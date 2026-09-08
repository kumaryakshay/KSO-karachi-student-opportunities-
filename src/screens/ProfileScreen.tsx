/**
 * KSO Profile Screen
 *
 * Shows user profile information.
 * Notifications are mandatory for registered users.
 *
 * Phase 8:
 * - Resume upload
 * - AI resume matching
 * - Mandatory notifications
 * - Reliable sign out
 */

import React, {
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

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

import { ProfileHeader } from '../components/ProfileHeader';
import { PrimaryButton } from '../components/PrimaryButton';

import { useAuth } from '../context/AuthContext';

import * as preferencesService from '../services/preferencesService';
import * as aiService from '../services/aiService';

type IoniconsName =
  React.ComponentProps<
    typeof Ionicons
  >['name'];

interface ProfileScreenProps {
  navigation?: any;
}

interface SettingsItem {
  icon: IoniconsName;
  label: string;
  onPress?: () => void;
  mandatory?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

export default function ProfileScreen({
  navigation,
}: ProfileScreenProps) {
  const {
    user,
    logout,
  } = useAuth();

  const [
    prefs,
    setPrefs,
  ] = useState<
    preferencesService.UserPreferences | null
  >(null);

  const [
    resumePath,
    setResumePath,
  ] = useState<string | null>(null);

  const [
    isUploading,
    setIsUploading,
  ] = useState(false);

  const [
    isMatching,
    setIsMatching,
  ] = useState(false);

  const [
    isSigningOut,
    setIsSigningOut,
  ] = useState(false);

  // ─────────────────────────────────────────────
  // LOAD PROFILE DATA
  // ─────────────────────────────────────────────

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const [
          preferences,
          resume,
        ] = await Promise.all([
          preferencesService.getPreferences(),
          aiService.getResumePath(),
        ]);

        if (!mounted) return;

        setPrefs(preferences);
        setResumePath(resume);
      } catch (error) {
        console.error(
          'Failed to load profile:',
          error
        );
      }
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, [user]);

  // ─────────────────────────────────────────────
  // USER
  // ─────────────────────────────────────────────

  const isGuest =
    !user || user.isGuest;

  const displayName = isGuest
    ? 'Guest User'
    : user.email?.split('@')[0] ||
      'User';

  const displayEmail = isGuest
    ? 'Sign in to access your profile'
    : user.email || '';

  // ─────────────────────────────────────────────
  // RESUME UPLOAD
  // ─────────────────────────────────────────────

  const handleUploadResume =
    async () => {
      if (isGuest) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to upload your resume.'
        );

        return;
      }

      try {
        const result =
          await DocumentPicker.getDocumentAsync(
            {
              type: 'application/pdf',
              copyToCacheDirectory: true,
              multiple: false,
            }
          );

        if (
          result.canceled ||
          !result.assets?.[0]
        ) {
          return;
        }

        const asset =
          result.assets[0];

        if (
          !asset.mimeType?.includes(
            'pdf'
          )
        ) {
          Alert.alert(
            'Invalid File',
            'Please select a PDF file.'
          );

          return;
        }

        setIsUploading(true);

        const path =
          await aiService.uploadResume(
            user.id,
            asset.uri,
            asset.name ||
              'resume.pdf'
          );

        setResumePath(path);

        Alert.alert(
          'Success',
          'Your resume has been uploaded successfully.'
        );
      } catch (err: any) {
        Alert.alert(
          'Upload Failed',
          err?.message ||
            'Something went wrong.'
        );
      } finally {
        setIsUploading(false);
      }
    };

  // ─────────────────────────────────────────────
  // AI MATCHING
  // ─────────────────────────────────────────────

  const handleAIMatch =
    async () => {
      if (isGuest) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to use AI resume matching.'
        );

        return;
      }

      if (!resumePath) {
        Alert.alert(
          'No Resume',
          'Please upload your resume first.'
        );

        return;
      }

      setIsMatching(true);

      try {
        const result =
          await aiService.matchResume();

        navigation?.navigate(
          'MatchingResults',
          { result }
        );
      } catch (err: any) {
        Alert.alert(
          'AI Matching Failed',
          err?.message ||
            'Something went wrong. Please try again.'
        );
      } finally {
        setIsMatching(false);
      }
    };

  // ─────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────

  const handleNotifications =
    () => {
      if (isGuest) {
        Alert.alert(
          'Sign In Required',
          'Please sign in to receive personalized notifications.'
        );

        return;
      }

      navigation?.navigate(
        'Notifications'
      );
    };

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const handleLogout = () => {
    if (isSigningOut) {
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',

          onPress: async () => {
            if (isSigningOut) {
              return;
            }

            try {
              setIsSigningOut(true);

              console.log(
                'Starting sign out...'
              );

              await logout();

              console.log(
                'Sign out completed.'
              );

              /*
               * RootNavigator listens to the auth
               * state and will move the user out
               * of the authenticated area.
               */
            } catch (error: any) {
              console.error(
                'Sign out error:',
                error
              );

              Alert.alert(
                'Sign Out Failed',
                error?.message ||
                  'Could not sign out. Please try again.'
              );
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // SETTINGS
  // ─────────────────────────────────────────────

  const SETTINGS_SECTIONS:
    SettingsSection[] = [
      {
        title: 'Account',

        items: [
          {
            icon: 'school-outline',
            label: 'Education Level',
          },

          {
            icon: 'book-outline',
            label: 'Field of Study',
          },

          {
            icon: 'heart-outline',
            label: 'Interests',
          },

          {
            icon: 'stats-chart-outline',
            label: 'GPA',
          },
        ],
      },

      {
        title: 'Preferences',

        items: [
          {
            icon:
              'notifications-outline',
            label: 'Notifications',
            onPress:
              handleNotifications,
            mandatory: true,
          },

          {
            icon: 'moon-outline',
            label: 'Dark Mode',
          },

          {
            icon:
              'language-outline',
            label: 'Language',
          },
        ],
      },

      {
        title: 'About',

        items: [
          {
            icon:
              'information-circle-outline',
            label: 'About KSO',
          },

          {
            icon:
              'shield-outline',
            label: 'Privacy Policy',
          },

          {
            icon:
              'document-outline',
            label: 'Terms of Service',
          },
        ],
      },
    ];

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        {/* PROFILE HEADER */}

        <ProfileHeader
          name={displayName}
          email={displayEmail}
        />

        {/* PROFILE INFORMATION */}

        <View
          style={
            styles.infoCardsRow
          }
        >
          <View
            style={styles.infoCard}
          >
            <Ionicons
              name="school-outline"
              size={iconSize.md}
              color={colors.primary}
            />

            <Text
              style={styles.infoLabel}
            >
              Education
            </Text>

            <Text
              style={styles.infoValue}
            >
              {prefs?.educationLevel ||
                'Not set'}
            </Text>
          </View>

          <View
            style={styles.infoCard}
          >
            <Ionicons
              name="book-outline"
              size={iconSize.md}
              color={colors.primary}
            />

            <Text
              style={styles.infoLabel}
            >
              Field
            </Text>

            <Text
              style={styles.infoValue}
            >
              {prefs?.fieldOfStudy ||
                'Not set'}
            </Text>
          </View>

          <View
            style={styles.infoCard}
          >
            <Ionicons
              name="heart-outline"
              size={iconSize.md}
              color={colors.primary}
            />

            <Text
              style={styles.infoLabel}
            >
              Interests
            </Text>

            <Text
              style={styles.infoValue}
            >
              {prefs?.interests?.length
                ? `${prefs.interests.length} selected`
                : 'Not set'}
            </Text>
          </View>
        </View>

        {/* AI RESUME MATCHING */}

        <View
          style={styles.aiSection}
        >
          <Text
            style={styles.sectionTitle}
          >
            AI Resume Matching
          </Text>

          <TouchableOpacity
            style={styles.resumeRow}
            onPress={
              handleUploadResume
            }
            activeOpacity={0.7}
            disabled={
              isUploading ||
              isSigningOut
            }
          >
            <View
              style={
                styles.resumeIcon
              }
            >
              <Ionicons
                name="document-text-outline"
                size={iconSize.md}
                color={
                  colors.primary
                }
              />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text
                style={
                  styles.resumeLabel
                }
              >
                {isUploading
                  ? 'Uploading...'
                  : resumePath
                    ? 'Replace Resume'
                    : 'Upload Resume (PDF)'}
              </Text>

              {resumePath &&
                !isUploading && (
                  <Text
                    style={
                      styles.resumeSubtext
                    }
                    numberOfLines={1}
                  >
                    {resumePath
                      .split('/')
                      .pop()}
                  </Text>
                )}
            </View>

            {isUploading ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.primary
                }
              />
            ) : (
              <Ionicons
                name="cloud-upload-outline"
                size={iconSize.base}
                color={
                  colors.textSecondary
                }
              />
            )}
          </TouchableOpacity>

          <View
            style={{
              marginTop:
                spacing.md,
            }}
          >
            <PrimaryButton
              title={
                isMatching
                  ? 'Analyzing Resume...'
                  : 'Match Me with AI'
              }
              onPress={
                handleAIMatch
              }
              loading={
                isMatching
              }
              disabled={
                isGuest ||
                !resumePath ||
                isMatching ||
                isSigningOut
              }
            />
          </View>

          {!resumePath &&
            !isGuest && (
              <Text
                style={
                  styles.aiHint
                }
              >
                Upload your resume above
                to unlock AI matching.
              </Text>
            )}
        </View>

        {/* SETTINGS */}

        {SETTINGS_SECTIONS.map(
          (section) => (
            <View
              key={section.title}
              style={
                styles.settingsSection
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                {section.title}
              </Text>

              {section.items.map(
                (item) => (
                  <TouchableOpacity
                    key={
                      item.label
                    }
                    style={
                      styles.settingsRow
                    }
                    onPress={
                      item.onPress
                    }
                    disabled={
                      isSigningOut
                    }
                    activeOpacity={
                      item.onPress
                        ? 0.6
                        : 1
                    }
                  >
                    <View
                      style={
                        styles.settingsIcon
                      }
                    >
                      <Ionicons
                        name={
                          item.icon
                        }
                        size={
                          iconSize.md
                        }
                        color={
                          item.mandatory
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                    </View>

                    <Text
                      style={
                        styles.settingsLabel
                      }
                    >
                      {item.label}
                    </Text>

                    {item.mandatory ? (
                      <View
                        style={
                          styles.requiredBadge
                        }
                      >
                        <Text
                          style={
                            styles.requiredBadgeText
                        }
                      >
                        Required
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={
                          colors.textTertiary
                        }
                      />
                    )}
                  </TouchableOpacity>
                )
              )}
            </View>
          )
        )}

        {/* AUTH BUTTON */}

        {isGuest ? (
          <TouchableOpacity
            style={
              styles.signInBtn
            }
            onPress={() =>
              navigation?.navigate(
                'Auth',
                {
                  mode: 'login',
                }
              )
            }
            disabled={
              isSigningOut
            }
          >
            <Ionicons
              name="log-in-outline"
              size={iconSize.md}
              color={
                colors.primary
              }
            />

            <Text
              style={
                styles.signInText
              }
            >
              Sign In / Create Account
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.signOutBtn,
              isSigningOut &&
                styles.signOutBtnDisabled,
            ]}
            onPress={
              handleLogout
            }
            disabled={
              isSigningOut
            }
            activeOpacity={0.7}
          >
            {isSigningOut ? (
              <ActivityIndicator
                size="small"
                color={
                  colors.error
                }
              />
            ) : (
              <Ionicons
                name="log-out-outline"
                size={iconSize.md}
                color={
                  colors.error
                }
              />
            )}

            <Text
              style={
                styles.signOutText
              }
            >
              {isSigningOut
                ? 'Signing Out...'
                : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        )}

        {/* VERSION */}

        <Text
          style={styles.version}
        >
          KSO v1.0.0 — Phase 8
        </Text>

        <View
          style={{
            height:
              spacing.xxl,
          }}
        />
      </ScrollView>
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

    content: {
      paddingBottom:
        spacing.xxl,
    },

    infoCardsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal:
        spacing.base,
      marginTop:
        spacing.base,
    },

    infoCard: {
      flex: 1,
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.md,
      padding:
        spacing.md,
      alignItems: 'center',
      borderWidth: 1,
      borderColor:
        colors.divider,
    },

    infoLabel: {
      fontSize:
        fontSize.xs,
      color:
        colors.textTertiary,
      marginTop:
        spacing.xs,
    },

    infoValue: {
      fontSize:
        fontSize.sm,
      color:
        colors.textSecondary,
      fontWeight:
        fontWeight.medium,
      marginTop: 2,
      textAlign:
        'center',
    },

    aiSection: {
      marginTop:
        spacing.lg,
      paddingHorizontal:
        spacing.base,
    },

    resumeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surface,
      borderRadius:
        borderRadius.lg,
      padding:
        spacing.base,
      borderWidth: 1,
      borderColor:
        colors.divider,
      gap: spacing.md,
    },

    resumeIcon: {
      width: 40,
      height: 40,
      borderRadius:
        borderRadius.md,
      backgroundColor:
        '#FAF5F1',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    resumeLabel: {
      fontSize:
        fontSize.base,
      fontWeight:
        fontWeight.medium,
      color: colors.text,
    },

    resumeSubtext: {
      fontSize:
        fontSize.xs,
      color:
        colors.textTertiary,
      marginTop: 2,
    },

    aiHint: {
      fontSize:
        fontSize.sm,
      color:
        colors.textTertiary,
      textAlign:
        'center',
      marginTop:
        spacing.sm,
    },

    settingsSection: {
      marginTop:
        spacing.lg,
      paddingHorizontal:
        spacing.base,
    },

    sectionTitle: {
      fontSize:
        fontSize.sm,
      fontWeight:
        fontWeight.semibold,
      color:
        colors.textTertiary,
      textTransform:
        'uppercase',
      letterSpacing: 0.5,
      marginBottom:
        spacing.sm,
      marginLeft:
        spacing.xs,
    },

    settingsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor:
        colors.surface,
      padding:
        spacing.base,
      marginBottom: 1,
      borderRadius:
        borderRadius.md,
    },

    settingsIcon: {
      width: 32,
      height: 32,
      borderRadius:
        borderRadius.sm,
      backgroundColor:
        colors.surfaceAlt,
      alignItems: 'center',
      justifyContent:
        'center',
      marginRight:
        spacing.md,
    },

    settingsLabel: {
      flex: 1,
      fontSize:
        fontSize.base,
      color: colors.text,
    },

    requiredBadge: {
      paddingHorizontal:
        spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor:
        '#FAF5F1',
      borderWidth: 1,
      borderColor:
        colors.primary,
    },

    requiredBadgeText: {
      fontSize:
        fontSize.xs,
      color:
        colors.primary,
      fontWeight:
        fontWeight.semibold,
    },

    signInBtn: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: spacing.sm,
      marginTop:
        spacing.xl,
      marginHorizontal:
        spacing.base,
      padding:
        spacing.base,
      borderRadius:
        borderRadius.lg,
      backgroundColor:
        '#FAF5F1',
      borderWidth: 1,
      borderColor:
        colors.primary,
    },

    signInText: {
      fontSize:
        fontSize.base,
      fontWeight:
        fontWeight.semibold,
      color:
        colors.primary,
    },

    signOutBtn: {
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: spacing.sm,
      marginTop:
        spacing.xl,
      marginHorizontal:
        spacing.base,
      padding:
        spacing.base,
      borderRadius:
        borderRadius.lg,
      backgroundColor:
        '#FFF5F5',
      borderWidth: 1,
      borderColor:
        colors.error,
    },

    signOutBtnDisabled: {
      opacity: 0.6,
    },

    signOutText: {
      fontSize:
        fontSize.base,
      fontWeight:
        fontWeight.semibold,
      color:
        colors.error,
    },

    version: {
      textAlign:
        'center',
      fontSize:
        fontSize.xs,
      color:
        colors.textTertiary,
      marginTop:
        spacing.xl,
    },
  });