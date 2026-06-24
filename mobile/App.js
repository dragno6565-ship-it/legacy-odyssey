import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { I18nProvider, useI18n } from './src/i18n/I18nContext';
import { colors, typography } from './src/theme';

/** Eye icon button shown in the header of every editing screen */
function PreviewButton() {
  const navigation = useNavigation();
  const { t } = useI18n();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Preview')}
      style={{ paddingHorizontal: 8, paddingVertical: 4 }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={{ color: colors.gold, fontSize: 13, fontWeight: '600', letterSpacing: 0.3 }}>
        {t('appnav.preview_button')}
      </Text>
    </TouchableOpacity>
  );
}

// Auth screens
import LoginScreen from './src/auth/LoginScreen';
import SignupScreen from './src/auth/SignupScreen';
import ForgotPasswordScreen from './src/auth/ForgotPasswordScreen';

// Baby book screens
import DashboardScreen from './src/screens/DashboardScreen';
import ChildInfoScreen from './src/screens/ChildInfoScreen';
import BeforeScreen from './src/screens/BeforeScreen';
import BirthStoryScreen from './src/screens/BirthStoryScreen';
import BirthDayScreen from './src/screens/BirthDayScreen';
import MomentsScreen from './src/screens/MomentsScreen';
import GalleriesScreen from './src/screens/GalleriesScreen';
import CirclesScreen from './src/screens/CirclesScreen';
import GalleryDetailScreen from './src/screens/GalleryDetailScreen';
import { UploadProvider } from './src/upload/UploadContext';
import JourneyScreen from './src/screens/JourneyScreen';
import ComingHomeScreen from './src/screens/ComingHomeScreen';
import MonthsScreen from './src/screens/MonthsScreen';
import MonthDetailScreen from './src/screens/MonthDetailScreen';
import FamilyScreen from './src/screens/FamilyScreen';
import FamilyMemberScreen from './src/screens/FamilyMemberScreen';
import FirstsScreen from './src/screens/FirstsScreen';
import CelebrationsScreen from './src/screens/CelebrationsScreen';
import CelebrationYearScreen from './src/screens/CelebrationYearScreen';
import CelebrationDetailScreen from './src/screens/CelebrationDetailScreen';
import LettersScreen from './src/screens/LettersScreen';
import RecipesScreen from './src/screens/RecipesScreen';
import RecipeDetailScreen from './src/screens/RecipeDetailScreen';
import KeepsakesScreen from './src/screens/KeepsakesScreen';
import KeepsakeDetailScreen from './src/screens/KeepsakeDetailScreen';
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
  headerRight: () => <PreviewButton />,
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

// FamilyAlbumNavigator removed — Family Album product retired. Baby Book is the only product now.

function AppNavigator() {
  const { t } = useI18n();
  return (
    <AppStack.Navigator screenOptions={defaultScreenOptions}>
      <AppStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <AppStack.Screen name="ChildInfo" component={ChildInfoScreen} options={{ title: t('appnav.child_info') }} />
      <AppStack.Screen name="BeforeArrived" component={BeforeScreen} options={{ title: t('appnav.before') }} />
      <AppStack.Screen name="BirthStory" component={BirthStoryScreen} options={{ title: t('appnav.birth_story') }} />
      <AppStack.Screen name="BirthDay" component={BirthDayScreen} options={{ title: t('appnav.birth_day') }} />
      <AppStack.Screen name="Moments" component={MomentsScreen} options={{ title: t('appnav.moments') }} />
      <AppStack.Screen name="Galleries" component={GalleriesScreen} options={{ title: t('appnav.galleries') }} />
      <AppStack.Screen name="Circles" component={CirclesScreen} options={{ title: t('appnav.contacts') }} />
      <AppStack.Screen name="GalleryDetail" component={GalleryDetailScreen} options={{ title: t('appnav.gallery') }} />
      <AppStack.Screen name="Journey" component={JourneyScreen} options={{ title: t('appnav.journey') }} />
      <AppStack.Screen name="ComingHome" component={ComingHomeScreen} options={{ title: t('appnav.coming_home') }} />
      <AppStack.Screen name="Months" component={MonthsScreen} options={{ title: t('appnav.months') }} />
      <AppStack.Screen
        name="MonthDetail"
        component={MonthDetailScreen}
        options={({ route }) => ({ title: t('appnav.month_detail', { label: route.params?.monthLabel || '' }) })}
      />
      <AppStack.Screen name="OurFamily" component={FamilyScreen} options={{ title: t('appnav.our_family') }} />
      <AppStack.Screen
        name="FamilyMember"
        component={FamilyMemberScreen}
        options={({ route }) => ({ title: route.params?.memberName || t('appnav.family_member_default') })}
      />
      <AppStack.Screen name="YourFirsts" component={FirstsScreen} options={{ title: t('appnav.firsts') }} />
      <AppStack.Screen name="Celebrations" component={CelebrationsScreen} options={{ title: t('appnav.celebrations') }} />
      <AppStack.Screen name="CelebrationYear" component={CelebrationYearScreen} options={{ title: t('appnav.celebrations') }} />
      <AppStack.Screen name="CelebrationDetail" component={CelebrationDetailScreen} options={{ title: t('appnav.celebration') }} />
      <AppStack.Screen name="Letters" component={LettersScreen} options={{ title: t('appnav.letters') }} />
      <AppStack.Screen name="FamilyRecipes" component={RecipesScreen} options={{ title: t('appnav.recipes') }} />
      <AppStack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: t('appnav.recipe') }} />
      <AppStack.Screen name="Keepsakes" component={KeepsakesScreen} options={{ title: t('appnav.keepsakes') }} />
      <AppStack.Screen name="KeepsakeDetail" component={KeepsakeDetailScreen} options={{ title: t('appnav.keepsake') }} />
      <AppStack.Screen name="TheVault" component={VaultScreen} options={{ title: t('appnav.vault') }} />
      <AppStack.Screen name="ManageSections" component={ManageSectionsScreen} options={{ title: t('appnav.manage_sections') }} />
      <AppStack.Screen name="NewWebsite" component={NewWebsiteScreen} options={{ title: t('appnav.new_website') }} />
      <AppStack.Screen name="Settings" component={SettingsScreen} options={{ title: t('appnav.settings') }} />
      <AppStack.Screen name="Help" component={HelpScreen} options={{ title: t('appnav.help') }} />
      <AppStack.Screen name="Preview" component={PreviewScreen} options={{ title: t('appnav.preview'), headerRight: null }} />
      <AppStack.Screen name="AdditionalDomain" component={AdditionalDomainScreen} options={{ title: t('appnav.additional_domain') }} />
    </AppStack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!isAuthenticated) return <AuthNavigator />;

  // Baby Book is the only product. (Family Album retired.)
  return <AppNavigator />;
}

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  return (
    <I18nProvider>
    <AuthProvider>
      <UploadProvider>
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
      </UploadProvider>
    </AuthProvider>
    </I18nProvider>
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
