-- ============================================================
-- LeadFlow CRM - Database Schema
-- Safe to run more than once in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. CUSTOM TYPES (ENUMS)
-- ============================================================

DO $$
BEGIN
  CREATE TYPE platform_type AS ENUM ('instagram', 'facebook', 'google_maps', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE prospect_status AS ENUM ('new', 'contacted', 'follow_up', 'interested', 'proposal_sent', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE activity_type AS ENUM ('call', 'note', 'status_change', 'ai_summary');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE team_role ADD VALUE IF NOT EXISTS 'affiliate';

DO $$
BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'member',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  fixed_affiliate_amount NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, user_id)
);

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS fixed_affiliate_amount NUMERIC(12, 2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_fixed_amount NUMERIC(12, 2) DEFAULT 0,
  affiliate_payout_status TEXT DEFAULT 'not_applicable',
  business_name TEXT NOT NULL,
  platform platform_type NOT NULL DEFAULT 'other',
  profile_link TEXT DEFAULT '',
  address TEXT DEFAULT '',
  category TEXT DEFAULT '',
  contact_name TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  status prospect_status NOT NULL DEFAULT 'new',
  priority priority_level NOT NULL DEFAULT 'medium',
  position INTEGER NOT NULL DEFAULT 0,
  expected_revenue NUMERIC(12, 2) DEFAULT 0,
  close_reason TEXT DEFAULT '',
  last_contacted_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prospects ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '';
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS affiliate_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS affiliate_fixed_amount NUMERIC(12, 2) DEFAULT 0;
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS affiliate_payout_status TEXT DEFAULT 'not_applicable';

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type activity_type NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
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

CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id, org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org ON team_members(org_id);
CREATE INDEX IF NOT EXISTS idx_prospects_org_status ON prospects(org_id, status);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_prospects_org_position ON prospects(org_id, status, position);
CREATE INDEX IF NOT EXISTS idx_activity_prospect ON activity_log(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_by ON activity_log(created_by);
CREATE INDEX IF NOT EXISTS idx_followups_prospect ON follow_ups(prospect_id);
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(due_date) WHERE NOT is_done;

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM team_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_primary_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT org_id FROM team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

CREATE OR REPLACE FUNCTION setup_user_workspace(
  p_org_name TEXT,
  p_display_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org organizations%ROWTYPE;
  v_member team_members%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NULLIF(trim(p_org_name), '') IS NULL OR NULLIF(trim(p_display_name), '') IS NULL THEN
    RAISE EXCEPTION 'Missing required fields';
  END IF;

  IF EXISTS (SELECT 1 FROM team_members WHERE user_id = v_user_id) THEN
    RAISE EXCEPTION 'User already belongs to an organization';
  END IF;

  INSERT INTO organizations (name)
  VALUES (trim(p_org_name))
  RETURNING * INTO v_org;

  INSERT INTO team_members (org_id, user_id, display_name, role)
  VALUES (v_org.id, v_user_id, trim(p_display_name), 'owner')
  RETURNING * INTO v_member;

  RETURN jsonb_build_object(
    'org', to_jsonb(v_org),
    'member', to_jsonb(v_member)
  );
END;
$$;

REVOKE ALL ON FUNCTION setup_user_workspace(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION setup_user_workspace(TEXT, TEXT) TO authenticated;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS tr_prospects_updated_at ON prospects;
CREATE TRIGGER tr_prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_prospects_status_changed ON prospects;
CREATE TRIGGER tr_prospects_status_changed
  BEFORE UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION update_status_changed_at();

DROP TRIGGER IF EXISTS tr_activity_last_contacted ON activity_log;
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

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations"
  ON organizations FOR UPDATE
  TO authenticated
  USING (id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can view team members of their org" ON team_members;
CREATE POLICY "Users can view team members of their org"
  ON team_members FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Owners can insert team members" ON team_members;
CREATE POLICY "Owners can insert team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Owners can delete team members" ON team_members;
CREATE POLICY "Owners can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can view prospects in their org" ON prospects;
CREATE POLICY "Users can view prospects in their org"
  ON prospects FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can insert prospects in their org" ON prospects;
CREATE POLICY "Users can insert prospects in their org"
  ON prospects FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can update prospects in their org" ON prospects;
CREATE POLICY "Users can update prospects in their org"
  ON prospects FOR UPDATE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can delete prospects in their org" ON prospects;
CREATE POLICY "Users can delete prospects in their org"
  ON prospects FOR DELETE
  TO authenticated
  USING (org_id IN (SELECT get_user_org_ids()));

DROP POLICY IF EXISTS "Users can view activities in their org" ON activity_log;
CREATE POLICY "Users can view activities in their org"
  ON activity_log FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "Users can insert activities in their org" ON activity_log;
CREATE POLICY "Users can insert activities in their org"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "Users can view follow-ups in their org" ON follow_ups;
CREATE POLICY "Users can view follow-ups in their org"
  ON follow_ups FOR SELECT
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "Users can insert follow-ups in their org" ON follow_ups;
CREATE POLICY "Users can insert follow-ups in their org"
  ON follow_ups FOR INSERT
  TO authenticated
  WITH CHECK (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "Users can update follow-ups in their org" ON follow_ups;
CREATE POLICY "Users can update follow-ups in their org"
  ON follow_ups FOR UPDATE
  TO authenticated
  USING (
    prospect_id IN (
      SELECT id FROM prospects WHERE org_id IN (SELECT get_user_org_ids())
    )
  );

DROP POLICY IF EXISTS "Users can delete follow-ups in their org" ON follow_ups;
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

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prospects;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE follow_ups;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;
