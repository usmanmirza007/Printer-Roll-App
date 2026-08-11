export type MarketCategory =
  | 'Pharmacy'
  | 'Restaurant'
  | 'Fast Food'
  | 'Cloth Brand'
  | 'Supermarket'
  | 'General Store'
  | 'Electronics'
  | 'Bakery'
  | 'Other';

export type CustomerStatus =
  | 'In Progress'
  | 'Pending'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Follow-up Required'
  | 'Cancelled';

export interface Customer {
  id: string;
  name: string;             // Customer / Contact Person Name
  phone: string;            // Phone Number
  shopName: string;         // Shop / Business Name
  location: string;         // Area / Address / Market Name
  category: MarketCategory; // Market Category
  rollType: string;         // Required Roll Type (e.g. "40 Meter", "50 Meter", "60 Meter", "80 Meter")
  purchaseRate: number;     // Cost Price (e.g. 120)
  saleRate: number;         // Sale Price for this customer (e.g. 135)
  status: CustomerStatus;   // Order/Customer Status
  createdDate: string;      // ISO String format date
  revisitDays: number;      // Days cycle for re-visit (e.g. 3, 7, 14, 30)
  nextVisitDate: string;    // Target date string YYYY-MM-DD
  lastVisitDate?: string;   // Last visited date YYYY-MM-DD
  notes?: string;           // Customer notes / feedback
  totalRollsOrdered?: number; // Total quantity ordered by this customer
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  rollId: string;
  quantity: number;
  rollType: string;         
  unitCostRate: number;
  unitSaleRate: number;
  totalCost: number;
  totalSale: number;
  profit: number;
  status: CustomerStatus;
  orderDate: string; // ISO String format date
}

export interface ThermalRoll {
  id: string;
  title: string;           // e.g. "40 Meter Thermal Roll"
  meterLength: number;     // 40, 50, 60, 80
  paperWidth: string;      // e.g. "80mm Standard POS"
  purchaseRate: number;    // Purchase Rate (e.g. 120)
  wholesaleRate: number;   // Wholesale Rate (e.g. 140)
  stockCount: number;      // Stock available (e.g. 50 items)
  minStockAlert: number;   // Low stock warning limit (e.g. 10)
  description: string;
}

export interface AppNotification {
  id: string;
  type: 'visit_reminder' | 'stock_alert' | 'order_status';
  title: string;
  message: string;
  customerId?: string;
  rollId?: string;
  date: string;            // ISO String
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  shopName: string;
  rollId: string;
  rollTitle: string;
  quantity: number;
  unitCostRate: number;
  unitSaleRate: number;
  totalCost: number;
  totalSale: number;
  profit: number;
  status: CustomerStatus;
  orderDate: string;
}
