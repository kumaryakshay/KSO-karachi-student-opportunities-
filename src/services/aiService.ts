/**
 * KSO AI Service
 *
 * Calls the Supabase Edge Function "match-resume".
 * The Edge Function uses Google Gemini to match a user's
 * resume against available opportunities.
 *
 * IMPORTANT:
 * The Gemini API key must stay inside Supabase Secrets.
 * Never put the Gemini API key in this React Native app.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

export interface AIMatch {
  opportunity_id: string;
  reason: string;
}

export interface AIMatchingResult {
  matches: AIMatch[];
  resume_feedback: string[];
  opportunities_count: number;
}

// ─────────────────────────────────────────────────────────────
// AI RESUME MATCHING
// ─────────────────────────────────────────────────────────────

/**
 * Calls the "match-resume" Supabase Edge Function.
 *
 * Requirements:
 * - Supabase must be configured
 * - User must be logged in
 * - User should have a resume uploaded
 */
export async function matchResume(): Promise<AIMatchingResult> {
  // Check Supabase configuration
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Please check your Supabase configuration.'
    );
  }

  // ───────────────────────────────────────────────────────────
  // Check current login session
  // ───────────────────────────────────────────────────────────

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);

    throw new Error(
      `Authentication error: ${sessionError.message}`
    );
  }

  if (!session?.user) {
    throw new Error(
      'You must be signed in before using AI matching.'
    );
  }

  if (!session.access_token) {
    throw new Error(
      'Your login session has expired. Please sign in again.'
    );
  }

  console.log('User authenticated:', session.user.id);
  console.log('Calling match-resume Edge Function...');

  // ───────────────────────────────────────────────────────────
  // Call Supabase Edge Function
  // ───────────────────────────────────────────────────────────

  try {
    const { data, error } = await supabase.functions.invoke(
      'match-resume',
      {
        body: {
          user_id: session.user.id,
        },

        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    // ─────────────────────────────────────────────────────────
    // Supabase returned an error
    // ─────────────────────────────────────────────────────────

    if (error) {
      console.error(
        'match-resume Edge Function error:',
        error
      );

      throw new Error(
        error.message ||
          'The match-resume Edge Function failed.'
      );
    }

    // ─────────────────────────────────────────────────────────
    // No response
    // ─────────────────────────────────────────────────────────

    if (!data) {
      console.error(
        'match-resume returned no data.'
      );

      throw new Error(
        'The AI matching service returned no data.'
      );
    }

    console.log(
      'match-resume response:',
      data
    );

    // ─────────────────────────────────────────────────────────
    // Edge Function returned its own error
    // ─────────────────────────────────────────────────────────

    if (data.error) {
      console.error(
        'Edge Function application error:',
        data.error
      );

      throw new Error(
        String(data.error)
      );
    }

    // ─────────────────────────────────────────────────────────
    // Safely process response
    // ─────────────────────────────────────────────────────────

    const matches: AIMatch[] = Array.isArray(data.matches)
      ? data.matches
      : [];

    const resumeFeedback: string[] =
      Array.isArray(data.resume_feedback)
        ? data.resume_feedback
        : [];

    const opportunitiesCount =
      typeof data.opportunities_count === 'number'
        ? data.opportunities_count
        : 0;

    return {
      matches,
      resume_feedback: resumeFeedback,
      opportunities_count: opportunitiesCount,
    };
  } catch (error: any) {
    console.error(
      'AI matching request failed:',
      error
    );

    // Keep our custom error messages
    if (
      error instanceof Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      'AI matching failed. Please try again.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// RESUME UPLOAD
// ─────────────────────────────────────────────────────────────

/**
 * Upload a PDF resume to Supabase Storage.
 *
 * The resume is stored using:
 *
 *     userId/timestamp_filename.pdf
 *
 * After uploading, the user's profile is updated with
 * the storage path.
 */
export async function uploadResume(
  userId: string,
  fileUri: string,
  fileName: string
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured.'
    );
  }

  if (!userId) {
    throw new Error(
      'User ID is required to upload a resume.'
    );
  }

  if (!fileUri) {
    throw new Error(
      'Resume file URI is required.'
    );
  }

  if (!fileName) {
    throw new Error(
      'Resume file name is required.'
    );
  }

  try {
    console.log(
      'Starting resume upload...'
    );

    // ─────────────────────────────────────────────────────────
    // Read local file
    // ─────────────────────────────────────────────────────────

    const response = await fetch(fileUri);

    if (!response.ok) {
      throw new Error(
        `Could not read resume file. HTTP ${response.status}`
      );
    }

    const blob = await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error(
        'The selected resume file is empty.'
      );
    }

    // ─────────────────────────────────────────────────────────
    // Create storage path
    // ─────────────────────────────────────────────────────────

    const safeFileName = fileName.replace(
      /[^a-zA-Z0-9._-]/g,
      '_'
    );

    const storagePath =
      `${userId}/${Date.now()}_${safeFileName}`;

    console.log(
      'Uploading resume to:',
      storagePath
    );

    // ─────────────────────────────────────────────────────────
    // Upload to Supabase Storage
    // ─────────────────────────────────────────────────────────

    const { error: uploadError } =
      await supabase.storage
        .from('resumes')
        .upload(
          storagePath,
          blob,
          {
            contentType: 'application/pdf',
            upsert: true,
          }
        );

    if (uploadError) {
      console.error(
        'Resume upload error:',
        uploadError
      );

      throw new Error(
        `Upload failed: ${uploadError.message}`
      );
    }

    console.log(
      'Resume uploaded successfully.'
    );

    // ─────────────────────────────────────────────────────────
    // Update user's profile
    // ─────────────────────────────────────────────────────────

    const {
      error: profileError,
    } = await supabase
      .from('profiles')
      .update({
        resume_url: storagePath,
      })
      .eq('id', userId);

    if (profileError) {
      console.error(
        'Profile update error:',
        profileError
      );

      throw new Error(
        `Profile update failed: ${profileError.message}`
      );
    }

    console.log(
      'Profile updated successfully.'
    );

    return storagePath;
  } catch (error: any) {
    console.error(
      'Resume upload failed:',
      error
    );

    if (
      error instanceof Error &&
      error.message
    ) {
      throw error;
    }

    throw new Error(
      'Resume upload failed. Please try again.'
    );
  }
}

// ─────────────────────────────────────────────────────────────
// GET RESUME PATH
// ─────────────────────────────────────────────────────────────

/**
 * Gets the current user's resume storage path.
 *
 * Returns:
 * - storage path if resume exists
 * - null if no resume exists
 */
export async function getResumePath(): Promise<
  string | null
> {
  if (!isSupabaseConfigured()) {
    console.warn(
      'Supabase is not configured.'
    );

    return null;
  }

  try {
    // ─────────────────────────────────────────────────────────
    // Get current session
    // ─────────────────────────────────────────────────────────

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error(
        'Session error:',
        sessionError
      );

      return null;
    }

    if (!session?.user) {
      console.log(
        'No logged-in user.'
      );

      return null;
    }

    // ─────────────────────────────────────────────────────────
    // Get resume path from profile
    // ─────────────────────────────────────────────────────────

    const {
      data,
      error,
    } = await supabase
      .from('profiles')
      .select('resume_url')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error(
        'Could not get resume path:',
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    return data.resume_url || null;
  } catch (error) {
    console.error(
      'getResumePath failed:',
      error
    );

    return null;
  }
}