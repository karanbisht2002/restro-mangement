-- Team, Attendance, Leave and Announcement Tables

CREATE TABLE IF NOT EXISTS staff (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NOT NULL UNIQUE,
  pin VARCHAR(8) NOT NULL DEFAULT '1234',
  email VARCHAR(128),
  password VARCHAR(128) NOT NULL DEFAULT 'demo123',
  department VARCHAR(64) NOT NULL DEFAULT 'Floor',
  system_role VARCHAR(32) NOT NULL DEFAULT 'None', -- 'Manager', 'Server', 'Kitchen', 'None'
  shift VARCHAR(64) NOT NULL DEFAULT '09:00 - 17:00',
  is_active_operator BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(64) NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  break_start TIMESTAMPTZ,
  break_end TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'Clocked in', -- 'Clocked in', 'On break', 'Clocked out', 'Scheduled'
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
  leave_type VARCHAR(32) NOT NULL DEFAULT 'Casual', -- 'Sick', 'Casual', 'Vacation', 'Emergency'
  reason TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
  reviewed_by VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  sender_name VARCHAR(128) NOT NULL DEFAULT 'Manager',
  target_type VARCHAR(32) NOT NULL DEFAULT 'All', -- 'All', 'Specific'
  target_staff_id VARCHAR(64) REFERENCES staff(id) ON DELETE CASCADE,
  title VARCHAR(256) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(32) NOT NULL DEFAULT 'Normal', -- 'Normal', 'Urgent'
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

-- Seed restaurant settings if not present
INSERT INTO restaurant_settings (id, restaurant_name, latitude, longitude, radius_meters)
VALUES ('default', 'Table & Thyme', 28.5355, 77.3910, 50)
ON CONFLICT (id) DO NOTHING;
