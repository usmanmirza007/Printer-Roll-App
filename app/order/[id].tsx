import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { loadRolls, loadSingleCustomer, loadSingleOrder, saveCustomerOrder, saveRoll } from '@/lib/storage';
import { Customer, CustomerOrder, OrderStatus, ThermalRoll } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

const STATUSES: OrderStatus[] = [
  'In Progress',
  'Pending',
  'Delivered',
  'Invoiced',
  'Cancelled',
];

export default function AddOrEditCustomerOrderScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  const { top } = useSafeAreaInsets();

  const { customerId = '', id = '', type = '' } = useLocalSearchParams<{
    customerId?: string;
    id?: string;
    type?: string;
  }>();
  const isEditMode = type === 'edit';

  // Form state
  const [customers, setCustomers] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [rollType, setRollType] = useState('40 Meter');
  const [quantity, setQuantity] = useState('1');
  const [unitCostRate, setUnitCostRate] = useState('120');
  const [unitSaleRate, setUnitSaleRate] = useState('135');
  const [status, setStatus] = useState<OrderStatus>('Pending');
  const [loading, setLoading] = useState(false);
  const [rolls, setRolls] = useState<ThermalRoll[]>([]);
  // const [selectedRoll, setSelectedRoll] = useState<ThermalRoll | null>(null);

  const fetchDetail = async () => {
    if (!customerId) return;
    const customer = await loadSingleCustomer(customerId);

    setCustomers(customer);
    if (customer && !selectedCustomerId) {
      setSelectedCustomerId(customer.id);
    }
    const allRolls = await loadRolls();
    setRolls(allRolls);
    // if (allRolls.length > 0) {
    //   const matched = allRolls.find((r) =>
    //     customer ? r.title.toLowerCase().includes(customer.rollType.toLowerCase()) : false
    //   );
    //   setSelectedRoll(matched || allRolls[0]);
    // }
  };

  // Load customers for selection
  useEffect(() => {
    fetchDetail();
  }, [customerId]);

  // If editing, load existing order (you can expand this later)
  useEffect(() => {
    loadSingleOrder(id).then((data: any) => {
      if (data) {
        setRollType(data.rollType);
        setQuantity(data.quantity.toString());
        setUnitCostRate(data.unitCostRate.toString());
        setUnitSaleRate(data.unitSaleRate.toString());
        setStatus(data.status);
      }
    });
  }, [id, isEditMode]);

  // Auto calculations
  const qty = parseFloat(quantity) || 0;
  const costRate = parseFloat(unitCostRate) || 0;
  const saleRate = parseFloat(unitSaleRate) || 0;

  const totalCost = useMemo(() => qty * costRate, [qty, costRate]);
  const totalSale = useMemo(() => qty * saleRate, [qty, saleRate]);
  const profit = useMemo(() => totalSale - totalCost, [totalSale, totalCost]);
  const marginPercent = costRate > 0 ? ((profit / totalCost) * 100).toFixed(1) : '0';


  const handleSave = async () => {
    const filterRoll = rolls.find((roll) => roll.title.replaceAll('Thermal Roll', '').trim() == rollType)

    if (!selectedCustomerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }
    if (qty <= 0) {
      Alert.alert('Validation Error', 'Quantity must be greater than 0.');
      return;
    }
    if (costRate <= 0 || saleRate <= 0) {
      Alert.alert('Validation Error', 'Please enter valid cost and sale rates.');
      return;
    }

    if (!filterRoll) {
      Alert.alert('Select Roll', 'Please select a thermal roll type.');
      return;
    }

    if (filterRoll && filterRoll.stockCount < qty) {
      Alert.alert(
        'Insufficient Stock',
        `Current available stock for ${filterRoll.title} is ${filterRoll.stockCount} rolls.`
      );
      return;
    }

    setLoading(true);

    try {
      const orderData: CustomerOrder = {
        id: isEditMode && id ? id : `order-${Date.now()}`,
        customerId: selectedCustomerId,
        rollId: `roll-${rollType.replace(/\s/g, '-').toLowerCase()}`,
        quantity: qty,
        rollType,
        unitCostRate: costRate,
        unitSaleRate: saleRate,
        buisnessName: customers?.shopName || '',
        totalCost,
        totalSale,
        profit,
        status,
        orderDate: new Date().toISOString(),
      };

      const updatedRoll: ThermalRoll = {
        id: filterRoll?.id || `roll-${rollType.replace(/\s/g, '-').toLowerCase()}`,
        description: filterRoll?.description || '',
        meterLength: filterRoll?.meterLength || 40,
        paperWidth: filterRoll?.paperWidth || '80mm Standard POS',
        purchaseRate: costRate,
        wholesaleRate: saleRate,
        stockCount: filterRoll ? filterRoll.stockCount - qty : 0, // Assuming initial stock is 100 for simplicity
        minStockAlert: filterRoll?.minStockAlert || 10,
        title: filterRoll.title,
      };

      await saveCustomerOrder(orderData); // make sure this function exists in storage
      if (updatedRoll) {
        await saveRoll(updatedRoll);
      }
      setLoading(false);
      Alert.alert(
        'Success',
        `Order saved successfully!\nProfit: ₨${profit}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e) {
      setLoading(false);
      console.error(e);
      Alert.alert('Error', 'Failed to save order.');
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {isEditMode ? 'Edit Order' : 'New Customer Order'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => router.push(`/invoice/${customerId}`)}
          >
            <Ionicons name="print-outline" size={18} color={theme.tint} />
            <Text style={[styles.actionText, { color: theme.text }]}>Print Invoice</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1: Select Customer */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Customer Details</Text>
          {customers && (
            <View style={[styles.selectedInfo, { backgroundColor: theme.surface }]}>
              <Text style={{ color: theme.text, fontWeight: '600' }}>
                {customers.shopName}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                {customers.name} • {customers.phone}
              </Text>
            </View>
          )}

        </View>

        {/* Section 2: Roll & Quantity */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>
            Roll Details & Quantity
          </Text>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Roll Type *</Text>
          <View style={styles.pillsWrap}>
            {rolls.map((rt) => {

              const title = rt.title.replaceAll('Thermal Roll', '').trim();
              const active = rollType === title; // Adjusted to match the rollType state
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
                    // setSelectedRoll(rt)
                    setUnitCostRate(rt.purchaseRate.toString())
                    setUnitSaleRate(rt.wholesaleRate.toString())
                  }}
                >
                  <Text
                    style={[
                      styles.pillText,
                      { color: active ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {title} {rt.stockCount !== undefined ? `(Stock: ${rt.stockCount})` : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Quantity *</Text>
          <TextInput
            style={[
              styles.input,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface },
            ]}
            placeholder="e.g. 10"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>

        {/* Section 3: Pricing */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Pricing</Text>

          <View style={styles.rateRow}>
            <View style={{ flex: 1, marginRight: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Unit Cost Rate *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                placeholder="120"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={unitCostRate}
                onChangeText={setUnitCostRate}
              />
            </View>

            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                Unit Sale Rate *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
                placeholder="135"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={unitSaleRate}
                onChangeText={setUnitSaleRate}
              />
            </View>
          </View>

          {/* Summary Banner */}
          <View
            style={[
              styles.summaryBox,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.summaryRow}>
              <Text style={{ color: theme.textSecondary }}>Total Cost</Text>
              <Text style={{ color: theme.text, fontWeight: '600' }}>₨{totalCost.toFixed(0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: theme.textSecondary }}>Total Sale</Text>
              <Text style={{ color: theme.text, fontWeight: '600' }}>₨{totalSale.toFixed(0)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: theme.textSecondary }}>Profit</Text>
              <Text
                style={{
                  color: profit >= 0 ? Palette.success : Palette.danger,
                  fontWeight: '700',
                }}
              >
                ₨{profit.toFixed(0)} ({marginPercent}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Section 4: Status */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionHeader, { color: theme.tint }]}>Order Status</Text>

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
                      : {
                        backgroundColor: theme.surface,
                        borderWidth: 1,
                        borderColor: theme.border,
                      },
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
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: theme.tint },
            loading && { opacity: 0.7 },
          ]}
          disabled={loading}
          onPress={handleSave}
        >
          <Text style={styles.saveBtnText}>
            {loading ? 'Saving...' : isEditMode ? 'Update Order' : 'Create Order'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 4,
  },
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
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
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
  selectedInfo: {
    borderRadius: 8,
  },
  summaryBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  saveBtn: {
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },

});