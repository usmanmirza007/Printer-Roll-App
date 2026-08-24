// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {
//   AuthorizationStatus,
//   getInitialNotification,
//   getMessaging,
//   getToken,
//   onMessage,
//   onNotificationOpenedApp,
//   registerDeviceForRemoteMessages,
//   requestPermission,
//   setBackgroundMessageHandler,
// } from '@react-native-firebase/messaging';
// import { Alert, PermissionsAndroid, Platform } from 'react-native';
// import notifee, { AndroidBadgeIconType, AndroidImportance } from 'react-native-notify-kit';

// const messaging = getMessaging();

// let navigationRef: any = null;
// const API_URL = 'https://ozchat-bb236cfd06d9.herokuapp.com/api';
// // const API_URL = 'https://b417a0e242a7.ngrok-free.app/api';

// /**
//  * ✅ Set navigation reference (for deep linking)
//  */
// export function setNotificationNavigation(navigation: any) {
//   navigationRef = navigation;
// }

// // ✅ Register ONLY ONCE at module level
// setBackgroundMessageHandler(messaging, async (remoteMessage) => {
//   console.log('Background message:', remoteMessage);
//   try {
//     // await notifee.incrementBadgeCount(1);
//   } catch (e) {
//     console.log('Badge error:', e);
//   }
// });

// /**
//  * ✅ Request Push Notification Permission
//  */
// export async function requestNotificationPermission() {
//   try {
//     if (Platform.OS === 'android') {
//       const grant = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
//       );
//       return grant === PermissionsAndroid.RESULTS.GRANTED;
//     }

//     // iOS
//     const authStatus = await requestPermission(messaging, {
//       alert: true,
//       badge: true,
//       sound: true,
//     });

//     const enabled =
//       authStatus === AuthorizationStatus.AUTHORIZED ||
//       authStatus === AuthorizationStatus.PROVISIONAL;

//     if (enabled) {
//       try {
//         // await notifee.requestPermission({ badge: true });
//         console.log('✅ iOS badge permission requested');
//       } catch (badgeError) {
//         console.error('❌ Error requesting iOS badge permission:', badgeError);
//       }
//     }

//     return enabled;
//   } catch (err) {
//     console.error('❌ Permission Error:', err);
//     return false;
//   }
// }

// /**
//  * ✅ Get FCM Token
//  */
// export async function getFCMToken() {
//   try {
//     await registerDeviceForRemoteMessages(messaging);
//     const token = await getToken(messaging);

//     if (token) {
//       console.log('✅ FCM Token:', token.substring(0, 20) + '...');
//       await AsyncStorage.setItem('fcmToken', token);
//     }
//     return token;
//   } catch (err) {
//     console.error('❌ Token Error:', err);
//     return null;
//   }
// }

// /**
//  * ✅ Register token to backend
//  */
// export async function registerFCMToken(
//   uid: string,
//   email: string,
//   accessToken?: string
// ) {
//   try {
//     const fcmToken = await getFCMToken();
//     if (!fcmToken) return false;

//     const response = await fetch(`${API_URL}/register-device`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({
//         deviceToken: fcmToken,
//         uid,
//         email,
//       }),
//     });

//     const result = await response.json();
//     console.log('Register Result:', result);

//     return fcmToken;
//   } catch (err) {
//     Alert.alert('Error', 'Failed to register device for notifications.');
//     console.error('❌ Register Error:', err);
//     return false;
//   }
// }

// /**
//  * ✅ Send push notification via backend
//  */
// export async function sendPushNotification(
//   accessToken: string,
//   title: string,
//   body: string,
//   uid: string
// ) {
//   try {
//     const response = await fetch(`${API_URL}/send-notification`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({
//         title,
//         body,
//         uid,
//       }),
//     });

//     const result = await response.json();
//     console.log('Send Notification Result:', result);
//   } catch (err) {
//     console.error('❌ Send Notification Error:', err);
//   }
// }

// /**
//  * Trigger local notification + FCM push when visit ends
//  */
// export async function triggerVisitEndPushNotification(
//   shopName: string,
//   nextVisitDate: string,
//   uid?: string,
//   accessToken?: string
// ) {
//   const title = `Visit Logged: ${shopName}`;
//   const body = `Next visit scheduled for ${nextVisitDate}. Thermal roll order status updated.`;

//   try {
//     await notifee.displayNotification({
//       title,
//       body,
//       android: {
//         channelId: 'default',
//         importance: AndroidImportance.HIGH,
//         pressAction: { id: 'default' },
//       },
//       ios: {
//         foregroundPresentationOptions: {
//           alert: true,
//           badge: true,
//           sound: true,
//         },
//       },
//     });

