-- Add admin rights to players table
-- Run this in your Supabase SQL Editor (Database -> SQL Editor)

-- Step 1: Add the is_admin column
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Step 2: Make yourself the admin (replace YOUR_PHONE with your actual phone number, digits only)
-- Example: UPDATE players SET is_admin = true WHERE phone = '5551234567';
UPDATE players SET is_admin = true WHERE phone = '3012137397';

-- To verify, run:
-- SELECT name, phone, is_admin FROM players;
