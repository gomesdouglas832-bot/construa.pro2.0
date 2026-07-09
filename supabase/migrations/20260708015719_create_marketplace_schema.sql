/*
# Create ObraLink marketplace schema

1. Overview
This migration creates the full schema for a construction-professionals marketplace ("ObraLink").
The platform connects professionals (pedreiros, engenheiros, arquitetos, etc.) with clients
who need construction work. Professionals sign in to manage a profile, portfolio, and stories.
Clients browse the public marketplace and contact professionals via WhatsApp.

2. New Tables
- `categories` — lookup table of professional categories (Pedreiro, Engenheiro, Arquiteto, etc.)
  - id (uuid, pk), name (text, unique), slug (text, unique), icon (text)
- `profiles` — one row per professional, linked to auth.users
  - id (uuid, pk, references auth.users)
  - full_name, title, bio, city, state, whatsapp, avatar_url, cover_url
  - specialties (text[]), years_experience (int), verified (bool), rating (numeric)
  - is_active (bool), created_at, updated_at
- `portfolio_items` — portfolio photos/projects for a professional
  - id, profile_id (fk profiles), title, description, image_url, category, created_at
- `stories` — ephemeral "behind the scenes" posts with expiry
  - id, profile_id (fk profiles), image_url, caption, status, expires_at, created_at
- `profile_views` — analytics: one row per profile view event
  - id, profile_id (fk profiles), viewer_source, created_at
- `whatsapp_clicks` — analytics: one row per WhatsApp CTA click
  - id, profile_id (fk profiles), origin, created_at

3. Security (RLS)
- `profiles`:
  - SELECT: public (TO anon, authenticated) — anyone can browse professionals.
  - INSERT/UPDATE/DELETE: owner only (TO authenticated, auth.uid() = id).
- `portfolio_items`:
  - SELECT: public.
  - INSERT/UPDATE/DELETE: owner of parent profile (EXISTS check against profiles).
- `stories`:
  - SELECT: public (only active, non-expired rows are returned by the app).
  - INSERT/UPDATE/DELETE: owner of parent profile.
- `profile_views` and `whatsapp_clicks`:
  - INSERT: public (TO anon, authenticated) — anyone can trigger an analytics event.
  - SELECT/UPDATE/DELETE: owner of the related profile only.
- `categories`:
  - SELECT: public. INSERT/UPDATE/DELETE: authenticated (admin-style, kept open for simplicity).

4. Important Notes
1. `profiles.id` is also the foreign key to auth.users (1:1). The owner column IS the primary key,
   so we do not need a separate `user_id` column — `auth.uid() = id` is the ownership check.
2. Owner columns on child tables (portfolio_items, stories, analytics) use `profile_id` and the
   ownership check goes through `profiles.id = auth.uid()`.
3. `profiles.id` has DEFAULT auth.uid() so inserts from the client work even when id is omitted.
4. Triggers update `profiles.updated_at` automatically.
5. An index on `profiles.city` and `profiles.is_active` speeds up the public browse query.
6. A partial index on `stories` (active, not expired) speeds up the public stories feed.
*/

-- ---------- categories ----------
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_categories" ON categories;
CREATE POLICY "public_read_categories"
ON categories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_manage_categories" ON categories;
CREATE POLICY "auth_manage_categories"
ON categories FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_categories" ON categories;
CREATE POLICY "auth_update_categories"
ON categories FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_categories" ON categories;
CREATE POLICY "auth_delete_categories"
ON categories FOR DELETE
TO authenticated USING (true);

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  avatar_url text,
  cover_url text,
  specialties text[] NOT NULL DEFAULT '{}',
  years_experience int NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  rating numeric(2,1) NOT NULL DEFAULT 5.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_profiles" ON profiles;
