import { triggerVisitEndPushNotification } from '@/constants/NotificationService';
import {
  deleteCustomerFromFirestore,
  deleteRollFromFirestore,
  deleteRollOrderFromFirestore,
  getCustomerByIdFromFirestore,
  getCustomerOrderByIdFromFirestore,
  getCustomerOrdersFromFirestore,
  getCustomersFromFirestore,
  getNotificationsFromFirestore,
  getRollsFromFirestore,
  saveCustomerToFirestore,
  saveNotificationToFirestore,
  saveRollOrderToFirestore,
  saveRollToFirestore,
  updateRollOrderToFirestore,
} from '@/lib/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, Customer, CustomerOrder, ThermalRoll } from './types';

const CUSTOMERS_KEY = '@thermal_roll_customers_v1';
const CUSTOMERS_ORDER_KEY = '@thermal_roll_customers_orders_v1';
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
  {
    id: 'barcode-38x28',
    title: '38 * 28 BarCode Stickers',
    productType: 'barcode',
    meterLength: 0,
    paperWidth: '38mm x 28mm',
    stickerWidth: 38,
    stickerHeight: 28,
    stickerCount: 4000,
    barcodeColumns: 2,
    purchaseRate: 260,
    wholesaleRate: 350,
    stockCount: 20,
    minStockAlert: 5,
    description: '38 x 28mm barcode stickers, 4000 stickers per roll.',
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
    orderCount: 2,
    purchaseRate: 120,
    saleRate: 135,
    status: 'Active',
    createdDate: getTodayDateString(-5),
    revisitDays: 7,
    nextVisitDate: getTodayDateString(2),
    lastVisitDate: getTodayDateString(-5),
    notes: 'Requires 25 rolls every week. Prefers morning deliveries.',
    totalRollsOrdered: 50,
  },
  
];
export const DEFAULT_CUSTOMERS_ORDERS: CustomerOrder[] = [
  {
    id: 'cust-1',
    customerId: 'cust-1',
    orderDate: getTodayDateString(-5),
    profit: 15,
    buisnessName: 'ABC Store',
    quantity: 25,
    rollId: 'roll-40m',
    rollType: '40 Meter',
    status: 'In Progress',
    totalCost: 3000,
    totalSale: 3375,
    unitCostRate: 120,
    unitSaleRate: 135,
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
    return cached ? JSON.parse(cached) : [];
  }
};

export const loadSingleCustomer = async (id: string): Promise<Customer | null> => {
  try {
    const firestoreData = await getCustomerByIdFromFirestore(id);
    return firestoreData;
  } catch (error) {
    console.error('Error loading single customer:', error);
    return null;
  }
};

export const loadSingleOrder = async (orderId: string): Promise<CustomerOrder | null> => {
  try {
    const firestoreData = await getCustomerOrderByIdFromFirestore(orderId);
    return firestoreData;
  } catch (error) {
    console.error('Error loading single customer order:', error);
    return null;
  }
};

// Load customers from Firestore with AsyncStorage cache fallback
export const loadCustomersOrder = async (customerId: string): Promise<CustomerOrder[]> => {
  try {
    const firestoreData = await getCustomerOrdersFromFirestore(customerId);
    await AsyncStorage.setItem(CUSTOMERS_ORDER_KEY, JSON.stringify(firestoreData));
    return firestoreData;
  } catch (error) {
    console.error('Error loading customers:', error);
    const cached = await AsyncStorage.getItem(CUSTOMERS_ORDER_KEY);
    return cached ? JSON.parse(cached) : [];
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

// Save Thermal Roll in Firestore
export const saveCustomerOrder = async (customerOrder: CustomerOrder): Promise<CustomerOrder[]> => {
  try {
    const order = await saveRollOrderToFirestore(customerOrder);
    await AsyncStorage.setItem(CUSTOMERS_ORDER_KEY, JSON.stringify(order));
    return order;
  } catch (error) {
    console.error('Error saving roll:', error);
    return await loadCustomersOrder(customerOrder.customerId);
  }
};

export const updateCustomerOrder = async (customerOrder: CustomerOrder): Promise<CustomerOrder[]> => {
  const orders = await updateRollOrderToFirestore(customerOrder);
  await AsyncStorage.setItem(CUSTOMERS_ORDER_KEY, JSON.stringify(orders));
  return orders;
};

// Delete customer order in Firestore
export const deleteCustomerOrder = async (
  id: string,
  customerId: string
): Promise<CustomerOrder[]> => {
  try {
    const updated = await deleteRollOrderFromFirestore(id, customerId);
    await AsyncStorage.setItem(CUSTOMERS_ORDER_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error deleting customer order:', error);
    throw error;
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
    return cached ? JSON.parse(cached) : [];
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
