import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import {
  tableStatuses,
  validateTableInput,
  type RestaurantTable,
  type TableStatus,
} from "./schemas/table";
import { createNotification } from "./notifications-db";

const tableColumns = `
  id, seats, zone, status,
  server_name AS "serverName",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const tablesDbRouter: Router = createRouter();

tablesDbRouter.get("/", async (_request: Request, response: Response) => {
  try {
    const result = await pool.query<RestaurantTable>(
      `SELECT ${tableColumns} FROM tables ORDER BY id ASC`,
    );
    response.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

tablesDbRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const result = await pool.query<RestaurantTable>(
      `SELECT ${tableColumns} FROM tables WHERE id = $1`,
      [request.params.id],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Table not found." });
      return;
    }
    response.json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

tablesDbRouter.patch("/:id/status", async (request: Request, response: Response) => {
  const { status } = request.body as { status?: string };
  if (!status || !tableStatuses.includes(status as TableStatus)) {
    response.status(400).json({
      error: "Invalid table status.",
      allowed: tableStatuses,
    });
    return;
  }

  try {
    const targetStatus = status === "Arrived" ? "Occupied" : status;
    const result = await pool.query<RestaurantTable>(
      `UPDATE tables SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING ${tableColumns}`,
      [request.params.id, targetStatus],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Table not found." });
      return;
    }

    const updatedTable = result.rows[0];

    if (targetStatus === "Needs cleaning") {
      // 1. Manager notification (goes to Employee activities tab as requested)
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "table_needs_cleaning",
        title: `Table ${updatedTable.id} Needs Cleaning`,
        summary: `Table ${updatedTable.id} (${updatedTable.zone}) is vacated and needs sanitizing and reset.`,
        details: {
          tableId: updatedTable.id,
          zone: updatedTable.zone,
          seats: updatedTable.seats,
          serverName: updatedTable.serverName,
        },
      }).catch((err) => console.error("Notification error:", err));

      // 2. Server notification
      createNotification({
        targetRole: "Server",
        category: "station",
        type: "table_needs_cleaning",
        title: `Table ${updatedTable.id} Needs Cleaning`,
        summary: `Table ${updatedTable.id} is vacated. Please clean and prepare for the next party.`,
        details: {
          tableId: updatedTable.id,
          zone: updatedTable.zone,
        },
      }).catch((err) => console.error("Notification error:", err));
    }

    response.json({ data: updatedTable });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to update table status.", details: String(error) });
  }
});

tablesDbRouter.post("/", async (request: Request, response: Response) => {
  const validation = validateTableInput(request.body);
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid table configuration.", details: validation.errors });
    return;
  }

  const table = validation.value;
  try {
    const result = await pool.query<RestaurantTable>(
      `INSERT INTO tables (id, seats, zone, status, server_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET
         seats = EXCLUDED.seats,
         zone = EXCLUDED.zone,
         status = EXCLUDED.status,
         server_name = EXCLUDED.server_name,
         updated_at = NOW()
       RETURNING ${tableColumns}`,
      [table.id, table.seats, table.zone, table.status, table.serverName],
    );
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to save table.", details: String(error) });
  }
});

tablesDbRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const result = await pool.query<{ id: string }>(
      `DELETE FROM tables WHERE id = $1 RETURNING id`,
      [request.params.id],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Table not found." });
      return;
    }
    response.json({ message: "Table deleted successfully.", id: result.rows[0].id });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Failed to delete table.", details: String(error) });
  }
});

