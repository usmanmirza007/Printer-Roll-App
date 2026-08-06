import { useColorScheme } from '@/components/useColorScheme';
import {
  registerFCMToken,
  requestNotificationPermission,
  showForegroundNotification,
  updateBadgeCountOnServer,
} from '@/constants/NotificationService';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import notifee, { AndroidImportance } from '@notifee/react-native';
// @ts-ignore
import messaging from '@react-native-firebase/messaging';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
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

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}

function MainContent() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    async function initChannel() {
      try {
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
          badge: true,
          sound: 'default',
        });
        await notifee.requestPermission({ badge: true });
      } catch (e) {
        console.error('Error setting up notification channel:', e);
      }
    }
    initChannel();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  useEffect(() => {
    if (!user) return;

    const initializeNotifications = async () => {
      try {
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) return;

        messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
          try {
            await notifee.incrementBadgeCount(1);
          } catch (e) { }
        });

        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
          showForegroundNotification(remoteMessage);
        });

        messaging().onNotificationOpenedApp(async (remoteMessage: any) => {
          if (Platform.OS === 'ios' && user?.uid) {
            await updateBadgeCountOnServer(
              user.uid,
              1,
              (user as any)?.stsTokenManager?.accessToken
            );
          }
        });

        messaging()
          .getInitialNotification()
          .then((msg: any) => {
            if (msg && Platform.OS === 'ios' && user?.uid) {
              updateBadgeCountOnServer(
                user.uid,
                1,
                (user as any)?.stsTokenManager?.accessToken
              );
            }
          });

        if (user.uid && user.email) {
          await registerFCMToken(
            user.uid,
            user.email,
            (user as any)?.stsTokenManager?.accessToken
          );
        }

        return unsubscribe;
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, [user]);

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}