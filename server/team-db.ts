import type { Request, Response, Router } from "express";
import { Router as createRouter } from "express";
import { pool } from "./db";
import { createNotification } from "./notifications-db";

export interface Staff {
  id: string;
  name: string;
  phone: string;
  pin: string;
  department: string;
  systemRole: "Manager" | "Server" | "Kitchen" | "None";
  shift: string;
  isActiveOperator: boolean;
  createdAt: string;
  updatedAt: string;
  todayStatus?: "Clocked in" | "On break" | "Clocked out" | "Scheduled";
  clockInTime?: string;
  clockOutTime?: string;
  lastDistanceMeters?: number;
}

export interface RestaurantSettings {
  id: string;
  restaurantName: string;
  branchName: string;
  currencySymbol: string;
  taxRate: number;
  serviceCharge: number;
  receiptFooter: string;
  estimatedPrepTimeMinutes: number;
  tableTurnTimeMinutes: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  updatedAt: string;
}

export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Radius of Earth in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

let initDone = false;
export async function ensureTeamTablesInitialized() {
  if (initDone) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        phone VARCHAR(32) NOT NULL UNIQUE,
        pin VARCHAR(8) NOT NULL DEFAULT '1234',
        email VARCHAR(128),
        password VARCHAR(128) NOT NULL DEFAULT 'demo123',
        department VARCHAR(64) NOT NULL DEFAULT 'Floor',
        system_role VARCHAR(32) NOT NULL DEFAULT 'None',
        shift VARCHAR(64) NOT NULL DEFAULT '09:00 - 17:00',
        is_active_operator BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE staff ADD COLUMN IF NOT EXISTS email VARCHAR(128);
      ALTER TABLE staff ADD COLUMN IF NOT EXISTS password VARCHAR(128) NOT NULL DEFAULT 'demo123';

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(64) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        clock_in TIMESTAMPTZ,
        clock_out TIMESTAMPTZ,
        break_start TIMESTAMPTZ,
        break_end TIMESTAMPTZ,
        status VARCHAR(32) NOT NULL DEFAULT 'Clocked in',
        clock_in_latitude DOUBLE PRECISION,
        clock_in_longitude DOUBLE PRECISION,
        clock_in_distance_meters DOUBLE PRECISION,
        is_geofence_verified BOOLEAN NOT NULL DEFAULT FALSE,
        manager_override BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id SERIAL PRIMARY KEY,
        staff_id VARCHAR(64) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        leave_type VARCHAR(32) NOT NULL DEFAULT 'Casual',
        reason TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'Pending',
        reviewed_by VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        sender_name VARCHAR(128) NOT NULL DEFAULT 'Manager',
        target_type VARCHAR(32) NOT NULL DEFAULT 'All',
        target_staff_id VARCHAR(64) REFERENCES staff(id) ON DELETE CASCADE,
        title VARCHAR(256) NOT NULL,
        message TEXT NOT NULL,
        priority VARCHAR(32) NOT NULL DEFAULT 'Normal',
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS restaurant_settings (
        id VARCHAR(64) PRIMARY KEY DEFAULT 'default',
        restaurant_name VARCHAR(128) NOT NULL DEFAULT 'Table & Thyme',
        latitude DOUBLE PRECISION NOT NULL DEFAULT 28.5355,
        longitude DOUBLE PRECISION NOT NULL DEFAULT 77.3910,
        radius_meters INTEGER NOT NULL DEFAULT 50,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO restaurant_settings (id, restaurant_name, latitude, longitude, radius_meters)
      VALUES ('default', 'Table & Thyme', 28.5355, 77.3910, 50)
      ON CONFLICT (id) DO NOTHING;

      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS branch_name VARCHAR(128) DEFAULT 'Downtown branch';
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS currency_symbol VARCHAR(8) DEFAULT '₹';
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS is_currency_locked BOOLEAN DEFAULT false;
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '';
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS tax_rate DOUBLE PRECISION DEFAULT 5.0;
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS service_charge DOUBLE PRECISION DEFAULT 5.0;
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS receipt_footer TEXT DEFAULT 'Thank you for dining with Table & Thyme!';
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS estimated_prep_time_minutes INTEGER DEFAULT 20;
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS table_turn_time_minutes INTEGER DEFAULT 60;
      ALTER TABLE restaurant_settings ADD COLUMN IF NOT EXISTS gst_number VARCHAR(64) DEFAULT '07AAAAA0000A1Z5';

      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(64) UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO departments (name) VALUES
        ('Floor'),
        ('Kitchen'),
        ('Bar'),
        ('Cleaning'),
        ('Utility'),
        ('Management')
      ON CONFLICT (name) DO NOTHING;
    `);

    // Seed default staff members if table is empty
    const countCheck = await pool.query("SELECT COUNT(*) FROM staff");
    if (parseInt(countCheck.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO staff (id, name, phone, pin, department, system_role, shift, is_active_operator) VALUES
        ('staff_101', 'Priya Shah', '+91 98201 11001', '1234', 'Management', 'Manager', '09:00 - 18:00', true),
        ('staff_102', 'Kabir Malik', '+91 98201 11002', '1234', 'Kitchen', 'Kitchen', '11:00 - 23:00', true),
        ('staff_103', 'Arjun Rao', '+91 98201 11003', '1234', 'Floor', 'Server', '12:00 - 21:00', true),
        ('staff_104', 'Neha Joshi', '+91 98201 11004', '1234', 'Floor', 'Server', '10:00 - 19:00', false),
        ('staff_105', 'Rohan Verma', '+91 98201 11005', '1234', 'Kitchen', 'None', '08:00 - 16:00', false),
        ('staff_106', 'Sunita Devi', '+91 98201 11006', '1234', 'Cleaning', 'None', '07:00 - 15:00', false),
        ('staff_107', 'Amit Kumar', '+91 98201 11007', '1234', 'Utility', 'None', '11:00 - 23:00', false),
        ('staff_108', 'Divya Nair', '+91 98201 11008', '1234', 'Bar', 'Server', '16:00 - 00:00', false);
      `);

      // Seed sample announcements
      await pool.query(`
        INSERT INTO announcements (sender_name, target_type, title, message, priority) VALUES
        ('Priya Shah (Manager)', 'All', 'Weekend Dinner Rush Preparation', 'Expect heavy table turnover this Saturday. All floor servers please ensure clean black aprons and double-check condiment stations by 6:00 PM.', 'Normal'),
        ('Priya Shah (Manager)', 'Specific', 'Shift Schedule Confirmation', 'Arjun, your evening floor rotation starts at 12:00 PM today. Please cover Zone 1 tables.', 'Urgent');
      `);
      // Link specific announcement to staff_103
      await pool.query(`UPDATE announcements SET target_staff_id = 'staff_103' WHERE target_type = 'Specific'`);

      // Seed initial attendance for active operators today
      await pool.query(`
        INSERT INTO attendance_logs (staff_id, date, clock_in, status, clock_in_latitude, clock_in_longitude, clock_in_distance_meters, is_geofence_verified) VALUES
        ('staff_101', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Clocked in', 28.5355, 77.3910, 12, true),
        ('staff_102', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Clocked in', 28.5355, 77.3910, 18, true),
        ('staff_103', CURRENT_DATE, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'Clocked in', 28.5355, 77.3910, 8, true);
      `);
    }
    initDone = true;
  } catch (err) {
    console.error("Failed to initialize team tables:", err);
  }
}

