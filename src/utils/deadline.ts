/**
 * KSO Deadline Utilities
 * Centralized deadline calculations used across the app.
 */

/** Get the number of days remaining until deadline (negative = expired) */
export function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

/** Check if an opportunity's deadline has passed */
export function isExpired(deadline: string | null): boolean {
  const days = getDaysRemaining(deadline);
  return days !== null && days < 0;
}

/** Check if deadline is today */
export function isDeadlineToday(deadline: string | null): boolean {
  return getDaysRemaining(deadline) === 0;
}

/** Check if deadline is tomorrow */
export function isDeadlineTomorrow(deadline: string | null): boolean {
  return getDaysRemaining(deadline) === 1;
}

/** Check if deadline is within N days */
export function isDeadlineWithin(deadline: string | null, days: number): boolean {
  const remaining = getDaysRemaining(deadline);
  return remaining !== null && remaining >= 0 && remaining <= days;
}

/** Get a human-readable deadline label */
export function getDeadlineLabel(deadline: string | null): string {
  if (!deadline) return 'No deadline';
  const days = getDaysRemaining(deadline);
  if (days === null) return 'No deadline';
  if (days < 0) return 'Expired';
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days <= 7) return `${days} days left`;
  if (days <= 30) return `${Math.ceil(days / 7)} weeks left`;
  return `${Math.ceil(days / 30)} months left`;
}

/** Get urgency level for color-coding */
export type DeadlineUrgency = 'expired' | 'urgent' | 'warning' | 'normal' | 'open';

export function getDeadlineUrgency(deadline: string | null): DeadlineUrgency {
  if (!deadline) return 'open';
  const days = getDaysRemaining(deadline);
  if (days === null) return 'open';
  if (days < 0) return 'expired';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'warning';
  return 'normal';
}

/** Format an ISO date string to a readable format */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Format relative time (e.g., "2 hours ago") */
export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}
