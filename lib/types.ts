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
  | 'Active'              // Normal active customer
  | 'Follow-up Required'  // Needs visit / follow-up
  | 'Inactive'            // Not ordering anymore
  | 'Blocked';            // Optional

export type OrderStatus =
  | 'Pending'             // Just created
  | 'In Progress'         // Being processed
  | 'Invoiced'            // Invoice generated
  | 'Delivered'           // Successfully delivered
  | 'Cancelled';          // Cancelled

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
  orderCount: number
  status: CustomerStatus;   // Order/Customer Status
  createdDate: string;      // ISO String format date
  revisitDays: number;      // Days cycle for re-visit (e.g. 3, 7, 14, 30)
  nextVisitDate: string;    // Target date string YYYY-MM-DD
  lastVisitDate?: string;   // Last visited date YYYY-MM-DD
  notes?: string;           // Customer notes / feedback
  totalRollsOrdered?: number; // Total quantity ordered by this customer
  orderHistory?: CustomerOrder[]; // Optional: List of past orders for this customer
}

export interface CustomerOrder {
  id: string;
  customerId: string;
  rollId: string;
  quantity: number;
  rollType: string;
  unitCostRate: number;
  buisnessName: string;
  unitSaleRate: number;
  totalCost: number;
  totalSale: number;
  profit: number;
  status: OrderStatus;
  orderDate: string; // ISO String format date
}

export interface ThermalRoll {
  id: string;
  title: string;
  productType?: 'thermal' | 'barcode';
  meterLength: number;
  paperWidth: string;
  stickerWidth?: number;
  stickerHeight?: number;
  stickerCount?: number;
  barcodeColumns?: 1 | 2 | 3 | 4;
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

