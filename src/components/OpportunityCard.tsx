import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import {
  borderRadius,
  iconSize,
  spacing,
} from '../theme/spacing';

import { Opportunity } from '../types/opportunity';
import { BookmarkButton } from './BookmarkButton';
import { DeadlineBadge } from './DeadlineBadge';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onPress: (opportunity: Opportunity) => void;
  compact?: boolean;
  disabled?: boolean;
  testID?: string;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryConfig {
  icon: IconName;
  color: string;
  background: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  scholarship: {
    icon: 'school-outline',
    color: colors.primary,
    background: 'rgba(59, 130, 246, 0.10)',
  },
  internship: {
    icon: 'briefcase-outline',
    color: '#8B5CF6',
    background: 'rgba(139, 92, 246, 0.10)',
  },
  course: {
    icon: 'book-outline',
    color: '#0EA5E9',
    background: 'rgba(14, 165, 233, 0.10)',
  },
  competition: {
    icon: 'trophy-outline',
    color: '#F59E0B',
    background: 'rgba(245, 158, 11, 0.10)',
  },
  fellowship: {
    icon: 'star-outline',
    color: '#EC4899',
    background: 'rgba(236, 72, 153, 0.10)',
  },
  training: {
    icon: 'hammer-outline',
    color: '#10B981',
    background: 'rgba(16, 185, 129, 0.10)',
  },
  exchange: {
    icon: 'airplane-outline',
    color: '#06B6D4',
    background: 'rgba(6, 182, 212, 0.10)',
  },
  volunteer: {
    icon: 'heart-outline',
    color: '#EF4444',
    background: 'rgba(239, 68, 68, 0.10)',
  },
  job: {
    icon: 'business-outline',
    color: '#6366F1',
    background: 'rgba(99, 102, 241, 0.10)',
  },
  other: {
    icon: 'apps-outline',
    color: colors.primary,
    background: 'rgba(59, 130, 246, 0.10)',
  },
};

const DEFAULT_CATEGORY: CategoryConfig = {
  icon: 'apps-outline',
  color: colors.primary,
  background: 'rgba(59, 130, 246, 0.10)',
};

const MAX_VISIBLE_TAGS = 3;