export const teamDbRouter: Router = createRouter();

// Middleware to ensure DB tables are ready
teamDbRouter.use(async (_req, _res, next) => {
  await ensureTeamTablesInitialized();
  next();
});

// GET /api/team/staff - List all staff with today's attendance status
teamDbRouter.get("/staff", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        s.id,
        s.name,
        s.phone,
        s.pin,
        s.email,
        s.password,
        s.department,
        s.system_role AS "systemRole",
        s.shift,
        s.is_active_operator AS "isActiveOperator",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        COALESCE(a.status, 'Scheduled') AS "todayStatus",
        a.clock_in AS "clockInTime",
        a.clock_out AS "clockOutTime",
        a.clock_in_distance_meters AS "lastDistanceMeters"
      FROM staff s
      LEFT JOIN LATERAL (
        SELECT status, clock_in, clock_out, clock_in_distance_meters
        FROM attendance_logs
        WHERE staff_id = s.id AND date = CURRENT_DATE
        ORDER BY id DESC
        LIMIT 1
      ) a ON true
      ORDER BY s.is_active_operator DESC, s.name ASC
    `);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(503).json({ error: "Failed to fetch staff", details: String(error) });
  }
});

// POST /api/team/staff - Add new employee
teamDbRouter.post("/staff", async (req: Request, res: Response) => {
  try {
    const { name, phone, pin, email, password, department, systemRole, shift } = req.body;
    if (!name || !phone) {
      res.status(400).json({ error: "Name and phone are required." });
      return;
    }

    const id = `staff_${Date.now().toString(36)}`;
    const cleanPin = (pin || "1234").trim();
    const cleanEmail = (email || `${name.toLowerCase().replace(/[^a-z0-9]/g, ".")}@gmail.com`).trim().toLowerCase();
    const cleanPassword = (password || "demo123").trim();
    const cleanDept = (department || "Floor").trim();
    const cleanRole = ["Manager", "Server", "Kitchen", "None"].includes(systemRole)
      ? systemRole
      : "None";
    const cleanShift = (shift || "09:00 - 17:00").trim();

    const insertRes = await pool.query(
      `INSERT INTO staff (id, name, phone, pin, email, password, department, system_role, shift, is_active_operator)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false)
       RETURNING
         id, name, phone, pin, email, password, department,
         system_role AS "systemRole",
         shift,
         is_active_operator AS "isActiveOperator",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [id, name.trim(), phone.trim(), cleanPin, cleanEmail, cleanPassword, cleanDept, cleanRole, cleanShift],
    );

    res.status(201).json({ data: insertRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to create staff member", details: String(error) });
  }
});

