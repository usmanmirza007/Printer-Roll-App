// @ts-nocheck
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from "firebase/auth";
import { getDatabase, serverTimestamp } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- keep your same config here ---
const firebaseConfig = {
  apiKey: "AIzaSyA8ROVWQm-tOozj6EV-B0V0I6eidyHoRr0",
  authDomain: "printer-app-169a3.firebaseapp.com",
  projectId: "printer-app-169a3",
  storageBucket: "printer-app-169a3.firebasestorage.app",
  messagingSenderId: "44971042835",
  appId: "1:44971042835:web:98aa76241934e1c52677e6",
  measurementId: "G-3YG1DDHP97"
};

// Ensure a single app instance across hot reloads
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Ensure a single Auth instance with RN persistence
let _auth: Auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // If already initialized, just get the existing one
  _auth = getAuth(app);
}
export const auth = _auth;

// Other services
export const realDB = getDatabase(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// export const messaging = new Messaging(app);
// messaging().useDeviceToken();
// messaging().onMessage((payload) => {
//   console.log("Message received. ", payload);
//   // Handle the message as needed
// });
export { serverTimestamp };
