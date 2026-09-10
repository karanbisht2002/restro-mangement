import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import {
  bookingStatuses,
  validateBookingInput,
  type BookingStatus,
  type TableBooking,
} from "./schemas/booking";
import { isKitchenClosed } from "./kitchen-db";
import { createNotification } from "./notifications-db";

const bookingColumns = `
  id, customer, phone,
  booking_date::text AS "bookingDate",
  booking_time AS "bookingTime",
  guests,
  table_id AS "tableId",
  status,
  deposit::float AS deposit,
  source,
  special_requests AS "specialRequests",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const bookingsDbRouter: Router = createRouter();

bookingsDbRouter.get("/", async (request: Request, response: Response) => {
  try {
    const { date, status, tableId } = request.query as {
      date?: string;
      status?: string;
      tableId?: string;
    };

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (date) {
      values.push(date);
      conditions.push(`booking_date = $${values.length}`);
    }
    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }
    if (tableId) {
      values.push(tableId);
      conditions.push(`table_id = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    const query = `
      SELECT ${bookingColumns}
      FROM table_bookings
      ${whereClause}
      ORDER BY booking_date DESC, created_at DESC
    `;

    const result = await pool.query<TableBooking>(query, values);
    response.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

bookingsDbRouter.get("/stats", async (_request: Request, response: Response) => {
  try {
    const result = await pool.query<{
      today_bookings: number;
      today_expected_guests: number;
      today_deposit: number;
      total_bookings: number;
      total_expected_guests: number;
      total_deposit: number;
      active_bookings: number;
      completed_bookings: number;
      cancelled_bookings: number;
    }>(`
      SELECT
        COUNT(CASE WHEN booking_date = CURRENT_DATE THEN 1 END)::int AS today_bookings,
        COALESCE(SUM(CASE WHEN booking_date = CURRENT_DATE AND status NOT IN ('Cancelled', 'No show') THEN guests ELSE 0 END), 0)::int AS today_expected_guests,
        COALESCE(SUM(CASE WHEN booking_date = CURRENT_DATE AND status NOT IN ('Cancelled', 'No show') THEN deposit ELSE 0 END), 0)::float AS today_deposit,
        COUNT(*)::int AS total_bookings,
        COALESCE(SUM(CASE WHEN status NOT IN ('Cancelled', 'No show') THEN guests ELSE 0 END), 0)::int AS total_expected_guests,
        COALESCE(SUM(CASE WHEN status NOT IN ('Cancelled', 'No show') THEN deposit ELSE 0 END), 0)::float AS total_deposit,
        COUNT(CASE WHEN status IN ('Booked', 'Arrived', 'Seated') THEN 1 END)::int AS active_bookings,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END)::int AS completed_bookings,
        COUNT(CASE WHEN status IN ('Cancelled', 'No show') THEN 1 END)::int AS cancelled_bookings
      FROM table_bookings
    `);
    response.json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to fetch booking stats.", details: String(error) });
  }
});

bookingsDbRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const result = await pool.query<TableBooking>(
      `SELECT ${bookingColumns} FROM table_bookings WHERE id = $1`,
      [request.params.id],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Booking not found." });
      return;
    }
    response.json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

bookingsDbRouter.post("/", async (request: Request, response: Response) => {
  if (isKitchenClosed()) {
    response.status(403).json({
      error: "Kitchen is closed. Cannot accept new table bookings at this time.",
    });
    return;
  }

  const validation = validateBookingInput(request.body);
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid booking.", details: validation.errors });
    return;
  }

  const booking = validation.value;
  const bookingId = `book_${Date.now()}`;

  try {
    // If a table is assigned, verify it exists
    if (booking.tableId) {
      const tableCheck = await pool.query(
        "SELECT id, status FROM tables WHERE id = $1",
        [booking.tableId],
      );
      if (tableCheck.rowCount === 0) {
        response.status(400).json({ error: `Table ${booking.tableId} does not exist.` });
        return;
      }
    }

    const result = await pool.query<TableBooking>(
      `INSERT INTO table_bookings (
        id, customer, phone, booking_date, booking_time,
        guests, table_id, status, deposit, source, special_requests
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'Booked', $8, $9, $10)
      RETURNING ${bookingColumns}`,
      [
        bookingId,
        booking.customer,
        booking.phone,
        booking.bookingDate,
        booking.bookingTime,
        booking.guests,
        booking.tableId,
        booking.deposit,
        booking.source,
        booking.specialRequests,
      ],
    );

    // If table assigned and not currently occupied, automatically mark table as 'Booked'
    if (booking.tableId) {
      await pool.query(
        "UPDATE tables SET status = 'Booked', updated_at = NOW() WHERE id = $1 AND status != 'Occupied'",
        [booking.tableId],
      );
    }

    // 1. Notify Manager (Customer activities tab)
    createNotification({
      targetRole: "Manager",
      category: "customer",
      type: "table_booked",
      title: `Table Booked: ${booking.customer}`,
      summary: `${booking.customer} reserved for ${booking.guests} guest${booking.guests > 1 ? "s" : ""} on ${booking.bookingDate} at ${booking.bookingTime}${booking.tableId ? ` (${booking.tableId})` : ""}`,
      details: {
        bookingId,
        customer: booking.customer,
        phone: booking.phone,
        guests: booking.guests,
        date: booking.bookingDate,
        time: booking.bookingTime,
        tableId: booking.tableId,
        deposit: booking.deposit,
        specialRequests: booking.specialRequests,
      },
    }).catch((err) => console.error("Error creating booking notification for manager:", err));

    // 2. Notify Server
    createNotification({
      targetRole: "Server",
      category: "customer",
      type: "table_booked",
      title: `New Reservation: ${booking.customer}`,
      summary: `Party of ${booking.guests} booked for ${booking.bookingDate} at ${booking.bookingTime}${booking.tableId ? ` (${booking.tableId})` : ""}`,
      details: {
        bookingId,
        customer: booking.customer,
        phone: booking.phone,
        guests: booking.guests,
        date: booking.bookingDate,
        time: booking.bookingTime,
        tableId: booking.tableId,
      },
    }).catch((err) => console.error("Error creating booking notification for server:", err));

    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to create table booking.", details: String(error) });
  }
});