// PUT /api/team/staff/:id - Update employee info
teamDbRouter.put("/staff/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, pin, email, password, department, systemRole, shift } = req.body;

    const updateRes = await pool.query(
      `UPDATE staff
       SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         pin = COALESCE($3, pin),
         email = COALESCE($4, email),
         password = COALESCE($5, password),
         department = COALESCE($6, department),
         system_role = COALESCE($7, system_role),
         shift = COALESCE($8, shift),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING
         id, name, phone, pin, email, password, department,
         system_role AS "systemRole",
         shift,
         is_active_operator AS "isActiveOperator",
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [name, phone, pin, email, password, department, systemRole, shift, id],
    );

    if (updateRes.rowCount === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }

    res.json({ data: updateRes.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to update staff member", details: String(error) });
  }
});

// DELETE /api/team/staff/:id - Delete employee
teamDbRouter.delete("/staff/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const delRes = await pool.query("DELETE FROM staff WHERE id = $1 RETURNING id", [id]);
    if (delRes.rowCount === 0) {
      res.status(404).json({ error: "Staff member not found" });
      return;
    }
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete staff member", details: String(error) });
  }
});

// PUT /api/team/operators - Assign 3 active shift operators
teamDbRouter.put("/operators", async (req: Request, res: Response) => {
  try {
    const { managerId, serverId, kitchenId } = req.body;
    await pool.query("UPDATE staff SET is_active_operator = false");

    const operatorIds = [managerId, serverId, kitchenId].filter(Boolean);
    if (operatorIds.length > 0) {
      await pool.query(
        "UPDATE staff SET is_active_operator = true WHERE id = ANY($1::varchar[])",
        [operatorIds],
      );
    }

    const updated = await pool.query(
      `SELECT id, name, system_role AS "systemRole", is_active_operator AS "isActiveOperator"
       FROM staff WHERE is_active_operator = true`,
    );

    res.json({ data: updated.rows, activeCount: updated.rowCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to update active operators", details: String(error) });
  }
});

// PUT /api/team/staff/:id/password - Change password with verification
teamDbRouter.put("/staff/:id/password", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || String(newPassword).trim().length < 4) {
      res.status(400).json({ error: "New password must be at least 4 characters." });
      return;
    }

    const checkRes = await pool.query("SELECT id, password FROM staff WHERE id = $1", [id]);
    if (checkRes.rowCount === 0) {
      res.status(404).json({ error: "Staff member not found." });
      return;
    }

    const existingPassword = checkRes.rows[0].password;
    if (currentPassword && currentPassword !== existingPassword) {
      res.status(400).json({ error: "Current password is incorrect." });
      return;
    }

    await pool.query(
      `UPDATE staff SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [String(newPassword).trim(), id],
    );

    res.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update password", details: String(error) });
  }
});

