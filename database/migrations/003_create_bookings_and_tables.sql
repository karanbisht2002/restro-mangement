CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  seats INTEGER NOT NULL CHECK (seats > 0),
  zone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Booked', 'Needs cleaning')),
  server_name TEXT NOT NULL DEFAULT 'Priya S.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS tables_status_idx ON tables (status);
CREATE INDEX IF NOT EXISTS tables_zone_idx ON tables (zone);

CREATE TABLE IF NOT EXISTS table_bookings (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  phone TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  table_id TEXT REFERENCES tables(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Booked' CHECK (status IN ('Booked', 'Arrived', 'Seated', 'Completed', 'Cancelled', 'No show')),
  deposit NUMERIC(10, 2) NOT NULL DEFAULT 500 CHECK (deposit >= 0),
  source TEXT NOT NULL DEFAULT 'Phone' CHECK (source IN ('Phone', 'Walk-in', 'Web link', 'Online')),
  special_requests TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS table_bookings_date_idx ON table_bookings (booking_date);
CREATE INDEX IF NOT EXISTS table_bookings_status_idx ON table_bookings (status);
CREATE INDEX IF NOT EXISTS table_bookings_table_id_idx ON table_bookings (table_id);

-- Seed initial tables matching the floor plan
INSERT INTO tables (id, seats, zone, status, server_name)
VALUES
  ('T01', 2, 'Window', 'Available', 'Priya S.'),
  ('T02', 4, 'Family', 'Occupied', 'Aarav R.'),
  ('T03', 4, 'Family', 'Needs cleaning', 'Aarav R.'),
  ('T04', 6, 'Garden', 'Available', 'Vikram K.'),
  ('T05', 2, 'Window', 'Booked', 'Priya S.'),
  ('T06', 8, 'Family', 'Occupied', 'Aarav R.'),
  ('T07', 4, 'Garden', 'Available', 'Vikram K.'),
  ('T08', 6, 'Smoking', 'Occupied', 'Priya S.'),
  ('T09', 2, 'Window', 'Available', 'Priya S.'),
  ('T10', 4, 'Family', 'Booked', 'Aarav R.')
ON CONFLICT (id) DO UPDATE SET
  seats = EXCLUDED.seats,
  zone = EXCLUDED.zone,
  status = EXCLUDED.status,
  server_name = EXCLUDED.server_name,
  updated_at = NOW();

-- Seed initial reservations matching current data
INSERT INTO table_bookings (id, customer, phone, booking_date, booking_time, guests, table_id, status, deposit, source, special_requests)
VALUES
  ('book_101', 'Maya Kapoor', '+91 98201 12345', CURRENT_DATE, '12:30 PM', 4, 'T05', 'Booked', 500, 'Phone', 'Window table preferred'),
  ('book_102', 'Rohan Mehta', '+91 98202 23456', CURRENT_DATE, '1:00 PM', 2, 'T01', 'Arrived', 500, 'Walk-in', ''),
  ('book_103', 'The Sharma party', '+91 98203 34567', CURRENT_DATE, '7:30 PM', 6, NULL, 'Booked', 500, 'Web link', 'Birthday celebration'),
  ('book_104', 'Anika Singh', '+91 98204 45678', CURRENT_DATE, '8:00 PM', 3, 'T10', 'No show', 500, 'Phone', 'High chair needed')
ON CONFLICT (id) DO UPDATE SET
  customer = EXCLUDED.customer,
  phone = EXCLUDED.phone,
  booking_date = EXCLUDED.booking_date,
  booking_time = EXCLUDED.booking_time,
  guests = EXCLUDED.guests,
  table_id = EXCLUDED.table_id,
  status = EXCLUDED.status,
  deposit = EXCLUDED.deposit,
  source = EXCLUDED.source,
  special_requests = EXCLUDED.special_requests,
  updated_at = NOW();
