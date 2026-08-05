import { useColorScheme } from '@/components/useColorScheme';
import { getTodayDateString, loadCustomers, saveCustomer } from '@/lib/storage';
import { Customer, CustomerStatus, MarketCategory } from '@/lib/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const ROLL_TYPES = ['40 Meter', '50 Meter', '60 Meter', '80 Meter', 'Custom'];

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
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

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
        style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Screen Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
            {isEditMode ? 'Edit Customer Record' : 'Add New Customer'}
          </Text>
        </View>

        {/* Section 1: Shop & Contact Info */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Text style={styles.sectionHeader}>🏬 Shop & Contact Details</Text>

          <Text style={styles.inputLabel}>Shop / Business Name *</Text>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' }]}
            placeholder="e.g. Al-Shafi Pharmacy / Savour Foods"
            placeholderTextColor="#9CA3AF"
            value={shopName}
            onChangeText={setShopName}
          />

          <Text style={styles.inputLabel}>Customer / Contact Person Name *</Text>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' }]}
            placeholder="e.g. Dr. Tariq Mahmood"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Phone / WhatsApp Number *</Text>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' }]}
            placeholder="e.g. +92 300 1234567"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.inputLabel}>Shop Location / Address *</Text>
          <TextInput
            style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' }]}
            placeholder="e.g. Main Commercial Market, G-9 Markaz"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          {/* Market Category Selector */}
          <Text style={styles.inputLabel}>Market Category *</Text>
          <View style={styles.pillsWrap}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: '#4F46E5' }
                      : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFF' : isDark ? '#D1D5DB' : '#374151' },
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
        <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Text style={styles.sectionHeader}>📜 Thermal Roll Requirement & Pricing</Text>

          <Text style={styles.inputLabel}>Required Roll Type *</Text>
          <View style={styles.pillsWrap}>
            {ROLL_TYPES.map((rt) => {
              const active = rollType === rt;
              return (
                <TouchableOpacity
                  key={rt}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: '#0284C7' }
                      : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => setRollType(rt)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFF' : isDark ? '#D1D5DB' : '#374151' },
                    ]}
                  >
                    {rt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.rateRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>My Purchase Rate (Cost) *</Text>
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
              <Text style={styles.inputLabel}>Customer Sale Rate *</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
                placeholder="e.g. 135"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={saleRate}
                onChangeText={setSaleRate}
              />
            </View>
          </View>

          {/* Profit Preview Banner */}
          <View style={[styles.profitBanner, { backgroundColor: margin >= 0 ? '#10B98115' : '#EF444415' }]}>
            <MaterialIcons
              name={margin >= 0 ? 'trending-up' : 'trending-down'}
              size={20}
              color={margin >= 0 ? '#10B981' : '#EF4444'}
            />
            <Text style={[styles.profitText, { color: margin >= 0 ? '#047857' : '#B91C1C' }]}>
              Profit Margin: <Text style={{ fontWeight: '800' }}>₨{margin}</Text> per roll
              {pRate > 0 && ` (${((margin / pRate) * 100).toFixed(1)}% profit rate)`}
            </Text>
          </View>
        </View>

        {/* Section 3: Status & Re-visit Feedback Reminder */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Text style={styles.sectionHeader}>⏰ Order Status & Re-visit Feedback</Text>

          <Text style={styles.inputLabel}>Current Status *</Text>
          <View style={styles.pillsWrap}>
            {STATUSES.map((st) => {
              const active = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: '#D97706' }
                      : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFF' : isDark ? '#D1D5DB' : '#374151' },
                    ]}
                  >
                    {st}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Visit Feedback (Re-visit Reminder Cycle)</Text>
          <Text style={styles.helperText}>
            Some customers say "come after 7 days" or "come after 3 days". The app will automatically send you a visit reminder notification.
          </Text>

          <View style={styles.pillsWrap}>
            {REVISIT_OPTIONS.map((opt) => {
              const active = revisitDays === opt.days;
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[
                    styles.pill,
                    active
                      ? { backgroundColor: '#10B981' }
                      : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                  ]}
                  onPress={() => {
                    setRevisitDays(opt.days);
                    setCustomRevisitDays('');
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFF' : isDark ? '#D1D5DB' : '#374151' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next Visit Date Scheduled Notice */}
          <View style={styles.noticeBox}>
            <Ionicons name="calendar-outline" size={18} color="#4F46E5" />
            <Text style={styles.noticeText}>
              Next scheduled visit reminder date:{' '}
              <Text style={{ fontWeight: '800', color: '#4F46E5' }}>
                {targetNextVisitDate}
              </Text>
            </Text>
          </View>

          <Text style={styles.inputLabel}>Customer Feedback & Notes</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
            placeholder="e.g. Owner visits shop after 4pm. Wants cash receipts."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
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
            {loading ? 'Saving...' : isEditMode ? 'Update Customer Record' : 'Save Customer Record'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
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
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  profitText: {
    fontSize: 13,
    marginLeft: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E510',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
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
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});
