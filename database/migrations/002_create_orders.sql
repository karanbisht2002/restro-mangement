CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  table_name TEXT NOT NULL,
  item_list TEXT[] NOT NULL,
  item_count TEXT NOT NULL,
  total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
  status TEXT NOT NULL DEFAULT 'Queued' CHECK (status IN ('Queued', 'Preparing', 'Ready', 'Notified', 'Served')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC);

INSERT INTO orders (id, customer, table_name, item_list, item_count, total, status)
VALUES
  ('#1048', 'Riya Sharma', 'Table 08', ARRAY['Citrus butter chicken', 'Garlic naan'], '2 items', 1842, 'Queued'),
  ('#1045', 'Kabir and friends', 'Table 03', ARRAY['Citrus spritz', 'Wild mushroom risotto', 'Still water'], '3 items', 2250, 'Preparing'),
  ('#1047', 'Arjun Mehta', 'Table 14', ARRAY['Charred paneer tikka', 'Truffle mushroom bao', '2 lime sodas'], '4 items', 3640, 'Ready'),
  ('#1046', 'Takeaway · Neha Joshi', 'Takeaway', ARRAY['Burnt basque cheesecake'], '1 item', 760, 'Served')
ON CONFLICT (id) DO NOTHING;
