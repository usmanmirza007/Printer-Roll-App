import { useColorScheme } from '@/components/useColorScheme';
import { loadRolls, saveRoll } from '@/lib/storage';
import { ThermalRoll } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
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

export default function AddOrEditRollScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const [title, setTitle] = useState('');
  const [meterLength, setMeterLength] = useState('40');
  const [paperWidth, setPaperWidth] = useState('80mm Standard POS');
  const [purchaseRate, setPurchaseRate] = useState('120');
  const [wholesaleRate, setWholesaleRate] = useState('140');
  const [stockCount, setStockCount] = useState('50');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadRolls().then((rolls) => {
        const found = rolls.find((r) => r.id === id);
        if (found) {
          setTitle(found.title);
          setMeterLength(String(found.meterLength));
          setPaperWidth(found.paperWidth);
          setPurchaseRate(String(found.purchaseRate));
          setWholesaleRate(String(found.wholesaleRate));
          setStockCount(String(found.stockCount));
          setMinStockAlert(String(found.minStockAlert));
          setDescription(found.description || '');
        }
      });
    }
  }, [id]);

  const pRate = parseFloat(purchaseRate) || 0;
  const wRate = parseFloat(wholesaleRate) || 0;
  const margin = wRate - pRate;

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter thermal roll title.');
      return;
    }

    setLoading(true);

    try {
      const rollData: ThermalRoll = {
        id: isEditMode && id ? id : `roll-${Date.now()}`,
        title: title.trim(),
        meterLength: parseInt(meterLength, 10) || 40,
        paperWidth: paperWidth.trim() || '80mm POS',
        purchaseRate: pRate,
        wholesaleRate: wRate,
        stockCount: parseInt(stockCount, 10) || 0,
        minStockAlert: parseInt(minStockAlert, 10) || 10,
        description: description.trim(),
      };

      await saveRoll(rollData);
      setLoading(false);
      Alert.alert('Success', `Thermal Roll "${title}" saved successfully!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save roll details.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Navigation */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            {isEditMode ? 'Edit Thermal Roll' : 'Add Roll Category'}
          </Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Text style={styles.sectionHeader}>📜 Roll Specification</Text>

          <Text style={styles.inputLabel}>Roll Title *</Text>
          <TextInput
            style={[
              styles.input,
              { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
            placeholder="e.g. 40 Meter Thermal Roll"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Meter Length *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 40"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={meterLength}
                onChangeText={setMeterLength}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Paper Width *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 80mm Standard POS"
                placeholderTextColor="#9CA3AF"
                value={paperWidth}
                onChangeText={setPaperWidth}
              />
            </View>
          </View>

          <Text style={[styles.sectionHeader, { marginTop: 18 }]}>💰 Rates & Stock Availability</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Purchase Rate (Cost) *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 120"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={purchaseRate}
                onChangeText={setPurchaseRate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Wholesale Rate *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 140"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={wholesaleRate}
                onChangeText={setWholesaleRate}
              />
            </View>
          </View>

          {/* Wholesale Profit Preview */}
          <View style={[styles.profitBanner, { backgroundColor: margin >= 0 ? '#10B98115' : '#EF444415' }]}>
            <Text style={[styles.profitText, { color: margin >= 0 ? '#047857' : '#B91C1C' }]}>
              Standard Wholesale Profit: <Text style={{ fontWeight: '800' }}>₨{margin}</Text> per roll
            </Text>
          </View>

          <View style={[styles.row, { marginTop: 10 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Available Stock Count *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 50"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={stockCount}
                onChangeText={setStockCount}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Low Stock Alert Threshold</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 10"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={minStockAlert}
                onChangeText={setMinStockAlert}
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>Roll Description / Specs</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
            placeholder="e.g. High quality 55gsm thermal paper, dark print density."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSave}
        >
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving...' : isEditMode ? 'Update Thermal Roll' : 'Save Roll Category'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 8 },
  backBtn: { padding: 6, marginRight: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
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
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#4F46E5', marginBottom: 12 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginTop: 10, marginBottom: 4 },
  input: { height: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 15 },
  textArea: { height: 74, textAlignVertical: 'top', paddingTop: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  profitBanner: { padding: 10, borderRadius: 8, marginTop: 10 },
  profitText: { fontSize: 13 },
  saveBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginLeft: 8 },
});
