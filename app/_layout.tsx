import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
export { ErrorBoundary } from 'expo-router';
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // ✅ Early return hata diya — hamesha same structure
  return (
    <AuthProvider>
      {!loaded ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <MainContent />
      )}
    </AuthProvider>
  );
}

function MainContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // useEffect(() => {
  //   async function initChannel() {
  //     try {
  //       await notifee.createChannel({
  //         id: 'default',
  //         name: 'Default Channel',
  //         importance: AndroidImportance.HIGH,
  //         badge: true,
  //         sound: 'default',
  //       });
  //       await notifee.requestPermission({ badge: true });
  //     } catch (e) {
  //       console.error('Error setting up notification channel:', e);
  //     }
  //   }
  //   initChannel();
  // }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  // useEffect(() => {
  //   if (!user) return;

  //   const unsubscribe = setupNotificationListeners(user);

  //   return () => {
  //     unsubscribe();
  //   };
  // }, [user]);

  // Auth loading ke time bhi same component tree rakho
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider
      value={(colorScheme === 'dark' ? DarkTheme : DefaultTheme) as unknown as ReactNavigation.Theme}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}