-- Squad Proposals Feature - Database Schema
-- Run this in your Supabase SQL Editor (Database -> SQL Editor)

-- ============================================
-- 1. PROPOSALS TABLE (The Topic/Question)
-- ============================================
CREATE TABLE IF NOT EXISTS proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'decided', 'cancelled')),
  created_by UUID REFERENCES players(id) ON DELETE SET NULL,
  winning_option_id UUID, -- Will reference proposal_options after that table exists
  target_date DATE NOT NULL,
  target_time TIME,
  activity_type TEXT NOT NULL DEFAULT 'activity' CHECK (activity_type IN ('meal', 'golf', 'activity', 'other')),
  deadline TIMESTAMPTZ,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PROPOSAL OPTIONS TABLE (The Choices)
-- ============================================
CREATE TABLE IF NOT EXISTS proposal_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  cost TEXT CHECK (cost IN ('$', '$$', '$$$', NULL)),
  location TEXT,
  image_url TEXT,
  created_by UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for winning_option_id now that proposal_options exists
ALTER TABLE proposals 
ADD CONSTRAINT fk_winning_option 
FOREIGN KEY (winning_option_id) REFERENCES proposal_options(id) ON DELETE SET NULL;

-- ============================================
-- 3. PROPOSAL VOTES TABLE (Approval Voting)
-- ============================================
CREATE TABLE IF NOT EXISTS proposal_votes (
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES proposal_options(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (proposal_id, option_id, player_id)
);

-- ============================================
-- INDEXES for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_target_date ON proposals(target_date);
CREATE INDEX IF NOT EXISTS idx_proposal_options_proposal ON proposal_options(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_option ON proposal_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_proposal_votes_player ON proposal_votes(player_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read proposals (public within the app)
CREATE POLICY "Anyone can view proposals" ON proposals FOR SELECT USING (true);
CREATE POLICY "Anyone can insert proposals" ON proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update proposals" ON proposals FOR UPDATE USING (true);

CREATE POLICY "Anyone can view options" ON proposal_options FOR SELECT USING (true);
CREATE POLICY "Anyone can insert options" ON proposal_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update options" ON proposal_options FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete options" ON proposal_options FOR DELETE USING (true);

CREATE POLICY "Anyone can view votes" ON proposal_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert votes" ON proposal_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete votes" ON proposal_votes FOR DELETE USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Run these commands to enable realtime updates:
-- ALTER PUBLICATION supabase_realtime ADD TABLE proposals;
-- ALTER PUBLICATION supabase_realtime ADD TABLE proposal_options;
-- ALTER PUBLICATION supabase_realtime ADD TABLE proposal_votes;

SELECT 'Proposals schema created successfully!' AS status;

-- 
-- Add URL column to proposals table
-- 
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS url TEXT;
