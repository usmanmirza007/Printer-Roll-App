import { useColorScheme } from '@/components/useColorScheme';
import { deleteRoll, loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RollDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const [roll, setRoll] = useState<ThermalRoll | null>(null);
  const [stockAddAmount, setStockAddAmount] = useState('20');

  const fetchRoll = async () => {
    if (!id) return;
    const allRolls = await loadRolls();
    const found = allRolls.find((r) => r.id === id);
    setRoll(found || null);
  };

  useEffect(() => {
    fetchRoll();
  }, [id]);

  if (!roll) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
        <Text style={{ color: isDark ? '#FFF' : '#000' }}>Thermal Roll not found.</Text>
      </View>
    );
  }

  const margin = roll.wholesaleRate - roll.purchaseRate;
  const isLowStock = roll.stockCount <= roll.minStockAlert;

  const handleDelete = () => {
    Alert.alert('Delete Thermal Roll', `Are you sure you want to delete ${roll.title}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRoll(roll.id);
          router.back();
        },
      },
    ]);
  };

  const handleAddStock = async () => {
    const addQty = parseInt(stockAddAmount, 10);
    if (isNaN(addQty) || addQty <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid stock quantity to add.');
      return;
    }

    const updated: ThermalRoll = {
      ...roll,
      stockCount: roll.stockCount + addQty,
    };
    await saveRoll(updated);
    setRoll(updated);
    Alert.alert('Stock Updated', `Added ${addQty} rolls to ${roll.title}. New stock: ${updated.stockCount} items!`);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
          Thermal Roll Details
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => router.push(`/roll/add?id=${roll.id}`)}
          >
            <Feather name="edit-3" size={22} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Spec Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.headerTop}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="receipt" size={28} color="#4F46E5" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.title, { color: isDark ? '#FFF' : '#111827' }]}>
              {roll.title}
            </Text>
            <Text style={styles.subtitle}>
              Length: {roll.meterLength}m • Width: {roll.paperWidth}
            </Text>
          </View>
        </View>

        {roll.description ? (
          <Text style={styles.descText}>{roll.description}</Text>
        ) : null}
      </View>

      {/* Financial Breakdown Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardSectionTitle}>💰 Financial Breakdown</Text>
        <View style={styles.grid}>
          <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Purchase Rate (Cost)</Text>
            <Text style={[styles.gridValue, { color: isDark ? '#FFF' : '#111827' }]}>
              ₨{roll.purchaseRate}
            </Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Wholesale Selling Rate</Text>
            <Text style={[styles.gridValue, { color: '#0284C7' }]}>
              ₨{roll.wholesaleRate}
            </Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={styles.gridLabel}>Wholesale Margin</Text>
            <Text style={[styles.gridValue, { color: '#10B981' }]}>
              +₨{margin}/roll
            </Text>
          </View>
        </View>
      </View>

      {/* Stock Replenish Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardSectionTitle}>📦 Stock Level & Replenishment</Text>

        <View style={[styles.stockBanner, { backgroundColor: isLowStock ? '#FEF2F2' : '#ECFDF5' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stockBannerTitle, { color: isLowStock ? '#991B1B' : '#065F46' }]}>
              Current Available Stock: {roll.stockCount} items
            </Text>
            <Text style={styles.stockBannerSub}>
              Low stock warning trigger set at {roll.minStockAlert} items.
            </Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Add New Shipment Batch (Replenish Stock):</Text>
        <View style={styles.replenishRow}>
          <TextInput
            style={[
              styles.input,
              { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
            keyboardType="numeric"
            placeholder="e.g. 50"
            placeholderTextColor="#9CA3AF"
            value={stockAddAmount}
            onChangeText={setStockAddAmount}
          />
          <TouchableOpacity style={styles.addStockBtn} onPress={handleAddStock}>
            <Ionicons name="add-circle-outline" size={20} color="#FFF" />
            <Text style={styles.addStockBtnText}>Add Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  descText: { fontSize: 13, color: '#4B5563', marginTop: 12, lineHeight: 18 },
  cardSectionTitle: { fontSize: 15, fontWeight: '700', color: '#4F46E5', marginBottom: 10 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridBox: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  gridValue: { fontSize: 16, fontWeight: '800' },
  stockBanner: { padding: 12, borderRadius: 10, marginBottom: 14 },
  stockBannerTitle: { fontSize: 15, fontWeight: '800' },
  stockBannerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  replenishRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16, marginRight: 10 },
  addStockBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 46,
    borderRadius: 8,
  },
  addStockBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
});
