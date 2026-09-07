CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  type TEXT NOT NULL CHECK (type IN ('veg', 'non-veg')),
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  preparation_time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (preparation_time_minutes >= 0),
  allergens TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS menu_items_category_idx ON menu_items (category);
CREATE INDEX IF NOT EXISTS menu_items_available_idx ON menu_items (available);

INSERT INTO menu_items (id, name, price, type, image, description, category, available, preparation_time_minutes, allergens, tags)
VALUES
  ('item_truffle_bao', 'Truffle mushroom bao', 420, 'veg', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 'Steamed bao filled with roasted mushrooms and truffle aioli.', 'Small plates', TRUE, 12, ARRAY['gluten', 'soy'], ARRAY['vegan', 'popular']),
  ('item_paneer_tikka', 'Charred paneer tikka', 520, 'veg', '', 'Charred paneer with peppers and house spices.', 'Small plates', TRUE, 15, ARRAY['dairy'], ARRAY['veg']),
  ('item_butter_chicken', 'Citrus butter chicken', 680, 'non-veg', '', 'Tender chicken in a bright citrus butter sauce.', 'Mains', TRUE, 20, ARRAY['dairy'], ARRAY['non-veg', 'popular']),
  ('item_mushroom_risotto', 'Wild mushroom risotto', 590, 'veg', '', 'Creamy Arborio rice with wild mushrooms and herbs.', 'Mains', FALSE, 22, ARRAY['dairy'], ARRAY['veg']),
  ('item_cheesecake', 'Burnt basque cheesecake', 360, 'veg', '', 'Silky baked cheesecake with a caramelized top.', 'Desserts', TRUE, 8, ARRAY['dairy', 'egg'], ARRAY['veg'])
ON CONFLICT (id) DO NOTHING;
