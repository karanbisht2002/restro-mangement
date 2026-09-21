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

let migrationDone = false;
async function ensureBookingsSchema() {
  if (migrationDone) return;
  try {
    await pool.query(`
      ALTER TABLE table_bookings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
      ALTER TABLE table_bookings ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT DEFAULT '';
      ALTER TABLE table_bookings ADD COLUMN IF NOT EXISTS payu_payment_id TEXT DEFAULT '';
      ALTER TABLE table_bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) DEFAULT 'Paid';
      ALTER TABLE table_bookings DROP CONSTRAINT IF EXISTS table_bookings_source_check;
      ALTER TABLE table_bookings ADD CONSTRAINT table_bookings_source_check CHECK (source IN ('Phone', 'Walk-in', 'Web link', 'Online', 'Website'));
    `);
    migrationDone = true;
  } catch {}
}
ensureBookingsSchema().catch(() => {});

const bookingColumns = `
  id, customer, phone,
  COALESCE(email, '') AS email,
  booking_date::text AS "bookingDate",
  booking_time AS "bookingTime",
  guests,
  table_id AS "tableId",
  status,
  deposit::float AS deposit,
  source,
  special_requests AS "specialRequests",
  COALESCE(payu_payment_id, stripe_payment_id, '') AS "payuPaymentId",
  COALESCE(payu_payment_id, stripe_payment_id, '') AS "paymentId",
  COALESCE(payment_status, 'Paid') AS "paymentStatus",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
`;

export const bookingsDbRouter: Router = createRouter();

bookingsDbRouter.get("/", async (request: Request, response: Response) => {
  try {
    const { date, status, tableId, sort } = request.query as {
      date?: string;
      status?: string;
      tableId?: string;
      sort?: string;
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

    let orderByClause = "ORDER BY created_at DESC";
    if (sort === "date_asc") {
      orderByClause = "ORDER BY booking_date ASC, booking_time ASC, created_at DESC";
    } else if (sort === "date_desc") {
      orderByClause = "ORDER BY booking_date DESC, booking_time DESC, created_at DESC";
    } else {
      orderByClause = "ORDER BY created_at DESC";
    }

    const query = `
      SELECT ${bookingColumns}
      FROM table_bookings
      ${whereClause}
      ${orderByClause}
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

    let depositAmount = typeof booking.deposit === "number" ? booking.deposit : undefined;
    if (depositAmount === undefined || depositAmount === null) {
      try {
        const setRes = await pool.query(
          "SELECT reservation_deposit FROM restaurant_settings WHERE id = 'default' LIMIT 1"
        );
        if (setRes.rows.length > 0 && typeof setRes.rows[0].reservation_deposit === "number") {
          depositAmount = setRes.rows[0].reservation_deposit;
        }
      } catch {}
    }
    if (depositAmount === undefined || depositAmount === null) depositAmount = 500;

    const paymentId = (booking as any).payuPaymentId || (booking as any).paymentId || (booking as any).stripePaymentId || "";

    const result = await pool.query<TableBooking>(
      `INSERT INTO table_bookings (
        id, customer, phone, email, booking_date, booking_time,
        guests, table_id, status, deposit, source, special_requests,
        payu_payment_id, stripe_payment_id, payment_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Booked', $9, $10, $11, $12, $13, $14)
      RETURNING ${bookingColumns}`,
      [
        bookingId,
        booking.customer,
        booking.phone,
        booking.email || "",
        booking.bookingDate,
        booking.bookingTime,
        booking.guests,
        booking.tableId,
        depositAmount,
        booking.source,
        booking.specialRequests,
        paymentId,
        paymentId,
        booking.paymentStatus || "Paid",
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