//     if (uid && accessToken) {
//       await sendPushNotification(accessToken, title, body, uid);
//     }
//   } catch (err) {
//     console.error('Error triggering visit end push notification:', err);
//   }
// }

// /**
//  * ✅ Handle foreground notifications
//  */
// export async function showForegroundNotification(remoteMessage: any) {
//   const { notification } = remoteMessage;
//   console.log('remoteMessage', remoteMessage);

//   await notifee.displayNotification({
//     title: notification?.title || 'New Message',
//     body: notification?.body || 'You have a new notification',
//     android: {
//       channelId: 'default',
//       importance: AndroidImportance.HIGH,
//       pressAction: { id: 'default' },
//       largeIcon: 'ic_launchers_round',
//       badgeIconType: AndroidBadgeIconType.LARGE,
//     },
//     ios: {
//       foregroundPresentationOptions: {
//         alert: true,
//         badge: true,
//         sound: true,
//       },
//     },
//     data: {},
//   });
// }

// /**
//  * ✅ Handle navigation when notification is pressed
//  */
// export function handleNotificationNavigation(remoteMessage: any, user: any) {
//   if (remoteMessage && Platform.OS === 'ios' && user?.uid) {
//     updateBadgeCountOnServer(
//       user.uid,
//       1,
//       (user as any)?.stsTokenManager?.accessToken
//     );
//   }
//   if (!navigationRef) return;

//   const { data } = remoteMessage;
//   if (!data) {
//     navigationRef.navigate('Notifications');
//     return;
//   }

//   switch (data.type) {
//     case 'document_expiring':
//       navigationRef.navigate('Documents', {
//         documentId: data.sourceId,
//         highlightDocument: true,
//       });
//       break;
//     default:
//       navigationRef.navigate('Notifications');
//   }
// }

// /**
//  * ✅ Clear listeners (optional)
//  */
// export function cleanupNotificationListeners() {
//   console.log('✅ Notification listeners cleaned');
// }

// /**
//  * ✅ Update badge count on server
//  */
// export async function updateBadgeCountOnServer(
//   uid: string,
//   badgeCount: number,
//   accessToken: string
// ) {
//   if (!uid) {
//     console.log('⚠️ Cannot update badge count: No UID provided');
//     return;
//   }

//   try {
//     console.log(`🔄 Updating server badge count to ${badgeCount}`);
//     const response = await fetch(`${API_URL}/decrement-badge`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({ uid, badgeCount }),
//     });

//     if (!response.ok) {
//       console.error('❌ Server returned error for badge update:', response.status);
//     } else {
//       console.log('✅ Server badge update successful');
//     }
//   } catch (error) {
//     console.error('❌ Failed to update badge count on server', error);
//   }
// }

// /**
//  * ✅ Reset Badge Count (Local + Server)
//  */
// export async function resetAppBadge(uid: string, accessToken: string) {
//   try {
//     console.log('🔄 Resetting server badge count');
//     const response = await fetch(`${API_URL}/reset-badge`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         Authorization: `Bearer ${accessToken}`,
//       },
//       body: JSON.stringify({ uid }),
//     });

//     if (!response.ok) {
//       console.error('❌ Server returned error for badge reset:', response.status);
//     } else {
//       // await notifee.setBadgeCount(0);
//       console.log('✅ Server badge reset successful');
//     }
//   } catch (error) {
//     console.error('❌ Error resetting app badge:', error);
//   }
// }

// /**
//  * ✅ Register background + foreground listeners
//  * Call this once (preferably in root _layout.tsx)
//  */
// export function setupNotificationListeners(user: any) {

//   // Foreground messages
//   const unsubscribeOnMessage = onMessage(messaging, async (remoteMessage) => {
//     await showForegroundNotification(remoteMessage);
//   });

//   // App opened from background
//   const unsubscribeOpened = onNotificationOpenedApp(messaging, (remoteMessage) => {
//     handleNotificationNavigation(remoteMessage, user);
//   });

//   // App opened from quit state
//   getInitialNotification(messaging).then((remoteMessage) => {
//     if (remoteMessage) {
//       handleNotificationNavigation(remoteMessage, user);
//     }
//   });

//   if (user?.uid && user?.email) {
//     registerFCMToken(
//       user.uid,
//       user.email,
//       (user as any)?.stsTokenManager?.accessToken
//     ).catch((err) => {
//       console.error('Failed to register FCM token:', err);
//     });
//   }

//   return () => {
//     unsubscribeOnMessage();
//     unsubscribeOpened();
//   };
// }