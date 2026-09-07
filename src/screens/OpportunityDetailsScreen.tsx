import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize, fontWeight } from '../theme/typography';
import { spacing, borderRadius, iconSize } from '../theme/spacing';
import { BookmarkButton } from '../components/BookmarkButton';
import { DeadlineBadge } from '../components/DeadlineBadge';
import { PrimaryButton } from '../components/PrimaryButton';
import { Opportunity } from '../types/opportunity';
import { isExpired, formatDate, getDeadlineLabel } from '../utils/deadline';

interface OpportunityDetailsScreenProps {
  route: {
    params: {
      opportunity: Opportunity;
    };
  };
  navigation: any;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <View style={styles.bullet} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function OpportunityDetailsScreen({ route, navigation }: OpportunityDetailsScreenProps) {
  const opp = route.params.opportunity;

  const expired = isExpired(opp.deadline);

  const handleApply = () => {
    if (opp.applicationUrl) {
      Linking.openURL(opp.applicationUrl).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Text style={styles.orgName}>{opp.organization}</Text>
              <Text style={styles.categoryBadge}>
                {opp.category.charAt(0).toUpperCase() + opp.category.slice(1)}
              </Text>
            </View>
            <BookmarkButton opportunityId={opp.id} size={iconSize.lg} />
          </View>
          <Text style={styles.title}>{opp.title}</Text>

          {/* Meta Row */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.textTertiary} />
              <Text style={styles.metaText}>{opp.isRemote ? 'Remote' : opp.location}</Text>
            </View>
            {opp.stipend && (
              <View style={styles.metaItem}>
                <Ionicons name="wallet-outline" size={16} color={colors.success} />
                <Text style={[styles.metaText, { color: colors.success }]}>{opp.stipend}</Text>
              </View>
            )}
          </View>

          {/* Deadline */}
          <View style={styles.deadlineContainer}>
            <DeadlineBadge deadline={opp.deadline} />
            {opp.deadline && (
              <Text style={styles.deadlineDate}>
                {formatDate(opp.deadline)}
              </Text>
            )}
          </View>

          {/* Expired banner */}
          {expired && (
            <View style={styles.expiredBanner}>
              <Ionicons name="warning" size={16} color={colors.error} />
              <Text style={styles.expiredText}>This opportunity's deadline has passed.</Text>
            </View>
          )}
        </View>

        {/* About */}
        <DetailSection title="About">
          <Text style={styles.bodyText}>{opp.description}</Text>
        </DetailSection>

        {/* Eligibility */}
        {opp.eligibility.length > 0 && (
          <DetailSection title="Eligibility">
            <BulletList items={opp.eligibility} />
          </DetailSection>
        )}

        {/* Requirements */}
        {opp.requirements.length > 0 && (
          <DetailSection title="Requirements">
            <BulletList items={opp.requirements} />
          </DetailSection>
        )}

        {/* Education & Field */}
        {(opp.educationLevel.length > 0 || opp.fieldOfStudy.length > 0) && (
          <DetailSection title="Education">
            {opp.educationLevel.length > 0 && (
              <View style={styles.chipRow}>
                {opp.educationLevel.map((ed) => (
                  <View key={ed} style={styles.infoChip}>
                    <Text style={styles.infoChipText}>
                      {ed.charAt(0).toUpperCase() + ed.slice(1)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {opp.fieldOfStudy.length > 0 && (
              <View style={styles.chipRow}>
                {opp.fieldOfStudy.map((f) => (
                  <View key={f} style={[styles.infoChip, styles.fieldChip]}>
                    <Text style={styles.fieldChipText}>{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </DetailSection>
        )}

        {/* How to Apply */}
        <DetailSection title="How to Apply">
          <Text style={styles.bodyText}>{opp.howToApply}</Text>
          {opp.requirements.length > 0 && (
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsTitle}>Steps:</Text>
              {opp.requirements.map((req, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{req}</Text>
                </View>
              ))}
            </View>
          )}
        </DetailSection>

        {/* Tags */}
        {opp.tags.length > 0 && (
          <DetailSection title="Tags">
            <View style={styles.tagRow}>
              {opp.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </DetailSection>
        )}

        {/* Source */}
        {opp.sourceUrl && (
          <TouchableOpacity style={styles.sourceRow} onPress={() => Linking.openURL(opp.sourceUrl!)}>
            <Ionicons name="link-outline" size={16} color={colors.info} />
            <Text style={styles.sourceText}>View original source</Text>
          </TouchableOpacity>
        )}

        {/* Bottom spacer for CTA */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Apply Button */}
      <View style={styles.ctaContainer}>
        <PrimaryButton
          title={expired ? 'Deadline Expired' : opp.applicationUrl ? 'Apply Now' : 'No Application Link'}
          onPress={handleApply}
          disabled={!opp.applicationUrl || expired}
        />
      </View>
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
  headerCard: {
    backgroundColor: colors.surface,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  orgName: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  categoryBadge: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  metaGrid: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  deadlineDate: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFEBEE',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  expiredText: {
    fontSize: fontSize.md,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  section: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    lineHeight: fontSize.base * 1.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoChip: {
    backgroundColor: '#FAF5F1',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  infoChipText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  fieldChip: {
    backgroundColor: colors.surfaceAlt,
  },
  fieldChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  stepsContainer: {
    marginTop: spacing.md,
  },
  stepsTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textInverse,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: fontSize.md * 1.5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
  },
  sourceText: {
    fontSize: fontSize.md,
    color: colors.info,
    textDecorationLine: 'underline',
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
