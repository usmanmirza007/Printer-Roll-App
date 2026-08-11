import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { useGetRoll } from '@/hooks/useGetRoll';
import { getTodayDateString, loadCustomers, saveCustomer } from '@/lib/storage';
import { Customer, CustomerStatus, MarketCategory } from '@/lib/types';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CATEGORIES: MarketCategory[] = [
  'Pharmacy',
  'Restaurant',
  'Fast Food',
  'Cloth Brand',
  'Supermarket',
  'General Store',
  'Electronics',
  'Bakery',
  'Other',
];

const STATUSES: CustomerStatus[] = [
  'In Progress',
  'Pending',
  'Out for Delivery',
  'Delivered',
  'Follow-up Required',
  'Cancelled',
];

const REVISIT_OPTIONS = [
  { label: 'After 3 Days', days: 3 },
  { label: 'After 7 Days', days: 7 },
  { label: 'After 14 Days', days: 14 },
  { label: 'After 30 Days', days: 30 },
];

export default function AddOrEditCustomerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { top } = useSafeAreaInsets();
  
  const {
    rolls,
    loading: rollLoading,
    error,
    refetch,
  } = useGetRoll();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<MarketCategory>('Pharmacy');
  const [rollType, setRollType] = useState('40 Meter');
  const [purchaseRate, setPurchaseRate] = useState('120');
  const [saleRate, setSaleRate] = useState('135');
  const [status, setStatus] = useState<CustomerStatus>('In Progress');
  const [revisitDays, setRevisitDays] = useState<number>(7);
  const [customRevisitDays, setCustomRevisitDays] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadCustomers().then((customers) => {
        const found = customers.find((c) => c.id === id);
        if (found) {
          setName(found.name);
          setPhone(found.phone);
          setShopName(found.shopName);
          setLocation(found.location);
          setCategory(found.category);
          setRollType(found.rollType);
          setPurchaseRate(String(found.purchaseRate));
          setSaleRate(String(found.saleRate));
          setStatus(found.status);
          setRevisitDays(found.revisitDays || 7);
          setNotes(found.notes || '');
        }
      });
    }
  }, [id]);

  const pRate = parseFloat(purchaseRate) || 0;
  const sRate = parseFloat(saleRate) || 0;
  const margin = sRate - pRate;

  const effectiveRevisitDays =
    revisitDays === 0 ? parseInt(customRevisitDays, 10) || 7 : revisitDays;

  const targetNextVisitDate = getTodayDateString(effectiveRevisitDays);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter customer name.');
      return;
    }
    if (!shopName.trim()) {
      Alert.alert('Validation Error', 'Please enter shop/business name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Please enter contact phone number.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter shop location.');
      return;
    }

    setLoading(true);

    try {
      const customerData: Customer = {
        id: isEditMode && id ? id : `cust-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        shopName: shopName.trim(),
        location: location.trim(),
        category,
        rollType,
        purchaseRate: pRate,
        saleRate: sRate,
        status,
        createdDate: isEditMode ? getTodayDateString(0) : getTodayDateString(0),
        revisitDays: effectiveRevisitDays,
        nextVisitDate: targetNextVisitDate,
        notes: notes.trim(),
      };

      await saveCustomer(customerData);
      setLoading(false);
      Alert.alert(
        'Success',
        `Customer "${shopName}" saved! Next visit scheduled for ${targetNextVisitDate}.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      setLoading(false);
      Alert.alert('Error', 'Failed to save customer record.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { marginTop: top, backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {isEditMode ? 'Edit Customer Record' : 'Add New Customer'}
          </Text>
        </View>

        {/* Section 1: Shop & Contact Info */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Shop & Contact Details</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Shop / Business Name *</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="e.g. Al-Shafi Pharmacy"
            placeholderTextColor={theme.textSecondary}
            value={shopName}
            onChangeText={setShopName}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Customer / Contact Person *</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="e.g. Dr. Tariq Mahmood"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone / WhatsApp Number *</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="e.g. +92 300 1234567"
            placeholderTextColor={theme.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Shop Location / Address *</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="e.g. Main Commercial Market, Sector G-9"
            placeholderTextColor={theme.textSecondary}
            value={location}
            onChangeText={setLocation}
          />

          {/* Market Category Selector */}
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Market Category *</Text>
          <View style={styles.pillsWrap}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: theme.tint }
                      : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section 2: Thermal Roll & Rate Pricing */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Thermal Roll Requirement & Rates</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Required Roll Type *</Text>
          <View style={styles.pillsWrap}>
            {rolls.map((rt) => {

              const title = rt.title.replaceAll('Thermal Roll', '').trim();
              const active = rollType === title;
              return (
                <TouchableOpacity
                  key={rt.title}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: theme.tint }
                      : {
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
                  ]}
                  onPress={() => {
                    setRollType(title)
                    setPurchaseRate(rt.purchaseRate.toString())
                    setSaleRate(rt.wholesaleRate.toString())
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rateRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Purchase Rate (Cost) *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="120"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={purchaseRate}
                onChangeText={setPurchaseRate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Customer Sale Rate *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                placeholder="135"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={saleRate}
                onChangeText={setSaleRate}
              />
            </View>
          </View>

          {/* Profit Preview Banner */}
          <View style={[styles.profitBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.profitText, { color: margin >= 0 ? Palette.success : Palette.danger }]}>
              Profit Margin: <Text style={{ fontWeight: '700' }}>₨{margin}</Text> per roll
              {pRate > 0 && ` (${((margin / pRate) * 100).toFixed(1)}%)`}
            </Text>
          </View>
        </View>

        {/* Section 3: Status & Re-visit Feedback */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Order Status & Visit Schedule</Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Status *</Text>
          <View style={styles.pillsWrap}>
            {STATUSES.map((st) => {
              const active = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: theme.tint }
                      : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Visit Feedback (Cycle)</Text>
          <View style={styles.pillsWrap}>
            {REVISIT_OPTIONS.map((opt) => {
              const active = revisitDays === opt.days;
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: theme.tint }
                      : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={() => {
                    setRevisitDays(opt.days);
                    setCustomRevisitDays('');
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next Visit Date Notice */}
          <View style={[styles.noticeBox, { backgroundColor: theme.surface }]}>
            <Ionicons name="calendar-outline" size={16} color={theme.tint} />
            <Text style={[styles.noticeText, { color: theme.text }]}>
              Next Visit Scheduled: <Text style={{ fontWeight: '700', color: theme.tint }}>{targetNextVisitDate}</Text>
            </Text>
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Customer Feedback & Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            placeholder="Notes or owner preferences..."
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.tint }, loading && { opacity: 0.7 }]}
          disabled={loading}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving...' : isEditMode ? 'Update Customer' : 'Save Customer Record'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  sectionHeader: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  textArea: { height: 70, textAlignVertical: 'top', paddingTop: 10 },
  pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  pillText: { fontSize: 12, fontWeight: '600' },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  profitBanner: { padding: 10, borderRadius: 8, marginTop: 10, borderWidth: 1 },
  profitText: { fontSize: 13 },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  noticeText: { fontSize: 13, marginLeft: 6 },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
