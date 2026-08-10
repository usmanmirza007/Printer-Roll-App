import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  // @ts-ignore
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyA8ROVWQm-tOozj6EV-B0V0I6eidyHoRr0",
  authDomain: "printer-app-169a3.firebaseapp.com",
  projectId: "printer-app-169a3",
  storageBucket: "printer-app-169a3.firebasestorage.app",
  messagingSenderId: "44971042835",
  appId: "1:44971042835:web:98aa76241934e1c52677e6",
  measurementId: "G-3YG1DDHP97"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  // Auth already initialized (hot reload)
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
