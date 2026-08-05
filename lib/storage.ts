import { triggerVisitEndPushNotification } from '@/constants/NotificationService';
import {
  deleteCustomerFromFirestore,
  deleteRollFromFirestore,
  getCustomersFromFirestore,
  getNotificationsFromFirestore,
  getRollsFromFirestore,
  saveCustomerToFirestore,
  saveNotificationToFirestore,
  saveRollToFirestore,
} from '@/lib/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, Customer, SalesOrder, ThermalRoll } from './types';

const CUSTOMERS_KEY = '@thermal_roll_customers_v1';
const ROLLS_KEY = '@thermal_roll_rolls_v1';
const NOTIFICATIONS_KEY = '@thermal_roll_notifications_v1';

// Helper to get formatted date string (YYYY-MM-DD)
export const getTodayDateString = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// Initial thermal roll data based on user requirements
export const DEFAULT_ROLLS: ThermalRoll[] = [
  {
    id: 'roll-40m',
    title: '40 Meter Thermal Roll',
    meterLength: 40,
    paperWidth: '80mm Standard POS',
    purchaseRate: 120,
    wholesaleRate: 140,
    stockCount: 50,
    minStockAlert: 15,
    description: 'High sensitivity thermal paper roll for POS receipt printers.',
  },
  {
    id: 'roll-50m',
    title: '50 Meter Thermal Roll',
    meterLength: 50,
    paperWidth: '80mm Premium POS',
    purchaseRate: 150,
    wholesaleRate: 175,
    stockCount: 40,
    minStockAlert: 10,
    description: 'Premium quality 50m thermal paper roll with clear dark image quality.',
  },
  {
    id: 'roll-60m',
    title: '60 Meter Thermal Roll',
    meterLength: 60,
    paperWidth: '80mm Heavy Duty',
    purchaseRate: 180,
    wholesaleRate: 210,
    stockCount: 35,
    minStockAlert: 10,
    description: 'Heavy duty 60m paper roll for high volume retail checkout counters.',
  },
  {
    id: 'roll-80m',
    title: '80 Meter Thermal Roll',
    meterLength: 80,
    paperWidth: '80mm Jumbo Roll',
    purchaseRate: 240,
    wholesaleRate: 280,
    stockCount: 30,
    minStockAlert: 8,
    description: 'Jumbo 80m thermal roll for busy restaurants and supermarket terminals.',
  },
];

// Initial pre-loaded customers across various market categories
export const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Dr. Tariq Mahmood',
    phone: '+92 300 5551234',
    shopName: 'Al-Shafi Pharmacy',
    location: 'Main Commercial Market, Sector G-9',
    category: 'Pharmacy',
    rollType: '40 Meter',
    purchaseRate: 120,
    saleRate: 135,
    status: 'In Progress',
    createdDate: getTodayDateString(-5),
    revisitDays: 7,
    nextVisitDate: getTodayDateString(2),
    lastVisitDate: getTodayDateString(-5),
    notes: 'Requires 25 rolls every week. Prefers morning deliveries.',
    totalRollsOrdered: 50,
  },
  {
    id: 'cust-2',
    name: 'Muhammad Usman',
    phone: '+92 321 4445678',
    shopName: 'Savour Foods & Restaurant',
    location: 'Food Street, Blue Area',
    category: 'Restaurant',
    rollType: '80 Meter',
    purchaseRate: 240,
    saleRate: 275,
    status: 'Delivered',
    createdDate: getTodayDateString(-10),
    revisitDays: 3,
    nextVisitDate: getTodayDateString(0),
    lastVisitDate: getTodayDateString(-3),
    notes: 'Busy restaurant terminal. Pays cash on delivery.',
    totalRollsOrdered: 120,
  },
  {
    id: 'cust-3',
    name: 'Shahid Khan',
    phone: '+92 333 9876543',
    shopName: 'Outfitters Clothing Outlet',
    location: 'Centaurus Mall 2nd Floor',
    category: 'Cloth Brand',
    rollType: '50 Meter',
    purchaseRate: 150,
    saleRate: 170,
    status: 'Pending',
    createdDate: getTodayDateString(-2),
    revisitDays: 14,
    nextVisitDate: getTodayDateString(12),
    lastVisitDate: getTodayDateString(-2),
    notes: 'Needs official invoice for company account clearance.',
    totalRollsOrdered: 40,
  },
  {
    id: 'cust-4',
    name: 'Ali Raza',
    phone: '+92 312 8887766',
    shopName: 'Burger Lab Fast Food',
    location: 'F-6 Markaz Market',
    category: 'Fast Food',
    rollType: '40 Meter',
    purchaseRate: 120,
    saleRate: 140,
    status: 'Follow-up Required',
    createdDate: getTodayDateString(-1),
    revisitDays: 7,
    nextVisitDate: getTodayDateString(0),
    lastVisitDate: getTodayDateString(-7),
    notes: 'Requested sample roll testing on counter printer.',
    totalRollsOrdered: 30,
  },
];

