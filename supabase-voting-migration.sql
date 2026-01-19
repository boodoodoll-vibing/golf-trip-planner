-- Squad Suggestions - Database Migration
-- Converts from multi-option voting to Yes/No/Indifferent RSVP-style voting with comments

-- ================================
-- 1. UPDATE proposal_votes TABLE
-- ================================

-- First, clear existing votes (they won't work with new schema)
DELETE FROM proposal_votes;

-- Drop the option_id column and add response column
ALTER TABLE proposal_votes 
  DROP COLUMN IF EXISTS option_id;

ALTER TABLE proposal_votes 
  ADD COLUMN IF NOT EXISTS response TEXT NOT NULL DEFAULT 'yes' 
  CHECK (response IN ('yes', 'no', 'indifferent'));

-- Update primary key: one vote per player per proposal
ALTER TABLE proposal_votes DROP CONSTRAINT IF EXISTS proposal_votes_pkey;
ALTER TABLE proposal_votes ADD PRIMARY KEY (proposal_id, player_id);

-- ================================
-- 2. CREATE proposal_comments TABLE
-- ================================

CREATE TABLE IF NOT EXISTS proposal_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by proposal
CREATE INDEX IF NOT EXISTS idx_proposal_comments_proposal ON proposal_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_comments_created ON proposal_comments(created_at);

-- RLS Policies
ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON proposal_comments;
CREATE POLICY "Anyone can view comments" ON proposal_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert comments" ON proposal_comments;
CREATE POLICY "Anyone can insert comments" ON proposal_comments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete comments" ON proposal_comments;
CREATE POLICY "Anyone can delete comments" ON proposal_comments FOR DELETE USING (true);

-- ================================
-- 3. OPTIONAL: Drop proposal_options table
-- ================================
-- Uncomment if you want to remove the options table entirely
-- DROP TABLE IF EXISTS proposal_options CASCADE;

-- ================================
-- 4. ADD delete permission to proposals (for admin cleanup)
-- ================================

DROP POLICY IF EXISTS "Anyone can delete proposals" ON proposals;
CREATE POLICY "Anyone can delete proposals" ON proposals FOR DELETE USING (true);

-- ================================
-- DONE! Run this in Supabase SQL Editor
-- ================================
