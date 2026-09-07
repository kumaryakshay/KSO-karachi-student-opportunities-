/**
 * KSO — Premium Welcome Experience
 *
 * Premium visual direction:
 * Midnight Navy + Champagne Gold + Electric Teal + Ivory
 *
 * Features:
 * - High contrast premium palette
 * - Glass-inspired cards
 * - Layered product preview
 * - AI match visualization
 * - Floating animated cards
 * - Responsive desktop/mobile layout
 * - Fully clickable action cards
 * - Press animations
 * - Existing navigation preserved
 */

import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';

import {
  Animated,
  Easing,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';

/* ========================================================================= */
/* PREMIUM COLOR SYSTEM                                                      */
/* ========================================================================= */

const PREMIUM = {
  midnight: '#0B1324',
  navy: '#111D33',
  navySoft: '#18243D',

  champagne: '#C9A875',
  champagneLight: '#E7D5B8',
  champagneSoft: '#F3E9D9',

  teal: '#22C7B8',
  tealDark: '#159E93',
  tealSoft: '#DDF8F5',

  coral: '#FF806B',
  coralSoft: '#FFE5E0',

  ivory: '#F7F4EE',
  white: '#FFFFFF',

  slate: '#667085',
  slateLight: '#98A2B3',
  text: '#162033',
  textSoft: '#475467',

  line: '#E5E0D7',
  whiteLine: 'rgba(255,255,255,0.13)',
};

/* ========================================================================= */
/* TYPES                                                                     */
/* ========================================================================= */

interface WelcomeScreenProps {
  navigation: any;
}

type IconName =
  React.ComponentProps<typeof Ionicons>['name'];

interface Insight {
  icon: IconName;
  title: string;
  subtitle: string;
  accent: string;
  score?: string;
}

/* ========================================================================= */
/* DATA                                                                      */
/* ========================================================================= */

const INSIGHTS: Insight[] = [
  {
    icon: 'school-outline',
    title: 'Scholarships',
    subtitle: '12 new matches',
    accent: PREMIUM.champagne,
    score: '94%',
  },
  {
    icon: 'briefcase-outline',
    title: 'Internships',
    subtitle: '8 strong matches',
    accent: PREMIUM.teal,
    score: '89%',
  },
  {
    icon: 'rocket-outline',
    title: 'Career Growth',
    subtitle: 'Personalized paths',
    accent: PREMIUM.coral,
  },
];

/* ========================================================================= */
/* MAIN COMPONENT                                                            */
/* ========================================================================= */

export default function WelcomeScreen({
  navigation,
}: WelcomeScreenProps) {
  const { enterGuest } = useAuth();

  const { width } = useWindowDimensions();

  const isWide = width >= 850;

  /* ----------------------------------------------------------------------- */
  /* Animation values                                                         */
  /* ----------------------------------------------------------------------- */

  const screenOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const heroY = useRef(
    new Animated.Value(30)
  ).current;

  const heroScale = useRef(
    new Animated.Value(0.97)
  ).current;

  const previewY = useRef(
    new Animated.Value(45)
  ).current;

  const contentY = useRef(
    new Animated.Value(45)
  ).current;

  const actionY = useRef(
    new Animated.Value(45)
  ).current;

  const logoScale = useRef(
    new Animated.Value(0.72)
  ).current;

  const logoPulse = useRef(
    new Animated.Value(1)
  ).current;

  const orbOne = useRef(
    new Animated.Value(1)
  ).current;

  const orbTwo = useRef(
    new Animated.Value(1)
  ).current;

  const floatingOne = useRef(
    new Animated.Value(0)
  ).current;

  const floatingTwo = useRef(
    new Animated.Value(0)
  ).current;

  /* ----------------------------------------------------------------------- */
  /* Entrance animations                                                      */
  /* ----------------------------------------------------------------------- */

  useEffect(() => {
    const entrance =
      Animated.parallel([
        Animated.timing(
          screenOpacity,
          {
            toValue: 1,
            duration: 800,
            easing: Easing.out(
              Easing.cubic
            ),
            useNativeDriver: true,
          }
        ),

        Animated.spring(heroY, {
          toValue: 0,
          damping: 17,
          stiffness: 105,
          useNativeDriver: true,
        }),

        Animated.spring(heroScale, {
          toValue: 1,
          damping: 17,
          stiffness: 110,
          useNativeDriver: true,
        }),

        Animated.spring(logoScale, {
          toValue: 1,
          damping: 11,
          stiffness: 145,
          useNativeDriver: true,
        }),

        Animated.spring(previewY, {
          toValue: 0,
          delay: 120,
          damping: 16,
          stiffness: 95,
          useNativeDriver: true,
        }),

        Animated.spring(contentY, {
          toValue: 0,
          delay: 180,
          damping: 16,
          stiffness: 95,
          useNativeDriver: true,
        }),

        Animated.spring(actionY, {
          toValue: 0,
          delay: 260,
          damping: 16,
          stiffness: 95,
          useNativeDriver: true,
        }),
      ]);

    entrance.start();

    const logoAnimation =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            logoPulse,
            {
              toValue: 1.045,
              duration: 1800,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            logoPulse,
            {
              toValue: 1,
              duration: 1800,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    const orbAnimationOne =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            orbOne,
            {
              toValue: 1.08,
              duration: 3000,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            orbOne,
            {
              toValue: 0.93,
              duration: 3000,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    const orbAnimationTwo =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            orbTwo,
            {
              toValue: 1.1,
              duration: 3600,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            orbTwo,
            {
              toValue: 0.91,
              duration: 3600,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    const floatingAnimationOne =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            floatingOne,
            {
              toValue: -7,
              duration: 2100,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            floatingOne,
            {
              toValue: 0,
              duration: 2100,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    const floatingAnimationTwo =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            floatingTwo,
            {
              toValue: 7,
              duration: 2500,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            floatingTwo,
            {
              toValue: 0,
              duration: 2500,
              easing:
                Easing.inOut(
                  Easing.ease
                ),
              useNativeDriver: true,
            }
          ),
        ])
      );

    logoAnimation.start();
    orbAnimationOne.start();
    orbAnimationTwo.start();
    floatingAnimationOne.start();
    floatingAnimationTwo.start();

    return () => {
      entrance.stop();

      logoAnimation.stop();
      orbAnimationOne.stop();
      orbAnimationTwo.stop();
      floatingAnimationOne.stop();
      floatingAnimationTwo.stop();
    };
  }, [
    screenOpacity,
    heroY,
    heroScale,
    previewY,
    contentY,
    actionY,
    logoScale,
    logoPulse,
    orbOne,
    orbTwo,
    floatingOne,
    floatingTwo,
  ]);

  /* ----------------------------------------------------------------------- */
  /* Navigation                                                               */
  /* ----------------------------------------------------------------------- */

  const handleGetStarted =
    useCallback(() => {
      navigation.navigate(
        'Onboarding'
      );
    }, [navigation]);

  const handleSignIn =
    useCallback(() => {
      navigation.navigate(
        'Auth',
        {
          mode: 'login',
        }
      );
    }, [navigation]);

  const handleSignUp =
    useCallback(() => {
      navigation.navigate(
        'Auth',
        {
          mode: 'signup',
        }
      );
    }, [navigation]);

  const handleGuest =
    useCallback(async () => {
      try {
        await enterGuest();
      } catch (error) {
        console.error(
          'Failed to enter guest mode:',
          error
        );
      }
    }, [enterGuest]);

  /* ----------------------------------------------------------------------- */
  /* UI                                                                       */
  /* ----------------------------------------------------------------------- */

  return (
    <SafeAreaView
      style={styles.safe}
    >
      {/* ================================================================= */}
      {/* Decorative background                                             */}
      {/* ================================================================= */}

      <View
        pointerEvents="none"
        style={
          StyleSheet.absoluteFill
        }
      >
        <Animated.View
          style={[
            styles.orb,
            styles.orbGold,
            {
              transform: [
                {
                  scale: orbOne,
                },
              ],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.orb,
            styles.orbTeal,
            {
              transform: [
                {
                  scale: orbTwo,
                },
              ],
            },
          ]}
        />

        <View
          style={
            styles.gridVerticalLeft
          }
        />

        <View
          style={
            styles.gridVerticalRight
          }
        />

        <View
          style={
            styles.gridHorizontalTop
          }
        />

        <View
          style={
            styles.gridHorizontalBottom
          }
        />
      </View>

      <Animated.View
        style={[
          styles.screen,
          {
            opacity:
              screenOpacity,
          },
        ]}
      >
        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          bounces={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          <View
            style={[
              styles.container,
              isWide &&
                styles.containerWide,
            ]}
          >
            {/* =========================================================== */}
            {/* Top Bar                                                      */}
            {/* =========================================================== */}

            <View
              style={styles.topBar}
            >
              <View
                style={styles.brand}
              >
                <View
                  style={
                    styles.brandIcon
                  }
                >
                  <Ionicons
                    name="compass-outline"
                    size={16}
                    color={
                      PREMIUM.white
                    }
                  />
                </View>

                <Text
                  style={styles.brandText}
                >
                  KSO
                </Text>

                <View
                  style={
                    styles.brandDivider
                  }
                />

                <Text
                  style={
                    styles.brandCaption
                  }
                >
                  KNOWLEDGE
                </Text>
              </View>

              <View
                style={styles.futurePill}
              >
                <View
                  style={
                    styles.futureDot
                  }
                />

                <Text
                  style={
                    styles.futureText
                  }
                >
                  BUILT FOR YOUR FUTURE
                </Text>
              </View>
            </View>

            {/* =========================================================== */}
            {/* Hero                                                          */}
            {/* =========================================================== */}

            <Animated.View
              style={[
                styles.hero,
                isWide &&
                  styles.heroWide,
                {
                  transform: [
                    {
                      translateY:
                        heroY,
                    },
                    {
                      scale:
                        heroScale,
                    },
                  ],
                },
              ]}
            >
              {/* Hero Copy */}
              <View
                style={[
                  styles.heroCopy,
                  isWide &&
                    styles.heroCopyWide,
                ]}
              >
                <View
                  style={
                    styles.heroLogoArea
                  }
                >
                  <Animated.View
                    style={[
                      styles.logoGlow,
                      {
                        transform: [
                          {
                            scale:
                              logoPulse,
                          },
                        ],
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.logoOuter,
                      {
                        transform: [
                          {
                            scale:
                              logoScale,
                          },
                        ],
                      },
                    ]}
                  >
                    <View
                      style={
                        styles.logoInner
                      }
                    >
                      <Ionicons
                        name="compass-outline"
                        size={42}
                        color={
                          PREMIUM.white
                        }
                      />
                    </View>
                  </Animated.View>
                </View>

                <View
                  style={
                    styles.eyebrow
                  }
                >
                  <View
                    style={
                      styles.eyebrowAccent
                    }
                  />

                  <Text
                    style={
                      styles.eyebrowText
                    }
                  >
                    KNOWLEDGE • SKILLS • OPPORTUNITIES
                  </Text>
                </View>

                <Text
                  style={styles.heroTitle}
                >
                  Discover
                </Text>

                <Text
                  style={[
                    styles.heroTitle,
                    styles.heroTitleAccent,
                  ]}
                >
                  what's next.
                </Text>

                <Text
                  style={
                    styles.heroDescription
                  }
                >
                  One intelligent place for
                  scholarships, internships,
                  courses, competitions and
                  career opportunities tailored
                  to your journey.
                </Text>

                <View
                  style={
                    styles.statsCard
                  }
                >
                  <Stat
                    value="01"
                    label="PROFILE"
                  />

                  <StatDivider />

                  <Stat
                    value="AI"
                    label="MATCHING"
                    accent
                  />

                  <StatDivider />

                  <Stat
                    value="24/7"
                    label="GUIDANCE"
                  />
                </View>
              </View>

              {/* Product preview */}
              <Animated.View
                style={[
                  styles.previewArea,
                  isWide &&
                    styles.previewAreaWide,
                  {
                    transform: [
                      {
                        translateY:
                          previewY,
                      },
                    ],
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.backCard,
                    {
                      transform: [
                        {
                          translateY:
                            floatingTwo,
                        },
                        {
                          rotate:
                            '5deg',
                        },
                      ],
                    },
                  ]}
                />

                <View
                  style={
                    styles.previewCard
                  }
                >
                  <View
                    style={
                      styles.previewCardGlow
                    }
                  />

                  <View
                    style={
                      styles.previewHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.previewKicker
                        }
                      >
                        YOUR KSO MATCHES
                      </Text>

                      <Text
                        style={
                          styles.previewTitle
                        }
                      >
                        Curated for you
                      </Text>
                    </View>

                    <View
                      style={
                        styles.aiBadge
                      }
                    >
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={
                          PREMIUM.champagne
                        }
                      />

                      <Text
                        style={
                          styles.aiBadgeText
                        }
                      >
                        AI
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.opportunityCard
                    }
                  >
                    <View
                      style={
                        styles.opportunityIcon
                      }
                    >
                      <Ionicons
                        name="school-outline"
                        size={22}
                        color={
                          PREMIUM.champagne
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.opportunityContent
                      }
                    >
                      <Text
                        style={
                          styles.opportunityLabel
                        }
                      >
                        SCHOLARSHIP
                      </Text>

                      <Text
                        style={
                          styles.opportunityTitle
                        }
                      >
                        Future Leaders
                        Programme
                      </Text>

                      <View
                        style={
                          styles.locationRow
                        }
                      >
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color={
                            PREMIUM.slateLight
                          }
                        />

                        <Text
                          style={
                            styles.locationText
                          }
                        >
                          Pakistan • Remote
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.bookmarkIcon
                      }
                    >
                      <Ionicons
                        name="bookmark-outline"
                        size={15}
                        color={
                          PREMIUM.slate
                        }
                      />
                    </View>
                  </View>

                  <View
                    style={
                      styles.matchSection
                    }
                  >
                    <View
                      style={
                        styles.matchTop
                      }
                    >
                      <Text
                        style={
                          styles.matchLabel
                        }
                      >
                        PROFILE MATCH
                      </Text>

                      <Text
                        style={
                          styles.matchScore
                        }
                      >
                        94%
                      </Text>
                    </View>

                    <View
                      style={
                        styles.matchTrack
                      }
                    >
                      <View
                        style={
                          styles.matchFill
                        }
                      />
                    </View>
                  </View>

                  <View
                    style={
                      styles.previewBottom
                    }
                  >
                    <PreviewTag text="STEM" />
                    <PreviewTag text="Undergraduate" />
                    <PreviewTag text="+2" />

                    <View
                      style={
                        styles.matchReady
                      }
                    >
                      <View
                        style={
                          styles.matchReadyDot
                        }
                      />

                      <Text
                        style={
                          styles.matchReadyText
                        }
                      >
                        Strong fit
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Floating AI card */}
                <Animated.View
                  style={[
                    styles.floatingAi,
                    {
                      transform: [
                        {
                          translateY:
                            floatingOne,
                        },
                        {
                          rotate:
                            '-6deg',
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={
                      styles.floatingAiIcon
                    }
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={17}
                      color={
                        PREMIUM.midnight
                      }
                    />
                  </View>

                  <View>
                    <Text
                      style={
                        styles.floatingAiTitle
                      }
                    >
                      AI MATCH
                    </Text>

                    <Text
                      style={
                        styles.floatingAiScore
                      }
                    >
                      94% fit
                    </Text>
                  </View>
                </Animated.View>

                {/* Floating count card */}
                <Animated.View
                  style={[
                    styles.floatingCount,
                    {
                      transform: [
                        {
                          translateY:
                            floatingTwo,
                        },
                        {
                          rotate:
                            '4deg',
                        },
                      ],
                    },
                  ]}
                >
                  <View
                    style={
                      styles.countDot
                    }
                  />

                  <Text
                    style={
                      styles.countText
                    }
                  >
                    12 new opportunities
                  </Text>
                </Animated.View>
              </Animated.View>
            </Animated.View>

            {/* =========================================================== */}
            {/* Value section                                                 */}
            {/* =========================================================== */}

            <Animated.View
              style={[
                styles.valueSection,
                {
                  opacity:
                    screenOpacity,
                  transform: [
                    {
                      translateY:
                        contentY,
                    },
                  ],
                },
              ]}
            >
              <View
                style={
                  styles.valueHeader
                }
              >
                <Text
                  style={
                    styles.valueEyebrow
                  }
                >
                  THE KSO DIFFERENCE
                </Text>

                <Text
                  style={
                    styles.valueTitle
                  }
                >
                  Less searching.
                  {'\n'}
                  More discovering.
                </Text>
              </View>

              <View
                style={[
                  styles.insightGrid,
                  isWide &&
                    styles.insightGridWide,
                ]}
              >
                {INSIGHTS.map(
                  (item, index) => (
                    <InsightCard
                      key={item.title}
                      item={item}
                      index={index}
                    />
                  )
                )}
              </View>
            </Animated.View>

            {/* =========================================================== */}
            {/* CLICKABLE ACTION AREA                                       */}
            {/* =========================================================== */}

            <Animated.View
              style={[
                styles.actionsSection,
                {
                  transform: [
                    {
                      translateY:
                        actionY,
                    },
                  ],
                },
              ]}
            >
              <View
                style={
                  styles.actionPanel
                }
              >
                <View
                  style={
                    styles.actionPanelTop
                  }
                >
                  <View
                    style={
                      styles.actionPanelCopy
                    }
                  >
                    <Text
                      style={
                        styles.actionEyebrow
                      }
                    >
                      YOUR NEXT MOVE
                    </Text>

                    <Text
                      style={
                        styles.actionTitle
                      }
                    >
                      Your next opportunity
                      is closer than you think.
                    </Text>

                    <Text
                      style={
                        styles.actionDescription
                      }
                    >
                      Create your profile once.
                      KSO helps you discover
                      opportunities that actually
                      fit you.
                    </Text>
                  </View>

                  <View
                    style={
                      styles.actionSpark
                    }
                  >
                    <Ionicons
                      name="sparkles"
                      size={23}
                      color={
                        PREMIUM.champagne
                      }
                    />
                  </View>
                </View>

                {/* ===================================================== */}
                {/* CLICKABLE: START JOURNEY                              */}
                {/* ===================================================== */}

                <ClickableActionCard
                  title="Start Your Journey"
                  subtitle="Build your personalized profile"
                  icon="arrow-forward"
                  variant="primary"
                  onPress={
                    handleGetStarted
                  }
                />

                {/* ===================================================== */}
                {/* CLICKABLE: SIGN IN + CREATE ACCOUNT                   */}
                {/* ===================================================== */}

                <View
                  style={
                    styles.authRow
                  }
                >
                  <ClickableActionCard
                    title="Sign In"
                    subtitle="Welcome back"
                    icon="log-in-outline"
                    variant="dark"
                    onPress={
                      handleSignIn
                    }
                  />

                  <ClickableActionCard
                    title="Create Account"
                    subtitle="New to KSO?"
                    icon="person-add-outline"
                    variant="dark"
                    onPress={
                      handleSignUp
                    }
                  />
                </View>

                {/* ===================================================== */}
                {/* CLICKABLE: GUEST                                       */}
                {/* ===================================================== */}

                <ClickableGuestCard
                  onPress={
                    handleGuest
                  }
                />

                {/* Security */}
                <View
                  style={
                    styles.securityRow
                  }
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={14}
                    color={
                      PREMIUM.teal
                    }
                  />

                  <Text
                    style={
                      styles.securityText
                    }
                  >
                    Private profile • Secure
                    authentication • You control
                    your data
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* =========================================================== */}
            {/* Footer                                                        */}
            {/* =========================================================== */}

            <View
              style={
                styles.footer
              }
            >
              <View
                style={
                  styles.footerAccent
                }
              />

              <Text
                style={
                  styles.footerText
                }
              >
                AI FOR PAKISTAN'S FUTURE
              </Text>

              <Text
                style={
                  styles.footerSubtext
                }
              >
                KSO • DISCOVER • GROW • ACHIEVE
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ========================================================================= */
/* STAT                                                                      */
/* ========================================================================= */

function Stat({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <View
      style={styles.stat}
    >
      <Text
        style={[
          styles.statValue,
          accent &&
            styles.statValueAccent,
        ]}
      >
        {value}
      </Text>

      <Text
        style={styles.statLabel}
      >
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  return (
    <View
      style={
        styles.statDivider
      }
    />
  );
}

/* ========================================================================= */
/* PREVIEW TAG                                                               */
/* ========================================================================= */

function PreviewTag({
  text,
}: {
  text: string;
}) {
  return (
    <View
      style={
        styles.previewTag
      }
    >
      <Text
        style={
          styles.previewTagText
        }
      >
        {text}
      </Text>
    </View>
  );
}

/* ========================================================================= */
/* INSIGHT CARD                                                              */
/* ========================================================================= */

function InsightCard({
  item,
  index,
}: {
  item: Insight;
  index: number;
}) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const handlePressIn =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 0.97,
        damping: 15,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  const handlePressOut =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 1,
        damping: 15,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  return (
    <Animated.View
      style={[
        styles.insightWrapper,
        {
          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={
          handlePressIn
        }
        onPressOut={
          handlePressOut
        }
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.insightCard,
          index === 1 &&
            styles.insightCardHighlighted,
          pressed &&
            styles.insightPressed,
        ]}
      >
        <View
          style={[
            styles.insightIcon,
            {
              backgroundColor:
                `${item.accent}18`,
            },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={21}
            color={
              item.accent
            }
          />
        </View>

        <View
          style={
            styles.insightContent
          }
        >
          <Text
            style={
              styles.insightIndex
            }
          >
            {String(
              index + 1
            ).padStart(2, '0')}
          </Text>

          <Text
            style={
              styles.insightTitle
            }
          >
            {item.title}
          </Text>

          <Text
            style={
              styles.insightSubtitle
            }
          >
            {item.subtitle}
          </Text>
        </View>

        {item.score ? (
          <View
            style={
              styles.scoreBadge
            }
          >
            <Text
              style={
                styles.scoreText
              }
            >
              {item.score}
            </Text>
          </View>
        ) : (
          <Ionicons
            name="arrow-forward"
            size={15}
            color={
              PREMIUM.slateLight
            }
          />
        )}
      </Pressable>
    </Animated.View>
  );
}

/* ========================================================================= */
/* GENERIC CLICKABLE ACTION CARD                                            */
/* ========================================================================= */

function ClickableActionCard({
  title,
  subtitle,
  icon,
  variant,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  variant: 'primary' | 'dark';
  onPress: () => void;
}) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const handlePressIn =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 0.975,
        damping: 16,
        stiffness: 230,
        mass: 0.7,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  const handlePressOut =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        mass: 0.7,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  const isPrimary =
    variant === 'primary';

  return (
    <Animated.View
      style={[
        styles.clickableCardWrapper,
        {
          transform: [
            {
              scale,
            },
          ],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={
          handlePressIn
        }
        onPressOut={
          handlePressOut
        }
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={
          subtitle
        }
        hitSlop={4}
        style={({ pressed }) => [
          styles.clickableActionCard,

          isPrimary &&
            styles.clickablePrimaryCard,

          !isPrimary &&
            styles.clickableDarkCard,

          pressed &&
            styles.clickableCardPressed,
        ]}
      >
        <View
          style={[
            styles.clickableIcon,
            isPrimary &&
              styles.clickablePrimaryIcon,
            !isPrimary &&
              styles.clickableDarkIcon,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={
              isPrimary
                ? PREMIUM.midnight
                : PREMIUM.champagne
            }
          />
        </View>

        <View
          style={
            styles.clickableContent
          }
        >
          <Text
            style={[
              styles.clickableTitle,
              isPrimary &&
                styles.clickablePrimaryTitle,
              !isPrimary &&
                styles.clickableDarkTitle,
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.clickableSubtitle,
              isPrimary &&
                styles.clickablePrimarySubtitle,
              !isPrimary &&
                styles.clickableDarkSubtitle,
            ]}
          >
            {subtitle}
          </Text>
        </View>

        <View
          style={[
            styles.clickableArrow,
            isPrimary &&
              styles.clickablePrimaryArrow,
            !isPrimary &&
              styles.clickableDarkArrow,
          ]}
        >
          <Ionicons
            name="chevron-forward"
            size={17}
            color={
              isPrimary
                ? PREMIUM.midnight
                : PREMIUM.slateLight
            }
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ========================================================================= */
/* CLICKABLE GUEST CARD                                                      */
/* ========================================================================= */

function ClickableGuestCard({
  onPress,
}: {
  onPress: () => void;
}) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const handlePressIn =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 0.975,
        damping: 16,
        stiffness: 220,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  const handlePressOut =
    useCallback(() => {
      Animated.spring(scale, {
        toValue: 1,
        damping: 16,
        stiffness: 180,
        useNativeDriver: true,
      }).start();
    }, [scale]);

  return (
    <Animated.View
      style={{
        transform: [
          {
            scale,
          },
        ],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={
          handlePressIn
        }
        onPressOut={
          handlePressOut
        }
        accessibilityRole="button"
        accessibilityLabel="Continue as Guest"
        accessibilityHint="Browse opportunities without creating an account"
        hitSlop={4}
        style={({ pressed }) => [
          styles.guestButton,
          pressed &&
            styles.guestButtonPressed,
        ]}
      >
        <View
          style={
            styles.guestIcon
          }
        >
          <Ionicons
            name="eye-outline"
            size={19}
            color={
              PREMIUM.champagne
            }
          />
        </View>

        <View
          style={
            styles.guestCopy
          }
        >
          <Text
            style={
              styles.guestTitle
            }
          >
            Continue as Guest
          </Text>

          <Text
            style={
              styles.guestSubtitle
            }
          >
            Explore opportunities without
            creating an account
          </Text>
        </View>

        <View
          style={
            styles.guestArrow
          }
        >
          <Ionicons
            name="arrow-forward"
            size={17}
            color={
              PREMIUM.slateLight
            }
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ========================================================================= */
/* STYLES                                                                    */
/* ========================================================================= */

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor:
      PREMIUM.ivory,
  },

  screen: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  container: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
  },

  containerWide: {
    maxWidth: 1180,
  },

  /* --------------------------------------------------------------------- */
  /* Background                                                              */
  /* --------------------------------------------------------------------- */

  orb: {
    position: 'absolute',
    borderRadius: 999,
  },

  orbGold: {
    width: 360,
    height: 360,
    top: -160,
    right: -140,
    backgroundColor:
      'rgba(201,168,117,0.11)',
  },

  orbTeal: {
    width: 360,
    height: 360,
    bottom: -160,
    left: -150,
    backgroundColor:
      'rgba(34,199,184,0.07)',
  },

  gridVerticalLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '12%',
    width: 1,
    backgroundColor:
      'rgba(11,19,36,0.028)',
  },

  gridVerticalRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '12%',
    width: 1,
    backgroundColor:
      'rgba(11,19,36,0.028)',
  },

  gridHorizontalTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '28%',
    height: 1,
    backgroundColor:
      'rgba(11,19,36,0.022)',
  },

  gridHorizontalBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '73%',
    height: 1,
    backgroundColor:
      'rgba(11,19,36,0.022)',
  },

  /* --------------------------------------------------------------------- */
  /* Top bar                                                                 */
  /* --------------------------------------------------------------------- */

  topBar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      PREMIUM.midnight,
  },

  brandText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 2.3,
    color:
      PREMIUM.midnight,
  },

  brandDivider: {
    width: 1,
    height: 18,
    marginHorizontal: 9,
    backgroundColor:
      PREMIUM.line,
  },

  brandCaption: {
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '700',
    color:
      PREMIUM.slate,
  },

  futurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
    borderColor:
      PREMIUM.line,
    backgroundColor:
      'rgba(255,255,255,0.72)',
  },

  futureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor:
      PREMIUM.teal,
  },

  futureText: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '700',
    color:
      PREMIUM.slate,
  },

  /* --------------------------------------------------------------------- */
  /* Hero                                                                    */
  /* --------------------------------------------------------------------- */

  hero: {
    marginBottom: 28,
  },

  heroWide: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 500,
  },

  heroCopy: {
    alignItems: 'center',
    flex: 1,
  },

  heroCopyWide: {
    alignItems: 'flex-start',
    paddingRight: 45,
  },

  heroLogoArea: {
    width: 125,
    height: 125,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },

  logoGlow: {
    position: 'absolute',
    width: 124,
    height: 124,
    borderRadius: 62,
    backgroundColor:
      'rgba(201,168,117,0.13)',
  },

  logoOuter: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      PREMIUM.midnight,
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },

  logoInner: {
    width: 79,
    height: 79,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.23)',
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  eyebrowAccent: {
    width: 26,
    height: 2,
    borderRadius: 2,
    marginRight: 8,
    backgroundColor:
      PREMIUM.champagne,
  },

  eyebrowText: {
    fontSize: 8,
    letterSpacing: 1.45,
    fontWeight: '700',
    color:
      PREMIUM.slate,
  },

  heroTitle: {
    fontSize: 64,
    lineHeight: 66,
    fontWeight: '800',
    letterSpacing: -2.5,
    color:
      PREMIUM.midnight,
  },

  heroTitleAccent: {
    color:
      PREMIUM.champagne,
  },

  heroDescription: {
    maxWidth: 650,
    marginTop: 14,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    color:
      PREMIUM.textSoft,
    textAlign: 'center',
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    paddingHorizontal: 17,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor:
      PREMIUM.line,
    backgroundColor:
      'rgba(255,255,255,0.70)',
  },

  stat: {
    minWidth: 62,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  statValueAccent: {
    color:
      PREMIUM.teal,
  },

  statLabel: {
    marginTop: 2,
    fontSize: 8,
    letterSpacing: 0.9,
    fontWeight: '700',
    color:
      PREMIUM.slateLight,
  },

  statDivider: {
    width: 1,
    height: 26,
    marginHorizontal: 14,
    backgroundColor:
      PREMIUM.line,
  },

  /* --------------------------------------------------------------------- */
  /* Preview                                                                 */
  /* --------------------------------------------------------------------- */

  previewArea: {
    width: '100%',
    minHeight: 390,
    marginTop: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewAreaWide: {
    width: 480,
    marginTop: 0,
    marginLeft: 15,
  },

  backCard: {
    position: 'absolute',
    width: '82%',
    height: 290,
    borderRadius: 27,
    backgroundColor:
      'rgba(17,29,51,0.07)',
    borderWidth: 1,
    borderColor:
      'rgba(11,19,36,0.05)',
  },

  previewCard: {
    position: 'relative',
    width: '82%',
    minHeight: 300,
    padding: 17,
    overflow: 'hidden',
    borderRadius: 27,
    backgroundColor:
      PREMIUM.white,
    borderWidth: 1,
    borderColor:
      'rgba(11,19,36,0.07)',
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 17,
    },
    shadowOpacity: 0.13,
    shadowRadius: 30,
    elevation: 8,
    zIndex: 2,
  },

  previewCardGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -90,
    top: -90,
    backgroundColor:
      'rgba(201,168,117,0.10)',
  },

  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent:
      'space-between',
    marginBottom: 14,
  },

  previewKicker: {
    fontSize: 8,
    letterSpacing: 1.25,
    fontWeight: '700',
    color:
      PREMIUM.slateLight,
  },

  previewTitle: {
    marginTop: 4,
    fontSize: 17,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor:
      PREMIUM.midnight,
  },

  aiBadgeText: {
    marginLeft: 4,
    fontSize: 8,
    letterSpacing: 0.6,
    fontWeight: '800',
    color:
      PREMIUM.champagneLight,
  },

  opportunityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor:
      '#FAF9F6',
    borderWidth: 1,
    borderColor:
      '#ECE8DE',
  },

  opportunityIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      PREMIUM.champagneSoft,
  },

  opportunityContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
  },

  opportunityLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
    color:
      PREMIUM.champagne,
  },

  opportunityTitle: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  locationText: {
    marginLeft: 3,
    fontSize: 8,
    color:
      PREMIUM.slate,
  },

  bookmarkIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      '#F1F1EF',
  },

  matchSection: {
    marginTop: 17,
  },

  matchTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 6,
  },

  matchLabel: {
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '800',
    color:
      PREMIUM.slateLight,
  },

  matchScore: {
    fontSize: 14,
    fontWeight: '800',
    color:
      PREMIUM.tealDark,
  },

  matchTrack: {
    height: 7,
    borderRadius: 99,
    overflow: 'hidden',
    backgroundColor:
      '#E7EEEC',
  },

  matchFill: {
    width: '94%',
    height: '100%',
    borderRadius: 99,
    backgroundColor:
      PREMIUM.teal,
  },

  previewBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 15,
  },

  previewTag: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor:
      '#F4F3F0',
  },

  previewTagText: {
    fontSize: 8,
    fontWeight: '600',
    color:
      PREMIUM.slate,
  },

  matchReady: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  matchReadyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor:
      PREMIUM.teal,
  },

  matchReadyText: {
    fontSize: 8,
    fontWeight: '700',
    color:
      PREMIUM.tealDark,
  },

  /* --------------------------------------------------------------------- */
  /* Floating cards                                                         */
  /* --------------------------------------------------------------------- */

  floatingAi: {
    position: 'absolute',
    left: 0,
    top: 80,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor:
      PREMIUM.champagne,
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.13,
    shadowRadius: 14,
    elevation: 5,
    zIndex: 5,
  },

  floatingAiIcon: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      PREMIUM.white,
    marginRight: 7,
  },

  floatingAiTitle: {
    fontSize: 8,
    letterSpacing: 0.8,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  floatingAiScore: {
    marginTop: 1,
    fontSize: 10,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  floatingCount: {
    position: 'absolute',
    right: 0,
    bottom: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 15,
    backgroundColor:
      PREMIUM.midnight,
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
    zIndex: 4,
  },

  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
    backgroundColor:
      PREMIUM.teal,
  },

  countText: {
    fontSize: 8,
    fontWeight: '700',
    color:
      PREMIUM.white,
  },

  /* --------------------------------------------------------------------- */
  /* Value section                                                          */
  /* --------------------------------------------------------------------- */

  valueSection: {
    marginTop: 15,
    marginBottom: 28,
  },

  valueHeader: {
    marginBottom: 14,
  },

  valueEyebrow: {
    fontSize: 8,
    letterSpacing: 1.3,
    fontWeight: '800',
    color:
      PREMIUM.champagne,
    marginBottom: 5,
  },

  valueTitle: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
    color:
      PREMIUM.midnight,
  },

  insightGrid: {
    gap: 10,
  },

  insightGridWide: {
    flexDirection: 'row',
  },

  insightWrapper: {
    flex: 1,
  },

  insightCard: {
    minHeight: 106,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor:
      PREMIUM.line,
    backgroundColor:
      'rgba(255,255,255,0.82)',
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.045,
    shadowRadius: 12,
    elevation: 2,
  },

  insightCardHighlighted: {
    borderColor:
      'rgba(34,199,184,0.35)',
    backgroundColor:
      '#F6FFFD',
  },

  insightPressed: {
    opacity: 0.88,
  },

  insightIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  insightContent: {
    flex: 1,
    marginLeft: 10,
  },

  insightIndex: {
    fontSize: 8,
    fontWeight: '800',
    color:
      PREMIUM.slateLight,
    marginBottom: 2,
  },

  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color:
      PREMIUM.midnight,
  },

  insightSubtitle: {
    marginTop: 3,
    fontSize: 9,
    color:
      PREMIUM.slate,
  },

  scoreBadge: {
    minWidth: 37,
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 11,
    backgroundColor:
      PREMIUM.tealSoft,
  },

  scoreText: {
    fontSize: 9,
    fontWeight: '800',
    color:
      PREMIUM.tealDark,
  },

  /* --------------------------------------------------------------------- */
  /* Actions                                                                */
  /* --------------------------------------------------------------------- */

  actionsSection: {
    marginBottom: 20,
  },

  actionPanel: {
    padding: 18,
    borderRadius: 28,
    backgroundColor:
      PREMIUM.midnight,
    shadowColor:
      PREMIUM.midnight,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 7,
  },

  actionPanelTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  actionPanelCopy: {
    flex: 1,
    paddingRight: 12,
  },

  actionEyebrow: {
    fontSize: 8,
    letterSpacing: 1.4,
    fontWeight: '800',
    color:
      PREMIUM.champagne,
    marginBottom: 6,
  },

  actionTitle: {
    maxWidth: 760,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    color:
      PREMIUM.white,
  },

  actionDescription: {
    maxWidth: 700,
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    color:
      'rgba(255,255,255,0.63)',
  },

  actionSpark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(201,168,117,0.13)',
    borderWidth: 1,
    borderColor:
      'rgba(201,168,117,0.23)',
  },

  /* --------------------------------------------------------------------- */
  /* Clickable action cards                                                */
  /* --------------------------------------------------------------------- */

  clickableCardWrapper: {
    flex: 1,
  },

  clickableActionCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 17,
    borderWidth: 1,
  },

  clickablePrimaryCard: {
    backgroundColor:
      PREMIUM.champagne,
    borderColor:
      PREMIUM.champagne,
    shadowColor:
      PREMIUM.champagne,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },

  clickableDarkCard: {
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderColor:
      PREMIUM.whiteLine,
  },

  clickableCardPressed: {
    opacity: 0.86,
  },

  clickableIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clickablePrimaryIcon: {
    backgroundColor:
      PREMIUM.white,
  },

  clickableDarkIcon: {
    backgroundColor:
      'rgba(201,168,117,0.10)',
  },

  clickableContent: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 10,
  },

  clickableTitle: {
    fontSize: 14,
    fontWeight: '800',
  },

  clickablePrimaryTitle: {
    color:
      PREMIUM.midnight,
  },

  clickableDarkTitle: {
    color:
      PREMIUM.white,
  },

  clickableSubtitle: {
    marginTop: 2,
    fontSize: 9,
  },

  clickablePrimarySubtitle: {
    color:
      'rgba(11,19,36,0.62)',
  },

  clickableDarkSubtitle: {
    color:
      'rgba(255,255,255,0.48)',
  },

  clickableArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  clickablePrimaryArrow: {
    backgroundColor:
      'rgba(11,19,36,0.08)',
  },

  clickableDarkArrow: {
    backgroundColor:
      'rgba(255,255,255,0.05)',
  },

  /* --------------------------------------------------------------------- */
  /* Auth row                                                               */
  /* --------------------------------------------------------------------- */

  authRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 9,
  },

  /* --------------------------------------------------------------------- */
  /* Guest                                                                  */
  /* --------------------------------------------------------------------- */

  guestButton: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor:
      'rgba(255,255,255,0.045)',
    borderWidth: 1,
    borderColor:
      PREMIUM.whiteLine,
  },

  guestButtonPressed: {
    opacity: 0.82,
    backgroundColor:
      'rgba(201,168,117,0.09)',
  },

  guestIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(201,168,117,0.09)',
  },

  guestCopy: {
    flex: 1,
    marginHorizontal: 9,
  },

  guestTitle: {
    fontSize: 11,
    fontWeight: '800',
    color:
      PREMIUM.white,
  },

  guestSubtitle: {
    marginTop: 2,
    fontSize: 8,
    lineHeight: 13,
    color:
      'rgba(255,255,255,0.48)',
  },

  guestArrow: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      'rgba(255,255,255,0.05)',
  },

  /* --------------------------------------------------------------------- */
  /* Security                                                               */
  /* --------------------------------------------------------------------- */

  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },

  securityText: {
    marginLeft: 5,
    fontSize: 8,
    color:
      'rgba(255,255,255,0.43)',
    textAlign: 'center',
  },

  /* --------------------------------------------------------------------- */
  /* Footer                                                                 */
  /* --------------------------------------------------------------------- */

  footer: {
    alignItems: 'center',
    paddingBottom: 14,
  },

  footerAccent: {
    width: 34,
    height: 2,
    borderRadius: 2,
    marginBottom: 8,
    backgroundColor:
      PREMIUM.champagne,
  },

  footerText: {
    fontSize: 8,
    letterSpacing: 1.5,
    fontWeight: '800',
    color:
      PREMIUM.slate,
  },

  footerSubtext: {
    marginTop: 4,
    fontSize: 7,
    letterSpacing: 1,
    color:
      PREMIUM.slateLight,
  },
});