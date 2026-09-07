/**
 * KSO AI Matching Results Screen
 * Shows matched opportunities (linked to Details) + resume improvement tips.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius, iconSize } from '../theme/spacing';
import { PrimaryButton } from '../components/PrimaryButton';
import { EmptyState } from '../components/EmptyState';
import * as opportunityService from '../services/opportunityService';
import type { AIMatchingResult, AIMatch } from '../services/aiService';
import { Opportunity } from '../types/opportunity';

interface MatchingResultsScreenProps {
  route: {
    params: {
      result: AIMatchingResult;
    };
  };
  navigation: any;
}

interface MatchWithOpportunity {
  match: AIMatch;
  opportunity: Opportunity | null;
}

export default function MatchingResultsScreen({ route, navigation }: MatchingResultsScreenProps) {
  const { result } = route.params;
  const [enrichedMatches, setEnrichedMatches] = useState<MatchWithOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch full opportunity data for each match
  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const allOpps = await opportunityService.getAllOpportunities();
      const oppMap = new Map(allOpps.map((o) => [o.id, o]));

      const enriched = result.matches.map((m) => ({
        match: m,
        opportunity: oppMap.get(m.opportunity_id) || null,
      }));

      setEnrichedMatches(enriched);
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity details.');
    } finally {
      setIsLoading(false);
    }
  }, [result.matches]);

  useEffect(() => {
    loadOpportunities();
  }, [loadOpportunities]);

  const handleOpportunityPress = (opp: Opportunity) => {
    navigation.navigate('OpportunityDetails', { opportunity: opp });
  };

  const handleRetry = () => {
    navigation.goBack();
  };

  // ── Error state ──
  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          icon="alert-circle-outline"
          title="Couldn't load results"
          message={error}
          action={
            <View style={{ gap: spacing.sm, width: '100%', paddingHorizontal: spacing.xl }}>
              <PrimaryButton title="Retry" onPress={loadOpportunities} />
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
                <Text style={styles.backLinkText}>Back to Profile</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading matched opportunities...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const validMatches = enrichedMatches.filter((m) => m.opportunity !== null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={32} color={colors.textInverse} />
          </View>
          <Text style={styles.headerTitle}>AI Matching Results</Text>
          <Text style={styles.headerSubtitle}>
            {validMatches.length} matches found from {result.opportunities_count} opportunities
          </Text>
        </View>

        {/* Matched Opportunities */}
        {validMatches.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matched Opportunities</Text>
            {validMatches.map(({ match, opportunity: opp }, index) => (
              <TouchableOpacity
                key={match.opportunity_id}
                style={styles.matchCard}
                onPress={() => opp && handleOpportunityPress(opp)}
                activeOpacity={0.7}
              >
                <View style={styles.matchHeader}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.matchInfo}>
                    <Text style={styles.matchTitle} numberOfLines={2}>{opp!.title}</Text>
                    <Text style={styles.matchOrg}>{opp!.organization}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </View>
                <View style={styles.reasonContainer}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.success} style={{ marginTop: 2 }} />
                  <Text style={styles.reasonText}>{match.reason}</Text>
                </View>
                <View style={styles.matchMeta}>
                  <View style={styles.metaTag}>
                    <Ionicons name="pricetag-outline" size={12} color={colors.textTertiary} />
                    <Text style={styles.metaText}>{opp!.category}</Text>
                  </View>
                  {opp!.deadline && (
                    <View style={styles.metaTag}>
                      <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                      <Text style={styles.metaText}>{opp!.deadline}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyMatches}>
            <Ionicons name="search-outline" size={iconSize.xxl} color={colors.disabled} />
            <Text style={styles.emptyText}>
              No strong matches found. Try uploading a more detailed resume or update your profile.
            </Text>
          </View>
        )}

        {/* Resume Feedback */}
        {result.resume_feedback.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resume Improvement Tips</Text>
            {result.resume_feedback.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PrimaryButton
            title="Run Matching Again"
            onPress={handleRetry}
          />
          <View style={{ height: spacing.sm }} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back to Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.base,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  // Sections
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  // Match cards
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  matchInfo: {
    flex: 1,
  },
  matchTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  matchOrg: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonContainer: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingLeft: 44,
    gap: spacing.sm,
  },
  reasonText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: fontSize.sm * 1.5,
  },
  matchMeta: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingLeft: 44,
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  // Empty
  emptyMatches: {
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: fontSize.md * 1.5,
  },
  // Tips
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.divider,
    gap: spacing.md,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
  // Actions
  actions: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
  },
  backLink: {
    alignItems: 'center',
    padding: spacing.md,
  },
  backLinkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
