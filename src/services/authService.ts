/**
 * KSO Auth Service
 *
 * Supabase Auth for email/password sign up/login/logout.
 * Guest mode uses a local session token.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient';

const GUEST_TOKEN_KEY =
  '@kso/guest_session_token';

export interface AuthUser {
  id: string;
  email: string;
  isGuest: boolean;
}

// ─────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────

export async function signUp(
  email: string,
  password: string,
  name?: string
): Promise<AuthUser> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    throw new Error(
      'Supabase not configured. Check your .env file.'
    );
  }

  const { data, error } =
    await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name:
            name?.trim() ||
            email.split('@')[0],
        },
      },
    });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      'Sign up failed — no user returned.'
    );
  }

  await AsyncStorage.removeItem(
    GUEST_TOKEN_KEY
  );

  return {
    id: data.user.id,
    email:
      data.user.email ||
      email,
    isGuest: false,
  };
}

// ─────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────

export async function signIn(
  email: string,
  password: string
): Promise<AuthUser> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    throw new Error(
      'Supabase not configured. Check your .env file.'
    );
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(
      'Sign in failed — no user returned.'
    );
  }

  await AsyncStorage.removeItem(
    GUEST_TOKEN_KEY
  );

  return {
    id: data.user.id,
    email:
      data.user.email ||
      email,
    isGuest: false,
  };
}

// ─────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────

export async function signOut(): Promise<void> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return;
  }

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }

  await AsyncStorage.removeItem(
    GUEST_TOKEN_KEY
  );
}

// ─────────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────────

export async function getCurrentUser(): Promise<
  AuthUser | null
> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return null;
  }

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error(
        'Session error:',
        error
      );
      return null;
    }

    if (session?.user) {
      return {
        id: session.user.id,
        email:
          session.user.email || '',
        isGuest: false,
      };
    }

    const guestToken =
      await AsyncStorage.getItem(
        GUEST_TOKEN_KEY
      );

    if (guestToken) {
      return {
        id: 'guest',
        email: '',
        isGuest: true,
      };
    }

    return null;
  } catch (error) {
    console.error(
      'getCurrentUser error:',
      error
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// GUEST
// ─────────────────────────────────────────────

export async function enterGuestMode(): Promise<string> {
  let token =
    await AsyncStorage.getItem(
      GUEST_TOKEN_KEY
    );

  if (!token) {
    token =
      `guest_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 11)}`;

    await AsyncStorage.setItem(
      GUEST_TOKEN_KEY,
      token
    );
  }

  return token;
}

export async function getGuestToken(): Promise<
  string | null
> {
  return AsyncStorage.getItem(
    GUEST_TOKEN_KEY
  );
}

export async function exitGuestMode(): Promise<void> {
  await AsyncStorage.removeItem(
    GUEST_TOKEN_KEY
  );
}

// ─────────────────────────────────────────────
// AUTH LISTENER
// ─────────────────────────────────────────────

export function onAuthStateChange(
  callback: (
    user: AuthUser | null
  ) => void
) {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    callback(null);
    return () => {};
  }

  const {
    data: subscription,
  } =
    supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email:
              session.user.email || '',
            isGuest: false,
          });
        } else {
          callback(null);
        }
      }
    );

  return () => {
    subscription.subscription.unsubscribe();
  };
}