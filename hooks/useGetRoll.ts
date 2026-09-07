import { loadRolls } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';

export const useGetRoll = () => {
  const [rolls, setRolls] = useState<ThermalRoll[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {

    try {
      setLoading(true);
      setError(null);
      const allRolls = await loadRolls();
      setRolls(allRolls);
    } catch (err: any) {
      console.log('Error fetching roll detail:', err);
      setError(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);
  
  return {
    rolls,
    loading,
    error,
    refetch: fetchDetail,
  };
};