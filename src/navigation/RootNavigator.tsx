/**
 * KSO Root Navigator
 *
 * Authentication-aware navigation.
 *
 * Flow:
 *
 * No user
 *    ↓
 * Welcome
 *    ↓
 * Sign In / Sign Up
 *
 * Registered user
 *    ↓
 * Onboarding complete?
 *    ├── No  → Onboarding
 *    └── Yes → Main
 *
 * Guest
 *    ↓
 * Main
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

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

export type RootStackParamList = {
  Welcome: undefined;

  Auth: {
    mode?: 'login' | 'signup';
  };

  Onboarding: undefined;

  Main: undefined;
};

const Stack =
  createNativeStackNavigator<RootStackParamList>();

// ─────────────────────────────────────────────
// ROOT NAVIGATOR
// ─────────────────────────────────────────────

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
    'Onboarding' |
    'Main' |
    null
  >(null);

  // ───────────────────────────────────────────
  // DETERMINE APP STATE
  // ───────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const determineRoute =
      async () => {
        if (authLoading) {
          return;
        }

        /*
         * Clear the previous route while we
         * determine the new authentication state.
         */
        if (mounted) {
          setInitialRoute(null);
        }

        // ─────────────────────────────────────
        // NO USER
        // ─────────────────────────────────────

        if (!user) {
          if (mounted) {
            setInitialRoute(
              'Welcome'
            );
          }

          return;
        }

        // ─────────────────────────────────────
        // GUEST
        // ─────────────────────────────────────

        if (user.isGuest) {
          if (mounted) {
            setInitialRoute(
              'Main'
            );
          }

          return;
        }

        // ─────────────────────────────────────
        // REGISTERED USER
        // ─────────────────────────────────────

        try {
          const prefs =
            await preferencesService
              .syncProfileFromSupabase();

          if (!mounted) {
            return;
          }

          if (
            prefs.onboardingComplete
          ) {
            setInitialRoute(
              'Main'
            );
          } else {
            setInitialRoute(
              'Onboarding'
            );
          }
        } catch (error) {
          console.error(
            'Failed to load profile:',
            error
          );

          /*
           * A registered user without a
           * completed profile should finish
           * onboarding rather than being left
           * in an unknown state.
           */
          if (mounted) {
            setInitialRoute(
              'Onboarding'
            );
          }
        }
      };

    determineRoute();

    return () => {
      mounted = false;
    };
  }, [
    user,
    authLoading,
  ]);

  // ───────────────────────────────────────────
  // LOADING
  // ───────────────────────────────────────────

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

  // ───────────────────────────────────────────
  // NAVIGATOR
  // ───────────────────────────────────────────

  return (
    <Stack.Navigator
      /*
       * Recreate the stack when authentication
       * state changes.
       *
       * Welcome/Auth → Main
       * Welcome/Auth → Onboarding
       * Main → Welcome after logout
       */
      key={initialRoute}
      initialRouteName={
        initialRoute
      }
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
          WELCOME
      ===================================================== */}

      <Stack.Screen
        name="Welcome"
        component={
          WelcomeScreen
        }
      />

      {/* =====================================================
          AUTH
      ===================================================== */}

      <Stack.Screen
        name="Auth"
        component={
          AuthScreen
        }
      />

      {/* =====================================================
          ONBOARDING
      ===================================================== */}

      <Stack.Screen
        name="Onboarding"
      >
        {({
          navigation,
        }) => (
          <OnboardingScreen
            onComplete={async (
              data
            ) => {
              try {
                await preferencesService
                  .saveOnboarding(
                    data
                  );

                /*
                 * Mark the app as completed
                 * immediately after saving.
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
      </Stack.Screen>

      {/* =====================================================
          MAIN
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

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

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