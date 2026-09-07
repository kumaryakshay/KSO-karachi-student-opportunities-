/**
 * KSO Saved Screen
 * Shows bookmarked opportunities with loading/empty/error states.
 */

import React, { useMemo } from 'react';
import { View, FlatList, StyleSheet, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius } from '../theme/spacing';
import { OpportunityCard } from '../components/OpportunityCard';
import { EmptyState } from '../components/EmptyState';
import { PrimaryButton } from '../components/PrimaryButton';
import { useSaved } from '../context/SavedContext';
import { mockOpportunities } from '../data/mockOpportunities';
import { Opportunity } from '../types/opportunity';

interface SavedScreenProps {
  navigation?: any;
}

export default function SavedScreen({ navigation }: SavedScreenProps) {
  const { savedIds, isLoading, error, reload } = useSaved();

  const savedOpps = useMemo(
    () => mockOpportunities.filter((o) => savedIds.has(o.id)),
    [savedIds]
  );

  const handleOpportunityPress = (opportunity: Opportunity) => {
    navigation?.navigate('OpportunityDetails', { opportunity });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading saved items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load saved items"
          message={error}
          action={
            <TouchableOpacity style={styles.retryBtn} onPress={reload}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={savedOpps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OpportunityCard opportunity={item} onPress={handleOpportunityPress} />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="bookmark-outline"
            title="No saved opportunities yet"
            message="Bookmark opportunities to easily find them later."
            action={
              <PrimaryButton
                title="Explore Opportunities"
                onPress={() => navigation?.navigate('Explore')}
              />
            }
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  retryBtnText: {
    fontSize: fontSize.base,
    color: colors.textInverse,
    fontWeight: fontWeight.semibold,
  },
});
