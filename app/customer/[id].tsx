import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import {
  deleteCustomer,
  getTodayDateString,
  loadCustomers,
  loadRolls,
  recordCustomerVisit,
  saveCustomerOrder,
  saveRoll,
} from '@/lib/storage';
import { Customer, CustomerOrder, ThermalRoll } from '@/lib/types';
import { Feather, Ionicons } from '@expo/vector-icons';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomerDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { id } = useLocalSearchParams<{ id: string }>();
  const { top } = useSafeAreaInsets();
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
      <View style={[styles.container, styles.center, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Customer not found.</Text>
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
      `Hello ${customer.name}! Contacting regarding Thermal Roll supply (${customer.rollType}) for ${customer.shopName}.`
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
        `Current available stock for ${selectedRoll.title} is ${selectedRoll.stockCount} rolls.`
      );
      return;
    }

    const updatedRoll: ThermalRoll = {
      ...selectedRoll,
      stockCount: selectedRoll.stockCount - qty,
    };

    const createCustomerOrder: CustomerOrder = {
      id: `${customer.id}_${selectedRoll.id}_${Date.now()}`,
      customerId: customer.id,
      rollId: selectedRoll.id,
      quantity: qty,
      rollType: selectedRoll.title,
      unitCostRate: selectedRoll.purchaseRate,
      unitSaleRate: customer.saleRate,
      totalCost: selectedRoll.purchaseRate * qty,
      totalSale: customer.saleRate * qty,
      profit: (customer.saleRate - selectedRoll.purchaseRate) * qty,
      status: 'In Progress',
      orderDate: new Date().toISOString(),
    };
    await saveRoll(updatedRoll);
    await saveCustomerOrder(createCustomerOrder);

    Alert.alert(
      'Order Recorded!',
      `Logged sale of ${qty} rolls (${selectedRoll.title}) for ${customer.shopName}.\n\nTotal Sale: ₨${qty * customer.saleRate
      }\nTotal Profit: ₨${qty * margin}\nRemaining Stock: ${updatedRoll.stockCount} rolls.`
    );
    fetchDetail();
  };

  return (
    <ScrollView
      style={[styles.container, { marginTop: top, backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Top Header */}
      <View style={styles.navRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]}>Customer Details</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{ marginRight: 14 }}
            onPress={() => router.push(`/customer/add?id=${customer.id}`)}
          >
            <Feather name="edit-2" size={20} color={theme.tint} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={Palette.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Info Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.headerTop}>
          <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
            <Text style={[styles.avatarText, { color: theme.tint }]}>
              {customer.shopName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.shopName, { color: theme.text }]}>{customer.shopName}</Text>
            <Text style={[styles.ownerName, { color: theme.textSecondary }]}>
              {customer.name} • {customer.location}
            </Text>
            <View style={styles.tagRow}>
              <View style={[styles.catTag, { backgroundColor: theme.surface }]}>
                <Text style={[styles.catTagText, { color: theme.textSecondary }]}>
                  {customer.category}
                </Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: theme.surface }]}>
                <Text style={[styles.statusTagText, { color: theme.tint }]}>
                  {customer.status}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.contactBar}>
          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.surface }]} onPress={handleCall}>
            <Ionicons name="call-outline" size={16} color={theme.text} />
            <Text style={[styles.contactBtnText, { color: theme.text }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.contactBtn, { backgroundColor: theme.surface }]} onPress={handleWhatsApp}>
            <Ionicons name="logo-whatsapp" size={16} color="#16A34A" />
            <Text style={[styles.contactBtnText, { color: theme.text }]}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Rates & Profit Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardSectionTitle, { color: theme.tint }]}>Rates & Financial Breakdown</Text>

        <View style={styles.rateGrid}>
          <View style={styles.rateBox}>
            <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Roll Required</Text>
            <Text style={[styles.rateValue, { color: theme.text }]}>{customer.rollType}</Text>
          </View>

          <View style={styles.rateBox}>
            <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Cost Rate</Text>
            <Text style={[styles.rateValue, { color: theme.text }]}>₨{customer.purchaseRate}</Text>
          </View>

          <View style={styles.rateBox}>
            <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Sale Rate</Text>
            <Text style={[styles.rateValue, { color: theme.text }]}>₨{customer.saleRate}</Text>
          </View>
        </View>

        <View style={[styles.marginBanner, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.marginTitle, { color: margin >= 0 ? Palette.success : Palette.danger }]}>
            Profit Margin: <Text style={{ fontWeight: '700' }}>₨{margin}</Text> per roll
          </Text>
          <Text style={[styles.marginSub, { color: theme.textSecondary }]}>
            Est. profit on 50 rolls = <Text style={{ fontWeight: '700', color: theme.text }}>₨{margin * 50}</Text>
          </Text>
        </View>
      </View>

      {/* Visit Schedule Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.rowBetween}>
          <Text style={[styles.cardSectionTitle, { color: theme.tint }]}>Re-visit Schedule</Text>
          {isVisitDue && (
            <View style={[styles.dueAlertBadge, { backgroundColor: isDark ? '#78350F' : '#FFFBEB' }]}>
              <Text style={styles.dueAlertText}>Visit Due Today</Text>
            </View>
          )}
        </View>

        <View style={styles.scheduleRow}>
          <View style={styles.schedBox}>
            <Text style={[styles.schedLabel, { color: theme.textSecondary }]}>Feedback Cycle</Text>
            <Text style={[styles.schedValue, { color: theme.text }]}>Every {customer.revisitDays} Days</Text>
          </View>

          <View style={styles.schedBox}>
            <Text style={[styles.schedLabel, { color: theme.textSecondary }]}>Next Scheduled Visit</Text>
            <Text style={[styles.schedValue, { color: isVisitDue ? Palette.warning : Palette.success }]}>
              {customer.nextVisitDate}
            </Text>
          </View>
        </View>

        {customer.notes ? (
          <View style={[styles.notesBox, { backgroundColor: theme.surface }]}>
            <Text style={[styles.notesLabel, { color: theme.textSecondary }]}>Customer Notes:</Text>
            <Text style={[styles.notesText, { color: theme.text }]}>{customer.notes}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.visitLogBtn, { backgroundColor: theme.tint }]} onPress={handleLogVisit}>
          <Text style={styles.visitLogBtnText}>Log Visit Completed Today</Text>
        </TouchableOpacity>
      </View>

      {/* Record Order Card */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardSectionTitle, { color: theme.tint }]}>Record New Sale</Text>

        <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Select Roll Item:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {rolls.map((r) => {
            const isSelected = selectedRoll?.id === r.id;
            return (
              <TouchableOpacity
                key={r.id}
                style={[
                  styles.rollPill,
                  isSelected
                    ? { backgroundColor: theme.tint, borderColor: theme.tint }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={() => setSelectedRoll(r)}
              >
                <Text style={{ color: isSelected ? '#FFF' : theme.text, fontWeight: '600', fontSize: 12 }}>
                  {r.title}
                </Text>
                <Text style={{ fontSize: 10, color: isSelected ? '#E0E7FF' : theme.textSecondary }}>
                  Stock: {r.stockCount}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.orderInputRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Quantity (Rolls):</Text>
            <TextInput
              style={[
                styles.qtyInput,
                { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              keyboardType="numeric"
              value={orderQty}
              onChangeText={setOrderQty}
            />
          </View>

          <TouchableOpacity style={[styles.processOrderBtn, { backgroundColor: theme.tint }]} onPress={handleProcessOrder}>
            <Text style={styles.processOrderBtnText}>Record Sale</Text>
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={[styles.processOrderBtn, { backgroundColor: theme.tint }]} onPress={() => router.push(`/order/list?customerId=${id}`)}>
        <Text style={styles.processOrderBtnText}>View Order List</Text>
      </TouchableOpacity>
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
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '700' },
  shopName: { fontSize: 17, fontWeight: '700' },
  ownerName: { fontSize: 13, marginTop: 2 },
  tagRow: { flexDirection: 'row', marginTop: 6 },
  catTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 6 },
  catTagText: { fontSize: 11, fontWeight: '600' },
  statusTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  contactBar: { flexDirection: 'row', marginTop: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 3,
  },
  contactBtnText: { fontSize: 13, fontWeight: '600', marginLeft: 6 },
  cardSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  rateGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rateBox: { flex: 1, alignItems: 'center' },
  rateLabel: { fontSize: 11, marginBottom: 2 },
  rateValue: { fontSize: 15, fontWeight: '700' },
  marginBanner: { padding: 10, borderRadius: 8, borderWidth: 1 },
  marginTitle: { fontSize: 13, fontWeight: '700' },
  marginSub: { fontSize: 12, marginTop: 2 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueAlertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  dueAlertText: { color: '#B45309', fontSize: 11, fontWeight: '700' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  schedBox: { flex: 1 },
  schedLabel: { fontSize: 11 },
  schedValue: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  notesBox: { padding: 8, borderRadius: 6, marginVertical: 6 },
  notesLabel: { fontSize: 11, fontWeight: '600' },
  notesText: { fontSize: 12, marginTop: 2 },
  visitLogBtn: {
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  visitLogBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  rollPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 6, borderWidth: 1 },
  orderInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4 },
  qtyInput: { height: 42, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 14 },
  processOrderBtn: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processOrderBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
