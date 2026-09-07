-- Migration: Add 'Arrived' to tables status check constraint
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE tables ADD CONSTRAINT tables_status_check CHECK (status IN ('Available', 'Occupied', 'Booked', 'Arrived', 'Needs cleaning'));