// GET /api/team/settings - Get restaurant settings
teamDbRouter.get("/settings", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         restaurant_name AS "restaurantName",
         COALESCE(branch_name, 'Downtown branch') AS "branchName",
         COALESCE(currency_symbol, '₹') AS "currencySymbol",
         COALESCE(is_currency_locked, false) AS "isCurrencyLocked",
         COALESCE(logo_url, '') AS "logoUrl",
         COALESCE(tax_rate, 5.0) AS "taxRate",
         COALESCE(service_charge, 5.0) AS "serviceCharge",
         COALESCE(receipt_footer, 'Thank you for dining with Table & Thyme!') AS "receiptFooter",
         COALESCE(estimated_prep_time_minutes, 20) AS "estimatedPrepTimeMinutes",
         COALESCE(table_turn_time_minutes, 60) AS "tableTurnTimeMinutes",
         COALESCE(gst_number, '07AAAAA0000A1Z5') AS "gstNumber",
         latitude,
         longitude,
         radius_meters AS "radiusMeters",
         updated_at AS "updatedAt"
       FROM restaurant_settings
       WHERE id = 'default'`,
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch restaurant settings", details: String(error) });
  }
});

// PUT /api/team/settings - Update restaurant settings
teamDbRouter.put("/settings", async (req: Request, res: Response) => {
  try {
    const {
      restaurantName,
      branchName,
      currencySymbol,
      isCurrencyLocked,
      unlockCurrency,
      logoUrl,
      taxRate,
      serviceCharge,
      receiptFooter,
      estimatedPrepTimeMinutes,
      tableTurnTimeMinutes,
      latitude,
      longitude,
      radiusMeters,
      gstNumber,
    } = req.body;

    // Process currency symbol and lock settings
    let finalCurrency = currencySymbol !== undefined ? currencySymbol : undefined;
    let finalLocked = isCurrencyLocked !== undefined ? Boolean(isCurrencyLocked) : undefined;

    const result = await pool.query(
      `UPDATE restaurant_settings
       SET
         restaurant_name = COALESCE($1, restaurant_name),
         branch_name = COALESCE($2, branch_name),
         currency_symbol = COALESCE($3, currency_symbol),
         is_currency_locked = COALESCE($4, is_currency_locked),
         logo_url = COALESCE($5, logo_url),
         tax_rate = COALESCE($6, tax_rate),
         service_charge = COALESCE($7, service_charge),
         receipt_footer = COALESCE($8, receipt_footer),
         estimated_prep_time_minutes = COALESCE($9, estimated_prep_time_minutes),
         table_turn_time_minutes = COALESCE($10, table_turn_time_minutes),
         latitude = COALESCE($11, latitude),
         longitude = COALESCE($12, longitude),
         radius_meters = COALESCE($13, radius_meters),
         gst_number = COALESCE($14, gst_number),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = 'default'
       RETURNING
         id,
         restaurant_name AS "restaurantName",
         branch_name AS "branchName",
         currency_symbol AS "currencySymbol",
         is_currency_locked AS "isCurrencyLocked",
         logo_url AS "logoUrl",
         tax_rate AS "taxRate",
         service_charge AS "serviceCharge",
         receipt_footer AS "receiptFooter",
         estimated_prep_time_minutes AS "estimatedPrepTimeMinutes",
         table_turn_time_minutes AS "tableTurnTimeMinutes",
         COALESCE(gst_number, '07AAAAA0000A1Z5') AS "gstNumber",
         latitude,
         longitude,
         radius_meters AS "radiusMeters",
         updated_at AS "updatedAt"`,
      [
        restaurantName,
        branchName,
        finalCurrency,
        finalLocked !== undefined ? Boolean(finalLocked) : null,
        logoUrl !== undefined ? String(logoUrl) : null,
        taxRate !== undefined ? Number(taxRate) : null,
        serviceCharge !== undefined ? Number(serviceCharge) : null,
        receiptFooter,
        estimatedPrepTimeMinutes,
        tableTurnTimeMinutes,
        latitude,
        longitude,
        radiusMeters,
        gstNumber !== undefined ? String(gstNumber) : null,
      ],
    );
    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to update settings", details: String(error) });
  }
});

// GET /api/team/departments - Get all restaurant departments
teamDbRouter.get("/departments", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT name FROM departments ORDER BY id ASC`,
    );
    const names = result.rows.map((r) => r.name);
    res.json({ data: names });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch departments", details: String(error) });
  }
});

