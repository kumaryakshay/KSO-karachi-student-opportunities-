import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  LayoutAnimation,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
 
import { colors }                        from '../theme/colors';
import { fontSize, fontWeight }          from '../theme/typography';
import { borderRadius, iconSize, spacing } from '../theme/spacing';
import type { AppNotification, NotificationType } from '../types/notification';
import { formatRelativeTime }            from '../utils/deadline';
 
// ─── Android LayoutAnimation ─────────────────────────────────────────────────
if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}
 
// ─── Constants ────────────────────────────────────────────────────────────────
const ENTRY_STAGGER_MS     = 55;   // delay between adjacent cards
const DISMISS_THRESHOLD_PX = 150;  // how far left to commit dismiss
const DISMISS_VELOCITY     = 0.3;  // fast flick threshold (px/ms)
const READ_THRESHOLD_PX    = 72;   // how far right to commit mark-read
const DISMISS_DURATION_MS  = 255;  // slide-out animation duration
 
// ─── Types ────────────────────────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
 
interface QuickAction {
  label:    string;
  icon:     IoniconName;
  primary?: boolean;
}
 
interface TypeConfig {
  icon:    IoniconName;
  iconBg:  string;
  accent:  string;
  badge:   string;
  urgency: boolean;            // show urgency bar?
  urgencyFill: number;         // 0–1 bar fill for this type
  actions: QuickAction[];
}
 
export interface NotificationCardProps {
  notification: AppNotification;
  onPress?:    (n: AppNotification) => void;
  onDismiss?:  (n: AppNotification) => void;
  onMarkRead?: (n: AppNotification) => void;
  style?:      StyleProp<ViewStyle>;
  /** Position in the rendered list — drives the entry-animation stagger */
  index?:      number;
}
 
// ─── Per-type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, TypeConfig> = {
  new_opportunity: {
    icon:        'sparkles-outline',
    iconBg:      '#E8F5E9',
    accent:      colors.success,
    badge:       'Opportunity',
    urgency:     false,
    urgencyFill: 0,
    actions: [
      { label: 'View', icon: 'arrow-forward-outline', primary: true },
      { label: 'Save', icon: 'bookmark-outline' },
    ],
  },
  deadline_reminder: {
    icon:        'time-outline',
    iconBg:      '#FFF8ED',
    accent:      colors.warning,
    badge:       'Reminder',
    urgency:     true,
    urgencyFill: 0.42,
    actions: [
      { label: 'Open',   icon: 'arrow-forward-outline', primary: true },
      { label: 'Snooze', icon: 'alarm-outline' },
    ],
  },
  deadline_warning: {
    icon:        'warning-outline',
    iconBg:      '#FFF0F0',
    accent:      colors.error,
    badge:       'Urgent',
    urgency:     true,
    urgencyFill: 0.88,
    actions: [
      { label: 'Act Now', icon: 'flash-outline', primary: true },
    ],
  },
  personalized: {
    icon:        'bulb-outline',
    iconBg:      '#EBF5FF',
    accent:      colors.info,
    badge:       'For You',
    urgency:     false,
    urgencyFill: 0,
    actions: [
      { label: 'Explore', icon: 'compass-outline', primary: true },
      { label: 'Dismiss', icon: 'close-outline' },
    ],
  },
};
 
// ═════════════════════════════════════════════════════════════════════════════
// Sub-component: PulseDot
//   Replaces the static coloured dot with an animated ring-pulse indicator.
// ═════════════════════════════════════════════════════════════════════════════
const PulseDot = memo(function PulseDot({ color }: { color: string }) {
  const ring = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [ring]);
 
  const ringScale   = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.38, 0] });
 
  return (
    <View style={dotSt.host} accessibilityElementsHidden>
      <Animated.View
        style={[
          dotSt.ring,
          { borderColor: color, transform: [{ scale: ringScale }], opacity: ringOpacity },
        ]}
      />
      <View style={[dotSt.core, { backgroundColor: color }]} />
    </View>
  );
});
 
