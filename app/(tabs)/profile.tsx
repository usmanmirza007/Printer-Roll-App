import { useColorScheme } from '@/components/useColorScheme';
import {
  DEFAULT_CUSTOMERS,
  DEFAULT_NOTIFICATIONS,
  DEFAULT_ROLLS,
  getTodayDateString,
  loadCustomers,
  loadRolls,
  saveCustomer,
  saveNotifications,
  saveRoll,
} from '@/lib/storage';
import { Customer, ThermalRoll } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rolls, setRolls] = useState<ThermalRoll[]>([]);

  const fetchData = async () => {
    const custs = await loadCustomers();
    const rls = await loadRolls();
    setCustomers(custs);
    setRolls(rls);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Profit & Metrics Calculations
  const todayStr = getTodayDateString(0);

  const totalCustomers = customers.length;
  const visitDueToday = customers.filter(
    (c) => c.nextVisitDate && c.nextVisitDate <= todayStr
  ).length;

  const totalStockItems = rolls.reduce((sum, r) => sum + r.stockCount, 0);

  // Total Estimated Revenue & Profit Margin across active customer base
  let totalEstProfitPerCycle = 0;
  customers.forEach((c) => {
    const margin = c.saleRate - c.purchaseRate;
    totalEstProfitPerCycle += margin * 20; // Avg 20 rolls per order cycle
  });

  // Market Category Counts
  const categoryCounts: Record<string, number> = {};
  customers.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  // Copy Formatted Customer List to Clipboard
  const handleCopyCustomerList = () => {
    let text = `📦 THERMAL ROLL CUSTOMER LIST\n-------------------------------\n`;
    customers.forEach((c, idx) => {
      text += `${idx + 1}. ${c.shopName} (${c.category})\n   Contact: ${c.name} (${c.phone})\n   Req: ${c.rollType} | Rate: ₨${c.saleRate} | Status: ${c.status}\n   Next Visit: ${c.nextVisitDate}\n\n`;
    });
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Customer list formatted and copied to clipboard.');
  };

  // Reset to Default Preset Data
  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset all customers and roll categories back to default state (40m roll @ 120/140 rate, sample pharmacy, restaurant, cloth brand customers). Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await saveNotifications(DEFAULT_NOTIFICATIONS);
            for (const c of DEFAULT_CUSTOMERS) {
              await saveCustomer(c);
            }
            for (const r of DEFAULT_ROLLS) {
              await saveRoll(r);
            }
            await fetchData();
            Alert.alert('Reset Complete', 'Default data restored successfully!');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Sales Business Profile Banner */}
      <View style={[styles.profileCard, { backgroundColor: '#4F46E5' }]}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="printer-pos" size={32} color="#4F46E5" />
        </View>

        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.profileName}>Thermal Roll Sales CRM</Text>
          <Text style={styles.profileSub}>
            Shop-by-Shop Direct Distribution System
          </Text>
        </View>
      </View>

      {/* Main KPI Summary Metrics Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <MaterialIcons name="people" size={24} color="#4F46E5" />
          <Text style={[styles.kpiNumber, { color: isDark ? '#FFF' : '#111827' }]}>
            {totalCustomers}
          </Text>
          <Text style={styles.kpiLabel}>Registered Shops</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <Ionicons name="time" size={24} color="#D97706" />
          <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{visitDueToday}</Text>
          <Text style={styles.kpiLabel}>Visits Due Today</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <MaterialCommunityIcons name="receipt" size={24} color="#10B981" />
          <Text style={[styles.kpiNumber, { color: '#10B981' }]}>{totalStockItems}</Text>
          <Text style={styles.kpiLabel}>In-Stock Rolls</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
          <MaterialCommunityIcons name="currency-usd" size={24} color="#2563EB" />
          <Text style={[styles.kpiNumber, { color: '#2563EB' }]}>
            ₨{totalEstProfitPerCycle}
          </Text>
          <Text style={styles.kpiLabel}>Est. Cycle Profit</Text>
        </View>
      </View>

      {/* Market Category Breakdown */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardTitle}>📊 Customer Market Breakdown</Text>

        <View style={styles.catGrid}>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <View key={cat} style={styles.catChip}>
              <Text style={styles.catChipName}>{cat}:</Text>
              <Text style={styles.catChipCount}>{count} shops</Text>
            </View>
          ))}
          {Object.keys(categoryCounts).length === 0 && (
            <Text style={{ color: '#9CA3AF', fontSize: 13 }}>No customers registered yet.</Text>
          )}
        </View>
      </View>

      {/* Quick Tools */}
      <View style={[styles.card, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <Text style={styles.cardTitle}>⚡ Quick Business Actions</Text>

        <TouchableOpacity style={styles.toolBtn} onPress={handleCopyCustomerList}>
          <Feather name="copy" size={18} color="#4F46E5" />
          <Text style={[styles.toolBtnText, { color: isDark ? '#FFF' : '#111827' }]}>
            Export Customer List (Copy to Clipboard)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.toolBtn} onPress={handleResetData}>
          <Feather name="refresh-cw" size={18} color="#EF4444" />
          <Text style={[styles.toolBtnText, { color: '#EF4444' }]}>
            Reset Demo Data to Initial State
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  profileSub: { fontSize: 12, color: '#E0E7FF', marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  kpiCard: {
    width: '48%',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiNumber: { fontSize: 20, fontWeight: '800', marginTop: 6 },
  kpiLabel: { fontSize: 12, color: '#6B7280', marginTop: 2, textAlign: 'center' },
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
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#4F46E5', marginBottom: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  catChip: {
    flexDirection: 'row',
    backgroundColor: '#4F46E510',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  catChipName: { fontSize: 12, fontWeight: '700', color: '#4338CA' },
  catChipCount: { fontSize: 12, color: '#6366F1', marginLeft: 4 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB20',
  },
  toolBtnText: { fontSize: 14, fontWeight: '600', marginLeft: 10 },
});
