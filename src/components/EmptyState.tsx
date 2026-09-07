import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, iconSize } from '../theme/spacing';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Variant system ───────────────────────────────────────────────────────────
// Add a new state here and every visual (icon, color, tint) stays in sync —
// no scattered ternaries to maintain.

type EmptyStateVariant = 'default' | 'error' | 'search' | 'network' | 'success';

interface VariantConfig {
  icon: IoniconsName;
  iconColor: string;
  iconBackground?: string; // optional tinted circle behind the icon
}

const VARIANT_CONFIG: Record<EmptyStateVariant, VariantConfig> = {
  default: {
    icon: 'file-tray-outline',
    iconColor: colors.disabled,
  },
  error: {
    icon: 'alert-circle-outline',
    iconColor: colors.error,
    iconBackground: '#FEF2F2',
  },
  search: {
    icon: 'search-outline',
    iconColor: colors.disabled,
  },
  network: {
    icon: 'cloud-offline-outline',
    iconColor: colors.warning,
    iconBackground: '#FFFBEB',
  },
  success: {
    icon: 'checkmark-circle-outline',
    iconColor: colors.success,
    iconBackground: '#F0FDF4',
  },
};

// ─── Constants ────────────────────────────────────────────────────────────────
// Named constants instead of an inline magic-number multiplier.

const EMPTY_ICON_SIZE = iconSize.xxl * 1.5;
const ICON_WRAPPER_SIZE = EMPTY_ICON_SIZE + spacing.xl * 2;

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  /** Override the variant's default icon when needed. */
  icon?: IoniconsName;
  title: string;
  message: string;
  /** Any ReactNode — typically a Button or Pressable. */
  action?: React.ReactNode;
  /** Controls icon, icon color, and tint background. Defaults to 'default'. */
  variant?: EmptyStateVariant;
  /** Fade + slide-up entrance animation. Pass false for instant render. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

function EmptyStateComponent({
  icon,
  title,
  message,
  action,
  variant = 'default',
  animated = true,
  style,
  testID,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const resolvedIcon = icon ?? config.icon;

  // Entrance animation: fade-in + subtle upward slide.
  const opacity = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animated ? 20 : 0)).current;

  useEffect(() => {
    if (!animated) return;

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 70,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animated, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        { opacity, transform: [{ translateY }] },
      ]}
      accessible
      accessibilityRole="none"
      // Reads as one clean sentence rather than fragmenting icon + text.
      accessibilityLabel={`${title}. ${message}`}
      testID={testID}
    >
      {/* Icon with optional tinted circle for error / warning / success. */}
      <View
        style={[
          styles.iconWrapper,
          config.iconBackground
            ? { backgroundColor: config.iconBackground }
            : undefined,
        ]}
      >
        <Ionicons
          name={resolvedIcon}
          size={EMPTY_ICON_SIZE}
          color={config.iconColor}
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      <Text style={styles.message} numberOfLines={5}>
        {message}
      </Text>

      {/* Explicit null avoids rendering `false` as a text node. */}
      {action ? (
        <View style={styles.actionContainer}>{action}</View>
      ) : null}
    </Animated.View>
  );
}

export const EmptyState = memo(EmptyStateComponent);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    minHeight: 300,
    // Prevents over-stretching on tablets / landscape; keeps content readable.
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: ICON_WRAPPER_SIZE,
    height: ICON_WRAPPER_SIZE,
    borderRadius: ICON_WRAPPER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  message: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: fontSize.base * 1.5,
  },
  actionContainer: {
    marginTop: spacing.xl,
    width: '100%',
    paddingHorizontal: spacing.xxl,
  },
});