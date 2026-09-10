import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import { createNotification } from "./notifications-db";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStockLimit: number;
  unit: string;
  costPerUnit: number;
  supplier: string;
  image?: string;
  lastRestockedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  type: "RESTOCK" | "USAGE" | "WASTAGE" | "ADJUSTMENT" | "INITIAL";
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  cost: number;
  notes: string | null;
  loggedBy: string;
  createdAt: string;
}

export interface InventoryUnit {
  name: string;
  label: string;
}

const itemColumns = `
  id,
  name,
  category,
  current_stock::float AS "currentStock",
  min_stock_limit::float AS "minStockLimit",
  unit,
  cost_per_unit::float AS "costPerUnit",
  supplier,
  COALESCE(image, '') AS image,
  last_restocked_at AS "lastRestockedAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

const logColumns = `
  id,
  item_id AS "itemId",
  item_name AS "itemName",
  type,
  quantity::float AS quantity,
  previous_stock::float AS "previousStock",
  new_stock::float AS "newStock",
  unit,
  cost::float AS cost,
  notes,
  logged_by AS "loggedBy",
  created_at AS "createdAt"
`;

let isInitialized = false;

const defaultImages: Record<string, string> = {
  "Fresh Malai Paneer": "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80",
  "Arborio Basmati Rice": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
  "Fresh Chicken Breast": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=600&q=80",
  "White Truffle Infused Oil": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
  "Amul Pasteurised Butter": "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=600&q=80",
  "Organic Bell Peppers": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80",
  "Steamed Bao Wrappers": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80",
  "Eco Takeaway Meal Boxes": "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=600&q=80",
};

export async function ensureInventoryTables() {
  if (isInitialized) return;

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        category VARCHAR(64) NOT NULL DEFAULT 'General',
        current_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
        min_stock_limit NUMERIC(10,2) NOT NULL DEFAULT 5,
        unit VARCHAR(32) NOT NULL DEFAULT 'kg',
        cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
        supplier VARCHAR(128) DEFAULT 'Local Vendor',
        image TEXT DEFAULT '',
        last_restocked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image TEXT DEFAULT '';

      CREATE TABLE IF NOT EXISTS inventory_logs (
        id VARCHAR(64) PRIMARY KEY,
        item_id VARCHAR(64) NOT NULL,
        item_name VARCHAR(128) NOT NULL,
        type VARCHAR(32) NOT NULL,
        quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
        previous_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
        new_stock NUMERIC(10,2) NOT NULL DEFAULT 0,
        unit VARCHAR(32) NOT NULL DEFAULT 'kg',
        cost NUMERIC(10,2) NOT NULL DEFAULT 0,
        notes TEXT,
        logged_by VARCHAR(128) DEFAULT 'Staff',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_categories (
        name VARCHAR(64) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory_units (
        name VARCHAR(32) PRIMARY KEY,
        label VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed default categories
    const initialCategories = [
      "Dairy",
      "Produce",
      "Meat & Poultry",
      "Dry Grocery",
      "Oils & Spices",
      "Bakery",
      "Packaging",
      "Beverages",
      "General",
    ];
    for (const cat of initialCategories) {
      await pool.query(
        `INSERT INTO inventory_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [cat]
      );
    }

    // Seed default units
    const initialUnits = [
      { name: "kg", label: "Kilogram (kg)" },
      { name: "g", label: "Gram (g)" },
      { name: "L", label: "Liter (L)" },
      { name: "ml", label: "Milliliter (ml)" },
      { name: "pcs", label: "Pieces (pcs)" },
      { name: "bottle", label: "Bottle (bottle)" },
      { name: "box", label: "Box (box)" },
      { name: "pack", label: "Pack (pack)" },
      { name: "crate", label: "Crate (crate)" },
      { name: "can", label: "Can / Tin (can)" },
    ];
    for (const u of initialUnits) {
      await pool.query(
        `INSERT INTO inventory_units (name, label) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [u.name, u.label]
      );
    }

    // Update images on existing items if currently empty
    for (const [name, imgUrl] of Object.entries(defaultImages)) {
      await pool.query(
        `UPDATE inventory_items SET image = $1 WHERE name = $2 AND (image IS NULL OR image = '')`,
        [imgUrl, name]
      );
    }

    isInitialized = true;
  } catch (err) {
    console.error("Failed to initialize inventory tables:", err);
  }
}

export const inventoryDbRouter: Router = createRouter();

ensureInventoryTables().catch(() => {});

// GET /api/inventory — List items & calculated metrics & meta
inventoryDbRouter.get("/", async (_req: Request, res: Response) => {
  try {
    await ensureInventoryTables();

    const itemsResult = await pool.query(
      `SELECT ${itemColumns} FROM inventory_items ORDER BY name ASC`
    );
    const items = itemsResult.rows;

    const totalStockValue = items.reduce(
      (sum, item) => sum + item.currentStock * item.costPerUnit,
      0
    );

    const lowStockItems = items.filter(
      (item) => item.currentStock > 0 && item.currentStock <= item.minStockLimit
    );
    const outOfStockItems = items.filter((item) => item.currentStock <= 0);

    const todayLogs = await pool.query(
      `SELECT type, quantity::float, cost::float FROM inventory_logs 
       WHERE created_at >= CURRENT_DATE`
    );

    const todayUsageCount = todayLogs.rows
      .filter((l) => l.type === "USAGE")
      .reduce((sum, l) => sum + (l.quantity || 0), 0);

    const weeklyWastageResult = await pool.query(
      `SELECT COALESCE(SUM(cost), 0)::float AS "weeklyWastage" 
       FROM inventory_logs 
       WHERE type = 'WASTAGE' AND created_at >= NOW() - INTERVAL '7 days'`
    );
    const weeklyWastageValue = weeklyWastageResult.rows[0]?.weeklyWastage || 0;

    const categoriesRes = await pool.query(
      `SELECT name FROM inventory_categories ORDER BY name ASC`
    );
    const dbCategories = categoriesRes.rows.map((r) => r.name);
    const allCategories = ["All", ...Array.from(new Set([...dbCategories, ...items.map((i) => i.category)]))];

    const unitsRes = await pool.query(
      `SELECT name, label FROM inventory_units ORDER BY name ASC`
    );

    res.json({
      items,
      metrics: {
        totalStockValue: Math.round(totalStockValue),
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        todayUsageCount: Number(todayUsageCount.toFixed(1)),
        weeklyWastageValue: Math.round(weeklyWastageValue),
      },
      categories: allCategories,
      units: unitsRes.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory.", details: String(error) });
  }
});

// GET /api/inventory/meta — Categories and units
inventoryDbRouter.get("/meta", async (_req: Request, res: Response) => {
  try {
    await ensureInventoryTables();
    const categoriesRes = await pool.query(`SELECT name FROM inventory_categories ORDER BY name ASC`);
    const unitsRes = await pool.query(`SELECT name, label FROM inventory_units ORDER BY name ASC`);
    res.json({
      categories: categoriesRes.rows.map((r) => r.name),
      units: unitsRes.rows,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory metadata.", details: String(error) });
  }
});

// POST /api/inventory/categories — Add new category
inventoryDbRouter.post("/categories", async (req: Request, res: Response) => {
  try {
    await ensureInventoryTables();
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Category name is required." });
      return;
    }
    const cleanName = name.trim();
    await pool.query(
      `INSERT INTO inventory_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [cleanName]
    );
    res.status(201).json({ success: true, name: cleanName });
  } catch (error) {
    res.status(500).json({ error: "Failed to add category.", details: String(error) });
  }
});

