import { useColorScheme } from '@/components/useColorScheme';
import {
  deleteCustomer,
  getTodayDateString,
  loadCustomers,
  loadRolls,
  recordCustomerVisit,
  saveRoll,
} from '@/lib/storage';
import { Customer, ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function CustomerDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { id } = useLocalSearchParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rolls, setRolls] = useState<ThermalRoll[]>([]);
  const [orderQty, setOrderQty] = useState('20');
  const [selectedRoll, setSelectedRoll] = useState<ThermalRoll | null>(null);

  const fetchDetail = async () => {
    if (!id) return;
    const allCustomers = await loadCustomers();
    const found = allCustomers.find((c) => c.id === id);
    setCustomer(found || null);

    const allRolls = await loadRolls();
    setRolls(allRolls);
    if (allRolls.length > 0) {
      // Find roll matching customer requirement or pick first
      const matched = allRolls.find((r) =>
        found ? r.title.toLowerCase().includes(found.rollType.toLowerCase()) : false
      );
      setSelectedRoll(matched || allRolls[0]);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  if (!customer) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
        <Text style={{ color: isDark ? '#FFF' : '#000' }}>Customer not found.</Text>
      </View>
    );
  }

  const margin = customer.saleRate - customer.purchaseRate;
  const todayStr = getTodayDateString(0);
  const isVisitDue = customer.nextVisitDate && customer.nextVisitDate <= todayStr;

  const handleCall = () => {
    Linking.openURL(`tel:${customer.phone}`);
  };

  const handleWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello ${customer.name}! Following up regarding your Thermal Printer Roll order (${customer.rollType}) for ${customer.shopName}.`
    );
    Linking.openURL(`whatsapp://send?phone=${cleanPhone}&text=${msg}`).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`);
    });
  };

  const handleLogVisit = async () => {
    const result = await recordCustomerVisit(customer.id);
    const updated = result.customers.find((c) => c.id === customer.id);
    if (updated) setCustomer(updated);
    Alert.alert('Visit Logged', `Visit completed today. Next visit scheduled for ${updated?.nextVisitDate}!`);
  };

  const handleDelete = () => {
    Alert.alert('Delete Customer', `Are you sure you want to delete ${customer.shopName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteCustomer(customer.id);
          router.back();
        },
      },
    ]);
  };

  const handleProcessOrder = async () => {
    const qty = parseInt(orderQty, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid order quantity.');
      return;
    }
    if (!selectedRoll) {
      Alert.alert('Select Roll', 'Please select a thermal roll type.');
      return;
    }

    if (selectedRoll.stockCount < qty) {
      Alert.alert(
        'Insufficient Stock',
        `Current available stock for ${selectedRoll.title} is ${selectedRoll.stockCount} rolls. Adjust inventory first or lower order quantity.`
      );
      return;
    }

    // Deduct stock count
    const updatedRoll: ThermalRoll = {
      ...selectedRoll,
      stockCount: selectedRoll.stockCount - qty,
    };
    await saveRoll(updatedRoll);

    Alert.alert(
      'Order Recorded! 🎉',
      `Logged sale of ${qty} rolls (${selectedRoll.title}) for ${customer.shopName}.\n\nTotal Sale: ₨${
        qty * customer.saleRate
      }\nTotal Profit: ₨${qty * margin}\nRemaining Roll Stock: ${updatedRoll.stockCount} rolls.`
    );
    fetchDetail();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Header Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#F9FAFB' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: isDark ? '#F9FAFB' : '#111827' }]}>
          Customer Details
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 12 }}
            onPress={() => router.push(`/customer/add?id=${customer.id}`)}
          >
            <Feather name="edit-3" size={22} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Profile Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.headerTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.shopName.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.shopName, { color: isDark ? '#FFF' : '#111827' }]}>
              {customer.shopName}
            </Text>
            <Text style={styles.ownerName}>👤 {customer.name}</Text>
            <View style={styles.tagRow}>
              <View style={styles.catTag}>
                <Text style={styles.catTagText}>{customer.category}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: '#4F46E518' }]}>
                <Text style={styles.statusTagText}>{customer.status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.contactBar}>
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#10B981' }]} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#FFF" />
            <Text style={styles.contactBtnText}>Call Customer</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
            <Text style={styles.contactBtnText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.locationBox}>
          <Ionicons name="location-outline" size={18} color="#6B7280" />
          <Text style={styles.locationText}>{customer.location}</Text>
        </View>
      </View>

      {/* Financial & Roll Rates Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardSectionTitle}>📜 Thermal Roll Rates & Margins</Text>

        <View style={styles.rateGrid}>
          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Required Roll</Text>
            <Text style={[styles.rateValue, { color: '#4F46E5' }]}>{customer.rollType}</Text>
          </View>

          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>My Purchase Rate</Text>
            <Text style={[styles.rateValue, { color: isDark ? '#FFF' : '#111827' }]}>
              ₨{customer.purchaseRate}
            </Text>
          </View>

          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Customer Sale Rate</Text>
            <Text style={[styles.rateValue, { color: isDark ? '#FFF' : '#111827' }]}>
              ₨{customer.saleRate}
            </Text>
          </View>
        </View>

        <View style={[styles.marginBanner, { backgroundColor: margin >= 0 ? '#10B98115' : '#EF444415' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.marginTitle, { color: margin >= 0 ? '#047857' : '#B91C1C' }]}>
              Profit Margin: ₨{margin} per roll
            </Text>
            <Text style={styles.marginSub}>
              Estimated profit on 50 rolls = <Text style={{ fontWeight: '800' }}>₨{margin * 50}</Text>
            </Text>
          </View>
          <MaterialCommunityIcons name="finance" size={28} color={margin >= 0 ? '#10B981' : '#EF4444'} />
        </View>
      </View>

      {/* Re-visit Schedule & Reminder Feedback Card */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardSectionTitle}>⏰ Re-visit Schedule Feedback</Text>
          {isVisitDue && (
            <View style={styles.dueAlertBadge}>
              <Text style={styles.dueAlertText}>🔥 DUE TODAY</Text>
            </View>
          )}
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.schedBox}>
            <Text style={styles.schedLabel}>Cycle Feedback</Text>
            <Text style={[styles.schedValue, { color: isDark ? '#FFF' : '#111827' }]}>
              Every {customer.revisitDays} Days
            </Text>
          </View>

          <View style={styles.schedBox}>
            <Text style={styles.schedLabel}>Next Scheduled Visit</Text>
            <Text style={[styles.schedValue, { color: isVisitDue ? '#D97706' : '#10B981' }]}>
              {customer.nextVisitDate}
            </Text>
          </View>
        </View>

        {customer.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Customer Notes / Feedback:</Text>
            <Text style={styles.notesText}>{customer.notes}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.visitLogBtn} onPress={handleLogVisit}>
          <MaterialIcons name="event-available" size={20} color="#FFF" />
          <Text style={styles.visitLogBtnText}>Log Shop Visit Completed Today</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Order / Sale Logger */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardSectionTitle}>🛍️ Record New Roll Sale</Text>
        <Text style={styles.helperText}>
          Deducts rolls directly from inventory stock and updates sale records.
        </Text>

        <Text style={styles.inputLabel}>Select Stock Roll Category:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {rolls.map((r) => {
            const isSelected = selectedRoll?.id === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.rollPill,
                  isSelected
                    ? { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }
                    : { backgroundColor: isDark ? '#374151' : '#E5E7EB', borderColor: 'transparent' },
                ]}
                onPress={() => setSelectedRoll(r)}
              >
                <Text style={{ color: isSelected ? '#FFF' : isDark ? '#FFF' : '#000', fontWeight: '700' }}>
                  {r.title}
                </Text>
                <Text style={{ fontSize: 11, color: isSelected ? '#E0E7FF' : '#6B7280' }}>
                  Stock: {r.stockCount} rolls
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.orderInputRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.inputLabel}>Order Quantity (Rolls):</Text>
            <TextInput
              style={[
                styles.qtyInput,
                { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#374151' : '#D1D5DB' },
              ]}
              keyboardType="numeric"
              value={orderQty}
              onChangeText={setOrderQty}
            />
          </View>

          <TouchableOpacity style={styles.processOrderBtn} onPress={handleProcessOrder}>
            <Ionicons name="cart" size={20} color="#FFF" />
            <Text style={styles.processOrderBtnText}>Record Sale</Text>
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
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  shopName: { fontSize: 18, fontWeight: '800' },
  ownerName: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 6 },
  catTag: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  catTagText: { color: '#3730A3', fontSize: 11, fontWeight: '700' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusTagText: { color: '#4F46E5', fontSize: 11, fontWeight: '700' },
  contactBar: { flexDirection: 'row', marginTop: 14 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  contactBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 6 },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB20',
  },
  locationText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },
  cardSectionTitle: { fontSize: 15, fontWeight: '700', color: '#4F46E5', marginBottom: 10 },
  rateGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  rateBox: { flex: 1, alignItems: 'center' },
  rateLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  rateValue: { fontSize: 16, fontWeight: '800' },
  marginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  marginTitle: { fontSize: 14, fontWeight: '700' },
  marginSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueAlertBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  dueAlertText: { color: '#B45309', fontSize: 11, fontWeight: '800' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  schedBox: { flex: 1 },
  schedLabel: { fontSize: 11, color: '#9CA3AF' },
  schedValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  notesBox: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, marginVertical: 8 },
  notesLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  notesText: { fontSize: 13, color: '#374151', marginTop: 2 },
  visitLogBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 8,
    marginTop: 8,
  },
  visitLogBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
  helperText: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  rollPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  orderInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  qtyInput: { height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontSize: 16 },
  processOrderBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
  },
  processOrderBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', marginLeft: 6 },
});
