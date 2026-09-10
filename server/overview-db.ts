import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";

export const overviewDbRouter: Router = createRouter();

overviewDbRouter.get("/", async (_request: Request, response: Response) => {
  try {
    // 1. Revenue calculations
    // Today's total revenue (all active/completed orders created today - resets at 12 AM midnight)
    const todayOrdersRes = await pool.query<{ total: number; count: number; served_total: number }>(`
      SELECT 
        COALESCE(SUM(total), 0)::float AS total,
        COUNT(*)::int AS count,
        COALESCE(SUM(CASE WHEN status = 'Served' THEN total ELSE 0 END), 0)::float AS served_total
      FROM orders
      WHERE created_at >= CURRENT_DATE AND status != 'Cancelled'
    `);

    // All-time order revenue
    const allTimeOrdersRes = await pool.query<{ total: number; count: number; served_total: number }>(`
      SELECT 
        COALESCE(SUM(total), 0)::float AS total,
        COUNT(*)::int AS count,
        COALESCE(SUM(CASE WHEN status = 'Served' THEN total ELSE 0 END), 0)::float AS served_total
      FROM orders
      WHERE status != 'Cancelled'
    `);

    // Booking deposit collections
    const depositsRes = await pool.query<{ total_deposits: number; today_deposits: number }>(`
      SELECT
        COALESCE(SUM(deposit), 0)::float AS total_deposits,
        COALESCE(SUM(CASE WHEN created_at >= CURRENT_DATE THEN deposit ELSE 0 END), 0)::float AS today_deposits
      FROM table_bookings
      WHERE status NOT IN ('Cancelled', 'No show')
    `);

    // 2. Active orders metrics
    const activeOrdersRes = await pool.query<{
      active_count: number;
      kitchen_count: number;
      ready_count: number;
      served_count: number;
    }>(`
      SELECT
        COUNT(CASE WHEN status != 'Served' AND status != 'Cancelled' THEN 1 END)::int AS active_count,
        COUNT(CASE WHEN status IN ('Queued', 'Preparing') THEN 1 END)::int AS kitchen_count,
        COUNT(CASE WHEN status IN ('Ready', 'Notified') THEN 1 END)::int AS ready_count,
        COUNT(CASE WHEN status = 'Served' THEN 1 END)::int AS served_count
      FROM orders
    `);

    // 3. Table occupancy stats
    const tablesRes = await pool.query<{
      total_tables: number;
      occupied: number;
      booked: number;
      available: number;
      needs_cleaning: number;
    }>(`
      SELECT
        COUNT(*)::int AS total_tables,
        COUNT(CASE WHEN status = 'Occupied' THEN 1 END)::int AS occupied,
        COUNT(CASE WHEN status = 'Booked' THEN 1 END)::int AS booked,
        COUNT(CASE WHEN status = 'Available' THEN 1 END)::int AS available,
        COUNT(CASE WHEN status = 'Needs cleaning' THEN 1 END)::int AS needs_cleaning
      FROM tables
    `);

    // 4. Last 7 Days Revenue Breakdown for the weekly bar chart
    // We generate the last 7 days ending today
    const sevenDaysQuery = await pool.query<{
      day_date: string;
      day_name: string;
      daily_revenue: number;
      order_count: number;
    }>(`
      WITH days AS (
        SELECT 
          d::date AS day_date,
          TO_CHAR(d, 'Dy') AS day_name
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
      )
      SELECT 
        d.day_date::text AS day_date,
        d.day_name,
        COALESCE(SUM(o.total), 0)::float AS daily_revenue,
        COUNT(o.id)::int AS order_count
      FROM days d
      LEFT JOIN orders o ON DATE(o.created_at) = d.day_date AND o.status != 'Cancelled'
      GROUP BY d.day_date, d.day_name
      ORDER BY d.day_date ASC
    `);

    const dailyBreakdown = sevenDaysQuery.rows;
    const maxDailyRevenue = Math.max(...dailyBreakdown.map((d) => d.daily_revenue), 1);
    const avgDailyRevenue =
      dailyBreakdown.reduce((sum, d) => sum + d.daily_revenue, 0) / (dailyBreakdown.length || 1);

    const weeklyChart = dailyBreakdown.map((day, index) => ({
      date: day.day_date,
      day: day.day_name,
      revenue: day.daily_revenue,
      orderCount: day.order_count,
      heightPercent: day.daily_revenue > 0
        ? Math.max(Math.round((day.daily_revenue / maxDailyRevenue) * 100), 10)
        : 4,
      isToday: index === dailyBreakdown.length - 1,
    }));

    // 5. Recent orders (top 6)
    const recentOrdersRes = await pool.query(`
      SELECT 
        id, customer, table_name AS table, item_list AS "itemList",
        item_count AS items, total::float AS total, status,
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM orders
      ORDER BY created_at DESC
      LIMIT 6
    `);

    const todayOrders = todayOrdersRes.rows[0];
    const allTimeOrders = allTimeOrdersRes.rows[0];
    const active = activeOrdersRes.rows[0];
    const tables = tablesRes.rows[0];
    const deposits = depositsRes.rows[0];

    // Strict revenue for today (resets at 12:00 AM midnight)
    const todayRevenue = todayOrders.total;
    const servedRevenue = todayOrders.served_total;

    let pacingPercent = 0;
    if (avgDailyRevenue > 0) {
      pacingPercent = Math.round(((todayRevenue - avgDailyRevenue) / avgDailyRevenue) * 100);
    }

    response.json({
      data: {
        revenue: {
          today: todayRevenue,
          servedToday: servedRevenue,
          allTime: allTimeOrders.total,
          totalOrdersToday: todayOrders.count,
          depositsCollected: deposits.today_deposits,
          allTimeDeposits: deposits.total_deposits,
          averageDaily: Math.round(avgDailyRevenue),
          pacingPercent,
        },
        orders: {
          activeCount: active.active_count,
          kitchenCount: active.kitchen_count,
          readyCount: active.ready_count,
          servedCount: active.served_count,
          totalOrders: allTimeOrders.count,
        },
        tables: {
          total: tables.total_tables,
          occupied: tables.occupied,
          booked: tables.booked,
          available: tables.available,
          needsCleaning: tables.needs_cleaning,
          occupancyPercent: Math.round((tables.occupied / (tables.total_tables || 1)) * 100),
        },
        weeklyChart,
        recentOrders: recentOrdersRes.rows,
      },
    });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to generate overview metrics.", details: String(error) });
  }
});
