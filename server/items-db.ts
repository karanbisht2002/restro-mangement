import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import type { ItemInput, MenuItem } from "./schemas/item";
import { validateItemInput } from "./schemas/item";

const itemColumns = `
  id, name, price::float AS price, type, image, description, category,
  available, preparation_time_minutes AS "preparationTimeMinutes",
  allergens, tags, created_at AS "createdAt", updated_at AS "updatedAt"
`;

export const itemsDbRouter: Router = createRouter();

itemsDbRouter.get("/", async (_request, response) => {
  try {
    const result = await pool.query<MenuItem>(
      `SELECT ${itemColumns} FROM menu_items ORDER BY created_at DESC`,
    );
    response.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    response
      .status(503)
      .json({ error: "Database unavailable.", details: String(error) });
  }
});

itemsDbRouter.get("/:id", async (request, response) => {
  const result = await pool.query<MenuItem>(
    `SELECT ${itemColumns} FROM menu_items WHERE id = $1`,
    [request.params.id],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Menu item not found." });
    return;
  }
  response.json({ data: result.rows[0] });
});

itemsDbRouter.post("/", async (request: Request, response: Response) => {
  const validation = validateItemInput(request.body);
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid menu item.", details: validation.errors });
    return;
  }
  const itemId = `item_${Date.now()}`;
  const item = validation.value;
  const result = await pool.query<MenuItem>(
    `INSERT INTO menu_items (id, name, price, type, image, description, category, available, preparation_time_minutes, allergens, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${itemColumns}`,
    [
      itemId,
      item.name,
      item.price,
      item.type,
      item.image,
      item.description,
      item.category,
      item.available,
      item.preparationTimeMinutes,
      item.allergens,
      item.tags,
    ],
  );
  response.status(201).json({ data: result.rows[0] });
});

itemsDbRouter.patch("/:id", async (request, response) => {
  const current = await pool.query<MenuItem>(
    `SELECT ${itemColumns} FROM menu_items WHERE id = $1`,
    [request.params.id],
  );
  if (current.rowCount === 0) {
    response.status(404).json({ error: "Menu item not found." });
    return;
  }
  const validation = validateItemInput({ ...current.rows[0], ...request.body });
  if (!validation.value) {
    response
      .status(400)
      .json({ error: "Invalid menu item.", details: validation.errors });
    return;
  }
  const item = validation.value;
  const result = await pool.query<MenuItem>(
    `UPDATE menu_items SET name=$2, price=$3, type=$4, image=$5, description=$6, category=$7, available=$8, preparation_time_minutes=$9, allergens=$10, tags=$11, updated_at=NOW()
     WHERE id=$1 RETURNING ${itemColumns}`,
    [
      request.params.id,
      item.name,
      item.price,
      item.type,
      item.image,
      item.description,
      item.category,
      item.available,
      item.preparationTimeMinutes,
      item.allergens,
      item.tags,
    ],
  );
  response.json({ data: result.rows[0] });
});

itemsDbRouter.delete("/:id", async (request, response) => {
  const result = await pool.query<MenuItem>(
    `DELETE FROM menu_items WHERE id = $1 RETURNING ${itemColumns}`,
    [request.params.id],
  );
  if (result.rowCount === 0) {
    response.status(404).json({ error: "Menu item not found." });
    return;
  }
  response.json({ data: result.rows[0] });
});