// DELETE /api/inventory/categories/:name — Delete category
inventoryDbRouter.delete("/categories/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await pool.query(`DELETE FROM inventory_categories WHERE name = $1`, [name]);
    res.json({ success: true, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete category.", details: String(error) });
  }
});

// POST /api/inventory/units — Add new unit of measurement
inventoryDbRouter.post("/units", async (req: Request, res: Response) => {
  try {
    await ensureInventoryTables();
    const { name, label } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: "Unit symbol is required." });
      return;
    }
    const cleanName = name.trim();
    const cleanLabel = (label || cleanName).trim();
    await pool.query(
      `INSERT INTO inventory_units (name, label) VALUES ($1, $2) ON CONFLICT (name) DO UPDATE SET label = $2`,
      [cleanName, cleanLabel]
    );
    res.status(201).json({ success: true, unit: { name: cleanName, label: cleanLabel } });
  } catch (error) {
    res.status(500).json({ error: "Failed to add unit.", details: String(error) });
  }
});

// DELETE /api/inventory/units/:name — Delete unit
inventoryDbRouter.delete("/units/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await pool.query(`DELETE FROM inventory_units WHERE name = $1`, [name]);
    res.json({ success: true, name });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete unit.", details: String(error) });
  }
});

// POST /api/inventory — Add new product (with image, category, unit)
inventoryDbRouter.post("/", async (req: Request, res: Response) => {
  try {
    await ensureInventoryTables();
    const {
      name,
      category = "General",
      currentStock = 0,
      minStockLimit = 5,
      unit = "kg",
      costPerUnit = 0,
      supplier = "Local Supplier",
      image = "",
      loggedBy = "Manager",
    } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: "Product name is required." });
      return;
    }

    const id = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const parsedStock = Math.max(0, Number(currentStock) || 0);
    const parsedLimit = Math.max(0, Number(minStockLimit) || 0);
    const parsedCost = Math.max(0, Number(costPerUnit) || 0);

    // Auto-save category and unit if new
    if (category.trim()) {
      await pool.query(
        `INSERT INTO inventory_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [category.trim()]
      );
    }
    if (unit.trim()) {
      await pool.query(
        `INSERT INTO inventory_units (name, label) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
        [unit.trim(), `${unit.trim()} (${unit.trim()})`]
      );
    }

    const insertResult = await pool.query(
      `INSERT INTO inventory_items (
        id, name, category, current_stock, min_stock_limit, unit, cost_per_unit, supplier, image, last_restocked_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING ${itemColumns}`,
      [id, name.trim(), category.trim(), parsedStock, parsedLimit, unit.trim(), parsedCost, supplier.trim(), image.trim()]
    );

    if (parsedStock > 0) {
      await pool.query(
        `INSERT INTO inventory_logs (
          id, item_id, item_name, type, quantity, previous_stock, new_stock, unit, cost, notes, logged_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `log-${Date.now()}`,
          id,
          name.trim(),
          "INITIAL",
          parsedStock,
          0,
          parsedStock,
          unit.trim(),
          parsedStock * parsedCost,
          "Initial stock entry",
          loggedBy,
        ]
      );
    }

    res.status(201).json({ item: insertResult.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to add inventory product.", details: String(error) });
  }
});

// PUT /api/inventory/:id — Edit product details
inventoryDbRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, minStockLimit, costPerUnit, supplier, image } = req.body;

    if (category && category.trim()) {
      await pool.query(
        `INSERT INTO inventory_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [category.trim()]
      );
    }

    const result = await pool.query(
      `UPDATE inventory_items
       SET name = COALESCE($1, name),
           category = COALESCE($2, category),
           min_stock_limit = COALESCE($3, min_stock_limit),
           cost_per_unit = COALESCE($4, cost_per_unit),
           supplier = COALESCE($5, supplier),
           image = COALESCE($6, image),
           updated_at = NOW()
       WHERE id = $7
       RETURNING ${itemColumns}`,
      [
        name ? name.trim() : null,
        category ? category.trim() : null,
        minStockLimit !== undefined ? Number(minStockLimit) : null,
        costPerUnit !== undefined ? Number(costPerUnit) : null,
        supplier !== undefined ? supplier.trim() : null,
        image !== undefined ? image.trim() : null,
        id,
      ]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Inventory item not found." });
      return;
    }

    res.json({ item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to update inventory item.", details: String(error) });
  }
});

