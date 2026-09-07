import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme/colors';
import {
  fontSize,
  fontWeight,
} from '../theme/typography';
import { spacing } from '../theme/spacing';

import { NotificationCard } from '../components/NotificationCard';
import { EmptyState } from '../components/EmptyState';

import { AppNotification } from '../types/notification';

import * as notificationService from '../services/notificationService';
import * as opportunityService from '../services/opportunityService';

interface NotificationsScreenProps {
  navigation?: any;
}

export default function NotificationsScreen({
  navigation,
}: NotificationsScreenProps) {
  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // LOAD NOTIFICATIONS
  // ─────────────────────────────────────────────

  const fetchNotifications =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data =
          await notificationService.getNotifications();

        setNotifications(data);
      } catch (err) {
        console.error(
          'Failed to load notifications:',
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load notifications'
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  // Load when screen first opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Reload whenever user comes back to this screen
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  // ─────────────────────────────────────────────
  // OPEN NOTIFICATION
  // ─────────────────────────────────────────────

  const handlePress = async (
    notification: AppNotification
  ) => {
    // Immediately show it as read in UI
    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              isRead: true,
            }
          : item
      )
    );

    // Save read status in Supabase
    try {
      await notificationService.markAsRead(
        notification.id
      );
    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      );
    }

    // Open related opportunity
    if (notification.opportunityId) {
      try {
        const opportunity =
          await opportunityService.getOpportunityById(
            notification.opportunityId
          );

        if (opportunity) {
          navigation?.navigate(
            'OpportunityDetails',
            {
              opportunity,
            }
          );
        }
      } catch (err) {
        console.error(
          'Failed to open opportunity:',
          err
        );
      }
    }
  };

  // ─────────────────────────────────────────────
  // MARK ALL AS READ
  // ─────────────────────────────────────────────

  const markAllRead = async () => {
    const unread =
      notifications.filter(
        (item) => !item.isRead
      );

    if (unread.length === 0) {
      return;
    }

    // Update UI immediately
    setNotifications((previous) =>
      previous.map((item) => ({
        ...item,
        isRead: true,
      }))
    );

    // Update Supabase
    try {
      await notificationService.markAllAsRead();
    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      );

      // Reload real state if database update failed
      await fetchNotifications();
    }
  };

  // ─────────────────────────────────────────────
  // UNREAD COUNT
  // ─────────────────────────────────────────────

  const unreadCount =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Loading notifications...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // ERROR
  // ─────────────────────────────────────────────

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load notifications"
          message={error}
          action={
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={fetchNotifications}
            >
              <Text
                style={styles.retryBtnText}
              >
                Try Again
              </Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────
  // SCREEN
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.subtitle}>
          {unreadCount > 0
            ? `${unreadCount} unread`
            : 'All caught up!'}
        </Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllRead}
          >
            <Text style={styles.markAll}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationCard
            notification={item}
            onPress={handlePress}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="No notifications"
            message="When a new opportunity matches your profile or a deadline reminder is available, it will appear here."
          />
        }
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 &&
            styles.emptyList,
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={fetchNotifications}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  retryBtn: {
    backgroundColor:
      colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
  },

  retryBtnText: {
    fontSize: fontSize.base,
    color: colors.textInverse,
    fontWeight:
      fontWeight.semibold,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal:
      spacing.base,
    paddingVertical:
      spacing.md,
  },

  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },

  markAll: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight:
      fontWeight.medium,
  },

  listContent: {
    paddingBottom:
      spacing.xxl,
  },

  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
