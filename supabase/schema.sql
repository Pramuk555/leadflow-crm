-- ============================================================
-- LeadFlow CRM — Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. CUSTOM TYPES (ENUMS)
-- ============================================================

CREATE TYPE platform_type AS ENUM ('instagram', 'facebook', 'google_maps', 'other');
CREATE TYPE prospect_status AS ENUM ('new', 'contacted', 'follow_up', 'interested', 'proposal_sent', 'won', 'lost');
CREATE TYPE activity_type AS ENUM ('call', 'note', 'status_change', 'ai_summary');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');

-- ============================================================
-- 2. TABLES
-- ============================================================

-- Organizations (teams)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gemini_api_key TEXT, -- stored server-side only, accessed via API routes
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Team members linking users to organizations
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

-- Prospects (leads)
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Business info
  business_name TEXT NOT NULL,
  platform platform_type NOT NULL DEFAULT 'other',
  profile_link TEXT DEFAULT '',
  category TEXT DEFAULT '',
  
  -- Contact person
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  
  -- Pipeline
  status prospect_status NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  position INTEGER NOT NULL DEFAULT 0,
  
  -- Revenue tracking
  expected_revenue NUMERIC(12, 2) DEFAULT 0,
  
  -- Win/Loss
  close_reason TEXT DEFAULT '', -- reason for winning or losing
  
  -- Timestamps
  last_contacted_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activity log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}', -- extra data like old_status, new_status for status_change
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Follow-ups
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  note TEXT DEFAULT '',
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================

CREATE INDEX idx_team_members_user ON team_members(user_id, org_id);
CREATE INDEX idx_team_members_org ON team_members(org_id);
CREATE INDEX idx_prospects_org_status ON prospects(org_id, status);
CREATE INDEX idx_prospects_assigned ON prospects(assigned_to);
CREATE INDEX idx_prospects_org_position ON prospects(org_id, status, position);
CREATE INDEX idx_activity_prospect ON activity_log(prospect_id, created_at DESC);
CREATE INDEX idx_activity_created_by ON activity_log(created_by);
CREATE INDEX idx_followups_prospect ON follow_ups(prospect_id);
CREATE INDEX idx_followups_due ON follow_ups(due_date) WHERE NOT is_done;

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Get organization IDs for the current user (used in RLS policies)
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM team_members WHERE user_id = auth.uid();
$$;

-- Get the primary org ID for the current user
CREATE OR REPLACE FUNCTION get_user_primary_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Auto-update status_changed_at when status changes
CREATE OR REPLACE FUNCTION update_status_changed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Auto-update last_contacted_at when activity is added
CREATE OR REPLACE FUNCTION update_last_contacted()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type IN ('call', 'note') THEN
    UPDATE prospects SET last_contacted_at = now() WHERE id = NEW.prospect_id;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

CREATE TRIGGER tr_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_prospects_status_changed
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_status_changed_at();

CREATE TRIGGER tr_activity_last_contacted
  AFTER INSERT ON activity_log
  FOR EACH ROW
  EXECUTE FUNCTION update_last_contacted();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Organizations: users can only see orgs they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (SELECT get_user_org_ids()));

-- Team members: users can see members of their orgs
CREATE POLICY "Users can view team members of their org"
  ON team_members FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Owners can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Owners can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

-- Prospects: full CRUD scoped to org
CREATE POLICY "Users can view prospects in their org"
  ON prospects FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can insert prospects in their org"
  ON prospects FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can update prospects in their org"
  ON prospects FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Users can delete prospects in their org"
  ON prospects FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

-- Activity log: scoped via prospect's org
CREATE POLICY "Users can view activities in their org"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can insert activities in their org"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- Follow-ups: scoped via prospect's org
CREATE POLICY "Users can view follow-ups in their org"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can insert follow-ups in their org"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can update follow-ups in their org"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

CREATE POLICY "Users can delete follow-ups in their org"
  ON follow_ups FOR DELETE
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

-- ============================================================
-- 7. ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE prospects;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE follow_ups;
