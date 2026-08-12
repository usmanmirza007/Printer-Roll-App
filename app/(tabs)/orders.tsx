import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { getOrdersFromFirestore } from '@/lib/firestore';
import { CustomerOrder, OrderStatus } from '@/lib/types';
import { getOrderStatusStyle } from '@/utils/statusStyle';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const STATUS_FILTERS: (OrderStatus | 'All')[] = [
  'All',
  'In Progress',
  'Pending',
  'Delivered',
  'Invoiced',
  'Cancelled'
];

export default function OrdersScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
  // const searchParams = useSearchParams();
  // const customerId = searchParams.get('customerId');

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'All'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await getOrdersFromFirestore();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = searchQuery.trim().toLowerCase();

      const matchesSearch =
        query === '' ||
        order.rollType.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query) ||
        order.orderDate.includes(query) ||
        order.id.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === 'All' || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const inProgressCount = orders.filter((o) => o.status === 'In Progress').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  const renderOrderCard = ({ item }: { item: CustomerOrder }) => {
    const statusStyle = getOrderStatusStyle(item.status);
    const margin = item.profit;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => router.push(`/order/${item.id}?type=view&customerId=${item.customerId}`)}
      >
        {/* Top Header */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderId, { color: theme.text }]} numberOfLines={1}>
              Order #{item.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={[styles.subText, { color: theme.textSecondary }]}>
              {formatDate(item.orderDate)} • Qty: {item.quantity}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Pricing Summary Box */}
        <View
          style={[
            styles.priceBox,
            {
              backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Roll Type</Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>{item.rollType}</Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>
              Rate (Cost ➔ Sale)
            </Text>
            <Text style={[styles.priceVal, { color: theme.text }]}>
              ₨{item.unitCostRate} ➔{' '}
              <Text style={{ fontWeight: '700' }}>₨{item.unitSaleRate}</Text>
            </Text>
          </View>

          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: theme.textSecondary }]}>Profit</Text>
            <Text style={[styles.marginVal, { color: Palette.success }]}>
              +₨{margin}
            </Text>
          </View>
        </View>

        {/* Totals Row */}
        <View style={styles.totalsRow}>
          <Text style={[styles.totalText, { color: theme.textSecondary }]}>
            Total Cost: <Text style={{ color: theme.text, fontWeight: '600' }}>₨{item.totalCost}</Text>
          </Text>
          <Text style={[styles.totalText, { color: theme.textSecondary }]}>
            Total Sale: <Text style={{ color: theme.text, fontWeight: '600' }}>₨{item.totalSale}</Text>
          </Text>
        </View>

        {/* Action Bar */}
        <View style={[styles.actionBar, { borderTopColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              onPress={() => router.push(`/order/${item.id}?type=view&customerId=${item.customerId}`)}
            >
              <Ionicons name="eye-outline" size={15} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.text }]}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.iconOnlyBtn,
                { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              ]}
              onPress={() => router.push(`/order/${item.id}?type=edit&customerId=${item.customerId}`)}
            >
              <Feather name="edit-2" size={15} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
            onPress={() => router.push(`/invoice/${item.id}`)}
          >
            <Ionicons name="print-outline" size={18} color={theme.tint} />
            <Text style={[styles.actionText, { color: theme.text }]}>Print Invoice</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBox,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by roll type, status, date..."
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

        {/* KPI Metrics */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: theme.text }]}>{totalCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Total Orders</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: Palette.warning }]}>{pendingCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Pending</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: theme.tint }]}>{inProgressCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>In Progress</Text>
          </View>
          <View style={[styles.metricChip, { backgroundColor: theme.surface }]}>
            <Text style={[styles.metricVal, { color: Palette.success }]}>{deliveredCount}</Text>
            <Text style={[styles.metricLbl, { color: theme.textSecondary }]}>Delivered</Text>
          </View>
        </View>

        {/* Status Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item}
          style={styles.filterScroll}
          renderItem={({ item }) => {
            const isSelected = selectedStatus === item;
            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isSelected
                    ? { backgroundColor: theme.tint }
                    : {
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.border,
                    },
                ]}
                onPress={() => setSelectedStatus(item)}
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
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <MaterialIcons name="receipt-long" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Orders Found</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              {searchQuery
                ? `No orders matching "${searchQuery}"`
                : 'Tap + New Order to create your first order.'}
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  metricVal: { fontSize: 14, fontWeight: '700' },
  metricLbl: { fontSize: 10, marginTop: 1 },
  filterScroll: { marginTop: 10 },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
  },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  listPadding: { padding: 16, paddingBottom: 90 },
  card: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: { fontSize: 16, fontWeight: '700' },
  subText: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  priceBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  priceCol: {},
  priceLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600' },
  priceVal: { fontSize: 13, marginTop: 2 },
  marginVal: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  totalText: { fontSize: 12 },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  iconOnlyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
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
  fabText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
});