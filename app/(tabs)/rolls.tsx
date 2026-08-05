import { useColorScheme } from '@/components/useColorScheme';
import { generateAutomaticNotifications, loadCustomers, loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RollsInventoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [rolls, setRolls] = useState<ThermalRoll[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchRollsData = async () => {
    try {
      const data = await loadRolls();
      const customers = await loadCustomers();
      setRolls(data);
      await generateAutomaticNotifications(customers, data);
    } catch (e) {
      console.error('Failed to load rolls:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRollsData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRollsData();
    setRefreshing(false);
  };

  // Search Roll Filtering
  const filteredRolls = useMemo(() => {
    return rolls.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        q === '' ||
        r.title.toLowerCase().includes(q) ||
        r.paperWidth.toLowerCase().includes(q) ||
        String(r.meterLength).includes(q) ||
        String(r.wholesaleRate).includes(q)
      );
    });
  }, [rolls, searchQuery]);

  // Inventory Summary Stats
  const totalTypesCount = rolls.length;
  const totalStockCount = rolls.reduce((acc, r) => acc + r.stockCount, 0);
  const lowStockCount = rolls.filter((r) => r.stockCount <= r.minStockAlert).length;

  // Quick Stock Adjustment (+ or -)
  const handleAdjustStock = async (roll: ThermalRoll, delta: number) => {
    const newStock = Math.max(0, roll.stockCount + delta);
    const updated: ThermalRoll = { ...roll, stockCount: newStock };
    const newList = await saveRoll(updated);
    setRolls(newList);
  };

  const renderRollItem = ({ item }: { item: ThermalRoll }) => {
    const wholesaleMargin = item.wholesaleRate - item.purchaseRate;
    const isLowStock = item.stockCount <= item.minStockAlert;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isLowStock ? '#EF4444' : isDark ? '#374151' : '#E5E7EB',
            borderWidth: isLowStock ? 1.5 : 1,
          },
        ]}
        onPress={() => router.push(`/roll/${item.id}`)}
      >
        {/* Card Header: Title & Stock Badge */}
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="receipt" size={24} color="#4F46E5" />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.rollTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
              {item.title}
            </Text>
            <Text style={styles.rollWidth}>
              📏 Width: {item.paperWidth} • {item.meterLength}m
            </Text>
          </View>

          <View
            style={[
              styles.stockBadge,
              {
                backgroundColor: isLowStock
                  ? isDark
                    ? '#7F1D1D'
                    : '#FEE2E2'
                  : isDark
                  ? '#064E3B'
                  : '#D1FAE5',
              },
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                { color: isLowStock ? '#991B1B' : '#065F46' },
              ]}
            >
              {isLowStock ? `⚠️ Low: ${item.stockCount}` : `📦 Stock: ${item.stockCount}`}
            </Text>
          </View>
        </View>

        {/* Pricing & Profit Info Grid */}
        <View style={[styles.priceGrid, { backgroundColor: isDark ? '#111827' : '#F9FAFB' }]}>
          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Purchase Rate</Text>
            <Text style={[styles.priceValue, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
              ₨{item.purchaseRate}
            </Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Wholesale Rate</Text>
            <Text style={[styles.priceValue, { color: '#0284C7' }]}>
              ₨{item.wholesaleRate}
            </Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.priceLabel}>Wholesale Profit</Text>
            <Text style={styles.marginText}>+₨{wholesaleMargin}/roll</Text>
          </View>
        </View>

        {/* Quick Stock Adjuster Controls */}
        <View style={styles.controlsRow}>
          <Text style={styles.adjustLabel}>Quick Stock Adjust:</Text>

          <View style={styles.counterGroup}>
            <TouchableOpacity
              style={[styles.countBtn, { backgroundColor: '#EF444415' }]}
              onPress={() => handleAdjustStock(item, -1)}
            >
              <Feather name="minus" size={16} color="#EF4444" />
            </TouchableOpacity>

            <Text style={[styles.countDisplay, { color: isDark ? '#FFF' : '#111827' }]}>
              {item.stockCount}
            </Text>

            <TouchableOpacity
              style={[styles.countBtn, { backgroundColor: '#10B98115' }]}
              onPress={() => handleAdjustStock(item, 1)}
            >
              <Feather name="plus" size={16} color="#10B981" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: '#4F46E515' }]}
              onPress={() => handleAdjustStock(item, 10)}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#4338CA' }}>+10 Stock</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/roll/${item.id}`)}
          >
            <Feather name="edit-2" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
      {/* Search & Header Stats */}
      <View style={[styles.searchSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
          <Ionicons name="search" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#F9FAFB' : '#111827' }]}
            placeholder="Search roll by meter length, rate, width..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{totalTypesCount}</Text>
            <Text style={styles.statLabel}>Roll Types</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#10B98115' }]}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{totalStockCount}</Text>
            <Text style={[styles.statLabel, { color: '#047857' }]}>Total In-Stock</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: '#EF444415' }]}>
            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{lowStockCount}</Text>
            <Text style={[styles.statLabel, { color: '#B91C1C' }]}>Low Stock Alert</Text>
          </View>
        </View>
      </View>

      {/* Rolls List */}
      <FlatList
        data={filteredRolls}
        keyExtractor={(item) => item.id}
        renderItem={renderRollItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="receipt-text-minus" size={54} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#F3F4F6' : '#374151' }]}>
              No Thermal Rolls Found
            </Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ Add Roll Category" to add 40m, 50m, 60m, or 80m thermal roll stock details.
            </Text>
          </View>
        }
      />

      {/* FAB: Add Roll Category */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/roll/add')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Roll Category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  statBox: {
    flex: 1,
    backgroundColor: '#4F46E510',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statNumber: { fontSize: 18, fontWeight: '800', color: '#4F46E5' },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#6366F1', marginTop: 1 },
  listContent: { padding: 14, paddingBottom: 90 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollTitle: { fontSize: 16, fontWeight: '700' },
  rollWidth: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  stockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stockBadgeText: { fontSize: 12, fontWeight: '700' },
  priceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '600' },
  priceValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  marginText: { fontSize: 14, fontWeight: '700', color: '#10B981', marginTop: 2 },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB20',
  },
  adjustLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  counterGroup: { flexDirection: 'row', alignItems: 'center' },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countDisplay: { fontSize: 15, fontWeight: '800', marginHorizontal: 10 },
  quickAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    marginLeft: 8,
  },
  editBtn: { padding: 6 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginLeft: 6 },
});
