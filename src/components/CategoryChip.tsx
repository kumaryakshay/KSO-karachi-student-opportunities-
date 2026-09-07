import React, { memo, useCallback, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';

interface CategoryChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const CategoryChip = memo(function CategoryChip({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
}: CategoryChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled || !onPress) {
      return;
    }

    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [disabled, onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled || !onPress) {
      return;
    }

    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    }).start();
  }, [disabled, onPress, scale]);

  const handlePress = useCallback(() => {
    if (disabled) {
      return;
    }

    if (onPress) {
      onPress();
    }
  }, [disabled, onPress]);

  const accessibilityText = selected ? `${label}, selected` : label;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale }],
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityText}
        accessibilityState={{
          selected,
          disabled,
        }}
        style={({ pressed }) => [
          styles.chip,
          selected && styles.selectedChip,
          disabled && styles.disabledChip,
          pressed && !disabled && styles.pressedChip,
          style,
        ]}
      >
        <View style={styles.content}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.label, selected && styles.selectedLabel]}
          >
            {label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 240,
  },
  selectedChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressedChip: {
    opacity: 0.85,
  },
  disabledChip: {
    opacity: 0.45,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    includeFontPadding: false,
  },
  selectedLabel: {
    color: colors.textInverse,
  },
});