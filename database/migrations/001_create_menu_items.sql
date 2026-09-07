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
  -- Small plates
  ('item_truffle_bao', 'Truffle mushroom bao', 420, 'veg', 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', 'Steamed bao filled with roasted wild mushrooms and truffle aioli.', 'Small plates', TRUE, 12, ARRAY['gluten', 'soy'], ARRAY['vegan', 'popular', 'signature']),
  ('item_paneer_tikka', 'Charred paneer tikka', 480, 'veg', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80', 'Cottage cheese cubes marinated in Kashmiri chili and mustard oil, roasted over charcoal.', 'Small plates', TRUE, 15, ARRAY['dairy'], ARRAY['veg', 'tandoor', 'chef-special']),
  ('item_lotus_stem', 'Crispy honey chili lotus stem', 390, 'veg', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', 'Wok-tossed lotus stem glazed in hot honey, garlic chili oil, and toasted sesame.', 'Small plates', TRUE, 10, ARRAY['sesame', 'soy'], ARRAY['veg', 'crispy', 'snack']),
  ('item_lamb_seekh', 'Spiced lamb seekh kebab', 620, 'non-veg', 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80', 'Tender hand-minced lamb skewers perfumed with smoked cloves, mace, and mint chutney.', 'Small plates', TRUE, 18, ARRAY['dairy'], ARRAY['non-veg', 'tandoor', 'popular']),
  ('item_dynamite_prawns', 'Dynamite prawns', 650, 'non-veg', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', 'Golden crisp butterflied prawns tossed in sriracha tobanjan glaze and scallions.', 'Small plates', TRUE, 14, ARRAY['crustacean', 'egg'], ARRAY['non-veg', 'spicy', 'signature']),

  -- Mains
  ('item_butter_chicken', 'Citrus butter chicken', 680, 'non-veg', 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80', 'Smoked chicken tikka in silky slow-reduced tomato gravy balanced with fresh citrus zest and fenugreek.', 'Mains', TRUE, 20, ARRAY['dairy'], ARRAY['non-veg', 'popular', 'bestseller']),
  ('item_mushroom_risotto', 'Wild mushroom risotto', 590, 'veg', 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=80', 'Creamy aged carnaroli rice with wild porcini, parmesan crisp, and white truffle oil.', 'Mains', TRUE, 22, ARRAY['dairy'], ARRAY['veg', 'gluten-free']),
  ('item_dal_makhani', 'Slow-cooked dal makhani', 490, 'veg', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80', 'Black lentils simmered overnight over clay oven embers with churned white butter.', 'Mains', TRUE, 15, ARRAY['dairy'], ARRAY['veg', 'signature', 'comfort']),
  ('item_salmon', 'Pan-seared Norwegian salmon', 890, 'non-veg', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', 'Crispy skin Atlantic salmon over sweet edamame puree, grilled asparagus, and lemon butter.', 'Mains', TRUE, 25, ARRAY['fish', 'dairy'], ARRAY['non-veg', 'chef-special', 'healthy']),
  ('item_dum_biryani', 'Awadhi chicken dum biryani', 640, 'non-veg', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', 'Fragrant aged basmati rice dum-cooked with tender spiced chicken, saffron, and browned onions.', 'Mains', TRUE, 25, ARRAY['dairy'], ARRAY['non-veg', 'popular', 'royal']),
  ('item_ravioli', 'Ricotta & spinach ravioli', 560, 'veg', 'https://images.unsplash.com/photo-1587740896339-96a76170508d?auto=format&fit=crop&w=800&q=80', 'Handmade pasta pillows filled with whipped ricotta and baby spinach in sage brown butter.', 'Mains', TRUE, 18, ARRAY['gluten', 'dairy', 'egg'], ARRAY['veg', 'handcrafted']),

  -- Sides & Breads
  ('item_garlic_naan', 'Garlic naan', 120, 'veg', 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&w=800&q=80', 'Blistered clay-oven flatbread brushed with roasted garlic butter and fresh cilantro.', 'Sides & Breads', TRUE, 6, ARRAY['gluten', 'dairy'], ARRAY['veg', 'tandoor', 'bestseller']),
  ('item_truffle_fries', 'Truffle parmesan fries', 290, 'veg', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80', 'Skin-on hand-cut potatoes tossed in aromatic white truffle oil, shaved parmesan, and rosemary.', 'Sides & Breads', TRUE, 8, ARRAY['dairy'], ARRAY['veg', 'crispy']),
  ('item_laccha_paratha', 'Laccha paratha', 110, 'veg', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', 'Multi-layered flaky whole wheat bread cooked golden brown in tandoor with ghee.', 'Sides & Breads', TRUE, 6, ARRAY['gluten', 'dairy'], ARRAY['veg', 'traditional']),

  -- Desserts
  ('item_cheesecake', 'Burnt basque cheesecake', 380, 'veg', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80', 'Silky baked cheesecake with a deeply caramelized top, Madagascar vanilla, and berry coulis.', 'Desserts', TRUE, 5, ARRAY['dairy', 'egg'], ARRAY['veg', 'popular', 'signature']),
  ('item_chocolate_fondant', 'Belgian dark chocolate fondant', 420, 'veg', 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80', 'Warm chocolate cake with molten ganache center made with 70% dark chocolate and vanilla bean gelato.', 'Desserts', TRUE, 12, ARRAY['dairy', 'gluten', 'egg'], ARRAY['veg', 'decadent']),
  ('item_pistachio_kulfi', 'Saffron pistachio kulfi', 280, 'veg', 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d7?auto=format&fit=crop&w=800&q=80', 'Traditional slow-churned Indian ice cream infused with saffron strands, crushed pistachios, and green cardamom.', 'Desserts', TRUE, 5, ARRAY['dairy', 'nuts'], ARRAY['veg', 'traditional', 'gluten-free']),

  -- Beverages
  ('item_citrus_spritz', 'Citrus spritz', 280, 'veg', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80', 'Handcrafted spritz of blood orange, fresh yuzu, elderflower tonic, and bruised thyme sprig.', 'Beverages', TRUE, 4, ARRAY[]::TEXT[], ARRAY['vegan', 'refreshing', 'mocktail']),
  ('item_lime_soda', 'Fresh lime soda', 180, 'veg', 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', 'Hand-muddled Persian limes, fresh mint leaves, rock salt, and chilled sparkling soda.', 'Beverages', TRUE, 3, ARRAY[]::TEXT[], ARRAY['vegan', 'classic']),
  ('item_cold_brew', 'Artisanal cold brew tonic', 310, 'veg', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80', '18-hour cold steeped Arabica single-origin coffee poured over botanical tonic and orange peel.', 'Beverages', TRUE, 3, ARRAY[]::TEXT[], ARRAY['vegan', 'artisan-coffee'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  image = EXCLUDED.image,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  available = EXCLUDED.available,
  preparation_time_minutes = EXCLUDED.preparation_time_minutes,
  allergens = EXCLUDED.allergens,
  tags = EXCLUDED.tags,
  updated_at = NOW();
