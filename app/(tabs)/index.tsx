import { useColorScheme } from '@/components/useColorScheme';
import {
  generateAutomaticNotifications,
  loadCustomers,
  loadRolls,
  recordCustomerVisit,
} from '@/lib/storage';
import { Customer, CustomerStatus, MarketCategory } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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
  View,
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
  'In Progress',
  'Pending',
  'Out for Delivery',
  'Delivered',
  'Follow-up Required',
];

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MarketCategory | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<CustomerStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

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

  // Live Filter base on Search Query (Shop Name or Customer Name or Location), Category, and Status
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

  // Summary Metrics
  const totalCount = customers.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const visitDueTodayCount = customers.filter(
    (c) => c.nextVisitDate && c.nextVisitDate <= todayStr
  ).length;
  const inProgressCount = customers.filter((c) => c.status === 'In Progress').length;

  // Direct Call Helper
  const handleCall = (phone: string, name: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', `Cannot initiate phone call to ${name}`);
    });
  };

  // Direct WhatsApp Helper
  const handleWhatsApp = (phone: string, shopName: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const msg = encodeURIComponent(
      `Hello! Reaching out regarding your Thermal Printer Roll order for ${shopName}.`
    );
    const url = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`).catch(() => {
        Alert.alert('WhatsApp', 'Could not open WhatsApp app.');
      });
    });
  };

  // Quick Visit Logger
  const handleLogVisit = async (customerId: string, shopName: string) => {
    Alert.alert(
      'Confirm Visit',
      `Mark shop visit completed today for "${shopName}"? Next visit will be scheduled automatically based on feedback cycle.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Done',
          onPress: async () => {
            const result = await recordCustomerVisit(customerId);
            setCustomers(result.customers);
            Alert.alert('Success', `Visit logged for ${shopName}!`);
          },
        },
      ]
    );
  };

  // Category Icon & Color mapping
  const getCategoryBadge = (cat: MarketCategory) => {
    let color = '#4F46E5';
    let icon = 'storefront';
    switch (cat) {
      case 'Pharmacy':
        color = '#059669';
        icon = 'local-pharmacy';
        break;
      case 'Restaurant':
        color = '#D97706';
        icon = 'restaurant';
        break;
      case 'Fast Food':
        color = '#DC2626';
        icon = 'fastfood';
        break;
      case 'Cloth Brand':
        color = '#9333EA';
        icon = 'checkroom';
        break;
      case 'Supermarket':
        color = '#2563EB';
        icon = 'shopping-cart';
        break;
      case 'General Store':
        color = '#0891B2';
        icon = 'store';
        break;
      default:
        color = '#4F46E5';
        icon = 'business';
    }
    return { color, icon };
  };

  // Status Badge formatting
  const getStatusBadgeStyle = (status: CustomerStatus) => {
    switch (status) {
      case 'Delivered':
        return { bg: isDark ? '#064E3B' : '#D1FAE5', text: '#065F46' };
      case 'In Progress':
        return { bg: isDark ? '#1E3A8A' : '#DBEAFE', text: '#1E40AF' };
      case 'Pending':
        return { bg: isDark ? '#78350F' : '#FEF3C7', text: '#92400E' };
      case 'Out for Delivery':
        return { bg: isDark ? '#581C87' : '#F3E8FF', text: '#6B21A8' };
      case 'Follow-up Required':
        return { bg: isDark ? '#831843' : '#FCE7F3', text: '#9D174D' };
      case 'Cancelled':
        return { bg: isDark ? '#7F1D1D' : '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const renderCustomerItem = ({ item }: { item: Customer }) => {
    const margin = item.saleRate - item.purchaseRate;
    const catBadge = getCategoryBadge(item.category);
    const statusStyle = getStatusBadgeStyle(item.status);
    const isDue = item.nextVisitDate && item.nextVisitDate <= todayStr;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: isDue ? '#F59E0B' : isDark ? '#374151' : '#E5E7EB',
            borderWidth: isDue ? 1.5 : 1,
          },
        ]}
        onPress={() => router.push(`/customer/${item.id}`)}
      >
        {/* Top Header: Shop Name & Category */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.shopTitle,
                  { color: isDark ? '#F9FAFB' : '#111827' },
                ]}
                numberOfLines={1}
              >
                {item.shopName}
              </Text>
            </View>
            <Text style={styles.customerName}>
              👤 {item.name} • {item.location}
            </Text>
          </View>

          <View style={[styles.categoryBadge, { backgroundColor: catBadge.color + '18' }]}>
            <MaterialIcons name={catBadge.icon as any} size={14} color={catBadge.color} />
            <Text style={[styles.categoryBadgeText, { color: catBadge.color }]}>
              {item.category}
            </Text>
          </View>
        </View>

        {/* Details Row: Roll Type & Profit Margin */}
        <View
          style={[
            styles.detailsContainer,
            { backgroundColor: isDark ? '#111827' : '#F9FAFB' },
          ]}
        >
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Roll Requirement</Text>
            <Text style={[styles.detailValue, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
              📜 {item.rollType}
            </Text>
          </View>

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Rates (Cost ➔ Sale)</Text>
            <Text style={[styles.detailValue, { color: isDark ? '#E5E7EB' : '#1F2937' }]}>
              ₨{item.purchaseRate} ➔ <Text style={{ fontWeight: '700' }}>₨{item.saleRate}</Text>
            </Text>
          </View>

          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Profit Margin</Text>
            <Text style={[styles.marginValue, { color: margin >= 0 ? '#10B981' : '#EF4444' }]}>
              +₨{margin}/roll
            </Text>
          </View>
        </View>

        {/* Status & Re-visit Schedule Row */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              ● {item.status}
            </Text>
          </View>

          <View style={styles.visitBadgeContainer}>
            {isDue ? (
              <View style={styles.dueBadge}>
                <Ionicons name="time" size={13} color="#D97706" />
                <Text style={styles.dueBadgeText}>Visit Due Today</Text>
              </View>
            ) : (
              <Text style={styles.nextVisitText}>
                🗓️ Re-visit: {item.nextVisitDate || `In ${item.revisitDays} days`}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#10B98115' }]}
            onPress={() => handleCall(item.phone, item.name)}
          >
            <Ionicons name="call" size={16} color="#10B981" />
            <Text style={[styles.actionBtnText, { color: '#059669' }]}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#25D36618' }]}
            onPress={() => handleWhatsApp(item.phone, item.shopName)}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#4F46E515' }]}
            onPress={() => handleLogVisit(item.id, item.shopName)}
          >
            <MaterialCommunityIcons name="calendar-check" size={16} color="#4F46E5" />
            <Text style={[styles.actionBtnText, { color: '#4338CA' }]}>Log Visit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
            onPress={() => router.push(`/customer/add?id=${item.id}`)}
          >
            <Feather name="edit-2" size={14} color={isDark ? '#9CA3AF' : '#4B5563'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
      {/* Search Bar */}
      <View style={[styles.searchSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? '#374151' : '#F3F4F6' },
          ]}
        >
          <Ionicons name="search" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#F9FAFB' : '#111827' }]}
            placeholder="Search by Shop, Customer or Location..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Stats Chips */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total Customers</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#F59E0B15' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>{visitDueTodayCount}</Text>
            <Text style={[styles.statLabel, { color: '#B45309' }]}>Visits Due</Text>
          </View>
          <View style={[styles.statChip, { backgroundColor: '#2563EB15' }]}>
            <Text style={[styles.statNumber, { color: '#2563EB' }]}>{inProgressCount}</Text>
            <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>In Progress</Text>
          </View>
        </View>

        {/* Category Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={MARKET_CATEGORIES}
          keyExtractor={(item) => item}
          style={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <Pressable
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: '#4F46E5' }
                    : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#D1D5DB' : '#374151' },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Status Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          style={[styles.filterList, { marginTop: 4 }]}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item;
            return (
              <Pressable
                style={[
                  styles.statusPill,
                  isSelected
                    ? { backgroundColor: '#0284C7' }
                    : { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' },
                ]}
                onPress={() => setSelectedStatus(item)}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    { color: isSelected ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Customer Cards List */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="person-search" size={54} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#F3F4F6' : '#374151' }]}>
              No Customers Found
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? `No shops matching "${searchQuery}"`
                : 'Tap + Add Customer to register a new shop customer record.'}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button (+ Add Customer) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/customer/add')}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
        <Text style={styles.fabText}>Add Customer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#4F46E510',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6366F1',
    marginTop: 1,
  },
  filterList: {
    marginTop: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    padding: 14,
    paddingBottom: 90,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  customerName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    marginTop: 2,
  },
  marginValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  visitBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  dueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 4,
  },
  nextVisitText: {
    fontSize: 12,
    color: '#6B7280',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB20',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
});
