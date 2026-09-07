/**
 * KSO Chat Service
 *
 * Supports:
 * - Logged-in users using Supabase JWT authentication
 * - Guest users using a guest token
 * - Persistent chat sessions
 * - Chat history
 * - Guest-to-account chat linking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getGuestToken } from './authService';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ChatResponse {
  reply: string;
  session_id: string;
  is_new_session: boolean;
}

// ─────────────────────────────────────────────────────────────
// STORAGE KEYS
// ─────────────────────────────────────────────────────────────

const GUEST_SESSION_KEY = '@kso/guest_chat_session_id';
const USER_SESSION_KEY = '@kso/chat_session_id';

// ─────────────────────────────────────────────────────────────
// GUEST SESSION
// ─────────────────────────────────────────────────────────────

async function getGuestSessionId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(GUEST_SESSION_KEY);
  } catch (error) {
    console.error('Could not get guest session:', error);
    return null;
  }
}

async function setGuestSessionId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_SESSION_KEY, id);
  } catch (error) {
    console.error('Could not save guest session:', error);
  }
}

/**
 * Clear the guest chat session.
 */
export async function clearGuestSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_SESSION_KEY);
  } catch (error) {
    console.error('Could not clear guest session:', error);
  }
}

// ─────────────────────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────────────────────

/**
 * Send a message to the chat-assistant Edge Function.
 *
 * Works for both:
 * - Logged-in users
 * - Guest users
 */
export async function sendMessage(
  message: string
): Promise<ChatResponse> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Chat requires Supabase to be configured.'
    );
  }

  // Validate message
  const cleanMessage = message.trim();

  if (!cleanMessage) {
    throw new Error(
      'Please enter a message.'
    );
  }

  // ───────────────────────────────────────────────────────────
  // Get authentication session
  // ───────────────────────────────────────────────────────────

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error(
      'Chat session error:',
      sessionError
    );

    throw new Error(
      `Authentication error: ${sessionError.message}`
    );
  }

  const isLoggedIn = !!session?.user;

  // ───────────────────────────────────────────────────────────
  // Build request body
  // ───────────────────────────────────────────────────────────

  const body: Record<string, string> = {
    message: cleanMessage,
  };

  if (isLoggedIn) {
    // Logged-in user
    const existingSessionId =
      await AsyncStorage.getItem(USER_SESSION_KEY);

    if (existingSessionId) {
      body.session_id = existingSessionId;
    }
  } else {
    // Guest user
    const guestSessionId =
      await getGuestSessionId();

    if (guestSessionId) {
      body.session_id = guestSessionId;
    }

    const guestToken =
      await getGuestToken();

    if (guestToken) {
      body.guest_token = guestToken;
    }
  }

  console.log(
    'Sending message to chat-assistant...',
    {
      loggedIn: isLoggedIn,
      hasSession: !!body.session_id,
      hasGuestToken: !!body.guest_token,
    }
  );

  // ───────────────────────────────────────────────────────────
  // Call Edge Function
  // ───────────────────────────────────────────────────────────

  try {
    const { data, error } =
      await supabase.functions.invoke(
        'chat-assistant',
        {
          body,

          headers: session?.access_token
            ? {
                Authorization:
                  `Bearer ${session.access_token}`,
              }
            : undefined,
        }
      );

    // Supabase function error
    if (error) {
      console.error(
        'chat-assistant Edge Function error:',
        error
      );

      throw new Error(
        error.message ||
          'Chat service returned an error.'
      );
    }

    // No response
    if (!data) {
      throw new Error(
        'Chat service returned no data.'
      );
    }

    console.log(
      'chat-assistant response received.'
    );

    // Edge Function application-level error
    if (data.error) {
      console.error(
        'chat-assistant returned error:',
        data.error
      );

      throw new Error(
        String(data.error)
      );
    }

    // Validate reply
    const reply =
      typeof data.reply === 'string'
        ? data.reply
        : '';

    if (!reply) {
      throw new Error(
        'The AI assistant returned an empty response.'
      );
    }

    // Get returned session ID
    const sessionId =
      typeof data.session_id === 'string'
        ? data.session_id
        : '';

    // ─────────────────────────────────────────────────────────
    // Save session ID
    // ─────────────────────────────────────────────────────────

    if (sessionId) {
      if (isLoggedIn) {
        await AsyncStorage.setItem(
          USER_SESSION_KEY,
          sessionId
        );
      } else {
        await setGuestSessionId(
          sessionId
        );
      }
    }

    return {
      reply,
      session_id: sessionId,
      is_new_session:
        data.is_new_session === true,
    };
  } catch (error: any) {
    console.error(
      'Chat request failed:',
      error
    );

    if (
      error instanceof Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      'Chat request failed. Please try again.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// LOAD CHAT HISTORY
// ─────────────────────────────────────────────────────────────

/**
 * Load chat history from Supabase.
 *
 * Logged-in users:
 *     Loads the current user's chat session.
 *
 * Guests:
 *     Loads their current guest chat session.
 */
export async function loadHistory(): Promise<
  ChatMessage[]
> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'History session error:',
        sessionError
      );

      return [];
    }

    let sessionId: string | null = null;

    if (session?.user) {
      sessionId =
        await AsyncStorage.getItem(
          USER_SESSION_KEY
        );
    } else {
      sessionId =
        await getGuestSessionId();
    }

    if (!sessionId) {
      return [];
    }

    const {
      data,
      error,
    } = await supabase
      .from('chat_messages')
      .select(
        'id, role, content, created_at'
      )
      .eq(
        'session_id',
        sessionId
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      )
      .limit(50);

    if (error) {
      console.error(
        'Could not load chat history:',
        error
      );

      return [];
    }

    if (!data) {
      return [];
    }

    return data.map(
      (row: any): ChatMessage => ({
        id: String(row.id),
        role: row.role,
        content: String(
          row.content ?? ''
        ),
        createdAt: row.created_at,
      })
    );
  } catch (error) {
    console.error(
      'loadHistory failed:',
      error
    );

    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// GUEST → USER ACCOUNT LINKING
// ─────────────────────────────────────────────────────────────

/**
 * Link an existing guest chat session to a user account.
 *
 * Called after successful sign-up.
 */
export async function linkGuestChatToUser(
  userId: string
): Promise<boolean> {
  if (!userId) {
    return false;
  }

  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const guestSessionId =
      await getGuestSessionId();

    if (!guestSessionId) {
      return false;
    }

    const {
      error,
    } = await supabase
      .from('chat_sessions')
      .update({
        user_id: userId,
        session_token: null,
      })
      .eq(
        'id',
        guestSessionId
      );

    if (error) {
      console.error(
        'Could not link guest chat:',
        error
      );

      return false;
    }

    // Move session to logged-in storage
    await AsyncStorage.setItem(
      USER_SESSION_KEY,
      guestSessionId
    );

    // Remove guest session
    await clearGuestSession();

    return true;
  } catch (error) {
    console.error(
      'linkGuestChatToUser failed:',
      error
    );

    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// CHECK GUEST SESSION
// ─────────────────────────────────────────────────────────────

/**
 * Check whether the guest currently has
 * an active chat session.
 */
export async function hasGuestChatSession(): Promise<boolean> {
  const id =
    await getGuestSessionId();

  return !!id;
}