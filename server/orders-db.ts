import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import {
  orderStatuses,
  validateOrderInput,
  type Order,
  type OrderStatus,
} from "./schemas/order";
import { isKitchenClosed } from "./kitchen-db";
import { createNotification } from "./notifications-db";

// Ensure source column exists on orders table
pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manager'").catch(() => {});

const orderColumns = `
  id, customer, table_name AS table, item_list AS "itemList",
  item_count AS items, total::float AS total, status,
  server_name AS "serverName",
  COALESCE(source, 'manager') AS source,
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

export const ordersDbRouter: Router = createRouter();

ordersDbRouter.get("/", async (_request: Request, response: Response) => {
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

ordersDbRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const rawId = String(request.params.id);
    const cleanId = rawId.startsWith("#") ? rawId : `#${rawId}`;
    const result = await pool.query<Order>(
      `SELECT ${orderColumns} FROM orders WHERE id = $1 OR id = $2 OR id = REPLACE($1, '#', '')`,
      [rawId, cleanId],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Order not found." });
      return;
    }
    response.json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

ordersDbRouter.post("/", async (request: Request, response: Response) => {
  if (isKitchenClosed()) {
    response.status(403).json({
      error: "Kitchen is closed. Cannot accept new orders at this time.",
    });
    return;
  }

  const validation = validateOrderInput(request.body);
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid order.", details: validation.errors });
    return;
  }
  const role = getStaffRole(request);
  if (role === "Kitchen") {
    response.status(403).json({
      error: "Only servants or managers can create orders. Kitchen staff handles preparation.",
      providedRole: role,
    });
    return;
  }

  const order = validation.value;
  const orderId = `#${Math.floor(10000 + Math.random() * 90000)}`;

  const rawSource = (request.body as any)?.source;
  const headerSource = request.headers["x-order-source"] || request.headers["x-client-source"];
  let orderSource = "manager";
  if (rawSource === "website" || headerSource === "website") {
    orderSource = "website";
  } else if (role === "Server") {
    orderSource = "server";
  } else if (role === "Manager") {
    orderSource = "manager";
  } else if (rawSource) {
    orderSource = String(rawSource).toLowerCase();
  }

  try {
    const result = await pool.query<Order>(
      `INSERT INTO orders (id, customer, table_name, item_list, item_count, total, status, server_name, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'Queued', $7, $8)
       RETURNING ${orderColumns}`,
      [
        orderId,
        order.customer,
        order.table,
        order.itemList,
        `${order.itemList.length} item${order.itemList.length > 1 ? "s" : ""}`,
        order.total,
        order.serverName || null,
        orderSource,
      ],
    );

    const match = order.table.match(/T?0?(\d+)/i);
    const tableIdCandidate = order.table.startsWith("T") && order.table.length <= 4
      ? order.table.toUpperCase()
      : match
        ? `T${match[1].padStart(2, "0")}`
        : null;

    if (tableIdCandidate) {
      if (order.serverName) {
        await pool.query(
          "UPDATE tables SET status = 'Occupied', server_name = $2, updated_at = NOW() WHERE id = $1",
          [tableIdCandidate, order.serverName],
        );
      } else {
        await pool.query(
          "UPDATE tables SET status = 'Occupied', updated_at = NOW() WHERE id = $1 AND status != 'Occupied'",
          [tableIdCandidate],
        );
      }
    }

    const sourceLabel = orderSource === "website" ? "Website" : orderSource === "server" ? "Servant" : "Manager";

    // 1. Manager Notification: ONLY when ordered from website (not when manager or servant creates order)
    if (orderSource === "website") {
      createNotification({
        targetRole: "Manager",
        category: "customer",
        type: "website_order",
        title: `Online Order: ${orderId}`,
        summary: `${order.customer || "Online Guest"} placed an online order (${order.itemList.length} items, ₹${order.total}) for ${order.table}`,
        details: {
          orderId,
          customer: order.customer,
          table: order.table,
          total: order.total,
          itemList: order.itemList,
          source: "website",
        },
      }).catch((err) => console.error("Error creating website order notification for manager:", err));
    }

    // 2. Kitchen Notification: New order from manager, servant, or website
    createNotification({
      targetRole: "Kitchen",
      category: "station",
      type: "new_order",
      title: `New Order ${orderId} (${sourceLabel})`,
      summary: `${order.table} • ${order.itemList.length} item${order.itemList.length > 1 ? "s" : ""} • ₹${order.total}`,
      details: {
        orderId,
        customer: order.customer,
        table: order.table,
        total: order.total,
        itemList: order.itemList,
        source: orderSource,
        serverName: order.serverName,
      },
    }).catch((err) => console.error("Error creating new order notification for kitchen:", err));

    // 3. Servant Panel Notification: Order from website or created by manager
    if (orderSource === "website" || orderSource === "manager") {
      createNotification({
        targetRole: "Server",
        category: "station",
        type: "new_order",
        title: `New Order ${orderId} (${sourceLabel})`,
        summary: `Table ${order.table} • ${order.itemList.length} item${order.itemList.length > 1 ? "s" : ""} • ₹${order.total}`,
        details: {
          orderId,
          customer: order.customer,
          table: order.table,
          total: order.total,
          itemList: order.itemList,
          source: orderSource,
        },
      }).catch((err) => console.error("Error creating new order notification for server:", err));
    }

    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to book order.", details: String(error) });
  }
});

