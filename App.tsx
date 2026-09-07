import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { SavedProvider } from './src/context/SavedContext';
import { colors } from './src/theme/colors';

const ksoTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

export default function App() {
  return (
    <AuthProvider>
      <SavedProvider>
        <NavigationContainer theme={ksoTheme}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </SavedProvider>
    </AuthProvider>
  );
}
