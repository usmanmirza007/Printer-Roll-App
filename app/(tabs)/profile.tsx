import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
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
  const theme = Colors[isDark ? 'dark' : 'light'];

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

  const todayStr = getTodayDateString(0);
  const totalCustomers = customers.length;
  const visitDueToday = customers.filter(
    (c) => c.nextVisitDate && c.nextVisitDate <= todayStr
  ).length;

  const totalStockItems = rolls.reduce((sum, r) => sum + r.stockCount, 0);

  let totalEstProfitPerCycle = 0;
  customers.forEach((c) => {
    const margin = c.saleRate - c.purchaseRate;
    totalEstProfitPerCycle += margin * 20;
  });

  const categoryCounts: Record<string, number> = {};
  customers.forEach((c) => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const handleCopyCustomerList = () => {
    let text = `📦 THERMAL ROLL CUSTOMER LIST\n-------------------------------\n`;
    customers.forEach((c, idx) => {
      text += `${idx + 1}. ${c.shopName} (${c.category})\n   Contact: ${c.name} (${c.phone})\n   Req: ${c.rollType} | Rate: ₨${c.saleRate} | Status: ${c.status}\n   Next Visit: ${c.nextVisitDate}\n\n`;
    });
    Clipboard.setString(text);
    Alert.alert('Copied!', 'Customer list copied to clipboard.');
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will reset customers and thermal rolls back to initial default state. Proceed?',
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
            Alert.alert('Reset Complete', 'Default data restored!');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Sales App Card Banner */}
      <View style={[styles.profileCard, { backgroundColor: theme.tint }]}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="printer-pos" size={26} color={theme.tint} />
        </View>

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.profileName}>Thermal Roll Direct Sales</Text>
          <Text style={styles.profileSub}>Shop Visit & Supply Management</Text>
        </View>
      </View>

      {/* Metric Cards Grid */}
      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialIcons name="storefront" size={22} color={theme.tint} />
          <Text style={[styles.kpiNumber, { color: theme.text }]}>{totalCustomers}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Registered Shops</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="time-outline" size={22} color={Palette.warning} />
          <Text style={[styles.kpiNumber, { color: Palette.warning }]}>{visitDueToday}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Visits Due Today</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="receipt" size={22} color={Palette.success} />
          <Text style={[styles.kpiNumber, { color: Palette.success }]}>{totalStockItems}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Total In-Stock</Text>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="currency-usd" size={22} color={theme.tint} />
          <Text style={[styles.kpiNumber, { color: theme.text }]}>₨{totalEstProfitPerCycle}</Text>
          <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>Est. Cycle Profit</Text>
        </View>
      </View>

      {/* Market Distribution */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.tint }]}>Customer Market Distribution</Text>

        <View style={styles.catGrid}>
          {Object.entries(categoryCounts).map(([cat, count]) => (
            <View key={cat} style={[styles.catChip, { backgroundColor: theme.surface }]}>
              <Text style={[styles.catChipName, { color: theme.text }]}>{cat}:</Text>
              <Text style={[styles.catChipCount, { color: theme.textSecondary }]}>{count} shops</Text>
            </View>
          ))}
          {Object.keys(categoryCounts).length === 0 && (
            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>No customers registered yet.</Text>
          )}
        </View>
      </View>

      {/* Quick Tools */}
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.cardTitle, { color: theme.tint }]}>Quick Tools</Text>

        <TouchableOpacity style={[styles.toolBtn, { borderBottomColor: theme.border }]} onPress={handleCopyCustomerList}>
          <Feather name="copy" size={16} color={theme.text} />
          <Text style={[styles.toolBtnText, { color: theme.text }]}>
            Export Customer Directory (Clipboard)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolBtn, { borderBottomColor: 'transparent' }]} onPress={handleResetData}>
          <Feather name="refresh-cw" size={16} color={Palette.danger} />
          <Text style={[styles.toolBtnText, { color: Palette.danger }]}>
            Reset Demo Data
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
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  profileSub: { fontSize: 12, color: '#E0E7FF', marginTop: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 },
  kpiCard: {
    width: '48%',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  kpiNumber: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  kpiLabel: { fontSize: 11, marginTop: 1, textAlign: 'center' },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  catChip: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  catChipName: { fontSize: 12, fontWeight: '600' },
  catChipCount: { fontSize: 12, marginLeft: 4 },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toolBtnText: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
});