// POST /api/team/departments - Add a new department
teamDbRouter.post("/departments", async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: "Department name is required." });
      return;
    }
    const cleanName = String(name).trim();
    await pool.query(
      `INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [cleanName],
    );
    const result = await pool.query(`SELECT name FROM departments ORDER BY id ASC`);
    res.status(201).json({ data: result.rows.map((r) => r.name) });
  } catch (error) {
    res.status(500).json({ error: "Failed to create department", details: String(error) });
  }
});

// DELETE /api/team/departments/:name - Delete a department
teamDbRouter.delete("/departments/:name", async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    await pool.query(`DELETE FROM departments WHERE LOWER(name) = LOWER($1)`, [name]);
    const result = await pool.query(`SELECT name FROM departments ORDER BY id ASC`);
    res.json({ data: result.rows.map((r) => r.name) });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete department", details: String(error) });
  }
});

// POST /api/team/attendance/clock-in - Geofenced clock in
teamDbRouter.post("/attendance/clock-in", async (req: Request, res: Response) => {
  try {
    const { staffId, latitude, longitude, managerOverride } = req.body;
    if (!staffId) {
      res.status(400).json({ error: "staffId is required." });
      return;
    }

    // Get restaurant settings
    const settingsRes = await pool.query(
      "SELECT latitude, longitude, radius_meters FROM restaurant_settings WHERE id = 'default'",
    );
    const settings = settingsRes.rows[0];

    let distanceMeters = 0;
    let isGeofenceVerified = false;

    if (latitude !== undefined && longitude !== undefined && !isNaN(Number(latitude)) && !isNaN(Number(longitude))) {
      distanceMeters = calculateDistanceMeters(
        Number(latitude),
        Number(longitude),
        settings.latitude,
        settings.longitude,
      );
      isGeofenceVerified = distanceMeters <= settings.radius_meters;
    }

    if (!managerOverride && !isGeofenceVerified) {
      if (latitude === undefined || longitude === undefined) {
        res.status(400).json({
          error: "Location required",
          distanceMeters: 0,
          allowedRadius: settings.radius_meters,
          message: "GPS location not received from device. Please allow location permissions in your browser, or clock in with override.",
        });
        return;
      }

      res.status(403).json({
        error: "Out of range",
        distanceMeters,
        allowedRadius: settings.radius_meters,
        message: `You are ${distanceMeters}m away from the restaurant. Clock-in is restricted within ${settings.radius_meters}m. Click 'Set Restaurant Location to Here' or use Manager Override.`,
      });
      return;
    }

    // Insert or update attendance log for today
    const existingLog = await pool.query(
      "SELECT id FROM attendance_logs WHERE staff_id = $1 AND date = CURRENT_DATE",
      [staffId],
    );

    let logRes;
    if (existingLog.rowCount && existingLog.rowCount > 0) {
      logRes = await pool.query(
        `UPDATE attendance_logs
         SET
           status = 'Clocked in',
           clock_in = CURRENT_TIMESTAMP,
           clock_in_latitude = $1,
           clock_in_longitude = $2,
           clock_in_distance_meters = $3,
           is_geofence_verified = $4,
           manager_override = $5
         WHERE id = $6
         RETURNING *`,
        [latitude || null, longitude || null, distanceMeters, isGeofenceVerified, !!managerOverride, existingLog.rows[0].id],
      );
    } else {
      logRes = await pool.query(
        `INSERT INTO attendance_logs (
           staff_id, date, clock_in, status,
           clock_in_latitude, clock_in_longitude,
           clock_in_distance_meters, is_geofence_verified, manager_override
         ) VALUES ($1, CURRENT_DATE, CURRENT_TIMESTAMP, 'Clocked in', $2, $3, $4, $5, $6)
         RETURNING *`,
        [staffId, latitude || null, longitude || null, distanceMeters, isGeofenceVerified, !!managerOverride],
      );
    }

    // Notify Manager (Employee activities tab)
    pool.query("SELECT name, department FROM staff WHERE id = $1", [staffId]).then((staffRes) => {
      const staffName = staffRes.rows[0]?.name || staffId;
      const dept = staffRes.rows[0]?.department || "Floor";
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "employee_clock_in",
        title: `${staffName} Clocked In`,
        summary: `${staffName} (${dept}) clocked in for shift${isGeofenceVerified ? " • Verified on-site" : managerOverride ? " • Manager Override" : ""}`,
        details: { staffId, staffName, department: dept, distanceMeters, time: new Date().toISOString() },
      });
    }).catch(() => {});

    res.json({
      success: true,
      data: logRes.rows[0],
      distanceMeters,
      verified: isGeofenceVerified || !!managerOverride,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to clock in", details: String(error) });
  }
});

// POST /api/team/attendance/break - Toggle break
teamDbRouter.post("/attendance/break", async (req: Request, res: Response) => {
  try {
    const { staffId, action } = req.body; // action: 'start' | 'end'
    if (!staffId) {
      res.status(400).json({ error: "staffId is required." });
      return;
    }

    const newStatus = action === "start" ? "On break" : "Clocked in";
    const updateField = action === "start" ? "break_start = CURRENT_TIMESTAMP" : "break_end = CURRENT_TIMESTAMP";

    const result = await pool.query(
      `UPDATE attendance_logs
       SET status = $1, ${updateField}
       WHERE staff_id = $2 AND date = CURRENT_DATE
       RETURNING *`,
      [newStatus, staffId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "No active attendance log for today" });
      return;
    }

    // Notify Manager (Employee activities tab)
    pool.query("SELECT name, department FROM staff WHERE id = $1", [staffId]).then((staffRes) => {
      const staffName = staffRes.rows[0]?.name || staffId;
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: action === "start" ? "employee_break_start" : "employee_break_end",
        title: action === "start" ? `${staffName} on Break` : `${staffName} Back from Break`,
        summary: action === "start" ? `${staffName} started break` : `${staffName} resumed duty`,
        details: { staffId, staffName, action, time: new Date().toISOString() },
      });
    }).catch(() => {});

    res.json({ success: true, data: result.rows[0], status: newStatus });
  } catch (error) {
    res.status(500).json({ error: "Failed to update break status", details: String(error) });
  }
});

// POST /api/team/attendance/clock-out - Clock out
teamDbRouter.post("/attendance/clock-out", async (req: Request, res: Response) => {
  try {
    const { staffId } = req.body;
    if (!staffId) {
      res.status(400).json({ error: "staffId is required." });
      return;
    }

    const result = await pool.query(
      `UPDATE attendance_logs
       SET status = 'Clocked out', clock_out = CURRENT_TIMESTAMP
       WHERE staff_id = $1 AND date = CURRENT_DATE
       RETURNING *`,
      [staffId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "No active attendance log for today" });
      return;
    }

    // Notify Manager (Employee activities tab)
    pool.query("SELECT name, department FROM staff WHERE id = $1", [staffId]).then((staffRes) => {
      const staffName = staffRes.rows[0]?.name || staffId;
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "employee_clock_out",
        title: `${staffName} Clocked Out`,
        summary: `${staffName} clocked out of shift`,
        details: { staffId, staffName, time: new Date().toISOString() },
      });
    }).catch(() => {});

    res.json({ success: true, data: result.rows[0], status: "Clocked out" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clock out", details: String(error) });
  }
});

// GET /api/team/leaves - List leave requests
teamDbRouter.get("/leaves", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.staff_id AS "staffId",
        s.name AS "staffName",
        s.department,
        l.start_date AS "startDate",
        l.end_date AS "endDate",
        l.leave_type AS "leaveType",
        l.reason,
        l.status,
        l.reviewed_by AS "reviewedBy",
        l.created_at AS "createdAt"
      FROM leave_requests l
      JOIN staff s ON l.staff_id = s.id
      ORDER BY l.created_at DESC
    `);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch leaves", details: String(error) });
  }
});

