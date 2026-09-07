import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import {
  Animated,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import {
  fontSize,
  fontWeight,
} from '../theme/typography';

import {
  spacing,
  borderRadius,
} from '../theme/spacing';

import {
  getDeadlineLabel,
  getDeadlineUrgency,
} from '../utils/deadline';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type DeadlineUrgency =
  | 'expired'
  | 'urgent'
  | 'warning'
  | 'normal'
  | 'none';

type IconName =
  React.ComponentProps<typeof Ionicons>['name'];

interface DeadlineBadgeProps {
  /**
   * Deadline date/value used by the existing deadline utilities.
   */
  deadline: string | null;

  /**
   * Smaller version for compact cards/lists.
   */
  compact?: boolean;

  /**
   * Enables pulse animation for urgent/expired deadlines.
   */
  animate?: boolean;

  /**
   * Allows the parent component to override/add styles.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Useful for testing.
   */
  testID?: string;
}

interface UrgencyStyle {
  icon: IconName;
  iconColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
}

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Single source of truth for all urgency-related visuals.
 */
const URGENCY_STYLES: Record<
  DeadlineUrgency,
  UrgencyStyle
> = {
  expired: {
    icon: 'close-circle-outline',
    iconColor: colors.error,
    textColor: colors.error,
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },

  urgent: {
    icon: 'alert-circle-outline',
    iconColor: colors.error,
    textColor: colors.error,
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },

  warning: {
    icon: 'time-outline',
    iconColor: colors.warning,
    textColor: colors.warning,
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },

  normal: {
    icon: 'calendar-outline',
    iconColor: colors.success,
    textColor: colors.textSecondary,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.divider,
  },

  none: {
    icon: 'calendar-outline',
    iconColor: colors.textTertiary,
    textColor: colors.textTertiary,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.divider,
  },
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeUrgency(
  urgency: unknown
): DeadlineUrgency {
  switch (urgency) {
    case 'expired':
    case 'urgent':
    case 'warning':
    case 'normal':
      return urgency;

    default:
      return 'none';
  }
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

function DeadlineBadgeComponent({
  deadline,
  compact = false,
  animate = true,
  style,
  testID,
}: DeadlineBadgeProps) {
  /**
   * Animation used for urgent deadlines.
   */
  const pulse = useRef(
    new Animated.Value(1)
  ).current;

  /**
   * Calculate all deadline-related state
   * only when the deadline changes.
   */
  const deadlineData = useMemo(() => {
    if (!deadline) {
      return null;
    }

    const urgency = normalizeUrgency(
      getDeadlineUrgency(deadline)
    );

    const label =
      getDeadlineLabel(deadline);

    const visuals =
      URGENCY_STYLES[urgency];

    const isExpired =
      urgency === 'expired';

    const isUrgent =
      urgency === 'urgent';

    return {
      urgency,
      label,
      visuals,
      isExpired,
      isUrgent,
      shouldAnimate:
        animate &&
        (isUrgent || isExpired),
    };
  }, [deadline, animate]);

  /* ------------------------------------------------------------------------ */
  /* Pulse animation                                                           */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    /**
     * Reset animation when the badge doesn't need animation.
     */
    if (!deadlineData?.shouldAnimate) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.72,
          duration: 750,
          useNativeDriver: true,
        }),

        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
      pulse.stopAnimation();
      pulse.setValue(1);
    };
  }, [
    deadlineData?.shouldAnimate,
    pulse,
  ]);

  /* ------------------------------------------------------------------------ */
  /* Nothing to render                                                         */
  /* ------------------------------------------------------------------------ */

  if (
    !deadlineData ||
    !deadlineData.label
  ) {
    return null;
  }

  const {
    label,
    visuals,
    isUrgent,
    isExpired,
    shouldAnimate,
  } = deadlineData;

  /* ------------------------------------------------------------------------ */
  /* Render                                                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <Animated.View
      testID={testID}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Deadline: ${label}`}
      style={[
        styles.badge,

        compact &&
          styles.compactBadge,

        {
          backgroundColor:
            visuals.backgroundColor,

          borderColor:
            visuals.borderColor,

          opacity:
            shouldAnimate
              ? pulse
              : 1,
        },

        isUrgent &&
          styles.urgentBadge,

        isExpired &&
          styles.expiredBadge,

        style,
      ]}
    >
      {/* Deadline icon */}
      <Ionicons
        name={visuals.icon}
        size={
          compact
            ? ICON_SIZES.compact
            : ICON_SIZES.normal
        }
        color={visuals.iconColor}
      />

      {/* Deadline text */}
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.text,

          compact &&
            styles.compactText,

          {
            color:
              visuals.textColor,
          },
        ]}
      >
        {label}
      </Text>

      {/* Live urgency indicator */}
      {isUrgent && !compact && (
        <View
          accessibilityElementsHidden
          style={[
            styles.statusDot,
            {
              backgroundColor:
                visuals.iconColor,
            },
          ]}
        />
      )}
    </Animated.View>
  );
}

/* -------------------------------------------------------------------------- */
/* Export                                                                     */
/* -------------------------------------------------------------------------- */

export const DeadlineBadge =
  memo(DeadlineBadgeComponent);

DeadlineBadge.displayName =
  'DeadlineBadge';

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ICON_SIZES = {
  compact: 11,
  normal: 13,
};

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  /**
   * Default badge.
   */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',

    alignSelf: 'flex-start',

    maxWidth: '100%',

    gap: 5,

    paddingHorizontal:
      spacing.sm,

    paddingVertical:
      spacing.xs,

    borderRadius:
      borderRadius.sm,

    borderWidth:
      StyleSheet.hairlineWidth,
  },

  /**
   * Compact version used inside cards.
   */
  compactBadge: {
    gap: 3,

    paddingHorizontal:
      spacing.xs,

    paddingVertical: 3,

    borderRadius:
      borderRadius.sm,
  },

  /**
   * Strong border for urgent deadlines.
   */
  urgentBadge: {
    borderWidth: 1,
  },

  /**
   * Strong border for expired deadlines.
   */
  expiredBadge: {
    borderWidth: 1,
  },

  /**
   * Main label.
   */
  text: {
    flexShrink: 1,

    fontSize:
      fontSize.sm,

    fontWeight:
      fontWeight.semibold,

    lineHeight:
      fontSize.sm * 1.3,
  },

  /**
   * Smaller label for compact mode.
   */
  compactText: {
    fontSize:
      fontSize.xs,

    lineHeight:
      fontSize.xs * 1.3,

    fontWeight:
      fontWeight.medium,
  },

  /**
   * Small visual signal for urgent deadlines.
   */
  statusDot: {
    width: 4,
    height: 4,

    borderRadius: 2,

    marginLeft: 1,
  },
});