import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontSize } from '../theme/typography';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import SavedScreen from '../screens/SavedScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OpportunityDetailsScreen from '../screens/OpportunityDetailsScreen';
import MatchingResultsScreen from '../screens/MatchingResultsScreen';
import { Opportunity } from '../types/opportunity';
import type { AIMatchingResult } from '../services/aiService';

// ── Types ──────────────────────────────────────────────────────────────────────

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Saved: undefined;
  Notifications: undefined;
  Chat: undefined;
  Profile: undefined;
};

export type MainStackParamList = {
  Tabs: undefined;
  OpportunityDetails: { opportunity: Opportunity };
  MatchingResults: { result: AIMatchingResult };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// ── Icon Map ───────────────────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, { focused: IoniconsName; unfocused: IoniconsName }> = {
  Home:           { focused: 'home',            unfocused: 'home-outline' },
  Explore:        { focused: 'compass',         unfocused: 'compass-outline' },
  Saved:          { focused: 'bookmark',        unfocused: 'bookmark-outline' },
  Notifications:  { focused: 'notifications',   unfocused: 'notifications-outline' },
  Chat:           { focused: 'chatbubbles',     unfocused: 'chatbubbles-outline' },
  Profile:        { focused: 'person-circle',   unfocused: 'person-circle-outline' },
};

// ── Tab Navigator ──────────────────────────────────────────────────────────────

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBackground,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          paddingBottom: 2,
          paddingTop: 2,
          height: 52,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 1,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          borderBottomColor: colors.divider,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontSize: fontSize.lg,
          fontWeight: '600',
          color: colors.text,
        },
        headerTitle: route.name === 'Home' ? 'KSO' : route.name === 'Chat' ? 'KSO Assistant' : route.name,
        headerShadowVisible: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.focused : icons.unfocused;
          return <Ionicons name={iconName} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Saved" component={SavedScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Main Stack (Tabs + Details) ────────────────────────────────────────────────

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={BottomTabs} />
      <Stack.Screen
        name="OpportunityDetails"
        component={OpportunityDetailsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Details',
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="MatchingResults"
        component={MatchingResultsScreen}
        options={{
          headerShown: true,
          headerTitle: 'AI Matches',
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text, fontWeight: '600' },
          headerTintColor: colors.primary,
          headerShadowVisible: false,
          headerBackTitle: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
}
