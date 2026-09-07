/**
 * KSO Root Navigator
 *
 * Current testing flow:
 *
 * App opens
 *    ↓
 * Welcome
 *    ↓
 * ┌───────────────┬───────────────┬───────────────┐
 * ↓               ↓               ↓
 * Get Started    Sign In         Create Account
 * ↓               ↓               ↓
 * Onboarding     Main            Main/Onboarding
 *
 * Guest → Main
 *
 * NOTE:
 * Welcome is currently shown every time so the intro page
 * is always visible during development/testing.
 */

import React, {
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { colors } from '../theme/colors';

import { useAuth } from '../context/AuthContext';

import WelcomeScreen from '../screens/WelcomeScreen';
import AuthScreen from '../screens/AuthScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import MainNavigator from './BottomTabNavigator';

import * as preferencesService from '../services/preferencesService';

// ─────────────────────────────────────────────────────────────
// ROUTE TYPES
// ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;

  Auth: {
    mode?: 'login' | 'signup';
  };

  Onboarding: undefined;

  Main: undefined;
};

// ─────────────────────────────────────────────────────────────
// STACK
// ─────────────────────────────────────────────────────────────

const Stack =
  createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────────────────────────
// ROOT NAVIGATOR
// ─────────────────────────────────────────────────────────────

export default function RootNavigator() {
  const {
    user,
    isLoading: authLoading,
  } = useAuth();

  const [
    initialRoute,
    setInitialRoute,
  ] = useState<
    'Welcome' |
    'Auth' |
    'Onboarding' |
    'Main' |
    null
  >(null);

  // ─────────────────────────────────────────────
  // DETERMINE STARTING SCREEN
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (authLoading) {
      return;
    }

    /*
     * DEVELOPMENT / TESTING MODE
     *
     * Always show Welcome first.
     *
     * This allows you to test:
     * - Intro page
     * - Get Started
     * - Sign In
     * - Create Account
     * - Guest
     */
    setInitialRoute('Welcome');
  }, [authLoading]);

  // ─────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────

  if (
    authLoading ||
    !initialRoute
  ) {
    return (
      <View
        style={styles.loading}
      >
        <View
          style={styles.loadingLogo}
        >
          <ActivityIndicator
            size="large"
            color={
              colors.primary
            }
          />
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────
  // NAVIGATOR
  // ─────────────────────────────────────────────

  return (
    <Stack.Navigator
      key={initialRoute}
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,

        contentStyle: {
          backgroundColor:
            colors.background,
        },

        animation:
          'slide_from_right',

        gestureEnabled: true,
      }}
    >
      {/* =====================================================
          WELCOME / INTRO
      ===================================================== */}

      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
      />

      {/* =====================================================
          AUTH
      ===================================================== */}

      <Stack.Screen
        name="Auth"
        component={AuthScreen}
      />

      {/* =====================================================
          ONBOARDING
      ===================================================== */}

      <Stack.Screen
        name="Onboarding"
        children={({
          navigation,
        }) => (
          <OnboardingScreen
            onComplete={async (
              data
            ) => {
              try {
                /*
                 * Save:
                 * - education
                 * - field
                 * - interests
                 * - location
                 */

                await preferencesService.saveOnboarding(
                  data
                );

                /*
                 * After onboarding,
                 * go to Main.
                 */

                navigation.replace(
                  'Main'
                );
              } catch (error) {
                console.error(
                  'Failed to save onboarding:',
                  error
                );
              }
            }}
            onSkip={() => {
              navigation.replace(
                'Main'
              );
            }}
          />
        )}
      />

      {/* =====================================================
          MAIN APP
      ===================================================== */}

      <Stack.Screen
        name="Main"
        component={
          MainNavigator
        }
      />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles =
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems:
        'center',
      justifyContent:
        'center',
      backgroundColor:
        colors.background,
    },

    loadingLogo: {
      width: 70,
      height: 70,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderRadius: 22,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.divider,
    },
  });