function normalizeStaffRole(rawRole?: string | null): string {
  if (!rawRole) return "";
  const cleaned = rawRole.trim().toLowerCase();
  if (["kitchen", "chef", "cook"].includes(cleaned)) return "Kitchen";
  if (["server", "servant", "waiter"].includes(cleaned)) return "Server";
  if (["manager", "admin", "owner"].includes(cleaned)) return "Manager";
  return rawRole.trim();
}

function getStaffRole(request: Request): string {
  const header = (request.headers["x-staff-role"] as string) || "";
  const bodyRole =
    typeof request.body === "object" && request.body && "role" in request.body
      ? String((request.body as Record<string, unknown>).role)
      : "";
  return normalizeStaffRole(header || bodyRole);
}

const performOrderTransition = async (
  request: Request,
  response: Response,
  targetStatus: OrderStatus,
) => {
  const role = getStaffRole(request);

  // Role validation:
  // - Kitchen handler exclusively manages preparation (Preparing, Ready, Notified)
  if (["Preparing", "Ready", "Notified"].includes(targetStatus)) {
    if (role === "Server") {
      response.status(403).json({
        error: `Only kitchen handler can mark order as '${targetStatus}'. Servants and managers wait for kitchen notification.`,
        requiredRole: "Kitchen",
        providedRole: role,
      });
      return;
    }
  }

  // - Manager/Servant exclusively marks order as Served
  if (targetStatus === "Served") {
    if (role === "Kitchen") {
      response.status(403).json({
        error: "Kitchen handler cannot mark order as served. Only servant or manager can serve the order.",
        allowedRoles: ["Server", "Manager"],
        providedRole: role,
      });
      return;
    }
  }

  try {
    const rawId = String(request.params.id);
    const cleanId = rawId.startsWith("#") ? rawId : `#${rawId}`;
    const result = await pool.query<Order>(
      `UPDATE orders SET status = $2, updated_at = NOW()
       WHERE id = $1 OR id = $3 OR id = REPLACE($1, '#', '')
       RETURNING ${orderColumns}`,
      [rawId, targetStatus, cleanId],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Order not found." });
      return;
    }

    const updatedOrder = result.rows[0];

    // Notification triggers based on lifecycle state:
    if (targetStatus === "Ready") {
      // Notify Server: Order ready to serve
      createNotification({
        targetRole: "Server",
        category: "station",
        type: "order_ready",
        title: `Order ${cleanId} Ready to Serve!`,
        summary: `Kitchen has completed preparation for ${updatedOrder.table}. Pick up and serve now.`,
        details: {
          orderId: cleanId,
          table: updatedOrder.table,
          customer: updatedOrder.customer,
          itemList: updatedOrder.itemList,
          total: updatedOrder.total,
        },
      }).catch((err) => console.error("Error creating order ready notification:", err));
    } else if (targetStatus === "Served") {
      // Notify Kitchen: Order served
      createNotification({
        targetRole: "Kitchen",
        category: "station",
        type: "order_served",
        title: `Order ${cleanId} Served`,
        summary: `Order for ${updatedOrder.table} was served to guests by floor staff.`,
        details: {
          orderId: cleanId,
          table: updatedOrder.table,
          customer: updatedOrder.customer,
          total: updatedOrder.total,
        },
      }).catch((err) => console.error("Error creating order served notification:", err));
    }

    response.json({
      data: updatedOrder,
      message: `Order status updated to ${targetStatus}.`,
    });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to update order status.", details: String(error) });
  }
};

