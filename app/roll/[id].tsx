import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { deleteRoll, loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RollDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { id } = useLocalSearchParams<{ id: string }>();
    const { top } = useSafeAreaInsets();
  
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
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Thermal Roll not found.</Text>
      </View>
    );
  }

  const margin = roll.wholesaleRate - roll.purchaseRate;
  const isLowStock = roll.stockCount <= roll.minStockAlert;
  const isBarcode = roll.productType === 'barcode' || roll.title.toLowerCase().includes('barcode') || roll.title.toLowerCase().includes('sticker');

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.container, { marginTop: top, backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      {/* Header */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Thermal Roll Details</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 14 }}
            onPress={() => router.push(`/roll/add?id=${roll.id}`)}
          >
            <Feather name="edit-2" size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Palette.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Spec Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
            <MaterialCommunityIcons name="receipt" size={24} color={theme.tint} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.title, { color: theme.text }]}>{roll.title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {isBarcode
                ? `${roll.paperWidth} • ${roll.stickerCount || 0} stickers • ${roll.barcodeColumns || 1} columns`
                : `Length: ${roll.meterLength}m • Width: ${roll.paperWidth}`}
            </Text>
          </View>
        </View>

        {roll.description ? (
          <Text style={[styles.descText, { color: theme.textSecondary }]}>{roll.description}</Text>
        ) : null}
      </View>

      {/* Pricing Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardSectionTitle, { color: theme.tint }]}>Financial Breakdown</Text>
        <View style={styles.grid}>
          <View style={styles.gridBox}>
            <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Purchase Rate (Cost)</Text>
            <Text style={[styles.gridValue, { color: theme.text }]}>₨{roll.purchaseRate}</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Wholesale Rate</Text>
            <Text style={[styles.gridValue, { color: theme.text }]}>₨{roll.wholesaleRate}</Text>
          </View>

          <View style={styles.gridBox}>
            <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>Wholesale Margin</Text>
            <Text style={[styles.gridValue, { color: Palette.success }]}>+₨{margin}</Text>
          </View>
        </View>
      </View>

      {/* Stock Replenish Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardSectionTitle, { color: theme.tint }]}>Stock Level & Replenishment</Text>

        <View style={[styles.stockBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stockBannerTitle, { color: isLowStock ? Palette.danger : Palette.success }]}>
            Current Stock: {roll.stockCount} items
          </Text>
          <Text style={[styles.stockBannerSub, { color: theme.textSecondary }]}>
            Low stock alert limit set at {roll.minStockAlert} items.
          </Text>
        </View>

        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Replenish Stock Batch:</Text>
        <View style={styles.replenishRow}>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            keyboardType="numeric"
            placeholder="50"
            placeholderTextColor={theme.textSecondary}
            value={stockAddAmount}
            onChangeText={setStockAddAmount}
          />
          <TouchableOpacity style={[styles.addStockBtn, { backgroundColor: theme.tint }]} onPress={handleAddStock}>
            <Text style={styles.addStockBtnText}>Add Stock</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 4,
  },
  backBtn: { padding: 4 },
  navTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  descText: { fontSize: 13, marginTop: 10, lineHeight: 18 },
  cardSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  gridBox: { flex: 1, alignItems: 'center' },
  gridLabel: { fontSize: 11, marginBottom: 2 },
  gridValue: { fontSize: 15, fontWeight: '700' },
  stockBanner: { padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  stockBannerTitle: { fontSize: 14, fontWeight: '700' },
  stockBannerSub: { fontSize: 12, marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  replenishRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 14, marginRight: 8 },
  addStockBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStockBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