const dotSt = StyleSheet.create({
  host: {
    width: 12, height: 12,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  ring: {
    position: 'absolute',
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 1.5,
  },
  core: { width: 7, height: 7, borderRadius: 3.5 },
});
 
// ═════════════════════════════════════════════════════════════════════════════
// Sub-component: TypeBadge
//   Small icon + label pill that identifies the notification category.
// ═════════════════════════════════════════════════════════════════════════════
const TypeBadge = memo(function TypeBadge({ cfg }: { cfg: TypeConfig }) {
  return (
    <View style={[badgeSt.pill, { backgroundColor: cfg.iconBg }]}>
      <Ionicons name={cfg.icon} size={9} color={cfg.accent} />
      <Text style={[badgeSt.text, { color: cfg.accent }]}>{cfg.badge}</Text>
    </View>
  );
});
 
const badgeSt = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginLeft: 3,
  },
});
 
// ═════════════════════════════════════════════════════════════════════════════
// Sub-component: UrgencyBar
//   Animated progress bar shown on deadline notification types.
//   Fill level is driven by config (urgencyFill), not elapsed time —
//   replace with real deadline math when the model exposes a `dueAt` field.
// ═════════════════════════════════════════════════════════════════════════════
const UrgencyBar = memo(function UrgencyBar({ cfg }: { cfg: TypeConfig }) {
  const progress = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    if (!cfg.urgency) return;
    const anim = Animated.timing(progress, {
      toValue:         cfg.urgencyFill,
      duration:        900,
      delay:           420,
      useNativeDriver: false,          // width% cannot use native driver
    });
    anim.start();
    return () => anim.stop();
  }, [cfg.urgency, cfg.urgencyFill, progress]);
 
  if (!cfg.urgency) return null;
 
  return (
    <View style={barSt.track}>
      <Animated.View
        style={[
          barSt.fill,
          {
            backgroundColor: cfg.accent,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
});
 
const barSt = StyleSheet.create({
  track: {
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.07)',
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2, opacity: 0.75 },
});
 
// ═════════════════════════════════════════════════════════════════════════════
// Sub-component: QuickActions
//   Inline CTA row. Primary action is filled; secondary is outlined.
//   These are nested Pressables — RN touch system routes to the innermost,
//   so they will NOT bubble up to the card's own Pressable.
// ═════════════════════════════════════════════════════════════════════════════
const QuickActions = memo(function QuickActions({
  cfg,
  onPrimary,
}: {
  cfg: TypeConfig;
  onPrimary: () => void;
}) {
  if (!cfg.actions.length) return null;
 
  return (
    <View style={qaSt.row}>
      {cfg.actions.map((action) => {
        const isPrimary = !!action.primary;
        return (
          <Pressable
            key={action.label}
            onPress={isPrimary ? onPrimary : undefined}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={({ pressed }) => [
              qaSt.btn,
              isPrimary
                ? { backgroundColor: cfg.accent, borderColor: cfg.accent }
                : { borderColor: cfg.accent },
              pressed && qaSt.btnPressed,
            ]}
          >
            <Ionicons
              name={action.icon}
              size={11}
              color={isPrimary ? '#fff' : cfg.accent}
            />
            <Text style={[qaSt.label, { color: isPrimary ? '#fff' : cfg.accent }]}>
              {action.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});
 
const qaSt = StyleSheet.create({
  row: { flexDirection: 'row', marginTop: spacing.sm },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1.25,
    marginRight: spacing.xs,
  },
  btnPressed: { opacity: 0.7 },
  label: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
});
 
// ═════════════════════════════════════════════════════════════════════════════
// Main component: NotificationCard
// ═════════════════════════════════════════════════════════════════════════════
export const NotificationCard = memo(function NotificationCard({
  notification,
  onPress,
  onDismiss,
  onMarkRead,
  style,
  index = 0,
}: NotificationCardProps) {
  const cfg = TYPE_CONFIG[notification.type];
 
  // Whether the message body is fully expanded
  const [expanded, setExpanded] = useState(false);
 
  // ── Stable refs for callbacks (safe to read inside PanResponder) ──────────
  const onPressRef    = useRef(onPress);
  const onDismissRef  = useRef(onDismiss);
  const onMarkReadRef = useRef(onMarkRead);
  useEffect(() => {
    onPressRef.current    = onPress;
    onDismissRef.current  = onDismiss;
    onMarkReadRef.current = onMarkRead;
  });
 
  // ── Animated values ───────────────────────────────────────────────────────
  const scale      = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const slideUp    = useRef(new Animated.Value(20)).current;
 
  // ── ① Entry animation ─────────────────────────────────────────────────────
  useEffect(() => {
    const delay = index * ENTRY_STAGGER_MS;
    const entry = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 360, delay, useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0, delay, tension: 110, friction: 13, useNativeDriver: true,
      }),
    ]);
    entry.start();
    return () => entry.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
  // ── ② Dismiss animation ───────────────────────────────────────────────────
  const animateDismiss = useCallback(() => {
    const anim = Animated.parallel([
      Animated.timing(translateX, {
        toValue: -500, duration: DISMISS_DURATION_MS, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0, duration: DISMISS_DURATION_MS, useNativeDriver: true,
      }),
    ]);
    anim.start(({ finished }) => {
      if (!finished) return;
      // Collapse the vacated vertical space smoothly
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
      onDismissRef.current?.(notification);
    });
  }, [notification, opacity, translateX]);
 
  // ── Snap translateX back to rest ──────────────────────────────────────────
  const snapBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0, tension: 200, friction: 18, useNativeDriver: true,
    }).start();
  }, [translateX]);
 
  // ── ③ Swipe gesture (② dismiss + ③ mark read) ────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Don't steal taps — only claim horizontal drags
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        !!(onDismissRef.current || onMarkReadRef.current) &&
        Math.abs(dx) > 6 &&
        Math.abs(dy) < 14,
 
      onPanResponderMove: (_, { dx }) => {
        translateX.setValue(Math.max(-300, Math.min(100, dx)));
      },
 
      onPanResponderRelease: (_, { dx, vx }) => {
        const isDismiss =
          dx < -DISMISS_THRESHOLD_PX ||
          (dx < -50 && vx < -DISMISS_VELOCITY);
        const isMarkRead = dx > READ_THRESHOLD_PX;
 
        if (isDismiss && onDismissRef.current) {
          animateDismiss();
        } else if (isMarkRead && onMarkReadRef.current) {
          snapBack();
          onMarkReadRef.current(notification);
        } else {
          snapBack();
        }
      },
 
      onPanResponderTerminate: () => snapBack(),
    })
  ).current;
 
  // ── Press-scale handlers ──────────────────────────────────────────────────
  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 0.982, tension: 220, friction: 18, useNativeDriver: true,
    }).start();
  }, [onPress, scale]);
 
  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scale, {
      toValue: 1, tension: 220, friction: 18, useNativeDriver: true,
    }).start();
  }, [onPress, scale]);
 
  // ── ⑨ Tap to expand / open ───────────────────────────────────────────────
  const handlePress = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(prev => !prev);
    onPressRef.current?.(notification);
  }, [notification]);
 
  // ── ④ Swipe-reveal background opacities ──────────────────────────────────
  const readBgOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [0, READ_THRESHOLD_PX],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [translateX]
  );
 
  const dismissBgOpacity = useMemo(
    () =>
      translateX.interpolate({
        inputRange: [-DISMISS_THRESHOLD_PX, -50, 0],
        outputRange: [1, 0.5, 0],
        extrapolate: 'clamp',
      }),
    [translateX]
  );
 
  // ── ⑩ Accessibility ───────────────────────────────────────────────────────
  const a11yLabel =
    `${notification.isRead ? '' : 'Unread. '}` +
    `${notification.title}. ${notification.message}`;
 
  const a11yHint = [
    onPress    && 'Double tap to open or expand.',
    onDismiss  && 'Swipe left to dismiss.',
    onMarkRead && 'Swipe right to mark as read.',
  ].filter(Boolean).join(' ');
 
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={[
        st.outerWrap,
        { opacity, transform: [{ translateY: slideUp }] },
      ]}
    >
      {/* ── ④ Swipe-reveal layers (behind the card) ── */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {/* Right-swipe: mark read (green, left-aligned) */}
        <Animated.View style={[st.swipeBg, st.readBg, { opacity: readBgOpacity }]}>
          <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
          <Text style={st.swipeLabel}>Mark Read</Text>
        </Animated.View>
 
        {/* Left-swipe: dismiss (red, right-aligned) */}
        <Animated.View style={[st.swipeBg, st.dismissBg, { opacity: dismissBgOpacity }]}>
          <Text style={st.swipeLabel}>Dismiss</Text>
          <Ionicons name="close-circle-outline" size={18} color="#fff" />
        </Animated.View>
      </View>
 
      {/* ── Swipeable + press-scalable card ── */}
      <Animated.View
        style={{ transform: [{ scale }, { translateX }] }}
        {...panResponder.panHandlers}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!onPress}
          accessibilityRole={onPress ? 'button' : 'text'}
          accessibilityLabel={a11yLabel}
          accessibilityHint={a11yHint}
          accessibilityState={{ disabled: !onPress, expanded }}
          style={({ pressed }) => [
            st.card,
            !notification.isRead && [st.unreadCard, { borderLeftColor: cfg.accent }],
            pressed && onPress && st.pressed,
            style,
          ]}
        >
          {/* ── Left column: icon ── */}
          <View style={[st.iconWrap, { backgroundColor: cfg.iconBg }]}>
            <Ionicons name={cfg.icon} size={iconSize.md} color={cfg.accent} />
          </View>
 
          {/* ── Right column: all text content ── */}
          <View style={st.body}>
 
            {/* Row A: ⑥ type badge  +  time  +  ⑤ pulsing dot */}
            <View style={st.topRow}>
              <TypeBadge cfg={cfg} />
              <View style={st.metaCluster}>
                <Text style={st.time}>{formatRelativeTime(notification.createdAt)}</Text>
                {!notification.isRead && <PulseDot color={cfg.accent} />}
              </View>
            </View>
 
            {/* Row B: title */}
            <Text
              style={[st.title, !notification.isRead && st.titleUnread]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
 
            {/* Row C: ⑨ expandable message */}
            <Text style={st.message} numberOfLines={expanded ? undefined : 2}>
              {notification.message}
            </Text>
 
            {/* Row D: ⑦ urgency progress bar (deadline types only) */}
            <UrgencyBar cfg={cfg} />
 
            {/* Row E: ⑧ quick-action buttons */}
            <QuickActions cfg={cfg} onPrimary={() => onPressRef.current?.(notification)} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});
 
// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  // Outer wrapper — provides the rounded clip for swipe backgrounds
  outerWrap: {
    marginHorizontal: spacing.base,
    marginBottom:     spacing.sm,
    borderRadius:     borderRadius.md,
    overflow:         'hidden',
  },
 
  // Swipe-reveal layer shared style
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: spacing.base,
  },
  readBg: {
    backgroundColor: colors.success,
    justifyContent:  'flex-start',
  },
  dismissBg: {
    backgroundColor: colors.error,
    justifyContent:  'flex-end',
  },
  swipeLabel: {
    color:      '#fff',
    fontSize:   fontSize.sm,
    fontWeight: '600',
    marginHorizontal: 5,
  },
 
  // Card surface
  card: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: colors.surface,
    padding:         spacing.base,
    borderRadius:    borderRadius.md,
    borderWidth:     1,
    borderColor:     colors.divider,
  },
  unreadCard: {
    borderLeftWidth: 3,
  },
  pressed: { opacity: 0.9 },
 
  // Icon container
  iconWrap: {
    width:          44,
    height:         44,
    borderRadius:   borderRadius.md,
    alignItems:     'center',
    justifyContent: 'center',
    marginRight:    spacing.md,
  },
 
  // Body
  body:    { flex: 1, minWidth: 0 },
  topRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  metaCluster: { flexDirection: 'row', alignItems: 'center' },
 
  time: {
    fontSize: fontSize.xs,
    color:    colors.textTertiary,
  },
 
  title: {
    fontSize:   fontSize.base,
    fontWeight: fontWeight.medium,
    color:      colors.text,
  },
  titleUnread: { fontWeight: fontWeight.semibold },
 
  message: {
    marginTop:  spacing.xs,
    fontSize:   fontSize.sm,
    lineHeight: fontSize.sm * 1.5,
    color:      colors.textSecondary,
  },
});