import { getOrdersFromFirestore } from '@/lib/firestore';
import { CustomerOrder } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export const useOrders = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {

    try {
      setLoading(true);
      setError(null);

      const data = await getOrdersFromFirestore();

      setOrders(data);
    } catch (err: any) {
      console.error('Error fetching orders:', err);

      setError(
        err?.message || 'Failed to load orders'
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

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