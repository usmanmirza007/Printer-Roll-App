import { db } from '@/lib/firebase';
import {
  DEFAULT_CUSTOMERS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ROLLS,
  getTodayDateString,
} from '@/lib/storage';
import { AppNotification, Customer, ThermalRoll } from '@/lib/types';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from 'firebase/firestore';

const CUSTOMERS_COLLECTION = 'customers';
const ROLLS_COLLECTION = 'rolls';
const NOTIFICATIONS_COLLECTION = 'notifications';

/**
 * Fetch all customers from Firestore.
 * Auto-seeds DEFAULT_CUSTOMERS if collection is empty.
 */
export async function getCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const colRef = collection(db, CUSTOMERS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('⚡ Firestore customers collection empty. Seeding defaults...');
      for (const cust of DEFAULT_CUSTOMERS) {
        await setDoc(doc(db, CUSTOMERS_COLLECTION, cust.id), cust);
      }
      return DEFAULT_CUSTOMERS;
    }

    const customers: Customer[] = [];
    snapshot.forEach((d) => {
      customers.push({ id: d.id, ...d.data() } as Customer);
    });
    return customers;
  } catch (error) {
    console.error('❌ Error fetching customers from Firestore:', error);
    return DEFAULT_CUSTOMERS;
  }
}

/**
 * Save or update a customer record in Firestore.
 */
export async function saveCustomerToFirestore(customer: Customer): Promise<Customer[]> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customer.id);
    await setDoc(docRef, customer, { merge: true });
    return await getCustomersFromFirestore();
  } catch (error) {
    console.error('❌ Error saving customer to Firestore:', error);
    return [];
  }
}

/**
 * Delete a customer record from Firestore.
 */
export async function deleteCustomerFromFirestore(id: string): Promise<Customer[]> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, id);
    await deleteDoc(docRef);
    return await getCustomersFromFirestore();
  } catch (error) {
    console.error('❌ Error deleting customer from Firestore:', error);
    return [];
  }
}

/**
 * Fetch all thermal rolls from Firestore.
 * Auto-seeds DEFAULT_ROLLS if collection is empty.
 */
export async function getRollsFromFirestore(): Promise<ThermalRoll[]> {
  try {
    const colRef = collection(db, ROLLS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('⚡ Firestore rolls collection empty. Seeding defaults...');
      for (const roll of DEFAULT_ROLLS) {
        await setDoc(doc(db, ROLLS_COLLECTION, roll.id), roll);
      }
      return DEFAULT_ROLLS;
    }

    const rolls: ThermalRoll[] = [];
    snapshot.forEach((d) => {
      rolls.push({ id: d.id, ...d.data() } as ThermalRoll);
    });
    return rolls;
  } catch (error) {
    console.error('❌ Error fetching rolls from Firestore:', error);
    return DEFAULT_ROLLS;
  }
}

/**
 * Save or update a thermal roll record in Firestore.
 */
export async function saveRollToFirestore(roll: ThermalRoll): Promise<ThermalRoll[]> {
  try {
    const docRef = doc(db, ROLLS_COLLECTION, roll.id);
    await setDoc(docRef, roll, { merge: true });
    return await getRollsFromFirestore();
  } catch (error) {
    console.error('❌ Error saving roll to Firestore:', error);
    return [];
  }
}

/**
 * Delete a thermal roll record from Firestore.
 */
export async function deleteRollFromFirestore(id: string): Promise<ThermalRoll[]> {
  try {
    const docRef = doc(db, ROLLS_COLLECTION, id);
    await deleteDoc(docRef);
    return await getRollsFromFirestore();
  } catch (error) {
    console.error('❌ Error deleting roll from Firestore:', error);
    return [];
  }
}

/**
 * Fetch all notifications from Firestore.
 * Auto-seeds DEFAULT_NOTIFICATIONS if empty.
 */
export async function getNotificationsFromFirestore(): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('⚡ Firestore notifications collection empty. Seeding defaults...');
      for (const notif of DEFAULT_NOTIFICATIONS) {
        await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), notif);
      }
      return DEFAULT_NOTIFICATIONS;
    }

    const notifications: AppNotification[] = [];
    snapshot.forEach((d) => {
      notifications.push({ id: d.id, ...d.data() } as AppNotification);
    });

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications from Firestore:', error);
    return DEFAULT_NOTIFICATIONS;
  }
}

/**
 * Save a single notification or batch save notifications to Firestore.
 */
export async function saveNotificationToFirestore(notif: AppNotification): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notif.id);
    await setDoc(docRef, notif, { merge: true });
  } catch (error) {
    console.error('❌ Error saving notification to Firestore:', error);
  }
}

/**
 * Force re-seed default data into Firestore.
 */
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    for (const cust of DEFAULT_CUSTOMERS) {
      await setDoc(doc(db, CUSTOMERS_COLLECTION, cust.id), cust);
    }
    for (const roll of DEFAULT_ROLLS) {
      await setDoc(doc(db, ROLLS_COLLECTION, roll.id), roll);
    }
    for (const notif of DEFAULT_NOTIFICATIONS) {
      await setDoc(doc(db, NOTIFICATIONS_COLLECTION, notif.id), notif);
    }
    console.log('✅ Firestore initial data seed complete!');
  } catch (error) {
    console.error('❌ Error seeding initial Firestore data:', error);
  }
}
