/**
 * KSO Auth Context
 *
 * Global authentication state.
 *
 * Handles:
 * - Supabase login
 * - Supabase signup
 * - Session restoration
 * - Logout
 * - Guest mode
 * - Profile sync after authentication
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';

import * as authService from '../services/authService';
import * as chatService from '../services/chatService';
import * as preferencesService from '../services/preferencesService';

import type { AuthUser } from '../services/authService';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  signup: (
    email: string,
    password: string,
    name?: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  enterGuest: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────

const AuthContext =
  createContext<AuthContextValue>({
    user: null,
    isLoading: true,

    login: async () => {},

    signup: async () => {},

    logout: async () => {},

    enterGuest: async () => {},
  });

// ─────────────────────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // ───────────────────────────────────────────
  // LOAD USER PROFILE
  // ───────────────────────────────────────────

  const syncProfile = useCallback(
    async () => {
      try {
        await preferencesService
          .syncProfileFromSupabase();
      } catch (error) {
        console.error(
          'Profile sync failed:',
          error
        );
      }
    },
    []
  );

  // ───────────────────────────────────────────
  // INITIAL AUTH CHECK
  // ───────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const currentUser =
          await authService.getCurrentUser();

        if (!mounted) {
          return;
        }

        setUser(currentUser);

        // Sync profile for registered users
        if (
          currentUser &&
          !currentUser.isGuest
        ) {
          await syncProfile();
        }
      } catch (error) {
        console.error(
          'Failed to initialize authentication:',
          error
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for Supabase auth changes
    const unsubscribe =
      authService.onAuthStateChange(
        async (nextUser) => {
          if (!mounted) {
            return;
          }

          setUser(nextUser);

          if (
            nextUser &&
            !nextUser.isGuest
          ) {
            await syncProfile();
          }
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [syncProfile]);

  // ───────────────────────────────────────────
  // LOGIN
  // ───────────────────────────────────────────

  const login = useCallback(
    async (
      email: string,
      password: string
    ) => {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          'Email is required.'
        );
      }

      if (!password) {
        throw new Error(
          'Password is required.'
        );
      }

      const authenticatedUser =
        await authService.signIn(
          cleanEmail,
          password
        );

      if (!authenticatedUser) {
        throw new Error(
          'Login failed. Please try again.'
        );
      }

      setUser(
        authenticatedUser
      );

      // Load saved profile/preferences
      if (
        !authenticatedUser.isGuest
      ) {
        await syncProfile();
      }
    },
    [syncProfile]
  );

  // ───────────────────────────────────────────
  // SIGN UP
  // ───────────────────────────────────────────

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ) => {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          'Email is required.'
        );
      }

      if (password.length < 6) {
        throw new Error(
          'Password must be at least 6 characters.'
        );
      }

      const cleanName =
        name?.trim() || undefined;

      const newUser =
        await authService.signUp(
          cleanEmail,
          password,
          cleanName
        );

      if (!newUser) {
        throw new Error(
          'Account creation failed.'
        );
      }

      /*
       * Link any existing guest chat.
       *
       * This should not prevent account creation
       * if the chat linking fails.
       */
      try {
        await chatService.linkGuestChatToUser(
          newUser.id
        );
      } catch (error) {
        console.error(
          'Guest chat linking failed:',
          error
        );
      }

      setUser(newUser);

      /*
       * If Supabase has already created a session,
       * synchronize the profile immediately.
       *
       * If email confirmation is enabled,
       * the user may need to verify their email
       * before a session exists.
       */
      if (!newUser.isGuest) {
        await syncProfile();
      }
    },
    [syncProfile]
  );

  // ───────────────────────────────────────────
  // LOGOUT
  // ───────────────────────────────────────────

  const logout = useCallback(
    async () => {
      try {
        await authService.signOut();
      } finally {
        setUser(null);
      }
    },
    []
  );

  // ───────────────────────────────────────────
  // GUEST MODE
  // ───────────────────────────────────────────

  const enterGuest = useCallback(
    async () => {
      await authService.enterGuestMode();

      setUser({
        id: 'guest',
        email: '',
        isGuest: true,
      });
    },
    []
  );

  // ───────────────────────────────────────────
  // PROVIDER
  // ───────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        enterGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useAuth() {
  return useContext(
    AuthContext
  );
}