bookingsDbRouter.patch("/:id", async (request: Request, response: Response) => {
  try {
    const current = await pool.query<TableBooking>(
      `SELECT ${bookingColumns} FROM table_bookings WHERE id = $1`,
      [request.params.id],
    );
    if (current.rowCount === 0) {
      response.status(404).json({ error: "Booking not found." });
      return;
    }

    const existing = current.rows[0];
    const { status, tableId, guests, specialRequests } = request.body as {
      status?: string;
      tableId?: string | null;
      guests?: number;
      specialRequests?: string;
    };

    if (
      status !== undefined &&
      !bookingStatuses.includes(status as BookingStatus)
    ) {
      response.status(400).json({
        error: "Invalid booking status.",
        allowed: bookingStatuses,
      });
      return;
    }

    const updatedStatus = (status as BookingStatus) ?? existing.status;
    const updatedTableId =
      tableId !== undefined ? (tableId ? String(tableId).trim() : null) : existing.tableId;
    const updatedGuests = typeof guests === "number" && guests > 0 ? guests : existing.guests;
    const updatedRequests =
      typeof specialRequests === "string" ? specialRequests.trim() : existing.specialRequests;

    const result = await pool.query<TableBooking>(
      `UPDATE table_bookings
       SET status = $2, table_id = $3, guests = $4, special_requests = $5, updated_at = NOW()
       WHERE id = $1
       RETURNING ${bookingColumns}`,
      [request.params.id, updatedStatus, updatedTableId, updatedGuests, updatedRequests],
    );

    // Synchronize table status according to booking lifecycle
    if (updatedTableId) {
      if (updatedStatus === "Arrived" || updatedStatus === "Seated") {
        await pool.query(
          "UPDATE tables SET status = 'Occupied', updated_at = NOW() WHERE id = $1",
          [updatedTableId],
        );
      } else if (updatedStatus === "Completed" || updatedStatus === "Cancelled" || updatedStatus === "No show") {
        await pool.query(
          "UPDATE tables SET status = 'Needs cleaning', updated_at = NOW() WHERE id = $1 AND status = 'Occupied'",
          [updatedTableId],
        );
        await pool.query(
          "UPDATE tables SET status = 'Available', updated_at = NOW() WHERE id = $1 AND status = 'Booked'",
          [updatedTableId],
        );
      } else if (updatedStatus === "Booked") {
        await pool.query(
          "UPDATE tables SET status = 'Booked', updated_at = NOW() WHERE id = $1 AND status != 'Occupied'",
          [updatedTableId],
        );
      }
    }

    response.json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to update booking.", details: String(error) });
  }
});

bookingsDbRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const current = await pool.query<TableBooking>(
      `SELECT ${bookingColumns} FROM table_bookings WHERE id = $1`,
      [request.params.id],
    );
    if (current.rowCount === 0) {
      response.status(404).json({ error: "Booking not found." });
      return;
    }

    const booking = current.rows[0];
    await pool.query("DELETE FROM table_bookings WHERE id = $1", [request.params.id]);

    // Release table if it was booked
    if (booking.tableId) {
      await pool.query(
        "UPDATE tables SET status = 'Available', updated_at = NOW() WHERE id = $1 AND status = 'Booked'",
        [booking.tableId],
      );
    }

    response.json({ data: booking, message: "Booking cancelled successfully." });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to delete booking.", details: String(error) });
  }
});
