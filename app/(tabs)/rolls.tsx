import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { generateAutomaticNotifications, loadCustomers, loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
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
  const theme = Colors[isDark ? 'dark' : 'light'];

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

  const filteredRolls = useMemo(() => {
    return rolls.filter((r) => {
      const q = searchQuery.trim().toLowerCase();
      return (
        q === '' ||
        r.title.toLowerCase().includes(q) ||
        r.paperWidth.toLowerCase().includes(q) ||
        String(r.meterLength).includes(q) ||
        String(r.stickerCount || '').includes(q) ||
        String(r.wholesaleRate).includes(q)
      );
    });
  }, [rolls, searchQuery]);

  const totalTypesCount = rolls.length;
  const totalStockCount = rolls.reduce((acc, r) => acc + r.stockCount, 0);
  const lowStockCount = rolls.filter((r) => r.stockCount <= r.minStockAlert).length;

  const handleAdjustStock = async (roll: ThermalRoll, delta: number) => {
    const newStock = Math.max(0, roll.stockCount + delta);
    const updated: ThermalRoll = { ...roll, stockCount: newStock };
    const newList = await saveRoll(updated);
    setRolls(newList);
  };

  const renderRollCard = ({ item }: { item: ThermalRoll }) => {
    const wholesaleMargin = item.wholesaleRate - item.purchaseRate;
    const isLowStock = item.stockCount <= item.minStockAlert;
    const isBarcode = item.productType === 'barcode' || item.title.toLowerCase().includes('barcode') || item.title.toLowerCase().includes('sticker');

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isLowStock ? Palette.danger : theme.border,
          },
        ]}
        onPress={() => router.push(`/roll/${item.id}`)}
      >
        {/* Card Header */}
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="receipt" size={22} color={theme.tint} />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.rollTitle, { color: theme.text }]}>{item.title}</Text>
            <Text style={[styles.rollWidth, { color: theme.textSecondary }]}>
              {isBarcode
                ? `${item.paperWidth} • ${item.stickerCount || 0} stickers • ${item.barcodeColumns || 1} columns`
                : `${item.paperWidth} • ${item.meterLength}m`}
            </Text>
          </View>

          <View
            style={[
              styles.stockBadge,
              {
                backgroundColor: isLowStock
                  ? isDark
                    ? '#7F1D1D'
                    : '#FEF2F2'
                  : isDark
                  ? '#064E3B'
                  : '#ECFDF5',
              },
            ]}
          >
            <Text
              style={[
                styles.stockBadgeText,
                { color: isLowStock ? Palette.danger : Palette.success },
              ]}
            >
              {isLowStock ? `Low: ${item.stockCount}` : `Stock: ${item.stockCount}`}
            </Text>
          </View>
        </View>

        {/* Pricing Info Box */}
        <View style={[styles.priceGrid, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: theme.border }]}>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Purchase Rate</Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>₨{item.purchaseRate}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Wholesale Rate</Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>₨{item.wholesaleRate}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Profit</Text>
            <Text style={[styles.marginText, { color: Palette.success }]}>+₨{wholesaleMargin}</Text>
          </View>
        </View>

        {/* Quick Stock Controls */}
        <View style={[styles.controlsRow, { borderTopColor: theme.border }]}>
          <Text style={[styles.adjustLabel, { color: theme.textSecondary }]}>Quick Adjust:</Text>

          <View style={styles.counterGroup}>
            <TouchableOpacity
              style={[styles.countBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleAdjustStock(item, -1)}
            >
              <Feather name="minus" size={14} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.countDisplay, { color: theme.text }]}>{item.stockCount}</Text>

            <TouchableOpacity
              style={[styles.countBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleAdjustStock(item, 1)}
            >
              <Feather name="plus" size={14} color={theme.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickAddBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleAdjustStock(item, 10)}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: theme.tint }}>+10</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/roll/${item.id}`)}>
            <Feather name="edit-2" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Search & Metrics */}
      <View style={[styles.headerBox, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search thermal roll catalog..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Minimal Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: theme.text }]}>{totalTypesCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Roll Categories</Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: Palette.success }]}>{totalStockCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>In-Stock Items</Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: Palette.danger }]}>{lowStockCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Low Stock Alert</Text>
          </View>
        </View>
      </View>

      {/* Main Catalog List */}
      <FlatList
        data={filteredRolls}
        keyExtractor={(item) => item.id}
        renderItem={renderRollCard}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="receipt-text-minus" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Thermal Rolls Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Tap + Add Category to create a thermal roll item.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        activeOpacity={0.85}
        onPress={() => router.push('/roll/add')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Roll Category</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBox: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 42, borderRadius: 8, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  metricChip: { flex: 1, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, alignItems: 'center', marginHorizontal: 3 },
  metricVal: { fontSize: 15, fontWeight: '700' },
  metricLbl: { fontSize: 11, marginTop: 1 },
  listPadding: { padding: 16, paddingBottom: 90 },
  card: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  rollTitle: { fontSize: 15, fontWeight: '700' },
  rollWidth: { fontSize: 12, marginTop: 1 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stockBadgeText: { fontSize: 11, fontWeight: '700' },
  priceGrid: { flexDirection: 'row', justifyContent: 'space-between', borderRadius: 8, padding: 10, marginTop: 10, borderWidth: 1 },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  priceVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  marginText: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  adjustLabel: { fontSize: 12, fontWeight: '600' },
  counterGroup: { flexDirection: 'row', alignItems: 'center' },
  countBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  countDisplay: { fontSize: 14, fontWeight: '700', marginHorizontal: 8 },
  quickAddBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 6 },
  editBtn: { padding: 4 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 4 },
});
