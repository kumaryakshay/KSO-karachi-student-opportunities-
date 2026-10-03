
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

  const authOperationInProgress = useRef(false);
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
      // IMPORTANT:
      // Profile sync must NEVER break authentication.
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

        // Do NOT block authentication on profile sync.
        if (
          currentUser &&
          !currentUser.isGuest
        ) {
          void syncProfile();
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

    void initializeAuthentication();

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

            // IMPORTANT:
            // Do not wait for profile sync here.
            if (
              nextUser &&
              !nextUser.isGuest
            ) {
              void syncProfile();
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

        // Profile sync is completely optional.
        // Never make login depend on it.
        if (!authenticatedUser.isGuest) {
          void syncProfile();
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
        // AUTH STATE FIRST
        // ─────────────────────────────────────
        //
        // THIS IS THE MOST IMPORTANT PART.
        //
        // Once the account is created, update the
        // application state immediately.
        //
        // Chat/profile operations happen AFTER this
        // and cannot make signup fail.

        if (mountedRef.current) {
          setUser(newUser);
        }

        console.log(
          'KSO AUTH: User state updated successfully.'
        );

        // ─────────────────────────────────────
        // OPTIONAL BACKGROUND OPERATIONS
        // ─────────────────────────────────────
        //
        // These operations are intentionally NOT awaited.
        // They must never block account creation/navigation.

        if (!newUser.isGuest) {
          void (async () => {
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
              console.error(
                'KSO AUTH: Guest chat linking failed:',
                error
              );
            }
          })();

          void syncProfile();
        }

        // ─────────────────────────────────────
        // IMPORTANT
        // ─────────────────────────────────────
        //
        // Signup is considered successful here.
        //
        // Navigation/auth state can continue without
        // waiting for chat or profile synchronization.

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
