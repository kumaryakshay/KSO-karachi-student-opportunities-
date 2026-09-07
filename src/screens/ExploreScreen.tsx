import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
  Modal, FlatList, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius, iconSize } from '../theme/spacing';
import { SearchBar } from '../components/SearchBar';
import { CategoryChip } from '../components/CategoryChip';
import { OpportunityCard } from '../components/OpportunityCard';
import { EmptyState } from '../components/EmptyState';
import * as opportunityService from '../services/opportunityService';
import type { ExploreFilters, SortOption } from '../services/opportunityService';
import { Opportunity, OpportunityCategory, EducationLevel } from '../types/opportunity';
import { getAllOrganizations, getAllFieldsOfStudy } from '../services/opportunityService';

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

const EDUCATION_LEVELS: { key: EducationLevel | 'all'; label: string }[] = [
  { key: 'all', label: 'Any' },
  { key: 'matric', label: 'Matric' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'bachelors', label: 'Bachelor\'s' },
  { key: 'masters', label: 'Master\'s' },
  { key: 'phd', label: 'PhD' },
  { key: 'diploma', label: 'Diploma' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'deadline', label: 'Deadline Soon' },
  { key: 'popular', label: 'Popular' },
];

const DEADLINE_OPTIONS: { key: 'all' | 'week' | 'month' | 'open'; label: string }[] = [
  { key: 'all', label: 'Any time' },
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'open', label: 'No deadline' },
];

interface ExploreScreenProps {
  navigation?: any;
}

