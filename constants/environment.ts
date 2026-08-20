export enum Environment {
  PRODUCTION = 'prod',
  STAGING = 'stag',
}

// ✅ FIXED: Added type annotation
export const env: Environment = Environment.PRODUCTION;

export const STAGING = 'staging';
export const PROD = 'production';

export const CURRENT_TARGET = env === Environment.PRODUCTION.toString() ? PROD : STAGING;

export const isProduction = env === Environment.PRODUCTION.toString();

// ======================
// Firestore Collections
// ======================
const PREFIX = isProduction ? '' : 'staging_';

export const COLLECTIONS = {
  CUSTOMERS: `${PREFIX}customers`,
  ORDERS: `${PREFIX}orders`,
  ROLLS: `${PREFIX}rolls`,
  NOTIFICATIONS: `${PREFIX}notifications`,
  INVESTMENTS: `${PREFIX}investments`,
} as const;

export const CUSTOMERS_COLLECTION = COLLECTIONS.CUSTOMERS;
export const CUSTOMERS_ORDER_COLLECTION = COLLECTIONS.ORDERS;
export const ROLLS_COLLECTION = COLLECTIONS.ROLLS;
export const NOTIFICATIONS_COLLECTION = COLLECTIONS.NOTIFICATIONS;
export const INVESTMENTS_COLLECTION = COLLECTIONS.INVESTMENTS;