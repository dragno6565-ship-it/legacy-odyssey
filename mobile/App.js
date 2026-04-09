import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { colors, typography } from './src/theme';

// Auth screens
import LoginScreen from './src/auth/LoginScreen';
import SignupScreen from './src/auth/SignupScreen';
import ForgotPasswordScreen from './src/auth/ForgotPasswordScreen';

// App screens
import DashboardScreen from './src/screens/DashboardScreen';
import ChildInfoScreen from './src/screens/ChildInfoScreen';
import BeforeScreen from './src/screens/BeforeScreen';
import BirthStoryScreen from './src/screens/BirthStoryScreen';
import ComingHomeScreen from './src/screens/ComingHomeScreen';
import MonthsScreen from './src/screens/MonthsScreen';
import MonthDetailScreen from './src/screens/MonthDetailScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import FamilyMemberScreen from './src/screens/FamilyMemberScreen';
import FirstsScreen from './src/screens/FirstsScreen';
import CelebrationsScreen from './src/screens/CelebrationsScreen';
import LettersScreen from './src/screens/LettersScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import VaultScreen from './src/screens/VaultScreen';
import ManageSectionsScreen from './src/screens/ManageSectionsScreen';
import NewWebsiteScreen from './src/screens/NewWebsiteScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpScreen from './src/screens/HelpScreen';
import PreviewScreen from './src/screens/PreviewScreen';
import AdditionalDomainScreen from './src/screens/AdditionalDomainScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

const defaultScreenOptions = {
  headerStyle: {
    backgroundColor: colors.dark,
  },
  headerTintColor: colors.gold,
  headerTitleStyle: {
    fontFamily: typography.fontFamily.serif,
    fontWeight: '600',
    fontSize: typography.sizes.lg,
  },
  contentStyle: {
    backgroundColor: colors.background,
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator screenOptions={defaultScreenOptions}>
      <AppStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen name="ChildInfo" component={ChildInfoScreen} options={{ title: 'Child Info' }} />
      <AppStack.Screen name="BeforeArrived" component={BeforeScreen} options={{ title: 'Before You Arrived' }} />
      <AppStack.Screen name="BirthStory" component={BirthStoryScreen} options={{ title: 'Birth Story' }} />
      <AppStack.Screen name="ComingHome" component={ComingHomeScreen} options={{ title: 'Coming Home' }} />
      <AppStack.Screen name="Months" component={MonthsScreen} options={{ title: 'Month by Month' }} />
      <AppStack.Screen
        name="MonthDetail"
        component={MonthDetailScreen}
        options={({ route }) => ({ title: `Month ${route.params?.monthLabel || ''}` })}
      />
      <AppStack.Screen name="OurFamily" component={FamilyScreen} options={{ title: 'Our Family' }} />
      <AppStack.Screen
        name="FamilyMember"
        component={FamilyMemberScreen}
        options={({ route }) => ({ title: route.params?.memberName || 'Family Member' })}
      />
      <AppStack.Screen name="YourFirsts" component={FirstsScreen} options={{ title: 'Your Firsts' }} />
      <AppStack.Screen name="Celebrations" component={CelebrationsScreen} options={{ title: 'Celebrations' }} />
      <AppStack.Screen name="Letters" component={LettersScreen} options={{ title: 'Letters to You' }} />
      <AppStack.Screen name="FamilyRecipes" component={RecipesScreen} options={{ title: 'Family Recipes' }} />
      <AppStack.Screen name="TheVault" component={VaultScreen} options={{ title: 'The Vault' }} />
      <AppStack.Screen name="ManageSections" component={ManageSectionsScreen} options={{ title: 'Website Sections' }} />
      <AppStack.Screen name="NewWebsite" component={NewWebsiteScreen} options={{ title: 'New Website' }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <AppStack.Screen name="Help" component={HelpScreen} options={{ title: 'Help & Support' }} />
      <AppStack.Screen name="Preview" component={PreviewScreen} options={{ title: 'Book Preview' }} />
      <AppStack.Screen name="AdditionalDomain" component={AdditionalDomainScreen} options={{ title: 'Add Another Book' }} />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer
        theme={{
          dark: false,
          colors: {
            primary: colors.gold,
            background: colors.background,
            card: colors.dark,
            text: colors.textPrimary,
            border: colors.border,
            notification: colors.gold,
          },
          fonts: {
            regular: { fontFamily: 'System', fontWeight: '400' },
            medium: { fontFamily: 'System', fontWeight: '500' },
            bold: { fontFamily: 'System', fontWeight: '700' },
            heavy: { fontFamily: 'System', fontWeight: '900' },
          },
        }}
      >
        <StatusBar style="light" />
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
