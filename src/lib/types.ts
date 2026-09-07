// ============================================================
// LeadFlow CRM — TypeScript Type Definitions
// ============================================================

// ---------- Enums ----------

export type Platform = 'instagram' | 'facebook' | 'google_maps' | 'other';
export type ProspectStatus = 'new' | 'contacted' | 'follow_up' | 'interested' | 'proposal_sent' | 'won' | 'lost';
export type ActivityType = 'call' | 'note' | 'status_change' | 'ai_summary';
export type TeamRole = 'owner' | 'admin' | 'member';
export type PriorityLevel = 'low' | 'medium' | 'high';
export type LeadTemperature = 'hot' | 'warm' | 'cold' | 'frozen';

// ---------- Database Row Types ----------

export interface Organization {
  id: string;
  name: string;
  gemini_api_key: string | null;
  created_at: string;
}

export interface TeamMember {
  id: string;
  org_id: string;
  user_id: string;
  role: TeamRole;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Prospect {
  id: string;
  org_id: string;
  assigned_to: string | null;

  // Business info
  business_name: string;
  platform: Platform;
  profile_link: string;
  category: string;

  // Contact person
  contact_name: string;
  contact_phone: string;
  contact_email: string;

  // Pipeline
  status: ProspectStatus;
  priority: PriorityLevel;
  position: number;

  // Revenue
  expected_revenue: number;

  // Win/Loss
  close_reason: string;

  // Timestamps
  last_contacted_at: string | null;
  status_changed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  prospect_id: string;
  created_by: string | null;
  type: ActivityType;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface FollowUp {
  id: string;
  prospect_id: string;
  due_date: string;
  note: string;
  is_done: boolean;
  created_at: string;
}

// ---------- Extended / Computed Types ----------

export interface ProspectWithRelations extends Prospect {
  follow_ups?: FollowUp[];
  activity_log?: ActivityLog[];
  assigned_member?: TeamMember | null;
  temperature?: LeadTemperature;
  days_in_stage?: number;
}

export interface ActivityLogWithAuthor extends ActivityLog {
  author?: TeamMember | null;
}

// ---------- API Request Types ----------

export interface CreateProspectInput {
  business_name: string;
  platform: Platform;
  profile_link?: string;
  category?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  assigned_to?: string | null;
  priority?: PriorityLevel;
  expected_revenue?: number;
}

export interface UpdateProspectInput {
  business_name?: string;
  platform?: Platform;
  profile_link?: string;
  category?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  assigned_to?: string | null;
  status?: ProspectStatus;
  priority?: PriorityLevel;
  position?: number;
  expected_revenue?: number;
  close_reason?: string;
}

export interface CreateActivityInput {
  prospect_id: string;
  type: ActivityType;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CreateFollowUpInput {
  prospect_id: string;
  due_date: string;
  note?: string;
}

export interface UpdateFollowUpInput {
  due_date?: string;
  note?: string;
  is_done?: boolean;
}

export interface InviteTeamMemberInput {
  email: string;
  role: TeamRole;
  display_name: string;
}

// ---------- API Response Types ----------

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface AiSummaryResponse {
  summary: string;
  next_action: string;
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
}

// ---------- Kanban Types ----------

export interface KanbanColumn {
  id: ProspectStatus;
  title: string;
  color: string;
  icon: string;
  prospects: ProspectWithRelations[];
  totalRevenue: number;
}

export interface KanbanFilters {
  platform: Platform | 'all';
  assignee: string | 'all';
  priority: PriorityLevel | 'all';
  showOverdueOnly: boolean;
  search: string;
}

// ---------- User Context ----------

export interface UserContext {
  user: {
    id: string;
    email: string;
  };
  org: Organization;
  member: TeamMember;
  team: TeamMember[];
}
