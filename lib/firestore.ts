import { CUSTOMERS_COLLECTION, CUSTOMERS_ORDER_COLLECTION, NOTIFICATIONS_COLLECTION, ROLLS_COLLECTION } from '@/constants/environment';
import { db } from '@/lib/firebase';
import {
  DEFAULT_CUSTOMERS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ROLLS
} from '@/lib/storage';
import { AppNotification, Customer, CustomerOrder, ThermalRoll } from '@/lib/types';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

/**
 * Fetch all customers from Firestore.
 */
export async function getCustomersFromFirestore(): Promise<Customer[]> {
  try {
    const colRef = collection(db, CUSTOMERS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('⚡ Firestore customers collection empty. Seeding defaults...');
      return []
    }

    const customers: Customer[] = [];
    snapshot.forEach((d) => {
      customers.push({ id: d.id, ...d.data() } as Customer);
    });
    return customers;
  } catch (error) {
    console.error('❌ Error fetching customers from Firestore:', error);
    return [];
  }
}

export async function getCustomerByIdFromFirestore(customerId: string): Promise<Customer | null> {
  try {
    const docRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Customer;
    }
    return null; // Customer not found
  } catch (error) {
    console.error('❌ Error fetching customer by ID:', error);
    return null;
  }
}
export async function getCustomerOrderByIdFromFirestore(customerOrderId: string): Promise<CustomerOrder | null> {
  try {
    const docRef = doc(db, CUSTOMERS_ORDER_COLLECTION, customerOrderId);
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as CustomerOrder;
    }
    return null; // Customer order not found
  } catch (error) {
    console.error('❌ Error fetching customer order by ID:', error);
    return null;
  }
}
/**
 * Fetch all customer orders from Firestore.
 */
export async function getCustomerOrdersFromFirestore(
  customerId: string
): Promise<CustomerOrder[]> {
  try {
    if (!customerId) return [];

    const q = query(
      collection(db, CUSTOMERS_ORDER_COLLECTION),
      where('customerId', '==', customerId)
    );

    const snapshot = await getDocs(q);

    const orders: CustomerOrder[] = [];
    snapshot.forEach((d) => {
      orders.push({
        id: d.id,
        ...d.data(),
      } as CustomerOrder);
    });

    return orders;
  } catch (error) {
    console.error('❌ Error fetching customer orders:', error);
    return [];
  }
}

// Fetch all orders from Firestore (for admin view)
export async function getOrdersFromFirestore(): Promise<CustomerOrder[]> {
  try {
    const colRef = collection(db, CUSTOMERS_ORDER_COLLECTION); // ← now using customers orders collection
    const snapshot = await getDocs(colRef);

    // Collection empty → seed defaults
    if (snapshot.empty) {
      console.log('⚡ Customers orders collection is empty. Seeding default orders...');

    }

    // Collection has data
    const customers: CustomerOrder[] = [];
    snapshot.forEach((d) => {
      customers.push({
        id: d.id,
        ...d.data(),
      } as CustomerOrder);
    });

    return customers;
  } catch (error) {
    console.error('❌ Error fetching customers from Firestore:', error);
    return []; // ← return default orders on error

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
      console.log('⚡ Firestore rolls collection empty. Seeding defaults... rolls');
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
    return [];
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
 * Save or update a thermal roll order record in Firestore.
 */
export async function saveRollOrderToFirestore(customerOrder: CustomerOrder): Promise<CustomerOrder[]> {
  try {
    const docRef = doc(db, CUSTOMERS_ORDER_COLLECTION, customerOrder.id);
    await setDoc(docRef, customerOrder, { merge: true });
    return await getCustomerOrdersFromFirestore(customerOrder.customerId);
  } catch (error) {
    console.error('❌ Error saving roll order to Firestore:', error);
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
 */
export async function getNotificationsFromFirestore(): Promise<AppNotification[]> {
  try {
    const colRef = collection(db, NOTIFICATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.log('⚡ Firestore notifications collection empty. Seeding defaults...');
      return [];
    }

    const notifications: AppNotification[] = [];
    snapshot.forEach((d) => {
      notifications.push({ id: d.id, ...d.data() } as AppNotification);
    });

    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return notifications;
  } catch (error) {
    console.error('❌ Error fetching notifications from Firestore:', error);
    return [];
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
