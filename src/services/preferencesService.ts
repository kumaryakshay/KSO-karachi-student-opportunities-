/**
 * KSO User Preferences Service
 *
 * Stores user preferences locally and in Supabase.
 *
 * Used for personalized opportunity matching:
 * - Education level
 * - Field of study
 * - Interests
 * - Location
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient';

const PREFS_KEY = '@kso/user_preferences';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface UserPreferences {
  educationLevel: string;
  fieldOfStudy: string;
  interests: string[];
  location: string;
  onboardingComplete: boolean;
  hasSeenWelcome: boolean;
}

// ─────────────────────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────────────────────

const DEFAULT_PREFS: UserPreferences = {
  educationLevel: '',
  fieldOfStudy: '',
  interests: [],
  location: '',
  onboardingComplete: false,
  hasSeenWelcome: false,
};

// ─────────────────────────────────────────────────────────────
// LOCAL STORAGE
// ─────────────────────────────────────────────────────────────

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const raw =
      await AsyncStorage.getItem(PREFS_KEY);

    if (!raw) {
      return DEFAULT_PREFS;
    }

    const parsed = JSON.parse(raw);

    return {
      ...DEFAULT_PREFS,
      ...parsed,
      interests: Array.isArray(
        parsed.interests
      )
        ? parsed.interests
        : [],
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function savePreferences(
  prefs: Partial<UserPreferences>
): Promise<UserPreferences> {
  const current =
    await getPreferences();

  const updated: UserPreferences = {
    ...current,
    ...prefs,
  };

  try {
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify(updated)
    );
  } catch (error) {
    console.error(
      'Could not save local preferences:',
      error
    );
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────
// CURRENT USER
// ─────────────────────────────────────────────────────────────

async function getLoggedInUserId(): Promise<string | null> {
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
    } =
      await supabase.auth.getSession();

    if (error) {
      console.error(
        'Could not get session:',
        error
      );

      return null;
    }

    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// SYNC PROFILE FROM SUPABASE
// ─────────────────────────────────────────────────────────────

export async function syncProfileFromSupabase(): Promise<UserPreferences> {
  const userId =
    await getLoggedInUserId();

  if (!userId || !supabase) {
    return getPreferences();
  }

  try {
    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error(
        'Could not load profile:',
        error
      );

      return getPreferences();
    }

    if (!data) {
      return getPreferences();
    }

    const merged =
      await savePreferences({
        educationLevel:
          data.education_level || '',

        fieldOfStudy:
          data.field_of_study || '',

        interests:
          Array.isArray(data.interests)
            ? data.interests
            : [],

        location:
          data.location || '',

        onboardingComplete:
          Boolean(
            data.education_level ||
            data.field_of_study ||
            data.interests?.length
          ),
      });

    return merged;
  } catch (error) {
    console.error(
      'Profile sync failed:',
      error
    );

    return getPreferences();
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE PROFILE TO SUPABASE
// ─────────────────────────────────────────────────────────────

async function saveProfileToSupabase(
  userId: string,
  data: {
    education: string;
    field: string;
    interests: string[];
    location?: string;
  }
): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } =
    await supabase
      .from('profiles')
      .upsert({
        id: userId,

        education_level:
          data.education,

        field_of_study:
          data.field,

        interests:
          data.interests,

        location:
          data.location || '',
      });

  if (error) {
    console.error(
      'Could not save profile:',
      error
    );

    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// SAVE ONBOARDING
// ─────────────────────────────────────────────────────────────

export async function saveOnboarding(
  data: {
    education: string;
    field: string;
    interests: string[];
    location?: string;
  }
): Promise<void> {
  // Save locally
  await savePreferences({
    educationLevel:
      data.education,

    fieldOfStudy:
      data.field,

    interests:
      data.interests,

    location:
      data.location || '',

    onboardingComplete: true,
  });

  // Save to Supabase
  const userId =
    await getLoggedInUserId();

  if (!userId) {
    return;
  }

  try {
    await saveProfileToSupabase(
      userId,
      data
    );
  } catch (error) {
    console.error(
      'Supabase profile save failed:',
      error
    );
  }
}

// ─────────────────────────────────────────────────────────────
// WELCOME
// ─────────────────────────────────────────────────────────────

export async function markWelcomeSeen(): Promise<void> {
  await savePreferences({
    hasSeenWelcome: true,
  });
}

// ─────────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────────

export async function resetPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(
      PREFS_KEY
    );
  } catch (error) {
    console.error(
      'Could not reset preferences:',
      error
    );
  }
}