function capitalize(value?: string) {
  if (!value) return 'Opportunity';

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getCategoryConfig(category?: string): CategoryConfig {
  if (!category) return DEFAULT_CATEGORY;

  return CATEGORY_CONFIG[category.toLowerCase()] ?? DEFAULT_CATEGORY;
}

function getDeadlineStatus(deadline?: string | Date) {
  if (!deadline) {
    return {
      label: 'No deadline',
      color: colors.textTertiary,
      icon: 'calendar-outline' as IconName,
    };
  }

  const deadlineDate = new Date(deadline);
  const now = new Date();

  if (Number.isNaN(deadlineDate.getTime())) {
    return {
      label: 'Deadline unavailable',
      color: colors.textTertiary,
      icon: 'calendar-outline' as IconName,
    };
  }

  const difference = deadlineDate.getTime() - now.getTime();
  const days = Math.ceil(difference / (1000 * 60 * 60 * 24));

  if (difference < 0) {
    return {
      label: 'Closed',
      color: '#EF4444',
      icon: 'close-circle-outline' as IconName,
    };
  }

  if (days <= 3) {
    return {
      label: days === 0 ? 'Ends today' : `${days}d left`,
      color: '#EF4444',
      icon: 'alert-circle-outline' as IconName,
    };
  }

  if (days <= 7) {
    return {
      label: `${days}d left`,
      color: '#F59E0B',
      icon: 'time-outline' as IconName,
    };
  }

  return {
    label: `${days}d left`,
    color: colors.success,
    icon: 'calendar-outline' as IconName,
  };
}

export const OpportunityCard = memo(function OpportunityCard({
  opportunity,
  onPress,
  compact = false,
  disabled = false,
  testID,
}: OpportunityCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const {
    id,
    title,
    organization,
    category,
    shortDescription,
    deadline,
    location,
    isRemote,
    stipend,
    tags = [],
    isFeatured,
  } = opportunity;

  const categoryConfig = useMemo(
    () => getCategoryConfig(category),
    [category]
  );

  const deadlineStatus = useMemo(
    () => getDeadlineStatus(deadline),
    [deadline]
  );

  const visibleTags = useMemo(
    () => tags.slice(0, MAX_VISIBLE_TAGS),
    [tags]
  );

  const remainingTags = Math.max(
    tags.length - MAX_VISIBLE_TAGS,
    0
  );

  const displayLocation = isRemote
    ? 'Remote'
    : location || 'Location not specified';

  const handlePressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 24,
      bounciness: 6,
    }).start();
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!disabled) {
      onPress(opportunity);
    }
  }, [disabled, onPress, opportunity]);

  /*
   * COMPACT CARD
   */
  if (compact) {
    return (
      <Animated.View
        style={[
          styles.animatedContainer,
          { transform: [{ scale }] },
        ]}
      >
        <Pressable
          testID={testID}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${title} by ${organization}`}
          accessibilityHint="Opens opportunity details"
          style={({ pressed }) => [
            styles.compactCard,
            pressed && styles.pressedCard,
            disabled && styles.disabledCard,
          ]}
        >
          <View style={styles.compactHeader}>
            <View
              style={[
                styles.categoryIcon,
                {
                  backgroundColor: categoryConfig.background,
                },
              ]}
            >
              <Ionicons
                name={categoryConfig.icon}
                size={iconSize.md}
                color={categoryConfig.color}
              />
            </View>

            <View style={styles.compactContent}>
              <Text
                style={styles.compactTitle}
                numberOfLines={1}
              >
                {title || 'Untitled Opportunity'}
              </Text>

              <Text
                style={styles.compactOrg}
                numberOfLines={1}
              >
                {organization || 'Organization not specified'}
              </Text>

              <View style={styles.compactMeta}>
                <Ionicons
                  name={deadlineStatus.icon}
                  size={12}
                  color={deadlineStatus.color}
                />

                <Text
                  style={[
                    styles.compactDeadline,
                    { color: deadlineStatus.color },
                  ]}
                >
                  {deadlineStatus.label}
                </Text>
              </View>
            </View>

            <BookmarkButton
              opportunityId={id}
              size={iconSize.md}
            />
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  /*
   * FULL CARD
   */
  return (
    <Animated.View
      style={[
        styles.animatedContainer,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${title} by ${organization}`}
        accessibilityHint="Opens opportunity details"
        style={({ pressed }) => [
          styles.card,
          isFeatured && styles.featuredCard,
          pressed && styles.pressedCard,
          disabled && styles.disabledCard,
        ]}
      >
        {/* Featured Indicator */}
        {isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons
              name="sparkles"
              size={12}
              color="#FFFFFF"
            />

            <Text style={styles.featuredText}>
              Featured
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.categoryIcon,
              {
                backgroundColor: categoryConfig.background,
              },
            ]}
          >
            <Ionicons
              name={categoryConfig.icon}
              size={iconSize.base}
              color={categoryConfig.color}
            />
          </View>

          <View style={styles.headerText}>
            <Text
              style={styles.orgName}
              numberOfLines={1}
            >
              {organization || 'Organization'}
            </Text>

            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryDot,
                  {
                    backgroundColor: categoryConfig.color,
                  },
                ]}
              />

              <Text style={styles.categoryLabel}>
                {capitalize(category)}
              </Text>
            </View>
          </View>

          <BookmarkButton
            opportunityId={id}
          />
        </View>

        {/* Title */}
        <Text
          style={styles.title}
          numberOfLines={2}
        >
          {title || 'Untitled Opportunity'}
        </Text>

        {/* Description */}
        {!!shortDescription && (
          <Text
            style={styles.description}
            numberOfLines={2}
          >
            {shortDescription}
          </Text>
        )}

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons
              name={
                isRemote
                  ? 'globe-outline'
                  : 'location-outline'
              }
              size={15}
              color={colors.textTertiary}
            />

            <Text
              style={styles.metaText}
              numberOfLines={1}
            >
              {displayLocation}
            </Text>
          </View>

          <View style={styles.deadlineContainer}>
            <Ionicons
              name={deadlineStatus.icon}
              size={14}
              color={deadlineStatus.color}
            />

            <Text
              style={[
                styles.deadlineText,
                {
                  color: deadlineStatus.color,
                },
              ]}
            >
              {deadlineStatus.label}
            </Text>
          </View>
        </View>

        {/* Stipend */}
        {!!stipend && (
          <View style={styles.stipendRow}>
            <View style={styles.stipendIcon}>
              <Ionicons
                name="wallet-outline"
                size={15}
                color={colors.success}
              />
            </View>

            <View style={styles.stipendContent}>
              <Text style={styles.stipendLabel}>
                Compensation
              </Text>

              <Text style={styles.stipendText}>
                {stipend}
              </Text>
            </View>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagRow}>
            {visibleTags.map((tag) => (
              <View
                key={tag}
                style={styles.tag}
              >
                <Text
                  style={styles.tagText}
                  numberOfLines={1}
                >
                  {tag}
                </Text>
              </View>
            ))}

            {remainingTags > 0 && (
              <View style={styles.moreTag}>
                <Text style={styles.moreTagText}>
                  +{remainingTags}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* CTA */}
        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>
            View Details
          </Text>

          <View style={styles.arrowContainer}>
            <Ionicons
              name="arrow-forward"
              size={15}
              color={colors.primary}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  animatedContainer: {
    width: '100%',
  },

  card: {
    position: 'relative',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  featuredCard: {
    borderWidth: 1,
    borderColor: colors.primary,
  },

  pressedCard: {
    opacity: 0.94,
  },

  disabledCard: {
    opacity: 0.55,
  },

  featuredBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    backgroundColor: colors.primary,
    borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.md,
  },

  featuredText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  categoryIcon: {
    width: 46,
    height: 46,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    marginHorizontal: spacing.sm,
    minWidth: 0,
  },

  orgName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 3,
  },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  categoryDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  categoryLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  title: {
    color: colors.text,
    fontSize: fontSize.md * 1.5,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.md * 1.9,
    marginBottom: spacing.xs,
  },

  description: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * 1.55,
    marginBottom: spacing.md,
  },

  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },

  metaItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },

  metaText: {
    flex: 1,
    color: colors.textTertiary,
    fontSize: fontSize.xs,
  },

  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  deadlineText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  stipendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },

  stipendIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },

  stipendContent: {
    marginLeft: spacing.sm,
  },

  stipendLabel: {
    color: colors.textTertiary,
    fontSize: fontSize.xs,
    marginBottom: 1,
  },

  stipendText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },

  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.xs,
  },

  tag: {
    maxWidth: 120,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundSecondary,
  },

  tagText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  moreTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '12',
  },

  moreTagText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ctaText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
  },

  /*
   * COMPACT
   */
  compactCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  compactContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: spacing.sm,
  },

  compactTitle: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },

  compactOrg: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: 3,
  },

  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  compactDeadline: {
    fontSize: 11,
    fontWeight: fontWeight.semibold,
  },
});

OpportunityCard.displayName = 'OpportunityCard';