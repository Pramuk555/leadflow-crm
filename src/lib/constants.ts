// ============================================================
// LeadFlow CRM — Constants
// ============================================================

import { Platform, ProspectStatus, PriorityLevel, LeadTemperature } from './types';

// ---------- Status Configuration ----------

export const STATUS_CONFIG: Record<ProspectStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  order: number;
}> = {
  new: {
    label: 'New',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: '✦',
    order: 0,
  },
  contacted: {
    label: 'Contacted',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    icon: '📞',
    order: 1,
  },
  follow_up: {
    label: 'Follow Up',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    icon: '🔔',
    order: 2,
  },
  interested: {
    label: 'Interested',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    icon: '🔥',
    order: 3,
  },
  proposal_sent: {
    label: 'Proposal Sent',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    icon: '📄',
    order: 4,
  },
  won: {
    label: 'Won',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: '🏆',
    order: 5,
  },
  lost: {
    label: 'Lost',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    icon: '✗',
    order: 6,
  },
};

export const STATUS_ORDER: ProspectStatus[] = [
  'new', 'contacted', 'follow_up', 'interested', 'proposal_sent', 'won', 'lost'
];

// ---------- Platform Configuration ----------

export const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  instagram: {
    label: 'Instagram',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10',
    icon: '📸',
  },
  facebook: {
    label: 'Facebook',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: '👤',
  },
  google_maps: {
    label: 'Google Maps',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    icon: '📍',
  },
  other: {
    label: 'Other',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    icon: '🌐',
  },
};

// ---------- Priority Configuration ----------

export const PRIORITY_CONFIG: Record<PriorityLevel, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  high: {
    label: 'High',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    icon: '🔴',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    icon: '🟡',
  },
  low: {
    label: 'Low',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    icon: '🟢',
  },
};

// ---------- Lead Temperature Configuration ----------

export const TEMPERATURE_CONFIG: Record<LeadTemperature, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  hot: {
    label: 'Hot',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    icon: '🔥',
  },
  warm: {
    label: 'Warm',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    icon: '🌤',
  },
  cold: {
    label: 'Cold',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    icon: '❄️',
  },
  frozen: {
    label: 'Frozen',
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    icon: '🧊',
  },
};

// ---------- Activity Configuration ----------

export const ACTIVITY_CONFIG: Record<string, {
  label: string;
  color: string;
  icon: string;
}> = {
  call: { label: 'Call', color: 'text-green-400', icon: '📞' },
  note: { label: 'Note', color: 'text-blue-400', icon: '📝' },
  status_change: { label: 'Status Change', color: 'text-violet-400', icon: '🔄' },
  ai_summary: { label: 'AI Summary', color: 'text-amber-400', icon: '✨' },
};

// ---------- Category Suggestions ----------

export const CATEGORY_SUGGESTIONS = [
  'Café', 'Restaurant', 'Boutique', 'Salon', 'Gym', 'Bakery',
  'Spa', 'Clinic', 'Dental', 'Photography', 'Florist', 'Pet Shop',
  'Jewelry', 'Real Estate', 'Tattoo', 'Barber', 'Auto Repair',
  'Clothing', 'Electronics', 'Grocery', 'Pharmacy', 'Hotel',
  'Yoga Studio', 'Dance Studio', 'Fitness', 'Other',
];

// ---------- Temperature Thresholds (in days) ----------

export const TEMPERATURE_THRESHOLDS = {
  hot: 3,    // contacted within last 3 days
  warm: 7,   // contacted within last 7 days
  cold: 14,  // contacted within last 14 days
  frozen: 14, // not contacted for 14+ days
};

// ---------- Stale Lead Threshold ----------

export const STALE_DAYS_THRESHOLD = 14; // days in same stage before considered stale
