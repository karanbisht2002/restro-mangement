import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";

export const notificationsDbRouter: Router = createRouter();

export interface CreateNotificationParams {
  targetRole: "Manager" | "Kitchen" | "Server" | "All";
  category: "customer" | "employee" | "station";
  type: string;
  title: string;
  summary: string;
  details?: Record<string, any>;
}

// Ensure the notifications table exists with proper indexes
export async function ensureNotificationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      target_role TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      details JSONB DEFAULT '{}'::jsonb,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(target_role, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_cat ON notifications(category, created_at DESC);
  `);
}

// Helper to create notifications from any backend service
export async function createNotification(params: CreateNotificationParams): Promise<any> {
  try {
    await ensureNotificationsTable();
    const id = `notif_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const result = await pool.query(
      `INSERT INTO notifications (id, target_role, category, type, title, summary, details, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
       RETURNING 
         id, target_role AS "targetRole", category, type, title, summary, details,
         is_read AS "isRead", created_at AS "createdAt"`,
      [
        id,
        params.targetRole,
        params.category,
        params.type,
        params.title,
        params.summary,
        JSON.stringify(params.details || {}),
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

// GET /api/notifications — Fetch notifications filtered by target role and category
notificationsDbRouter.get("/", async (req: Request, res: Response) => {
  try {
    await ensureNotificationsTable();
    const { role, category, limit = "50" } = req.query;

    let query = `
      SELECT 
        id, target_role AS "targetRole", category, type, title, summary, details,
        is_read AS "isRead", created_at AS "createdAt"
      FROM notifications
      WHERE 1=1
    `;
    const params: any[] = [];

    if (role && role !== "All") {
      params.push(role);
      // Notifications targeted to this role OR to 'All'
      query += ` AND (target_role = $${params.length} OR target_role = 'All')`;
    }

    if (category && category !== "all") {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(Math.min(parseInt(String(limit), 10) || 50, 100));

    const result = await pool.query(query, params);

    // Count unread for the requested role
    let unreadCount = 0;
    if (role && role !== "All") {
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = false AND (target_role = $1 OR target_role = 'All')`,
        [role]
      );
      unreadCount = countRes.rows[0]?.count || 0;
    } else {
      const countRes = await pool.query(
        `SELECT COUNT(*)::int AS count FROM notifications WHERE is_read = false`
      );
      unreadCount = countRes.rows[0]?.count || 0;
    }

    res.json({
      data: result.rows,
      unreadCount,
      count: result.rowCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications.", details: String(error) });
  }
});

// PATCH /api/notifications/:id/read — Mark single notification as read
notificationsDbRouter.patch("/:id/read", async (req: Request, res: Response) => {
  try {
    await ensureNotificationsTable();
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 
       RETURNING id, is_read AS "isRead"`,
      [id]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }
    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark notification read.", details: String(error) });
  }
});

// POST /api/notifications/read-all — Mark all notifications for a role as read
notificationsDbRouter.post("/read-all", async (req: Request, res: Response) => {
  try {
    await ensureNotificationsTable();
    const { role } = req.body;

    if (role && role !== "All") {
      await pool.query(
        `UPDATE notifications SET is_read = true WHERE (target_role = $1 OR target_role = 'All')`,
        [role]
      );
    } else {
      await pool.query(`UPDATE notifications SET is_read = true`);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark all notifications read.", details: String(error) });
  }
});

// POST /api/notifications/broadcast — Manager sends custom announcement to Kitchen / Servant / All
notificationsDbRouter.post("/broadcast", async (req: Request, res: Response) => {
  try {
    await ensureNotificationsTable();
    const { targetRole = "All", title, message, priority = "Normal", sentBy = "Manager" } = req.body;

    if (!title || !String(title).trim() || !message || !String(message).trim()) {
      res.status(400).json({ error: "Title and message are required for broadcast." });
      return;
    }

    const cleanTitle = String(title).trim();
    const cleanMessage = String(message).trim();

    const notif = await createNotification({
      targetRole: targetRole as any,
      category: "station",
      type: "manager_broadcast",
      title: priority === "Urgent" ? `🚨 Urgent: ${cleanTitle}` : `📢 Manager Notice: ${cleanTitle}`,
      summary: cleanMessage.length > 90 ? `${cleanMessage.slice(0, 87)}...` : cleanMessage,
      details: {
        sentBy,
        targetRole,
        priority,
        fullMessage: cleanMessage,
        sentAt: new Date().toISOString(),
      },
    });

    res.status(201).json({ success: true, notification: notif });
  } catch (error) {
    res.status(500).json({ error: "Failed to broadcast notification.", details: String(error) });
  }
});