// Initial notifications
export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'visit_reminder',
    title: 'Shop Visit Due Today',
    message: 'Re-visit Savour Foods & Restaurant (3 days feedback cycle). Check thermal roll stock.',
    customerId: 'cust-2',
    date: new Date().toISOString(),
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-2',
    type: 'visit_reminder',
    title: 'Follow-up Scheduled',
    message: 'Visit Burger Lab Fast Food in F-6 Markaz (7 days feedback cycle).',
    customerId: 'cust-4',
    date: new Date().toISOString(),
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-3',
    type: 'stock_alert',
    title: 'Stock Overview Alert',
    message: '40 Meter Thermal Roll stock is currently at 50 items. Keep stock monitored for peak orders.',
    rollId: 'roll-40m',
    date: new Date().toISOString(),
    isRead: true,
    priority: 'medium',
  },
];

// Load customers from Firestore with AsyncStorage cache fallback
export const loadCustomers = async (): Promise<Customer[]> => {
  try {
    const firestoreData = await getCustomersFromFirestore();
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(firestoreData));
    return firestoreData;
  } catch (error) {
    console.error('Error loading customers:', error);
    const cached = await AsyncStorage.getItem(CUSTOMERS_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_CUSTOMERS;
  }
};

// Save customer (add or edit) in Firestore
export const saveCustomer = async (customer: Customer): Promise<Customer[]> => {
  try {
    const updated = await saveCustomerToFirestore(customer);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
    await generateAutomaticNotifications(updated, await loadRolls());
    return updated;
  } catch (error) {
    console.error('Error saving customer:', error);
    return await loadCustomers();
  }
};

// Delete customer in Firestore
export const deleteCustomer = async (id: string): Promise<Customer[]> => {
  try {
    const updated = await deleteCustomerFromFirestore(id);
    await AsyncStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error deleting customer:', error);
    return await loadCustomers();
  }
};

