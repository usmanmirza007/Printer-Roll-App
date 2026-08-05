import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { registerFCMToken, requestNotificationPermission, showForegroundNotification, updateBadgeCountOnServer } from '@/constants/NotificationService';
import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
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
  useEffect(() => {
    async function init() {
      // Create Android notification channel
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        badge: true,
        sound: 'default',
      });

      // Request badge permission (especially important for iOS)
      try {
        await notifee.requestPermission({ badge: true });
        console.log('✅ Badge permission requested');
      } catch (error) {
        console.error('❌ Error requesting badge permission:', error);
      }
    }

    init();
  }, []);

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // 1. Request permission
        const hasPermission = await requestNotificationPermission();
        console.log('hasPermission', hasPermission);

        if (!hasPermission) {
          console.log('❌ Notification permissions denied');
          return;
        }

        console.log('✅ Notification permissions granted');

        // 2. Background message handler
        messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
          console.log('Message handled in the background!', remoteMessage);

          try {
            await notifee.incrementBadgeCount(1);
            const badgeCount = await notifee.getBadgeCount();
            console.log('✅ Background badge count updated to:', badgeCount);
          } catch (error) {
            console.error('❌ Error updating background badge count:', error);
          }
        });

        // 3. Foreground message handler
        const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
          showForegroundNotification(remoteMessage);
        });

        // 4. Notification opened from background
        messaging().onNotificationOpenedApp(async (remoteMessage: any) => {
          console.log('Notification caused app to open from background:', remoteMessage);

          if (Platform.OS === 'ios' && user?.uid) {
            await updateBadgeCountOnServer(
              user.uid,
              1,
              (user as any)?.stsTokenManager?.accessToken
            );
          }
        });

        // 5. Notification opened from quit state
        messaging()
          .getInitialNotification()
          .then((msg: any) => {
            if (msg) {
              console.log('Notification caused app to open from quit state:', msg);

              if (Platform.OS === 'ios' && user?.uid) {
                updateBadgeCountOnServer(
                  user.uid,
                  1,
                  (user as any)?.stsTokenManager?.accessToken
                );
              }
            }
          })
          .catch((e) => {
            console.log('Error handling initial notification', e);
          });

        // 6. Register FCM Token to your server
        if (user?.uid && user?.email) {
          await registerFCMToken(
            user.uid,
            user.email,
            (user as any)?.stsTokenManager?.accessToken
          );
        }

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
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
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
