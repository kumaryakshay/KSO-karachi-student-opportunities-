/**
 * KSO Notification Service
 *
 * Reads notifications from Supabase for logged-in users.
 * Guests can use the local mock notifications.
 */

import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient';

import {
  AppNotification,
  NotificationType,
} from '../types/notification';

// ─────────────────────────────────────────────────────────────
// MOCK DATA FOR GUESTS
// ─────────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-001',
    type: 'personalized',
    title: 'Recommended for You',
    message:
      "Based on your profile, this opportunity may be a great match.",
    opportunityId: undefined,
    createdAt: new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString(),
    isRead: false,
  },
];

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function mapRowToNotification(
  row: any
): AppNotification {
  const type =
    (row.type as NotificationType) ||
    'new_opportunity';

  return {
    id: String(row.id),

    type,

    // Use the database title first.
    // If there is no title, create a default one.
    title:
      row.title ||
      getDefaultTitle(type),

    message:
      row.message || '',

    opportunityId:
      row.opportunity_id || undefined,

    createdAt:
      row.created_at ||
      new Date().toISOString(),

    isRead:
      row.is_read === true,
  };
}

function getDefaultTitle(
  type: NotificationType
): string {
  switch (type) {
    case 'personalized':
      return 'Recommended for You';

    case 'deadline_warning':
      return 'Deadline Approaching';

    case 'deadline_reminder':
      return 'Deadline Reminder';

    case 'new_opportunity':
    default:
      return 'New Opportunity';
  }
}

async function getLoggedInUserId(): Promise<
  string | null
> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return null;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        'Notification auth error:',
        error
      );

      return null;
    }

    return session?.user?.id || null;
  } catch (error) {
    console.error(
      'Could not get logged-in user:',
      error
    );

    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// GET NOTIFICATIONS
// ─────────────────────────────────────────────────────────────

export async function getNotifications(): Promise<
  AppNotification[]
> {
  const userId =
    await getLoggedInUserId();

  // Guest user
  if (!userId) {
    return [...MOCK_NOTIFICATIONS];
  }

  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return [];
  }

  const {
    data,
    error,
  } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    console.error(
      'Failed to load notifications:',
      error
    );

    throw new Error(
      `Failed to load notifications: ${error.message}`
    );
  }

  console.log(
    'Notifications loaded:',
    data?.length || 0
  );

  // IMPORTANT:
  // Do not replace an empty database result
  // with mock data for logged-in users.
  return (data || []).map(
    mapRowToNotification
  );
}

// ─────────────────────────────────────────────────────────────
// MARK ONE AS READ
// ─────────────────────────────────────────────────────────────

export async function markAsRead(
  notificationId: string
): Promise<void> {
  const userId =
    await getLoggedInUserId();

  if (
    !userId ||
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return;
  }

  const {
    error,
  } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) {
    console.error(
      'Failed to mark notification as read:',
      error
    );

    throw new Error(
      `Failed to mark notification as read: ${error.message}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────────────────────

export async function markAllAsRead(): Promise<void> {
  const userId =
    await getLoggedInUserId();

  if (
    !userId ||
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return;
  }

  const {
    error,
  } = await supabase
    .from('notifications')
    .update({
      is_read: true,
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error(
      'Failed to mark all notifications as read:',
      error
    );

    throw new Error(
      `Failed to mark all notifications as read: ${error.message}`
    );
  }
}

// ─────────────────────────────────────────────────────────────
// UNREAD COUNT
// ─────────────────────────────────────────────────────────────

export async function getUnreadCount(): Promise<number> {
  const userId =
    await getLoggedInUserId();

  if (
    !userId ||
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return 0;
  }

  const {
    count,
    error,
  } = await supabase
    .from('notifications')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error(
      'Failed to get unread count:',
      error
    );

    return 0;
  }

  return count || 0;
}