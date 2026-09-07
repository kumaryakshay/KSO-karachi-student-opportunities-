/**
 * KSO Bookmark Service
 * Supabase-backed for logged-in users, AsyncStorage fallback for guests.
 * Hook API stays the same regardless of backend.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@kso/saved_opportunities';

/** Check if a real Supabase user is logged in */
async function getLoggedInUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || null;
  } catch {
    return null;
  }
}

// ── Supabase Queries (logged-in users) ─────────────────────────────────────────

async function getSavedIdsSupabase(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('saved_opportunities')
    .select('opportunity_id')
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map((r: any) => r.opportunity_id);
}

async function addSavedSupabase(userId: string, opportunityId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_opportunities')
    .insert({ user_id: userId, opportunity_id: opportunityId });

  if (error && error.code !== '23505') throw error; // 23505 = unique violation
}

async function removeSavedSupabase(userId: string, opportunityId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_opportunities')
    .delete()
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId);

  if (error) throw error;
}

// ── AsyncStorage (guest / offline fallback) ─────────────────────────────────────

async function getSavedIdsLocal(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveIdsLocal(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Silently fail
  }
}

// ── Public API ───────────────────────────────────────────────────────────────────

/** Get all saved opportunity IDs */
export async function getSavedIds(): Promise<string[]> {
  const userId = await getLoggedInUserId();
  if (userId) {
    try {
      return await getSavedIdsSupabase(userId);
    } catch {
      return getSavedIdsLocal();
    }
  }
  return getSavedIdsLocal();
}

/** Add an opportunity ID to saved */
export async function addSaved(id: string): Promise<string[]> {
  const userId = await getLoggedInUserId();
  if (userId) {
    await addSavedSupabase(userId, id);
    return getSavedIds();
  }
  const current = await getSavedIdsLocal();
  if (!current.includes(id)) {
    const updated = [...current, id];
    await saveIdsLocal(updated);
    return updated;
  }
  return current;
}

/** Remove an opportunity ID from saved */
export async function removeSaved(id: string): Promise<string[]> {
  const userId = await getLoggedInUserId();
  if (userId) {
    await removeSavedSupabase(userId, id);
    return getSavedIds();
  }
  const current = await getSavedIdsLocal();
  const updated = current.filter((i) => i !== id);
  await saveIdsLocal(updated);
  return updated;
}

/** Toggle an opportunity ID — add if not saved, remove if saved */
export async function toggleSaved(id: string): Promise<{ saved: boolean; ids: string[] }> {
  const current = await getSavedIds();
  if (current.includes(id)) {
    const ids = await removeSaved(id);
    return { saved: false, ids };
  } else {
    const ids = await addSaved(id);
    return { saved: true, ids };
  }
}