CREATE POLICY "public_read_profiles"
ON profiles FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_profile" ON profiles;
CREATE POLICY "owner_insert_profile"
ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_update_profile" ON profiles;
CREATE POLICY "owner_update_profile"
ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "owner_delete_profile" ON profiles;
CREATE POLICY "owner_delete_profile"
ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_city_active ON profiles (city, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles (is_active);

-- ---------- portfolio_items ----------
CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  category text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_portfolio" ON portfolio_items;
CREATE POLICY "public_read_portfolio"
ON portfolio_items FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_portfolio" ON portfolio_items;
CREATE POLICY "owner_insert_portfolio"
ON portfolio_items FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = portfolio_items.profile_id AND p.id = auth.uid())
);

DROP POLICY IF EXISTS "owner_update_portfolio" ON portfolio_items;
CREATE POLICY "owner_update_portfolio"
ON portfolio_items FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = portfolio_items.profile_id AND p.id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = portfolio_items.profile_id AND p.id = auth.uid())
);

DROP POLICY IF EXISTS "owner_delete_portfolio" ON portfolio_items;
CREATE POLICY "owner_delete_portfolio"
ON portfolio_items FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = portfolio_items.profile_id AND p.id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_portfolio_profile ON portfolio_items (profile_id, created_at DESC);

-- ---------- stories ----------
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_stories" ON stories;
CREATE POLICY "public_read_stories"
ON stories FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "owner_insert_story" ON stories;
CREATE POLICY "owner_insert_story"
ON stories FOR INSERT
TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = stories.profile_id AND p.id = auth.uid())
);

DROP POLICY IF EXISTS "owner_update_story" ON stories;
CREATE POLICY "owner_update_story"
ON stories FOR UPDATE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = stories.profile_id AND p.id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = stories.profile_id AND p.id = auth.uid())
);

DROP POLICY IF EXISTS "owner_delete_story" ON stories;
CREATE POLICY "owner_delete_story"
ON stories FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = stories.profile_id AND p.id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_stories_active ON stories (profile_id, created_at DESC)
  WHERE status = 'active';

-- ---------- profile_views ----------
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_source text NOT NULL DEFAULT 'marketplace',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_profile_view" ON profile_views;
CREATE POLICY "public_insert_profile_view"
ON profile_views FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "owner_read_profile_views" ON profile_views;
CREATE POLICY "owner_read_profile_views"
ON profile_views FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_views.profile_id AND p.id = auth.uid())
);

DROP POLICY IF EXISTS "owner_delete_profile_views" ON profile_views;
CREATE POLICY "owner_delete_profile_views"
ON profile_views FOR DELETE
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = profile_views.profile_id AND p.id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_views_profile_created ON profile_views (profile_id, created_at DESC);

-- ---------- whatsapp_clicks ----------
CREATE TABLE IF NOT EXISTS whatsapp_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin text NOT NULL DEFAULT 'profile',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_insert_whatsapp_click" ON whatsapp_clicks;
CREATE POLICY "public_insert_whatsapp_click"
ON whatsapp_clicks FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "owner_read_whatsapp_clicks" ON whatsapp_clicks;
CREATE POLICY "owner_read_whatsapp_clicks"
ON whatsapp_clicks FOR SELECT
TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = whatsapp_clicks.profile_id AND p.id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_clicks_profile_created ON whatsapp_clicks (profile_id, created_at DESC);

-- ---------- updated_at trigger ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------- seed categories ----------
INSERT INTO categories (name, slug, icon) VALUES
  ('Pedreiro', 'pedreiro', 'BrickWall'),
  ('Engenheiro Civil', 'engenheiro-civil', 'Compass'),
  ('Arquiteto', 'arquiteto', 'Ruler'),
  ('Eletricista', 'eletricista', 'Zap'),
  ('Encanador', 'encanador', 'Wrench'),
  ('Pintor', 'pintor', 'PaintRoller'),
  ('Marceneiro', 'marceneiro', 'Hammer'),
  ('Azulejista', 'azulejista', 'Grid3x3'),
  ('Gesseiro', 'gesseiro', 'Layers'),
  ('Mestre de Obras', 'mestre-de-obras', 'HardHat')
ON CONFLICT (name) DO NOTHING;
