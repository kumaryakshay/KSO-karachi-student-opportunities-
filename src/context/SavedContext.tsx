/**
 * KSO Saved/Bookmark Context
 * Auth-aware — reloads saved IDs when user logs in/out.
 * Uses Supabase for logged-in users, AsyncStorage for guests.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import * as bookmarkService from '../services/bookmarkService';
import { useAuth } from './AuthContext';

interface SavedContextValue {
  savedIds: Set<string>;
  toggleSaved: (id: string) => void;
  isSaved: (id: string) => boolean;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

const SavedContext = createContext<SavedContextValue>({
  savedIds: new Set(),
  toggleSaved: () => {},
  isSaved: () => false,
  isLoading: true,
  error: null,
  reload: () => {},
});

export function SavedProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const reload = useCallback(() => setReloadTrigger((t) => t + 1), []);

  // Load saved IDs whenever auth state changes or reload is triggered
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    bookmarkService.getSavedIds()
      .then((ids) => {
        setSavedIds(new Set(ids));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load saved items');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.id, reloadTrigger]);

  const toggleSaved = useCallback((id: string) => {
    // Optimistic update — update UI immediately, then persist
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // Persist
      bookmarkService.toggleSaved(id).catch(() => {
        // Revert on error
        setSavedIds(prev);
      });
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.has(id), [savedIds]);

  return (
    <SavedContext.Provider value={{ savedIds, toggleSaved, isSaved, isLoading, error, reload }}>
      {children}
    </SavedContext.Provider>
  );
}

export const useSaved = () => useContext(SavedContext);