// Load Thermal Rolls from Firestore
export const loadRolls = async (): Promise<ThermalRoll[]> => {
  try {
    const firestoreData = await getRollsFromFirestore();
    await AsyncStorage.setItem(ROLLS_KEY, JSON.stringify(firestoreData));
    return firestoreData;
  } catch (error) {
    console.error('Error loading rolls:', error);
    const cached = await AsyncStorage.getItem(ROLLS_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_ROLLS;
  }
};

// Save Thermal Roll in Firestore
export const saveRoll = async (roll: ThermalRoll): Promise<ThermalRoll[]> => {
  try {
    const updated = await saveRollToFirestore(roll);
    await AsyncStorage.setItem(ROLLS_KEY, JSON.stringify(updated));
    await generateAutomaticNotifications(await loadCustomers(), updated);
    return updated;
  } catch (error) {
    console.error('Error saving roll:', error);
    return await loadRolls();
  }
};

// Delete roll in Firestore
export const deleteRoll = async (id: string): Promise<ThermalRoll[]> => {
  try {
    const updated = await deleteRollFromFirestore(id);
    await AsyncStorage.setItem(ROLLS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error deleting roll:', error);
    return await loadRolls();
  }
};

// Load Notifications from Firestore
export const loadNotifications = async (): Promise<AppNotification[]> => {
  try {
    const firestoreData = await getNotificationsFromFirestore();
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(firestoreData));
    return firestoreData;
  } catch (error) {
    console.error('Error loading notifications:', error);
    const cached = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return cached ? JSON.parse(cached) : DEFAULT_NOTIFICATIONS;
  }
};

// Save Notifications list
export const saveNotifications = async (notifications: AppNotification[]): Promise<void> => {
  try {
    for (const notif of notifications) {
      await saveNotificationToFirestore(notif);
    }
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications:', error);
  }
};

// Mark Notification as read
export const markNotificationRead = async (id: string): Promise<AppNotification[]> => {
  const notifs = await loadNotifications();
  const updated = notifs.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  await saveNotifications(updated);
  return updated;
};

// Mark all as read
export const markAllNotificationsRead = async (): Promise<AppNotification[]> => {
  const notifs = await loadNotifications();
  const updated = notifs.map((n) => ({ ...n, isRead: true }));
  await saveNotifications(updated);
  return updated;
};

// Record visit completed for a customer -> updates nextVisitDate & triggers Push Notification!
export const recordCustomerVisit = async (
  customerId: string,
  userUid?: string,
  accessToken?: string
): Promise<{ customers: Customer[]; notifications: AppNotification[] }> => {
  const customers = await loadCustomers();
  const custIndex = customers.findIndex((c) => c.id === customerId);
  if (custIndex === -1) return { customers, notifications: await loadNotifications() };

  const cust = customers[custIndex];
  const todayStr = getTodayDateString(0);
  const nextVisitStr = getTodayDateString(cust.revisitDays || 7);

  const updatedCust: Customer = {
    ...cust,
    lastVisitDate: todayStr,
    nextVisitDate: nextVisitStr,
  };

  const newCustomers = await saveCustomerToFirestore(updatedCust);

  // Add confirmation notification
  const notifs = await loadNotifications();
  const visitNotif: AppNotification = {
    id: `visit-log-${Date.now()}`,
    type: 'visit_reminder',
    title: `Visit Logged: ${cust.shopName}`,
    message: `Completed visit today. Next visit scheduled for ${nextVisitStr} (${cust.revisitDays} days cycle).`,
    customerId: cust.id,
    date: new Date().toISOString(),
    isRead: false,
    priority: 'low',
  };

  await saveNotificationToFirestore(visitNotif);
  const updatedNotifs = [visitNotif, ...notifs];

  // Trigger Push Notification for visit time end / completion
  await triggerVisitEndPushNotification(cust.shopName, nextVisitStr, userUid, accessToken);

  return { customers: newCustomers, notifications: updatedNotifs };
};

// Generate Automatic Notifications based on Customer revisit dates and Roll stock alerts
export const generateAutomaticNotifications = async (
  customers: Customer[],
  rolls: ThermalRoll[]
): Promise<AppNotification[]> => {
  let notifs = await loadNotifications();
  const todayStr = getTodayDateString(0);
  let changed = false;

  // 1. Check Customer Revisit Dates
  for (const cust of customers) {
    if (cust.nextVisitDate && cust.nextVisitDate <= todayStr) {
      const existing = notifs.find(
        (n) => n.customerId === cust.id && n.type === 'visit_reminder' && n.message.includes(cust.nextVisitDate)
      );
      if (!existing) {
        const isOverdue = cust.nextVisitDate < todayStr;
        const newNotif: AppNotification = {
          id: `auto-visit-${cust.id}-${cust.nextVisitDate}`,
          type: 'visit_reminder',
          title: isOverdue ? `Overdue Visit: ${cust.shopName}` : `Visit Due Today: ${cust.shopName}`,
          message: `Customer ${cust.name} requested visit every ${cust.revisitDays} days. Scheduled date: ${cust.nextVisitDate}. Location: ${cust.location}`,
          customerId: cust.id,
          date: new Date().toISOString(),
          isRead: false,
          priority: isOverdue ? 'high' : 'medium',
        };
        await saveNotificationToFirestore(newNotif);
        notifs = [newNotif, ...notifs];
        changed = true;
      }
    }
  }

  // 2. Check Low Stock Alerts
  for (const roll of rolls) {
    if (roll.stockCount <= roll.minStockAlert) {
      const existing = notifs.find(
        (n) => n.rollId === roll.id && n.type === 'stock_alert' && !n.isRead
      );
      if (!existing) {
        const newNotif: AppNotification = {
          id: `auto-stock-${roll.id}-${Date.now()}`,
          type: 'stock_alert',
          title: `Low Stock Alert: ${roll.title}`,
          message: `Stock level for ${roll.title} is down to ${roll.stockCount} rolls (Threshold: ${roll.minStockAlert}). Replenish stock soon!`,
          rollId: roll.id,
          date: new Date().toISOString(),
          isRead: false,
          priority: 'high',
        };
        await saveNotificationToFirestore(newNotif);
        notifs = [newNotif, ...notifs];
        changed = true;
      }
    }
  }

  return notifs;
};
