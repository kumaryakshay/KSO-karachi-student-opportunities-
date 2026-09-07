/**
 * KSO Deadline Notification Service
 * Scans saved opportunities for upcoming deadlines and generates
 * "deadline tomorrow" / "deadline in 3 days" notifications.
 *
 * Designed to be called once on HomeScreen mount (fire-and-forget).
 * De-duplicates by generating a deterministic notification ID.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Check saved opportunities for upcoming deadlines and create notifications.
 * Safe to call repeatedly — skips already-sent notifications via ID collision.
 * Returns the count of new notifications created.
 */
export async function generateDeadlineNotifications(userId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  // 1. Get user's saved opportunity IDs
  const { data: savedItems, error: savedError } = await supabase
    .from('saved_opportunities')
    .select('opportunity_id')
    .eq('user_id', userId);

  if (savedError || !savedItems || savedItems.length === 0) return 0;

  const savedIds = savedItems.map((s: any) => s.opportunity_id);

  // 2. Fetch deadline info for saved opportunities
  const { data: opps, error: oppError } = await supabase
    .from('opportunities')
    .select('id, title, organization, deadline')
    .in('id', savedIds)
    .not('deadline', 'is', null);

  if (oppError || !opps) return 0;

  // 3. Check existing notifications to avoid duplicates
  const { data: existingNotifs } = await supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .in('type', ['deadline_reminder', 'deadline_warning']);

  const existingIds = new Set((existingNotifs || []).map((n: any) => n.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newNotifications: {
    id: string;
    user_id: string;
    opportunity_id: string;
    type: string;
    title: string;
    message: string;
    is_read: boolean;
  }[] = [];

  for (const opp of opps) {
    if (!opp.deadline) continue;

    const deadlineDate = new Date(opp.deadline);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / DAY_MS);

    let type: string | null = null;
    let title: string | null = null;
    let message: string | null = null;

    if (diffDays === 1) {
      type = 'deadline_warning';
      title = 'Deadline Tomorrow!';
      message = `"${opp.title}" by ${opp.organization} — application deadline is tomorrow. Don't miss out!`;
    } else if (diffDays === 3) {
      type = 'deadline_warning';
      title = 'Deadline in 3 Days';
      message = `"${opp.title}" by ${opp.organization} — only 3 days left to apply!`;
    } else if (diffDays === 7) {
      type = 'deadline_reminder';
      title = 'Deadline Next Week';
      message = `"${opp.title}" by ${opp.organization} — deadline is in one week.`;
    } else if (diffDays === 14) {
      type = 'deadline_reminder';
      title = 'Upcoming Deadline';
      message = `"${opp.title}" by ${opp.organization} — deadline is in 2 weeks.`;
    }

    if (type && title && message) {
      // Deterministic ID prevents duplicate notifications on repeated calls
      const notifId = `deadline_${type}_${opp.id}_${diffDays}d`;

      if (!existingIds.has(notifId)) {
        newNotifications.push({
          id: notifId,
          user_id: userId,
          opportunity_id: opp.id,
          type,
          title,
          message,
          is_read: false,
        });
      }
    }
  }

  if (newNotifications.length === 0) return 0;

  // 4. Insert all new notifications (ignore duplicates via ON CONFLICT DO NOTHING)
  const { error } = await supabase
    .from('notifications')
    .insert(newNotifications);

  if (error) {
    console.warn('[KSO] Deadline notification insert error:', error.message);
    return 0;
  }

  return newNotifications.length;
}

/**
 * Get the current user's ID (if logged in).
 * Returns null for guests or unauthenticated users.
 */
export async function getCurrentUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}
