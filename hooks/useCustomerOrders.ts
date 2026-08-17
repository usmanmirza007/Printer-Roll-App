import { getCustomerOrdersFromFirestore } from '@/lib/firestore';
import { CustomerOrder } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export const useCustomerOrders = (customerId?: string) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!customerId) {
      setOrders([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getCustomerOrdersFromFirestore(customerId);

      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching customer orders:', err);

      setError(
        err?.message || 'Failed to load customer orders'
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const orderCount = orders.length;

  return {
    orders,
    orderCount,
    loading,
    error,
    refetch: fetchOrders,
  };
};