import notifee, { AndroidBadgeIconType, AndroidImportance } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import messaging from '@react-native-firebase/messaging';
import { Alert, PermissionsAndroid, Platform } from 'react-native';

let navigationRef: any = null;
const API_URL = 'https://ozchat-bb236cfd06d9.herokuapp.com/api';
// const API_URL = 'https://b417a0e242a7.ngrok-free.app/api';
/**
 * :white_check_mark: Set navigation reference (for deep linking)
 */
export function setNotificationNavigation(navigation: any) {
  navigationRef = navigation;
}

/**
 * :white_check_mark: Request Push Notification Permission
 */
export async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      const grant = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return grant === 'granted';
    }

    // For iOS, request permission with badge, alert, and sound
    const authStatus = await messaging().requestPermission({
      alert: true,
      badge: true,
      sound: true,
    });

    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    // Also request badge permission via notifee for iOS
    if (enabled) {
      try {
        await notifee.requestPermission({ badge: true });
        console.log(':white_check_mark: iOS badge permission requested');
      } catch (badgeError) {
        console.error(':x: Error requesting iOS badge permission:', badgeError);
      }
    }

    return enabled;
  } catch (err) {
    console.error(':x: Permission Error:', err);
    return false;
  }
}

/**
 * :white_check_mark: Get FCM Token
 */
export async function getFCMToken() {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();

    if (token) {
      console.log(':white_check_mark: FCM Token:', token, token.substring(0, 20) + '...');
      await AsyncStorage.setItem('fcmToken', token);
    }
    return token;
  } catch (err) {
    console.error(':x: Token Error:', err);
    return null;
  }
}

/**
 * :white_check_mark: Register token to backend
 */
export async function registerFCMToken(uid: string, email: string, accesssToken?: string) {
  try {
    const fcmToken = await getFCMToken();
    if (!fcmToken) return false;

    const response = await fetch(
      `${API_URL}/register-device`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accesssToken}` },
        body: JSON.stringify({
          deviceToken: fcmToken,
          uid: uid,
          email: email,
        }),
      }
    );

    const result = await response.json();
    console.log('Register Result:', result);

    return fcmToken
  } catch (err) {
    Alert.alert('Error', 'Failed to register device for notifications.');
    console.error(':x: Register Error:', err);
  }
}
export async function sendPushNotification(accesssToken: string, title: string, body: string, uid: string) {
  try {

    const response = await fetch(
      `${API_URL}/send-notification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accesssToken}` },
        body: JSON.stringify({
          title: title,
          body: body,
          uid: uid,
        }),
      }
    );

    const result = await response.json();
    console.log('Register Result:', result);

} catch (err) {
    console.error(':x: Register Error:', err);
  }
}

/**
 * Trigger local notification and FCM push call when customer visit time ends or is completed
 */
export async function triggerVisitEndPushNotification(
  shopName: string,
  nextVisitDate: string,
  uid?: string,
  accessToken?: string
) {
  const title = `Visit Logged: ${shopName}`;
  const body = `Next visit scheduled for ${nextVisitDate}. Thermal roll order status updated.`;

  try {
    // 1. Display local notification via Notifee
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        pressAction: { id: 'default' },
      },
      ios: {
        foregroundPresentationOptions: { alert: true, badge: true, sound: true },
      },
    });

    // 2. If user UID and access token are available, call backend push API
    if (uid && accessToken) {
      await sendPushNotification(accessToken, title, body, uid);
    }
  } catch (err) {
    console.error('Error triggering visit end push notification:', err);
  }
}


/**
 * :white_check_mark: Handle foreground notifications
 */

export async function showForegroundNotification(remoteMessage: any) {
  const { notification } = remoteMessage;
  console.log('remoteMessage', remoteMessage);

  await notifee.displayNotification({
    title: notification?.title || 'New Message',
    body: notification?.body || 'You have a new notification',
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
      pressAction: { id: 'default' },
      largeIcon: 'ic_launchers_round',
      badgeIconType: AndroidBadgeIconType.LARGE,
    },
    ios: {
      foregroundPresentationOptions: {
        alert: true,
        badge: true,
        sound: true,
      },
    },
    data: {

    }

  });
}

/**
 * :white_check_mark: Handle navigation when notification pressed
 */
export function handleNotificationNavigation(remoteMessage: any) {
  if (!navigationRef) return;

  const { data } = remoteMessage;
  if (!data) {
    navigationRef.navigate('Notifications');
    return;
  }

  switch (data.type) {
    case 'document_expiring':
      navigationRef.navigate('Documents', {
        documentId: data.sourceId,
        highlightDocument: true,
      });
      break;
    default:
      navigationRef.navigate('Notifications');
  }
}

/**
 * :white_check_mark: Clear listeners (optional)
 */
export function cleanupNotificationListeners() {
  console.log(':white_check_mark: Notification listeners cleaned');
}

/**
 * :white_check_mark: Update badge count on server
 */
export async function updateBadgeCountOnServer(uid: string, badgeCount: number, accesssToken: string) {
  if (!uid) {
    console.log(':warning: Cannot update badge count: No UID provided');
    return;
  }

  try {
    await notifee.decrementBadgeCount(1)

    console.log(`:arrows_counterclockwise: Updating server badge count to ${badgeCount}`);
    const response = await fetch(`${API_URL}/decrement-badge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accesssToken}` },
      body: JSON.stringify({ uid, badgeCount })
    });

    if (!response.ok) {
      console.error(':x: Server returned error for badge update:', response.status);
    } else {
      console.log(':white_check_mark: Server badge update successful');
    }
  } catch (error) {
    console.error(':x: Failed to update badge count on server', error);
  }
}

/**
 * :white_check_mark: Reset Badge Count (Local + Server)
 * This is the SINGLE generic handler for app opens.
 */
export async function resetAppBadge(uid: string, accesssToken: string) {
  try {
    // 1. Reset iOS local badge
    try {

      console.log(`:arrows_counterclockwise: Updating server badge count`);
      const response = await fetch(`${API_URL}/reset-badge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accesssToken}` },
        body: JSON.stringify({ uid })
      });

      if (!response.ok) {
        console.error(':x: Server returned error for badge update:', response.status);
      } else {
        await notifee.setBadgeCount(0)
        console.log(':white_check_mark: Server badge update successful');
      }
    } catch (error) {
      console.error(':x: Failed to update badge count on server', error);
    }

  } catch (error) {
    console.error(':x: Error resetting app badge:', error);
  }
}