// POST /api/inventory/:id/restock — Add stock to item
inventoryDbRouter.post("/:id/restock", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { quantity, supplier, notes, loggedBy = "Manager", costPerUnit } = req.body;

    const addQty = Number(quantity);
    if (isNaN(addQty) || addQty <= 0) {
      res.status(400).json({ error: "Valid restock quantity is required." });
      return;
    }

    const itemRes = await pool.query(`SELECT * FROM inventory_items WHERE id = $1`, [id]);
    if (itemRes.rowCount === 0) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    const prevItem = itemRes.rows[0];
    const prevStock = Number(prevItem.current_stock);
    const newStock = Number((prevStock + addQty).toFixed(2));
    const effectiveCostPerUnit = costPerUnit !== undefined ? Number(costPerUnit) : Number(prevItem.cost_per_unit);

    const updatedRes = await pool.query(
      `UPDATE inventory_items
       SET current_stock = $1,
           cost_per_unit = $2,
           supplier = COALESCE($3, supplier),
           last_restocked_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING ${itemColumns}`,
      [newStock, effectiveCostPerUnit, supplier ? supplier.trim() : null, id]
    );

    await pool.query(
      `INSERT INTO inventory_logs (
        id, item_id, item_name, type, quantity, previous_stock, new_stock, unit, cost, notes, logged_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        id,
        prevItem.name,
        "RESTOCK",
        addQty,
        prevStock,
        newStock,
        prevItem.unit,
        Number((addQty * effectiveCostPerUnit).toFixed(2)),
        notes ? notes.trim() : "Vendor shipment restock",
        loggedBy,
      ]
    );

    // Notify Kitchen: New stock added (restock)
    createNotification({
      targetRole: "Kitchen",
      category: "station",
      type: "inventory_restocked",
      title: `Stock Added: ${prevItem.name}`,
      summary: `Restocked +${addQty} ${prevItem.unit} (Total: ${newStock} ${prevItem.unit}) by ${loggedBy}.`,
      details: { itemId: id, itemName: prevItem.name, addedQty: addQty, newStock, unit: prevItem.unit, loggedBy, notes },
    }).catch(() => {});

    res.json({ item: updatedRes.rows[0], newStock });
  } catch (error) {
    res.status(500).json({ error: "Failed to restock item.", details: String(error) });
  }
});

// POST /api/inventory/:id/daily-log — End-of-day usage & wastage logging
inventoryDbRouter.post("/:id/daily-log", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { usage = 0, waste = 0, notes, loggedBy = "Kitchen" } = req.body;

    const parsedUsage = Math.max(0, Number(usage) || 0);
    const parsedWaste = Math.max(0, Number(waste) || 0);
    const totalDeduction = Number((parsedUsage + parsedWaste).toFixed(2));

    if (totalDeduction <= 0) {
      res.status(400).json({ error: "Please enter a valid usage or waste quantity." });
      return;
    }

    const itemRes = await pool.query(`SELECT * FROM inventory_items WHERE id = $1`, [id]);
    if (itemRes.rowCount === 0) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    const prevItem = itemRes.rows[0];
    const prevStock = Number(prevItem.current_stock);
    const newStock = Math.max(0, Number((prevStock - totalDeduction).toFixed(2)));
    const unitCost = Number(prevItem.cost_per_unit);
    const minLimit = Number(prevItem.min_stock_limit);

    const updatedRes = await pool.query(
      `UPDATE inventory_items
       SET current_stock = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING ${itemColumns}`,
      [newStock, id]
    );

    if (parsedUsage > 0) {
      await pool.query(
        `INSERT INTO inventory_logs (
          id, item_id, item_name, type, quantity, previous_stock, new_stock, unit, cost, notes, logged_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `log-${Date.now()}-u`,
          id,
          prevItem.name,
          "USAGE",
          parsedUsage,
          prevStock,
          Number((prevStock - parsedUsage).toFixed(2)),
          prevItem.unit,
          Number((parsedUsage * unitCost).toFixed(2)),
          notes ? notes.trim() : "Daily shift consumption",
          loggedBy,
        ]
      );
    }

    if (parsedWaste > 0) {
      await pool.query(
        `INSERT INTO inventory_logs (
          id, item_id, item_name, type, quantity, previous_stock, new_stock, unit, cost, notes, logged_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          `log-${Date.now()}-w`,
          id,
          prevItem.name,
          "WASTAGE",
          parsedWaste,
          Number((prevStock - parsedUsage).toFixed(2)),
          newStock,
          prevItem.unit,
          Number((parsedWaste * unitCost).toFixed(2)),
          notes ? `Wastage: ${notes.trim()}` : "Daily prep wastage / spoilage",
          loggedBy,
        ]
      );
    }

    // 1. Notify Manager (Employee activities tab): Kitchen member edited usage of inventory
    createNotification({
      targetRole: "Manager",
      category: "employee",
      type: "inventory_usage_logged",
      title: `Stock Usage: ${prevItem.name}`,
      summary: `${loggedBy || "Kitchen staff"} logged ${parsedUsage} ${prevItem.unit} used${parsedWaste > 0 ? ` & ${parsedWaste} ${prevItem.unit} wasted` : ""}. Remaining: ${newStock} ${prevItem.unit}.`,
      details: {
        itemId: id,
        itemName: prevItem.name,
        usage: parsedUsage,
        waste: parsedWaste,
        newStock,
        unit: prevItem.unit,
        loggedBy,
        notes,
      },
    }).catch(() => {});

    // 2. Check Out-of-stock or Low-stock conditions
    if (newStock <= 0) {
      // Out of stock -> Manager (Employee section)
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "inventory_out_of_stock",
        title: `🚨 Out of Stock: ${prevItem.name}`,
        summary: `${prevItem.name} is completely depleted (0 ${prevItem.unit} left). Requires immediate restock!`,
        details: { itemId: id, itemName: prevItem.name, currentStock: 0, unit: prevItem.unit, minLimit },
      }).catch(() => {});

      // Out of stock -> Kitchen
      createNotification({
        targetRole: "Kitchen",
        category: "station",
        type: "inventory_out_of_stock",
        title: `🚨 Out of Stock: ${prevItem.name}`,
        summary: `${prevItem.name} has run out of stock (0 ${prevItem.unit}).`,
        details: { itemId: id, itemName: prevItem.name, currentStock: 0, unit: prevItem.unit },
      }).catch(() => {});
    } else if (newStock <= minLimit) {
      // Low stock -> Manager (Employee section)
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "inventory_low_stock",
        title: `⚠️ Low Stock: ${prevItem.name}`,
        summary: `${prevItem.name} reached low stock: ${newStock} ${prevItem.unit} remaining (min limit: ${minLimit} ${prevItem.unit}).`,
        details: { itemId: id, itemName: prevItem.name, currentStock: newStock, minLimit, unit: prevItem.unit },
      }).catch(() => {});

      // Low stock -> Kitchen
      createNotification({
        targetRole: "Kitchen",
        category: "station",
        type: "inventory_low_stock",
        title: `⚠️ Low Stock: ${prevItem.name}`,
        summary: `${prevItem.name} is low on stock (${newStock} ${prevItem.unit} remaining).`,
        details: { itemId: id, itemName: prevItem.name, currentStock: newStock, unit: prevItem.unit },
      }).catch(() => {});
    }

    res.json({
      item: updatedRes.rows[0],
      deducted: totalDeduction,
      usage: parsedUsage,
      waste: parsedWaste,
      newStock,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to record daily stock usage.", details: String(error) });
  }
});

// GET /api/inventory/logs — Get audit log of stock movements
inventoryDbRouter.get("/logs", async (req: Request, res: Response) => {
  try {
    const { itemId, limit = 50 } = req.query;
    let query = `SELECT ${logColumns} FROM inventory_logs`;
    const params: any[] = [];

    if (itemId) {
      query += ` WHERE item_id = $1`;
      params.push(itemId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Number(limit) || 50);

    const result = await pool.query(query, params);
    res.json({ logs: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory audit logs.", details: String(error) });
  }
});

// DELETE /api/inventory/:id — Delete item
inventoryDbRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM inventory_logs WHERE item_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM inventory_items WHERE id = $1 RETURNING id`, [id]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Item not found." });
      return;
    }

    res.json({ success: true, deletedId: id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete inventory item.", details: String(error) });
  }
});
