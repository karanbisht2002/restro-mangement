import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import { orderStatuses, validateOrderInput, type Order } from "./schemas/order";

const orderColumns = `
  id, customer, table_name AS table, item_list AS "itemList",
  item_count AS items, total::float AS total, status,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

export const ordersDbRouter: Router = createRouter();

ordersDbRouter.get("/", async (_request, response) => {
  try {
    const result = await pool.query<Order>(
      `SELECT ${orderColumns} FROM orders ORDER BY created_at DESC`,
    );
    response.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

ordersDbRouter.post("/", async (request: Request, response: Response) => {
  const validation = validateOrderInput(request.body);
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid order.", details: validation.errors });
    return;
  }
  const order = validation.value;
  const result = await pool.query<Order>(
    `INSERT INTO orders (id, customer, table_name, item_list, item_count, total, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'Queued')
     RETURNING ${orderColumns}`,
    [
      `order_${Date.now()}`,
      order.customer,
      order.table,
      order.itemList,
      `${order.itemList.length} items`,
      order.total,
    ],
  );
  response.status(201).json({ data: result.rows[0] });
});

ordersDbRouter.patch("/:id/status", async (request, response) => {
  const { status } = request.body as { status?: string };
  if (
    !status ||
    !orderStatuses.includes(status as (typeof orderStatuses)[number])
  ) {
    response
      .status(400)
      .json({ error: "Invalid order status.", allowed: orderStatuses });
    return;
  }
  const result = await pool.query<Order>(
    `UPDATE orders SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING ${orderColumns}`,
    [request.params.id, status],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Order not found." });
    return;
  }
  response.json({ data: result.rows[0] });
});
