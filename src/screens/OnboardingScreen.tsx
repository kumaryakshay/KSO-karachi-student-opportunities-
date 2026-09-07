import React, { useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import {
  fontSize,
  fontWeight,
} from '../theme/typography';

import {
  spacing,
  borderRadius,
  iconSize,
} from '../theme/spacing';

import { PrimaryButton } from '../components/PrimaryButton';

// ─────────────────────────────────────────────────────────────
// OPTIONS
// ─────────────────────────────────────────────────────────────

const EDUCATION_LEVELS = [
  {
    key: 'matric',
    label: 'Matric / O-Levels',
    icon: 'school-outline',
  },
  {
    key: 'intermediate',
    label: 'Intermediate / A-Levels',
    icon: 'book-outline',
  },
  {
    key: 'undergraduate',
    label: 'Undergraduate',
    icon: 'library-outline',
  },
  {
    key: 'graduate',
    label: "Graduate (Bachelor's)",
    icon: 'ribbon-outline',
  },
  {
    key: 'postgraduate',
    label: 'Postgraduate',
    icon: 'school',
  },
];

const FIELDS = [
  {
    key: 'cs',
    label: 'Computer Science / IT',
    icon: 'laptop-outline',
  },
  {
    key: 'engineering',
    label: 'Engineering',
    icon: 'construct-outline',
  },
  {
    key: 'business',
    label: 'Business / Commerce',
    icon: 'briefcase-outline',
  },
  {
    key: 'medicine',
    label: 'Medicine / Health',
    icon: 'medkit-outline',
  },
  {
    key: 'social',
    label: 'Social Sciences',
    icon: 'people-outline',
  },
  {
    key: 'arts',
    label: 'Arts / Design',
    icon: 'color-palette-outline',
  },
  {
    key: 'other',
    label: 'Other',
    icon: 'apps-outline',
  },
];

const INTERESTS = [
  {
    key: 'scholarship',
    label: 'Scholarships',
  },
  {
    key: 'internship',
    label: 'Internships',
  },
  {
    key: 'course',
    label: 'Courses',
  },
  {
    key: 'job',
    label: 'Jobs',
  },
  {
    key: 'fellowship',
    label: 'Fellowships',
  },
  {
    key: 'competition',
    label: 'Competitions',
  },
  {
    key: 'volunteer',
    label: 'Volunteering',
  },
];

const LOCATIONS = [
  {
    key: 'karachi',
    label: 'Karachi',
    subtitle: 'Recommended',
    icon: 'location',
  },
  {
    key: 'lahore',
    label: 'Lahore',
    subtitle: '',
    icon: 'location-outline',
  },
  {
    key: 'islamabad',
    label: 'Islamabad / Rawalpindi',
    subtitle: '',
    icon: 'location-outline',
  },
  {
    key: 'other_pakistan',
    label: 'Other city in Pakistan',
    subtitle: '',
    icon: 'location-outline',
  },
  {
    key: 'online',
    label: 'Online / Remote',
    subtitle: '',
    icon: 'globe-outline',
  },
];

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────

interface OnboardingScreenProps {
  onComplete: (data: {
    education: string;
    field: string;
    interests: string[];
    location: string;
  }) => void;

  onSkip: () => void;
}

// ─────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────

export default function OnboardingScreen({
  onComplete,
  onSkip,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(0);

  const [education, setEducation] =
    useState('');

  const [field, setField] =
    useState('');

  const [interests, setInterests] =
    useState<string[]>([]);

  const [location, setLocation] =
    useState('');

  // ───────────────────────────────────────────────────────────
  // INTERESTS
  // ───────────────────────────────────────────────────────────

  const toggleInterest = (
    key: string
  ) => {
    setInterests((previous) =>
      previous.includes(key)
        ? previous.filter(
            (item) => item !== key
          )
        : [...previous, key]
    );
  };

  // ───────────────────────────────────────────────────────────
  // NEXT
  // ───────────────────────────────────────────────────────────

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Final step
    onComplete({
      education,
      field,
      interests,
      location,
    });
  };

  // ───────────────────────────────────────────────────────────
  // VALIDATION
  // ───────────────────────────────────────────────────────────

  const canProceed =
    (step === 0 &&
      education.length > 0) ||
    (step === 1 &&
      field.length > 0) ||
    (step === 2 &&
      interests.length > 0) ||
    (step === 3 &&
      location.length > 0);

  // ───────────────────────────────────────────────────────────
  // SCREEN
  // ───────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Text style={styles.skipText}>
            Skip
          </Text>
        </TouchableOpacity>

        <View style={styles.progressRow}>
          {[0, 1, 2, 3].map(
            (s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step &&
                    styles.progressDotActive,
                ]}
              />
            )
          )}
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ─────────────────────────────────────────
            STEP 0 — EDUCATION
        ───────────────────────────────────────── */}

        {step === 0 && (
          <>
            <Text
              style={styles.stepTitle}
            >
              What's your education level?
            </Text>

            <Text
              style={styles.stepSubtitle}
            >
              This helps us find opportunities
              suitable for you.
            </Text>

            {EDUCATION_LEVELS.map(
              (item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionRow,
                    education ===
                      item.key &&
                      styles.optionRowActive,
                  ]}
                  onPress={() =>
                    setEducation(
                      item.key
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      item.icon as any
                    }
                    size={
                      iconSize.base
                    }
                    color={
                      education ===
                      item.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.optionText,
                      education ===
                        item.key &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {education ===
                    item.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={
                        iconSize.md
                      }
                      color={
                        colors.primary
                      }
                    />
                  )}
                </TouchableOpacity>
              )
            )}
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 1 — FIELD
        ───────────────────────────────────────── */}

        {step === 1 && (
          <>
            <Text
              style={styles.stepTitle}
            >
              What's your field of study?
            </Text>

            <Text
              style={styles.stepSubtitle}
            >
              We'll prioritize opportunities
              relevant to your field.
            </Text>

            {FIELDS.map(
              (item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionRow,
                    field === item.key &&
                      styles.optionRowActive,
                  ]}
                  onPress={() =>
                    setField(
                      item.key
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      item.icon as any
                    }
                    size={
                      iconSize.base
                    }
                    color={
                      field === item.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />

                  <Text
                    style={[
                      styles.optionText,
                      field ===
                        item.key &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {field ===
                    item.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={
                        iconSize.md
                      }
                      color={
                        colors.primary
                      }
                    />
                  )}
                </TouchableOpacity>
              )
            )}
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 2 — INTERESTS
        ───────────────────────────────────────── */}

        {step === 2 && (
          <>
            <Text
              style={styles.stepTitle}
            >
              What are you interested in?
            </Text>

            <Text
              style={styles.stepSubtitle}
            >
              Select all that apply.
              These help us personalize
              your opportunities.
            </Text>

            <View
              style={
                styles.interestGrid
              }
            >
              {INTERESTS.map(
                (item) => {
                  const selected =
                    interests.includes(
                      item.key
                    );

                  return (
                    <TouchableOpacity
                      key={
                        item.key
                      }
                      style={[
                        styles.interestChip,
                        selected &&
                          styles.interestChipActive,
                      ]}
                      onPress={() =>
                        toggleInterest(
                          item.key
                        )
                      }
                      activeOpacity={
                        0.7
                      }
                    >
                      <Text
                        style={[
                          styles.interestText,
                          selected &&
                            styles.interestTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                }
              )}
            </View>
          </>
        )}

        {/* ─────────────────────────────────────────
            STEP 3 — LOCATION
        ───────────────────────────────────────── */}

        {step === 3 && (
          <>
            <Text
              style={styles.stepTitle}
            >
              Where are you located?
            </Text>

            <Text
              style={styles.stepSubtitle}
            >
              We'll use your location to
              show you the most relevant
              opportunities and notifications.
            </Text>

            {LOCATIONS.map(
              (item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.optionRow,
                    location ===
                      item.key &&
                      styles.optionRowActive,
                  ]}
                  onPress={() =>
                    setLocation(
                      item.key
                    )
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      item.icon as any
                    }
                    size={
                      iconSize.base
                    }
                    color={
                      location ===
                      item.key
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />

                  <View
                    style={
                      styles.locationTextContainer
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        location ===
                          item.key &&
                          styles.optionTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {item.subtitle ? (
                      <Text
                        style={
                          styles.locationRecommended
                        }
                      >
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {location ===
                    item.key && (
                    <Ionicons
                      name="checkmark-circle"
                      size={
                        iconSize.md
                      }
                      color={
                        colors.primary
                      }
                    />
                  )}
                </TouchableOpacity>
              )
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom button */}

      <View
        style={styles.footer}
      >
        <PrimaryButton
          title={
            step === 3
              ? 'Get Started'
              : 'Continue'
          }
          onPress={
            handleNext
          }
          disabled={
            !canProceed
          }
        />
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        colors.background,
    },

    header: {
      flexDirection:
        'row',
      justifyContent:
        'space-between',
      alignItems:
        'center',
      paddingHorizontal:
        spacing.base,
      paddingVertical:
        spacing.md,
    },

    skipText: {
      fontSize:
        fontSize.md,
      color:
        colors.textSecondary,
      width: 40,
    },

    progressRow: {
      flexDirection:
        'row',
      gap: spacing.sm,
    },

    progressDot: {
      width: 24,
      height: 4,
      borderRadius: 2,
      backgroundColor:
        colors.border,
    },

    progressDotActive: {
      backgroundColor:
        colors.primary,
    },

    content: {
      flexGrow: 1,
      paddingHorizontal:
        spacing.xl,
      paddingTop:
        spacing.lg,
      paddingBottom:
        spacing.xl,
    },

    stepTitle: {
      fontSize:
        fontSize.xxl,
      fontWeight:
        fontWeight.bold,
      color:
        colors.text,
      marginBottom:
        spacing.sm,
    },

    stepSubtitle: {
      fontSize:
        fontSize.base,
      color:
        colors.textSecondary,
      marginBottom:
        spacing.xl,
      lineHeight:
        fontSize.base *
        1.5,
    },

    optionRow: {
      flexDirection:
        'row',
      alignItems:
        'center',
      backgroundColor:
        colors.surface,
      padding:
        spacing.base,
      borderRadius:
        borderRadius.lg,
      marginBottom:
        spacing.sm,
      borderWidth: 1,
      borderColor:
        colors.divider,
      gap: spacing.md,
    },

    optionRowActive: {
      borderColor:
        colors.primary,
      backgroundColor:
        '#FAF5F1',
    },

    optionText: {
      flex: 1,
      fontSize:
        fontSize.base,
      color:
        colors.text,
    },

    optionTextActive: {
      fontWeight:
        fontWeight.medium,
      color:
        colors.primary,
    },

    locationTextContainer: {
      flex: 1,
    },

    locationRecommended: {
      fontSize:
        fontSize.xs,
      color:
        colors.primary,
      marginTop: 2,
      fontWeight:
        fontWeight.medium,
    },

    interestGrid: {
      flexDirection:
        'row',
      flexWrap:
        'wrap',
      gap: spacing.sm,
    },

    interestChip: {
      paddingHorizontal:
        spacing.lg,
      paddingVertical:
        spacing.md,
      borderRadius:
        borderRadius.full,
      backgroundColor:
        colors.surface,
      borderWidth: 1,
      borderColor:
        colors.border,
      minWidth: '30%',
      alignItems:
        'center',
    },

    interestChipActive: {
      backgroundColor:
        colors.primary,
      borderColor:
        colors.primary,
    },

    interestText: {
      fontSize:
        fontSize.md,
      color:
        colors.textSecondary,
      fontWeight:
        fontWeight.medium,
    },

    interestTextActive: {
      color:
        colors.textInverse,
    },

    footer: {
      padding:
        spacing.xl,
      paddingTop:
        spacing.base,
      backgroundColor:
        colors.background,
    },
  });