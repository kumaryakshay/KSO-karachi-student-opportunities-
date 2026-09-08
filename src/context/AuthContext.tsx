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

const AuthContext =
  createContext<AuthContextValue>({
    user: null,
    isLoading: true,
    login: async () => {},
    signup: async () => {},
    logout: async () => {},
    enterGuest: async () => {},
  });

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  // ─────────────────────────────────────────────
  // PROFILE SYNC
  // ─────────────────────────────────────────────

  const syncProfile =
    useCallback(async () => {
      try {
        await preferencesService.syncProfileFromSupabase();
      } catch (error) {
        console.error(
          'Profile sync failed:',
          error
        );
      }
    }, []);

  // ─────────────────────────────────────────────
  // INITIAL AUTH
  // ─────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const currentUser =
          await authService.getCurrentUser();

        if (!mounted) return;

        setUser(currentUser);

        if (
          currentUser &&
          !currentUser.isGuest
        ) {
          await syncProfile();
        }
      } catch (error) {
        console.error(
          'Authentication initialization failed:',
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

    initialize();

    const unsubscribe =
      authService.onAuthStateChange(
        async (nextUser) => {
          if (!mounted) return;

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

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  const login = useCallback(
    async (
      email: string,
      password: string
    ) => {
      const authenticatedUser =
        await authService.signIn(
          email,
          password
        );

      setUser(authenticatedUser);

      if (
        !authenticatedUser.isGuest
      ) {
        await syncProfile();
      }
    },
    [syncProfile]
  );

  // ─────────────────────────────────────────────
  // SIGNUP
  // ─────────────────────────────────────────────

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ) => {
      const newUser =
        await authService.signUp(
          email,
          password,
          name
        );

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

      if (!newUser.isGuest) {
        await syncProfile();
      }
    },
    [syncProfile]
  );

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const logout = useCallback(
    async () => {
      try {
        // Tell Supabase to end the session.
        await authService.signOut();
      } catch (error) {
        console.error(
          'Supabase sign out failed:',
          error
        );

        /*
         * We still clear local auth state.
         * This prevents the user from being
         * stuck inside the app if the server
         * returns an error.
         */
      } finally {
        // Always remove the authenticated user
        // from the React state.
        setUser(null);

        // Clear any local guest state as well.
        try {
          await authService.exitGuestMode();
        } catch (error) {
          console.error(
            'Guest cleanup failed:',
            error
          );
        }
      }
    },
    []
  );

  // ─────────────────────────────────────────────
  // GUEST
  // ─────────────────────────────────────────────

  const enterGuest =
    useCallback(async () => {
      await authService.enterGuestMode();

      setUser({
        id: 'guest',
        email: '',
        isGuest: true,
      });
    }, []);

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

export function useAuth() {
  return useContext(AuthContext);
}