// POST /api/team/leaves - Submit leave request
teamDbRouter.post("/leaves", async (req: Request, res: Response) => {
  try {
    const { staffId, startDate, endDate, leaveType, reason } = req.body;
    if (!staffId || !startDate || !endDate || !reason) {
      res.status(400).json({ error: "Missing required leave request fields." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (staff_id, start_date, end_date, leave_type, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')
       RETURNING
         id, staff_id AS "staffId",
         start_date AS "startDate",
         end_date AS "endDate",
         leave_type AS "leaveType",
         reason, status,
         created_at AS "createdAt"`,
      [staffId, startDate, endDate, leaveType || "Casual", reason],
    );

    // Notify Manager (Employee activities tab)
    pool.query("SELECT name, department FROM staff WHERE id = $1", [staffId]).then((staffRes) => {
      const staffName = staffRes.rows[0]?.name || staffId;
      createNotification({
        targetRole: "Manager",
        category: "employee",
        type: "employee_leave_request",
        title: `Leave Request: ${staffName}`,
        summary: `${staffName} requested ${leaveType || "Casual"} leave from ${startDate} to ${endDate}`,
        details: { staffId, staffName, startDate, endDate, leaveType: leaveType || "Casual", reason },
      });
    }).catch(() => {});

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit leave", details: String(error) });
  }
});

// PUT /api/team/leaves/:id/status - Approve or reject leave
teamDbRouter.put("/leaves/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy } = req.body; // 'Approved' | 'Rejected'
    if (!["Approved", "Rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be Approved or Rejected." });
      return;
    }

    const result = await pool.query(
      `UPDATE leave_requests
       SET status = $1, reviewed_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, reviewedBy || "Manager", id],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: "Leave request not found" });
      return;
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to update leave status", details: String(error) });
  }
});

// GET /api/team/announcements - Fetch announcements
teamDbRouter.get("/announcements", async (req: Request, res: Response) => {
  try {
    const { staffId } = req.query;
    let query = `
      SELECT
        id,
        sender_name AS "senderName",
        target_type AS "targetType",
        target_staff_id AS "targetStaffId",
        title,
        message,
        priority,
        created_at AS "createdAt"
      FROM announcements
    `;
    const params: string[] = [];

    if (staffId && typeof staffId === "string") {
      query += ` WHERE target_type = 'All' OR target_staff_id = $1`;
      params.push(staffId);
    }
    query += ` ORDER BY created_at DESC LIMIT 30`;

    const result = await pool.query(query, params);
    res.json({ data: result.rows, count: result.rowCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch announcements", details: String(error) });
  }
});

// POST /api/team/announcements - Create announcement
teamDbRouter.post("/announcements", async (req: Request, res: Response) => {
  try {
    const { senderName, targetType, targetStaffId, title, message, priority } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: "Title and message are required." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO announcements (sender_name, target_type, target_staff_id, title, message, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING
         id,
         sender_name AS "senderName",
         target_type AS "targetType",
         target_staff_id AS "targetStaffId",
         title, message, priority,
         created_at AS "createdAt"`,
      [
        senderName || "Manager",
        targetType || "All",
        targetType === "Specific" ? targetStaffId : null,
        title.trim(),
        message.trim(),
        priority || "Normal",
      ],
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Failed to create announcement", details: String(error) });
  }
});

// POST /api/team/auth/login - Phone + 4-digit PIN authentication
teamDbRouter.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) {
      res.status(400).json({ error: "Phone number and PIN are required." });
      return;
    }

    const cleanPhone = String(phone).replace(/[^0-9]/g, "");
    const cleanPin = String(pin).trim();

    const result = await pool.query(
      `SELECT
         id, name, phone, department,
         system_role AS "systemRole",
         shift,
         is_active_operator AS "isActiveOperator"
       FROM staff
       WHERE RIGHT(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = RIGHT($1, 10) AND pin = $2`,
      [cleanPhone, cleanPin],
    );

    if (result.rowCount === 0) {
      res.status(401).json({ error: "Invalid phone number or 4-digit PIN." });
      return;
    }

    res.json({ success: true, staff: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Authentication failed", details: String(error) });
  }
});

// POST /api/team/auth/login-web - Email (Gmail/work) + password authentication for stations
teamDbRouter.post("/auth/login-web", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const result = await pool.query(
      `SELECT
         id, name, phone, pin, email, department,
         system_role AS "systemRole",
         shift,
         is_active_operator AS "isActiveOperator"
       FROM staff
       WHERE LOWER(COALESCE(email, '')) = $1 AND password = $2`,
      [cleanEmail, cleanPassword],
    );

    if (result.rowCount === 0) {
      // Allow fallback default demo passwords if role matches demo pattern
      if (cleanPassword === "demo123") {
        const role = cleanEmail.includes("manager") ? "Manager"
          : cleanEmail.includes("kitchen") ? "Kitchen"
          : cleanEmail.includes("server") ? "Server" : null;
        if (role) {
          res.json({
            success: true,
            staff: {
              id: `demo_${role.toLowerCase()}`,
              name: `${role} Station`,
              email: cleanEmail,
              systemRole: role,
              department: role === "Manager" ? "Management" : role === "Kitchen" ? "Kitchen" : "Floor",
              shift: "09:00 - 18:00",
              isActiveOperator: true,
            },
          });
          return;
        }
      }
      res.status(401).json({ error: "Invalid email or password. Please check your credentials." });
      return;
    }

    res.json({ success: true, staff: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: "Web login failed", details: String(error) });
  }
});
