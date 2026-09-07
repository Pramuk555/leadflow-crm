// ============================================================
// LeadFlow CRM — Utility Functions
// ============================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, format, formatDistanceToNow, isToday, isPast, parseISO } from 'date-fns';
import { LeadTemperature, ProspectWithRelations } from './types';
import { TEMPERATURE_THRESHOLDS, STALE_DAYS_THRESHOLD } from './constants';

// ---------- Classname Utility ----------

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---------- Date Utilities ----------

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy h:mm a');
}

export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function isDueToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function isOverdue(dateStr: string): boolean {
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function isDueTodayOrOverdue(dateStr: string): boolean {
  return isDueToday(dateStr) || isOverdue(dateStr);
}

// ---------- Lead Temperature Calculator ----------

export function calculateTemperature(prospect: ProspectWithRelations): LeadTemperature {
  // Won/Lost leads don't have temperature
  if (prospect.status === 'won' || prospect.status === 'lost') {
    return 'cold';
  }

  if (!prospect.last_contacted_at) {
    // Never contacted — check how old the lead is
    const daysSinceCreated = differenceInDays(new Date(), parseISO(prospect.created_at));
    if (daysSinceCreated <= TEMPERATURE_THRESHOLDS.hot) return 'warm';
    if (daysSinceCreated <= TEMPERATURE_THRESHOLDS.warm) return 'cold';
    return 'frozen';
  }

  const daysSinceContact = differenceInDays(new Date(), parseISO(prospect.last_contacted_at));

  if (daysSinceContact <= TEMPERATURE_THRESHOLDS.hot) return 'hot';
  if (daysSinceContact <= TEMPERATURE_THRESHOLDS.warm) return 'warm';
  if (daysSinceContact <= TEMPERATURE_THRESHOLDS.cold) return 'cold';
  return 'frozen';
}

// ---------- Days in Stage ----------

export function calculateDaysInStage(statusChangedAt: string): number {
  return differenceInDays(new Date(), parseISO(statusChangedAt));
}

export function isStale(statusChangedAt: string): boolean {
  return calculateDaysInStage(statusChangedAt) >= STALE_DAYS_THRESHOLD;
}

// ---------- Revenue Formatting ----------

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `\$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `\$${(amount / 1000).toFixed(1)}K`;
  }
  return `\$${amount.toLocaleString()}`;
}

// ---------- Initials Generator ----------

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// ---------- URL Validation ----------

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ---------- Truncate Text ----------

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

// ---------- Generate Color from String (for avatars) ----------

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500',
];

export function getAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
