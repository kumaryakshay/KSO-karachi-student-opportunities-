import React, { memo, useCallback, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  AccessibilityState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { iconSize } from '../theme/spacing';
import { useSaved } from '../context/SavedContext';

interface BookmarkButtonProps {
  opportunityId: string;
  size?: number;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const BookmarkButton = memo(function BookmarkButton({
  opportunityId,
  size = iconSize.base,
  disabled = false,
  style,
  accessibilityLabel,
}: BookmarkButtonProps) {
  const { isSaved, toggleSaved } = useSaved();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const saved = isSaved(opportunityId);

  const handlePressIn = useCallback(() => {
    if (disabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.82,
      useNativeDriver: true,
      speed: 30,
      bounciness: 8,
    }).start();
  }, [disabled, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 10,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    if (disabled || !opportunityId) return;
    toggleSaved(opportunityId);
  }, [disabled, opportunityId, toggleSaved]);

  const accessibilityState: AccessibilityState = {
    disabled,
    selected: saved,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={
          accessibilityLabel ??
          (saved ? 'Remove opportunity from saved' : 'Save opportunity')
        }
        accessibilityState={accessibilityState}
      >
        <Ionicons
          name={saved ? 'bookmark' : 'bookmark-outline'}
          size={size}
          color={saved ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});