import React from 'react';

import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { colors } from '../theme/colors';
import {
  fontSize,
  fontWeight,
} from '../theme/typography';

import {
  spacing,
  borderRadius,
} from '../theme/spacing';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void | Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
}: PrimaryButtonProps) {
  const isDisabled =
    disabled || loading;

  const handlePress = async () => {
    if (isDisabled) {
      return;
    }

    console.log(
      `[PrimaryButton] Pressed: ${title}`
    );

    try {
      await onPress();
    } catch (error) {
      console.error(
        `[PrimaryButton] Error:`,
        error
      );
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        fullWidth &&
          styles.fullWidth,
        isDisabled &&
          styles.disabled,
        pressed &&
          !isDisabled &&
          styles.pressed,
      ]}
      onPress={handlePress}
      disabled={isDisabled}
      android_ripple={{
        color: 'rgba(255,255,255,0.15)',
      }}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            colors.textInverse
          }
        />
      ) : (
        <Text
          style={styles.text}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      backgroundColor:
        colors.primary,
      paddingVertical:
        spacing.md,
      paddingHorizontal:
        spacing.xl,
      borderRadius:
        borderRadius.lg,
      alignItems:
        'center',
      justifyContent:
        'center',
      minHeight: 48,
    },

    fullWidth: {
      width: '100%',
    },

    disabled: {
      backgroundColor:
        colors.disabled,
    },

    pressed: {
      opacity: 0.75,
      transform: [
        {
          scale: 0.99,
        },
      ],
    },

    text: {
      color:
        colors.textInverse,
      fontSize:
        fontSize.base,
      fontWeight:
        fontWeight.semibold,
    },
  });