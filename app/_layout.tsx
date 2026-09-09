import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';

import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
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

  return (
    <AuthProvider>
      <MainContent fontsLoaded={loaded} fontError={error} />
    </AuthProvider>
  );
}

function MainContent({ fontsLoaded, fontError }: { fontsLoaded: boolean; fontError: Error | null }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (!fontsLoaded || loading) return;

    SplashScreen.hideAsync();
  }, [fontsLoaded, loading]);

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

  if (!fontsLoaded || loading) {
    return null;
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