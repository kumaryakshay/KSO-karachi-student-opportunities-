import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius, iconSize } from '../theme/spacing';
import { SearchBar } from '../components/SearchBar';
import { CategoryChip } from '../components/CategoryChip';
import { OpportunityCard } from '../components/OpportunityCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import * as opportunityService from '../services/opportunityService';
import * as deadlineService from '../services/deadlineService';
import { Opportunity, OpportunityCategory } from '../types/opportunity';

const CATEGORIES: { key: OpportunityCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'scholarship', label: 'Scholarships' },
  { key: 'internship', label: 'Internships' },
  { key: 'course', label: 'Courses' },
  { key: 'competition', label: 'Competitions' },
  { key: 'fellowship', label: 'Fellowships' },
  { key: 'training', label: 'Training' },
  { key: 'exchange', label: 'Exchanges' },
  { key: 'volunteer', label: 'Volunteer' },
  { key: 'job', label: 'Jobs' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface HomeScreenProps {
  navigation?: any;
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'all'>('all');
  const [allOpps, setAllOpps] = useState<Opportunity[]>([]);
  const [featured, setFeatured] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [opps, feat] = await Promise.all([
        opportunityService.getAllOpportunities(),
        opportunityService.getFeaturedOpportunities(),
      ]);
      setAllOpps(opps);
      setFeatured(feat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fire-and-forget: check saved deadlines on mount
  useEffect(() => {
    deadlineService.getCurrentUserId().then((userId) => {
      if (userId) {
        deadlineService.generateDeadlineNotifications(userId).catch(() => {});
      }
    });
  }, []);

  // Filter locally
  const filtered = allOpps.filter((o) => {
    if (selectedCategory !== 'all' && o.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        o.category.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q) ||
        o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpportunityPress = (opportunity: Opportunity) => {
    navigation?.navigate('OpportunityDetails', { opportunity });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
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
          title="Something went wrong"
          message={error}
          action={
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Greeting Header */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            <Text style={styles.tagline}>Discover opportunities that build your future.</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => navigation?.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={iconSize.base} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>

        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              label={cat.label}
              selected={selectedCategory === cat.key}
              onPress={() => setSelectedCategory(cat.key)}
            />
          ))}
        </ScrollView>

        {/* Featured Section */}
        {selectedCategory === 'all' && !search && featured.length > 0 && (
          <>
            <SectionHeader title="Featured" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
              pagingEnabled
            >
              {featured.map((opp) => (
                <TouchableOpacity
                  key={opp.id}
                  style={styles.featuredCard}
                  onPress={() => handleOpportunityPress(opp)}
                  activeOpacity={0.8}
                >
                  <View style={styles.featuredIcon}>
                    <Ionicons name="star" size={iconSize.md} color={colors.primary} />
                  </View>
                  <Text style={styles.featuredOrg}>{opp.organization}</Text>
                  <Text style={styles.featuredTitle} numberOfLines={2}>{opp.title}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>{opp.shortDescription}</Text>
                  <View style={styles.featuredMeta}>
                    <Text style={styles.featuredCategory}>
                      {opp.category.charAt(0).toUpperCase() + opp.category.slice(1)}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* All / Filtered Opportunities */}
        <SectionHeader
          title={selectedCategory === 'all' ? 'All Opportunities' : `${CATEGORIES.find((c) => c.key === selectedCategory)?.label || ''}`}
        />

        {filtered.length > 0 ? (
          filtered.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} onPress={handleOpportunityPress} />
          ))
        ) : (
          <EmptyState
            icon="search-outline"
            title="No opportunities found"
            message="Try adjusting your search or category filter."
          />
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
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
    color: colors.textInverse,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  chipRow: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  chipScroll: {
    maxHeight: 44,
  },
  featuredScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  featuredCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.divider,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  featuredIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#FAF5F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  featuredOrg: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  featuredTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xxs,
  },
  featuredDesc: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: fontSize.sm * 1.5,
  },
  featuredMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  featuredCategory: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
});