export default function ExploreScreen({ navigation }: ExploreScreenProps) {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Opportunity[]>([]);

  // Active filters
  const [filters, setFilters] = useState<ExploreFilters>({
    category: 'all',
    sortBy: 'newest',
    isRemote: null,
    isPaid: null,
    educationLevel: 'all',
    fieldOfStudy: 'all',
    organization: 'all',
    deadlineRange: 'all',
  });

  // Temp filters for the modal (apply on confirm)
  const [tempFilters, setTempFilters] = useState<ExploreFilters>(filters);

  const fetchResults = useCallback(async (f: ExploreFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await opportunityService.searchOpportunities(f);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on filter change
  useEffect(() => {
    const f = { ...filters, search };
    fetchResults(f);
  }, [filters, search, fetchResults]);

  const handleOpportunityPress = (opportunity: Opportunity) => {
    navigation?.navigate('OpportunityDetails', { opportunity });
  };

  const openFilterModal = () => {
    setTempFilters(filters);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const cleared: ExploreFilters = {
      category: 'all', sortBy: 'newest', isRemote: null, isPaid: null,
      educationLevel: 'all', fieldOfStudy: 'all', organization: 'all', deadlineRange: 'all',
    };
    setTempFilters(cleared);
    setSearch('');
  };

  const activeFilterCount = [
    filters.category !== 'all',
    filters.isRemote !== null,
    filters.isPaid !== null,
    filters.educationLevel !== 'all',
    filters.fieldOfStudy !== 'all',
    filters.organization !== 'all',
    filters.deadlineRange !== 'all',
  ].filter(Boolean).length;

  const [organizations, setOrganizations] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);

  useEffect(() => {
    getAllOrganizations().then(setOrganizations);
    getAllFieldsOfStudy().then(setFields);
  }, []);

  // ── Error state ──
  if (error && !isLoading && results.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.searchContainer}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Something went wrong"
          message={error}
          action={
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchResults({ ...filters, search })}>
              <Text style={styles.retryBtnText}>Try Again</Text>
            </TouchableOpacity>
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <SearchBar value={search} onChangeText={setSearch} />
        <TouchableOpacity style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]} onPress={openFilterModal}>
          <Ionicons name="options-outline" size={iconSize.md} color={activeFilterCount > 0 ? colors.textInverse : colors.primary} />
          {activeFilterCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={cat.label}
            selected={filters.category === cat.key}
            onPress={() => setFilters((f) => ({ ...f, category: cat.key }))}
          />
        ))}
      </ScrollView>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.resultCount}>{results.length} opportunities</Text>
        )}
        <View style={styles.sortOptions}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.sortChip, filters.sortBy === opt.key && styles.sortChipActive]}
              onPress={() => setFilters((f) => ({ ...f, sortBy: opt.key }))}
            >
              <Text style={[styles.sortChipText, filters.sortBy === opt.key && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OpportunityCard opportunity={item} onPress={handleOpportunityPress} />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="search-outline"
              title="No results"
              message="Try adjusting your search or filters."
            />
          ) : null
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={iconSize.base} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category */}
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterChipRow}>
                {CATEGORIES.map((cat) => (
                  <CategoryChip
                    key={cat.key}
                    label={cat.label}
                    selected={tempFilters.category === cat.key}
                    onPress={() => setTempFilters((f) => ({ ...f, category: cat.key }))}
                  />
                ))}
              </View>

              {/* Education Level */}
              <Text style={styles.filterSectionTitle}>Education Level</Text>
              <View style={styles.filterChipRow}>
                {EDUCATION_LEVELS.map((ed) => (
                  <CategoryChip
                    key={ed.key}
                    label={ed.label}
                    selected={tempFilters.educationLevel === ed.key}
                    onPress={() => setTempFilters((f) => ({ ...f, educationLevel: ed.key }))}
                  />
                ))}
              </View>

              {/* Field of Study */}
              <Text style={styles.filterSectionTitle}>Field of Study</Text>
              <View style={styles.filterChipRow}>
                <CategoryChip label="Any" selected={tempFilters.fieldOfStudy === 'all'}
                  onPress={() => setTempFilters((f) => ({ ...f, fieldOfStudy: 'all' }))} />
                {fields.map((f) => (
                  <CategoryChip key={f} label={f} selected={tempFilters.fieldOfStudy === f}
                    onPress={() => setTempFilters((tf) => ({ ...tf, fieldOfStudy: f }))} />
                ))}
              </View>

              {/* Organization */}
              <Text style={styles.filterSectionTitle}>Organization</Text>
              <View style={styles.filterChipRow}>
                <CategoryChip label="Any" selected={tempFilters.organization === 'all'}
                  onPress={() => setTempFilters((f) => ({ ...f, organization: 'all' }))} />
                {organizations.map((o) => (
                  <CategoryChip key={o} label={o} selected={tempFilters.organization === o}
                    onPress={() => setTempFilters((tf) => ({ ...tf, organization: o }))} />
                ))}
              </View>

              {/* Location Type */}
              <Text style={styles.filterSectionTitle}>Location</Text>
              <TouchableOpacity
                style={[styles.toggleRow, tempFilters.isRemote === true && styles.toggleRowActive]}
                onPress={() => setTempFilters((f) => ({ ...f, isRemote: f.isRemote === true ? null : true }))}
              >
                <Ionicons
                  name={tempFilters.isRemote === true ? 'checkmark-circle' : 'ellipse-outline'}
                  size={iconSize.md} color={tempFilters.isRemote === true ? colors.primary : colors.textTertiary}
                />
                <Text style={styles.toggleText}>Remote only</Text>
              </TouchableOpacity>

              {/* Paid/Unpaid */}
              <Text style={styles.filterSectionTitle}>Compensation</Text>
              <TouchableOpacity
                style={[styles.toggleRow, tempFilters.isPaid === true && styles.toggleRowActive]}
                onPress={() => setTempFilters((f) => ({ ...f, isPaid: f.isPaid === true ? null : true }))}
              >
                <Ionicons
                  name={tempFilters.isPaid === true ? 'checkmark-circle' : 'ellipse-outline'}
                  size={iconSize.md} color={tempFilters.isPaid === true ? colors.primary : colors.textTertiary}
                />
                <Text style={styles.toggleText}>Paid/Stipend only</Text>
              </TouchableOpacity>

              {/* Deadline Range */}
              <Text style={styles.filterSectionTitle}>Deadline</Text>
              <View style={styles.filterChipRow}>
                {DEADLINE_OPTIONS.map((opt) => (
                  <CategoryChip key={opt.key} label={opt.label}
                    selected={tempFilters.deadlineRange === opt.key}
                    onPress={() => setTempFilters((f) => ({ ...f, deadlineRange: opt.key }))} />
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                <Text style={styles.applyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm, gap: spacing.sm,
  },
  filterBtn: {
    width: 44, height: 44, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  badge: {
    position: 'absolute', top: -4, right: -4,
    width: 18, height: 18, borderRadius: 9, backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, color: colors.textInverse, fontWeight: fontWeight.bold },
  chipRow: { paddingHorizontal: spacing.base, paddingBottom: spacing.sm },
  sortBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  resultCount: { fontSize: fontSize.sm, color: colors.textTertiary },
  sortOptions: { flexDirection: 'row', gap: spacing.xs },
  sortChip: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm, backgroundColor: colors.surface,
  },
  sortChipActive: { backgroundColor: colors.primary },
  sortChipText: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  sortChipTextActive: { color: colors.textInverse },
  listContent: { paddingBottom: spacing.xxl },
  retryBtn: {
    backgroundColor: colors.primary, paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl, borderRadius: borderRadius.lg,
  },
  retryBtnText: { color: colors.textInverse, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl, padding: spacing.xl, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  filterSectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surfaceAlt, marginBottom: spacing.sm,
  },
  toggleRowActive: { backgroundColor: '#FAF5F1' },
  toggleText: { fontSize: fontSize.base, color: colors.text },
  modalFooter: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  clearBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  clearBtnText: { fontSize: fontSize.base, color: colors.textSecondary, fontWeight: fontWeight.medium },
  applyBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.primary, alignItems: 'center' },
  applyBtnText: { fontSize: fontSize.base, color: colors.textInverse, fontWeight: fontWeight.semibold },
});
