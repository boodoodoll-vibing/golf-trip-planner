-- Multi-Trip Migration & Schema Repair
-- Run this in your Supabase SQL Editor

-- 1. Ensure basic tables exist (Schema Repair)
-- ==========================================

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_date DATE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  time TEXT,
  location TEXT,
  notes TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID REFERENCES players(id),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT DEFAULT 'other',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  trip_id UUID -- We'll set the FK constraint later
);

CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL
);

-- 2. Create TRIPS table (Migration from singleton 'trip' table)
-- ==========================================================
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  destination TEXT,
  start_date DATE,
  end_date DATE,
  wifi_name TEXT,
  wifi_pass TEXT, 
  house_address TEXT,
  gate_code TEXT,
  door_code TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID -- will be linked after migration
);

-- 3. Migrate existing trip data (if any)
-- =====================================
INSERT INTO trips (
  id, name, destination, start_date, end_date, 
  wifi_name, wifi_pass, house_address, gate_code, door_code
)
SELECT 
  id, name, destination, start_date, end_date,
  wifi_name, wifi_pass, house_address, gate_code, door_code
FROM trip
LIMIT 1;

-- 4. Add trip_id to related tables & FK Constraints
-- ===============================================

-- Players
ALTER TABLE players ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;

-- Proposals (Ensuring table exists too)
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  created_by UUID REFERENCES players(id) ON DELETE SET NULL,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE, -- direct add here if creating new
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- If proposals existed, ensure trip_id is added
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE CASCADE;


-- 5. Backfill trip_id for existing data
-- ====================================
DO $$
DECLARE
  first_trip_id UUID;
BEGIN
  -- Grab the migrated trip (or just the first one)
  SELECT id INTO first_trip_id FROM trips LIMIT 1;
  
  -- If we found a trip, link everything to it
  IF first_trip_id IS NOT NULL THEN
    UPDATE players SET trip_id = first_trip_id WHERE trip_id IS NULL;
    UPDATE activities SET trip_id = first_trip_id WHERE trip_id IS NULL;
    UPDATE expenses SET trip_id = first_trip_id WHERE trip_id IS NULL;
    UPDATE proposals SET trip_id = first_trip_id WHERE trip_id IS NULL;
  END IF;
END $$;

-- 6. Indexes for performance
-- =========================
CREATE INDEX IF NOT EXISTS idx_players_trip ON players(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip ON activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_proposals_trip ON proposals(trip_id);

-- 7. Enable RLS (Simplicity First: Open Access for now)
-- ===================================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

-- Open Policy
DROP POLICY IF EXISTS "Public view trips" ON trips;
CREATE POLICY "Public view trips" ON trips FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert trips" ON trips;
CREATE POLICY "Public insert trips" ON trips FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update trips" ON trips;
CREATE POLICY "Public update trips" ON trips FOR UPDATE USING (true);

-- Expenses policies (simple open access)
DROP POLICY IF EXISTS "Public view expenses" ON expenses;
CREATE POLICY "Public view expenses" ON expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert expenses" ON expenses;
CREATE POLICY "Public insert expenses" ON expenses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete expenses" ON expenses;
CREATE POLICY "Public delete expenses" ON expenses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public view splits" ON expense_splits;
CREATE POLICY "Public view splits" ON expense_splits FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert splits" ON expense_splits;
CREATE POLICY "Public insert splits" ON expense_splits FOR INSERT WITH CHECK (true);

SELECT 'Migration complete. Tables created if missing.' AS status;