// Dedicated lifecycle endpoints
ordersDbRouter.post("/:id/prepare", (req, res) => performOrderTransition(req, res, "Preparing"));
ordersDbRouter.post("/:id/ready", (req, res) => performOrderTransition(req, res, "Ready"));
ordersDbRouter.post("/:id/notify", (req, res) => performOrderTransition(req, res, "Notified"));
ordersDbRouter.post("/:id/serve", (req, res) => performOrderTransition(req, res, "Served"));

const handleOrderStatusUpdate = async (request: Request, response: Response) => {
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
  return performOrderTransition(request, response, status as OrderStatus);
};

ordersDbRouter.patch("/:id/status", handleOrderStatusUpdate);
ordersDbRouter.put("/:id/status", handleOrderStatusUpdate);
ordersDbRouter.post("/:id/status", handleOrderStatusUpdate);
ordersDbRouter.patch("/:id", async (request: Request, response: Response) => {
  try {
    const rawId = String(request.params.id);
    const cleanId = rawId.startsWith("#") ? rawId : `#${rawId}`;
    const { status, itemList, total, serverName, customer } = request.body as {
      status?: string;
      itemList?: string[];
      total?: number;
      serverName?: string;
      customer?: string;
    };

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (itemList !== undefined && Array.isArray(itemList)) {
      fields.push(`item_list = $${idx++}`);
      values.push(itemList);
      fields.push(`item_count = $${idx++}`);
      values.push(`${itemList.length} item${itemList.length > 1 ? "s" : ""}`);
    }
    if (total !== undefined) {
      fields.push(`total = $${idx++}`);
      values.push(Number(total));
    }
    if (serverName !== undefined) {
      fields.push(`server_name = $${idx++}`);
      values.push(serverName);
    }
    if (customer !== undefined) {
      fields.push(`customer = $${idx++}`);
      values.push(customer);
    }

    if (fields.length === 0) {
      response.status(400).json({ error: "No update fields provided." });
      return;
    }

    fields.push(`updated_at = NOW()`);
    const idParam1 = idx++;
    const idParam2 = idx++;
    values.push(rawId, cleanId);

    const result = await pool.query<Order>(
      `UPDATE orders
       SET ${fields.join(", ")}
       WHERE id = $${idParam1} OR id = $${idParam2} OR id = REPLACE($${idParam1}, '#', '')
       RETURNING ${orderColumns}`,
      values,
    );

    if (result.rowCount === 0) {
      response.status(404).json({ error: "Order not found." });
      return;
    }
    response.json({ data: result.rows[0] });
  } catch (error) {
    response.status(500).json({ error: "Failed to update order", details: String(error) });
  }
});

ordersDbRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const rawId = String(request.params.id);
    const cleanId = rawId.startsWith("#") ? rawId : `#${rawId}`;
    const result = await pool.query<Order>(
      `DELETE FROM orders
       WHERE id = $1 OR id = $2 OR id = REPLACE($1, '#', '')
       RETURNING ${orderColumns}`,
      [rawId, cleanId],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Order not found." });
      return;
    }
    response.json({ data: result.rows[0], message: "Order cancelled." });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to delete order.", details: String(error) });
  }
});
