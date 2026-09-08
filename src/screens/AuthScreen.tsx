/**
 * KSO Auth Screen
 *
 * Direct authentication flow:
 * Sign In     → Supabase → Main
 * Create User → Supabase → Onboarding
 */

import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
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
  iconSize,
} from '../theme/spacing';

import { useAuth } from '../context/AuthContext';

import * as authService from '../services/authService';

interface AuthScreenProps {
  navigation: any;

  route: {
    params?: {
      mode?: 'login' | 'signup';
    };
  };
}

export default function AuthScreen({
  navigation,
  route,
}: AuthScreenProps) {
  const {
    signup,
  } = useAuth();

  const [isSignUp, setIsSignUp] =
    useState(
      route.params?.mode === 'signup'
    );

  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  // ─────────────────────────────────────────────
  // SUBMIT
  // ─────────────────────────────────────────────

  const handleSubmit = async () => {
    if (loading) {
      return;
    }

    const cleanEmail =
      email.trim().toLowerCase();

    const cleanName =
      name.trim();

    // Validation
    if (!cleanEmail) {
      Alert.alert(
        'Email Required',
        'Please enter your email address.'
      );
      return;
    }

    if (
      !cleanEmail.includes('@') ||
      !cleanEmail.includes('.')
    ) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        'Password Required',
        'Please enter your password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters.'
      );
      return;
    }

    if (
      isSignUp &&
      !cleanName
    ) {
      Alert.alert(
        'Name Required',
        'Please enter your full name.'
      );
      return;
    }

    setLoading(true);

    try {
      // ───────────────────────────────────────
      // SIGN UP
      // ───────────────────────────────────────

      if (isSignUp) {
        console.log(
          '[KSO] Creating account...'
        );

        await signup(
          cleanEmail,
          password,
          cleanName
        );

        console.log(
          '[KSO] Account created successfully'
        );

        navigation.replace(
          'Onboarding'
        );

        return;
      }

      // ───────────────────────────────────────
      // SIGN IN
      // ───────────────────────────────────────

      console.log(
        '[KSO] Signing in...'
      );

      /*
       * Call Supabase directly here.
       * This avoids the AuthContext/RootNavigator
       * navigation race.
       */
      const loggedInUser =
        await authService.signIn(
          cleanEmail,
          password
        );

      console.log(
        '[KSO] Supabase login successful:',
        loggedInUser.id
      );

      /*
       * Supabase has created the session.
       * Now go directly to Main.
       */
      navigation.replace(
        'Main'
      );
    } catch (error: any) {
      console.error(
        '[KSO] Authentication error:',
        error
      );

      const rawMessage =
        error?.message ||
        'Something went wrong. Please try again.';

      const message =
        rawMessage.toLowerCase();

      if (
        message.includes(
          'invalid login credentials'
        )
      ) {
        Alert.alert(
          'Sign In Failed',
          'The email or password is incorrect.'
        );
      } else if (
        message.includes(
          'email not confirmed'
        )
      ) {
        Alert.alert(
          'Email Not Confirmed',
          'Please confirm your email address before signing in.'
        );
      } else if (
        message.includes(
          'supabase not configured'
        )
      ) {
        Alert.alert(
          'Supabase Configuration Error',
          'Supabase is not configured correctly. Check your environment variables.'
        );
      } else {
        Alert.alert(
          isSignUp
            ? 'Create Account Failed'
            : 'Sign In Failed',
          rawMessage
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────
  // SWITCH MODE
  // ─────────────────────────────────────────────

  const switchMode = () => {
    if (loading) {
      return;
    }

    const nextMode =
      !isSignUp;

    setIsSignUp(nextMode);

    setName('');
    setEmail('');
    setPassword('');

    navigation.setParams({
      mode: nextMode
        ? 'signup'
        : 'login',
    });
  };

  // ─────────────────────────────────────────────
  // BACK
  // ─────────────────────────────────────────────

  const handleBack = () => {
    if (loading) {
      return;
    }

    navigation.goBack();
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scroll
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* Back */}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={
              handleBack
            }
            disabled={loading}
          >
            <Ionicons
              name="arrow-back"
              size={iconSize.base}
              color={
                colors.text
              }
            />
          </TouchableOpacity>

          {/* Header */}

          <View
            style={styles.header}
          >
            <View
              style={
                styles.logoCircle
              }
            >
              <Ionicons
                name="compass"
                size={32}
                color={
                  colors.textInverse
                }
              />
            </View>

            <Text
              style={styles.title}
            >
              {isSignUp
                ? 'Create Account'
                : 'Welcome Back'}
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              {isSignUp
                ? 'Create your KSO account to discover personalized opportunities.'
                : 'Sign in to access your profile, opportunities, and notifications.'}
            </Text>
          </View>

          {/* Form */}

          <View
            style={styles.form}
          >
            {/* Name */}

            {isSignUp && (
              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="person-outline"
                  size={
                    iconSize.md
                  }
                  color={
                    colors.textTertiary
                  }
                  style={
                    styles.inputIcon
                  }
                />

                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Full Name"
                  placeholderTextColor={
                    colors.textTertiary
                  }
                  value={name}
                  onChangeText={
                    setName
                  }
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
            )}

            {/* Email */}

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="mail-outline"
                size={
                  iconSize.md
                }
                color={
                  colors.textTertiary
                }
                style={
                  styles.inputIcon
                }
              />

              <TextInput
                style={
                  styles.input
                }
                placeholder="Email"
                placeholderTextColor={
                  colors.textTertiary
                }
                value={email}
                onChangeText={
                  setEmail
                }
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Password */}

            <View
              style={
                styles.inputContainer
              }
            >
              <Ionicons
                name="lock-closed-outline"
                size={
                  iconSize.md
                }
                color={
                  colors.textTertiary
                }
                style={
                  styles.inputIcon
                }
              />

              <TextInput
                style={
                  styles.input
                }
                placeholder="Password"
                placeholderTextColor={
                  colors.textTertiary
                }
                value={password}
                onChangeText={
                  setPassword
                }
                secureTextEntry={
                  !showPassword
                }
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                onSubmitEditing={
                  handleSubmit
                }
              />

              <TouchableOpacity
                onPress={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
                disabled={loading}
              >
                <Ionicons
                  name={
                    showPassword
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={
                    iconSize.md
                  }
                  color={
                    colors.textTertiary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* SIGN IN / SIGN UP BUTTON */}

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading &&
                  styles.submitButtonDisabled,
              ]}
              onPress={
                handleSubmit
              }
              disabled={
                loading
              }
              activeOpacity={0.8}
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
                  style={
                    styles.submitButtonText
                  }
                >
                  {isSignUp
                    ? 'Create Account'
                    : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Switch */}

          <View
            style={
              styles.toggleRow
            }
          >
            <Text
              style={
                styles.toggleText
              }
            >
              {isSignUp
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>

            <TouchableOpacity
              onPress={
                switchMode
              }
              disabled={
                loading
              }
            >
              <Text
                style={
                  styles.toggleLink
                }
              >
                {isSignUp
                  ? ' Sign In'
                  : ' Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    flex: {
      flex: 1,
    },

    scroll: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.xl,
      paddingBottom:
        spacing.xxl,
    },

    backBtn: {
      marginTop:
        spacing.base,
      marginBottom:
        spacing.lg,
      width: 40,
      height: 40,
      borderRadius:
        borderRadius.full,
      backgroundColor:
        colors.surface,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    header: {
      alignItems:
        'center',
      marginBottom:
        spacing.xxl,
    },

    logoCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginBottom:
        spacing.base,
    },

    title: {
      fontSize:
        fontSize.xxl,
      fontWeight:
        fontWeight.bold,
      color:
        colors.text,
      marginBottom:
        spacing.sm,
      textAlign:
        'center',
    },

    subtitle: {
      fontSize:
        fontSize.md,
      color:
        colors.textSecondary,
      textAlign:
        'center',
      lineHeight:
        fontSize.md * 1.5,
    },

    form: {
      gap: spacing.md,
    },

    inputContainer: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.lg,
      borderWidth: 1,
      borderColor:
        colors.border,
      paddingHorizontal:
        spacing.base,
      height: 52,
    },

    inputIcon: {
      marginRight:
        spacing.sm,
    },

    input: {
      flex: 1,
      fontSize:
        fontSize.base,
      color:
        colors.text,
      height: '100%',
    },

    submitButton: {
      minHeight: 52,
      borderRadius:
        borderRadius.lg,
      backgroundColor:
        colors.primary,
      alignItems:
        'center',
      justifyContent:
        'center',
      marginTop:
        spacing.lg,
    },

    submitButtonDisabled: {
      opacity: 0.6,
    },

    submitButtonText: {
      fontSize:
        fontSize.base,
      fontWeight:
        fontWeight.semibold,
      color:
        colors.textInverse,
    },

    toggleRow: {
      flexDirection:
        'row',
      justifyContent:
        'center',
      marginTop:
        spacing.xl,
    },

    toggleText: {
      fontSize:
        fontSize.md,
      color:
        colors.textSecondary,
    },

    toggleLink: {
      fontSize:
        fontSize.md,
      color:
        colors.primary,
      fontWeight:
        fontWeight.semibold,
    },
  });