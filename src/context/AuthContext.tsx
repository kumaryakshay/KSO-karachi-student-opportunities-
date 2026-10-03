import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';

import * as authService from '../services/authService';
import * as chatService from '../services/chatService';
import * as preferencesService from '../services/preferencesService';

import type { AuthUser } from '../services/authService';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,

  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  enterGuest: async () => {},
});

// ─────────────────────────────────────────────
// ERROR HELPER
// ─────────────────────────────────────────────

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
}

// ─────────────────────────────────────────────
// PROVIDER
// ─────────────────────────────────────────────

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Prevent multiple login/signup/logout operations
  // from running at the same time.
  const authOperationInProgress = useRef(false);

  // Prevent state updates after provider unmount.
  const mountedRef = useRef(true);

  // ─────────────────────────────────────────────
  // PROFILE SYNC
  // ─────────────────────────────────────────────

  const syncProfile = useCallback(async () => {
    try {
      console.log('KSO AUTH: Starting profile sync...');

      await preferencesService.syncProfileFromSupabase();

      console.log('KSO AUTH: Profile sync completed.');
    } catch (error) {
      // Profile syncing is not part of authentication.
      // Never allow it to break login/signup.
      console.error(
        'KSO AUTH: Profile sync failed:',
        error
      );
    }
  }, []);

  // ─────────────────────────────────────────────
  // INITIAL AUTH CHECK
  // ─────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    let unsubscribe: (() => void) | undefined;

    const initializeAuthentication = async () => {
      try {
        console.log(
          'KSO AUTH: Checking existing authentication...'
        );

        const currentUser =
          await authService.getCurrentUser();

        if (!mountedRef.current) {
          return;
        }

        setUser(currentUser);

        console.log(
          'KSO AUTH: Existing user:',
          currentUser
        );

        // Sync profile only for real authenticated users.
        if (
          currentUser &&
          !currentUser.isGuest
        ) {
          await syncProfile();
        }
      } catch (error) {
        console.error(
          'KSO AUTH: Authentication initialization failed:',
          error
        );

        if (mountedRef.current) {
          setUser(null);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    initializeAuthentication();

    // ───────────────────────────────────────────
    // AUTH STATE LISTENER
    // ───────────────────────────────────────────

    try {
      unsubscribe =
        authService.onAuthStateChange(
          async (nextUser) => {
            if (!mountedRef.current) {
              return;
            }

            console.log(
              'KSO AUTH: Auth state changed:',
              nextUser
            );

            setUser(nextUser);

            // Only sync profiles for real users.
            if (
              nextUser &&
              !nextUser.isGuest
            ) {
              await syncProfile();
            }
          }
        );
    } catch (error) {
      console.error(
        'KSO AUTH: Failed to register auth listener:',
        error
      );
    }

    return () => {
      mountedRef.current = false;

      try {
        unsubscribe?.();
      } catch (error) {
        console.error(
          'KSO AUTH: Failed to remove auth listener:',
          error
        );
      }
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
      if (authOperationInProgress.current) {
        throw new Error(
          'An authentication request is already in progress. Please wait.'
        );
      }

      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          'Please enter your email address.'
        );
      }

      if (!password) {
        throw new Error(
          'Please enter your password.'
        );
      }

      authOperationInProgress.current = true;

      try {
        console.log(
          'KSO AUTH: Starting login...'
        );

        const authenticatedUser =
          await authService.signIn(
            cleanEmail,
            password
          );

        if (!authenticatedUser) {
          throw new Error(
            'Login failed. No user was returned.'
          );
        }

        if (!authenticatedUser.id) {
          throw new Error(
            'Login failed. The authenticated user has no ID.'
          );
        }

        if (mountedRef.current) {
          setUser(authenticatedUser);
        }

        console.log(
          'KSO AUTH: Login successful:',
          authenticatedUser
        );

        // Profile sync is optional and must not
        // cause login to fail.
        if (!authenticatedUser.isGuest) {
          await syncProfile();
        }

        console.log(
          'KSO AUTH: Login flow completed.'
        );
      } catch (error) {
        console.error(
          'KSO AUTH: LOGIN ERROR:',
          error
        );

        throw new Error(
          getErrorMessage(
            error,
            'Unable to login. Please check your email and password.'
          )
        );
      } finally {
        authOperationInProgress.current = false;
      }
    },
    [syncProfile]
  );

  // ─────────────────────────────────────────────
  // SIGNUP / CREATE ACCOUNT
  // ─────────────────────────────────────────────

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name?: string
    ) => {
      if (authOperationInProgress.current) {
        throw new Error(
          'An authentication request is already in progress. Please wait.'
        );
      }

      const cleanEmail =
        email.trim().toLowerCase();

      const cleanName =
        typeof name === 'string'
          ? name.trim()
          : '';

      // ───────────────────────────────────────
      // VALIDATION
      // ───────────────────────────────────────

      if (!cleanName) {
        throw new Error(
          'Please enter your name.'
        );
      }

      if (!cleanEmail) {
        throw new Error(
          'Please enter your email address.'
        );
      }

      if (!cleanEmail.includes('@')) {
        throw new Error(
          'Please enter a valid email address.'
        );
      }

      if (!password) {
        throw new Error(
          'Please enter a password.'
        );
      }

      if (password.length < 6) {
        throw new Error(
          'Password must be at least 6 characters long.'
        );
      }

      authOperationInProgress.current = true;

      try {
        console.log(
          'KSO AUTH: Starting account creation...'
        );

        console.log(
          'KSO AUTH: Email:',
          cleanEmail
        );

        // ─────────────────────────────────────
        // CREATE ACCOUNT
        // ─────────────────────────────────────

        const newUser =
          await authService.signUp(
            cleanEmail,
            password,
            cleanName
          );

        console.log(
          'KSO AUTH: Signup service returned:',
          newUser
        );

        // Never continue if signup did not
        // return a user object.
        if (!newUser) {
          throw new Error(
            'Account creation failed. No user was returned.'
          );
        }

        if (!newUser.id) {
          throw new Error(
            'Account creation failed. The new user has no ID.'
          );
        }

        // ─────────────────────────────────────
        // UPDATE AUTH STATE FIRST
        // ─────────────────────────────────────

        // This is deliberately done BEFORE chat
        // or profile operations.
        //
        // Account creation itself should not depend
        // on those optional services.

        if (mountedRef.current) {
          setUser(newUser);
        }

        console.log(
          'KSO AUTH: User state updated successfully.'
        );

        // ─────────────────────────────────────
        // LINK GUEST CHAT
        // ─────────────────────────────────────

        if (!newUser.isGuest) {
          try {
            console.log(
              'KSO AUTH: Linking guest chat...'
            );

            await chatService.linkGuestChatToUser(
              newUser.id
            );

            console.log(
              'KSO AUTH: Guest chat linked successfully.'
            );
          } catch (error) {
            // This is optional functionality.
            // It must NEVER cancel successful signup.
            console.error(
              'KSO AUTH: Guest chat linking failed:',
              error
            );
          }
        }

        // ─────────────────────────────────────
        // PROFILE SYNC
        // ─────────────────────────────────────

        if (!newUser.isGuest) {
          await syncProfile();
        }

        console.log(
          'KSO AUTH: ACCOUNT CREATION COMPLETED.'
        );
      } catch (error) {
        console.error(
          'KSO AUTH: SIGNUP ERROR:',
          error
        );

        throw new Error(
          getErrorMessage(
            error,
            'Unable to create your account. Please try again.'
          )
        );
      } finally {
        authOperationInProgress.current = false;
      }
    },
    [syncProfile]
  );

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const logout = useCallback(async () => {
    if (authOperationInProgress.current) {
      throw new Error(
        'Another authentication request is already in progress. Please wait.'
      );
    }

    authOperationInProgress.current = true;

    try {
      console.log(
        'KSO AUTH: Starting logout...'
      );

      try {
        await authService.signOut();

        console.log(
          'KSO AUTH: Supabase logout successful.'
        );
      } catch (error) {
        // We still clear local state below.
        console.error(
          'KSO AUTH: Supabase sign out failed:',
          error
        );
      }

      if (mountedRef.current) {
        setUser(null);
      }

      try {
        await authService.exitGuestMode();
      } catch (error) {
        console.error(
          'KSO AUTH: Guest cleanup failed:',
          error
        );
      }

      console.log(
        'KSO AUTH: Logout completed.'
      );
    } finally {
      authOperationInProgress.current = false;
    }
  }, []);

  // ─────────────────────────────────────────────
  // GUEST MODE
  // ─────────────────────────────────────────────

  const enterGuest = useCallback(async () => {
    if (authOperationInProgress.current) {
      throw new Error(
        'Another authentication request is already in progress. Please wait.'
      );
    }

    authOperationInProgress.current = true;

    try {
      console.log(
        'KSO AUTH: Entering guest mode...'
      );

      await authService.enterGuestMode();

      const guestUser: AuthUser = {
        id: 'guest',
        email: '',
        isGuest: true,
      };

      if (mountedRef.current) {
        setUser(guestUser);
      }

      console.log(
        'KSO AUTH: Guest mode enabled.'
      );
    } catch (error) {
      console.error(
        'KSO AUTH: GUEST MODE ERROR:',
        error
      );

      throw new Error(
        getErrorMessage(
          error,
          'Unable to enter guest mode.'
        )
      );
    } finally {
      authOperationInProgress.current = false;
    }
  }, []);

  // ─────────────────────────────────────────────
  // PROVIDER
  // ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// AUTH HOOK
// ─────────────────────────────────────────────

export function useAuth() {
  return useContext(AuthContext);
}