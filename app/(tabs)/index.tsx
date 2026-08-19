import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  generateAutomaticNotifications,
  loadCustomers,
  loadRolls,
  recordCustomerVisit,
} from '@/lib/storage';
import { Customer, CustomerStatus, MarketCategory } from '@/lib/types';
import { getCustomerStatusStyle } from '@/utils/statusStyle';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';


const MARKET_CATEGORIES: (MarketCategory | 'All')[] = [
  'All',
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

const STATUS_FILTERS: (CustomerStatus | 'All')[] = [
  'All',
  'Active',
  'Follow-up Required',
  'Inactive',
  'Blocked'
];

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // const {
  //   orders,
  //   orderCount,
  //   loading,
  //   error,
  //   refetch,
  // } = useCustomerOrders(customerId);

  const fetchCustomerData = async () => {
    try {
      const data = await loadCustomers();
      const rolls = await loadRolls();
      setCustomers(data);
      await generateAutomaticNotifications(data, rolls);
    } catch (e) {
      console.error('Failed to load customers:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCustomerData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerData();
    setRefreshing(false);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        cust.shopName.toLowerCase().includes(query) ||
        cust.name.toLowerCase().includes(query) ||
        cust.location.toLowerCase().includes(query) ||
        cust.phone.includes(query);

      const matchesCategory =
        selectedCategory === 'All' || cust.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'All' || cust.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [customers, searchQuery, selectedCategory, selectedStatus]);

  const totalCount = customers.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const visitDueTodayCount = customers.filter(
    (c) => c.nextVisitDate && c.nextVisitDate <= todayStr
  ).length;
  const inProgressCount = customers.filter((c) => c.status === 'Active').length;

  const handleCall = (phone: string, name: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', `Cannot call ${name}`);
    });
  };

  const handleWhatsApp = (phone: string, shopName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello! Contacting regarding Thermal Roll supply for ${shopName}.`
    );
    const url = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`).catch(() => {
        Alert.alert('WhatsApp', 'Could not open WhatsApp app.');
      });
    });
  };


  const handleLogVisit = async (customerId: string, shopName: string) => {
    Alert.alert(
      'Log Visit',
      `Mark shop visit complete for "${shopName}" today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Done',
          onPress: async () => {
            const token = (user as any)?.stsTokenManager?.accessToken;
            const result = await recordCustomerVisit(customerId, user?.uid, token);
            setCustomers(result.customers);
          },
        },
      ]
    );
  };


  const renderCustomerCard = ({ item }: { item: Customer }) => {
    const margin = item.saleRate - item.purchaseRate;
    const statusStyle = getCustomerStatusStyle(item.status, isDark);
    const isDue = item.nextVisitDate && item.nextVisitDate <= todayStr;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: isDue ? Palette.warning : theme.border,
          },
        ]}
        onPress={() => router.push(`/customer/${item.id}`)}
      >
        {/* Top Header */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={[styles.shopName, { color: theme.text }]} numberOfLines={1}>
                {item.shopName}
              </Text>
            </View>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {item.name} • {item.location}
            </Text>
          </View>

          {/* Unified Gray Category Tag */}
          <View style={[styles.categoryTag, { backgroundColor: isDark ? '#334155' : '#F1F5F9' }]}>
            <Text style={[styles.categoryTagText, { color: theme.textSecondary }]}>
              {item.category}
            </Text>
          </View>
        </View>

        {/* Pricing Summary Box */}
        <View style={[styles.priceBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: theme.border }]}>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Roll Type</Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>{item.rollType}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Sale Rate</Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>
              ₨{item.saleRate}
            </Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Order Count</Text>
            <Text style={[styles.marginVal, { color: theme.text }]}>
              {item.orderCount}
            </Text>
          </View>
        </View>

        {/* Status & Revisit Schedule Footer */}
        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>

          <View style={styles.visitNotice}>
            {isDue ? (
              <View style={[styles.dueBadge, { backgroundColor: isDark ? '#78350F' : '#FFFBEB' }]}>
                <Ionicons name="time-outline" size={13} color="#B45309" />
                <Text style={styles.dueText}>Visit Due Today</Text>
              </View>
            ) : (
              <Text style={[styles.revisitText, { color: theme.textSecondary }]}>
                Next Visit: {item.nextVisitDate}
              </Text>
            )}
          </View>
        </View>

        {/* Native Action Buttons Bar */}
        <View style={[styles.actionBar, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => handleCall(item.phone, item.name)}
          >
            <Ionicons name="call-outline" size={15} color={theme.text} />
            <Text style={[styles.actionText, { color: theme.text }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => handleWhatsApp(item.phone, item.shopName)}
          >
            <Ionicons name="logo-whatsapp" size={15} color="#16A34A" />
            <Text style={[styles.actionText, { color: theme.text }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => handleLogVisit(item.id, item.shopName)}
          >
            <Ionicons name="checkmark-done-outline" size={15} color={theme.tint} />
            <Text style={[styles.actionText, { color: theme.text }]}>Log Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.iconOnlyBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => router.push(`/customer/add?id=${item.id}`)}
          >
            <Feather name="edit-2" size={14} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Search & Filter Bar */}
      <View style={[styles.headerBox, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by shop, customer, location..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Minimal KPI Metric Chips */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: theme.text }]}>{totalCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Total Shops</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: Palette.warning }]}>{visitDueTodayCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Visits Due</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: theme.tint }]}>{inProgressCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>In Progress</Text>
          </View>
        </View>

        {/* Category Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MARKET_CATEGORIES}
          keyExtractor={(item) => item}
          style={styles.filterScroll}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: theme.tint }
                    : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />

        {/* Status Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          style={[styles.filterScroll, { marginTop: 6 }]}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item;
            return (
              <TouchableOpacity
                style={[
                  styles.statusPill,
                  isSelected
                    ? { backgroundColor: isDark ? '#334155' : '#334155' }
                    : { backgroundColor: 'transparent' },
                ]}
                onPress={() => setSelectedStatus(item)}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerCard}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="storefront" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Customers Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {searchQuery
                ? `No shops matching "${searchQuery}"`
                : 'Tap + New Customer to register a shop record.'}
            </Text>
          </View>
        }
      />

      {/* Floating Native Add Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.tint }]}
        activeOpacity={0.85}
        onPress={() => router.push('/customer/add')}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.fabText}>New Customer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBox: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  metricChip: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  metricVal: { fontSize: 15, fontWeight: '700' },
  metricLbl: { fontSize: 11, marginTop: 1 },
  filterScroll: { marginTop: 10 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  statusPillText: { fontSize: 12, fontWeight: '500' },
  listPadding: { padding: 16, paddingBottom: 90 },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  shopName: { fontSize: 16, fontWeight: '700' },
  subText: { fontSize: 13, marginTop: 2 },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryTagText: { fontSize: 11, fontWeight: '600' },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  priceCol: { flex: 1 },
  priceLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  priceVal: { fontSize: 13, marginTop: 2 },
  marginVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  visitNotice: { flexDirection: 'row', alignItems: 'center' },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dueText: { fontSize: 11, fontWeight: '700', color: '#B45309', marginLeft: 4 },
  revisitText: { fontSize: 12 },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  iconOnlyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  fabText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 4 },
});
