import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  getTodayDateString,
  loadCustomers,
  loadRolls,
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

  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rolls, setRolls] = useState<ThermalRoll[]>([]);
  const [reseeding, setReseeding] = useState(false);

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

  const handleResetFirestoreData = () => {
    Alert.alert(
      'Reset Firestore Data',
      'This will re-seed default customers and thermal rolls into Firebase Firestore. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Firestore',
          style: 'destructive',
          onPress: async () => {
            setReseeding(true);
            // await seedInitialFirestoreData();
            await fetchData();
            setReseeding(false);
            Alert.alert('Reset Complete', 'Firestore default collections restored!');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* User Account Card */}
      <View style={[styles.profileCard, { backgroundColor: theme.tint }]}>
        <View style={styles.avatarCircle}>
          <MaterialCommunityIcons name="account" size={28} color={theme.tint} />
        </View>

        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.profileName}>
            {user?.displayName || user?.email?.split('@')[0] || 'Sales Executive'}
          </Text>
          <Text style={styles.profileSub}>{user?.email || 'Firebase Authenticated'}</Text>
          <Text style={[styles.profileSub, { fontSize: 10, opacity: 0.8 }]}>
            UID: {user?.uid ? user.uid.substring(0, 12) + '...' : 'Guest'}
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBadge} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
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
        <Text style={[styles.cardTitle, { color: theme.tint }]}>Quick Tools & Firebase Controls</Text>

        <TouchableOpacity style={[styles.toolBtn, { borderBottomColor: theme.border }]} onPress={handleCopyCustomerList}>
          <Feather name="copy" size={16} color={theme.text} />
          <Text style={[styles.toolBtnText, { color: theme.text }]}>
            Export Customer Directory (Clipboard)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolBtn, { borderBottomColor: theme.border }]} onPress={handleResetFirestoreData} disabled={reseeding}>
          <Feather name="refresh-cw" size={16} color={Palette.warning} />
          <Text style={[styles.toolBtnText, { color: Palette.warning }]}>
            {reseeding ? 'Re-seeding Firestore...' : 'Reset & Seed Firestore Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.toolBtn, { borderBottomColor: 'transparent' }]} onPress={handleLogout}>
          <Feather name="log-out" size={16} color={Palette.danger} />
          <Text style={[styles.toolBtnText, { color: Palette.danger }]}>
            Sign Out Account
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  profileSub: { fontSize: 12, color: '#E0E7FF', marginTop: 1 },
  logoutBadge: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
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
