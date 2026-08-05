import { useColorScheme } from '@/components/useColorScheme';
import {
  generateAutomaticNotifications,
  loadCustomers,
  loadNotifications,
  loadRolls,
  markAllNotificationsRead,
  markNotificationRead,
  recordCustomerVisit,
  saveNotifications,
} from '@/lib/storage';
import { AppNotification } from '@/lib/types';
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
  TouchableOpacity,
  View,
} from 'react-native';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'visit_reminder' | 'stock_alert'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = async () => {
    try {
      const custs = await loadCustomers();
      const rolls = await loadRolls();
      const data = await generateAutomaticNotifications(custs, rolls);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifs();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifs();
    setRefreshing(false);
  };

  const filteredNotifs = useMemo(() => {
    if (activeFilter === 'All') return notifications;
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsRead();
    setNotifications(updated);
  };

  const handleToggleRead = async (id: string) => {
    const updated = await markNotificationRead(id);
    setNotifications(updated);
  };

  const handleClearNotif = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    await saveNotifications(updated);
  };

  const handleVisitDone = async (customerId?: string) => {
    if (!customerId) return;
    const result = await recordCustomerVisit(customerId);
    setNotifications(result.notifications);
    Alert.alert('Visit Logged!', 'Shop visit marked complete and next reminder auto-scheduled.');
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => {
    const isVisit = item.type === 'visit_reminder';
    const isStock = item.type === 'stock_alert';

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: !item.isRead
              ? '#4F46E5'
              : isDark
              ? '#374151'
              : '#E5E7EB',
            borderLeftWidth: !item.isRead ? 4 : 1,
            borderLeftColor: !item.isRead
              ? item.priority === 'high'
                ? '#EF4444'
                : '#4F46E5'
              : isDark
              ? '#374151'
              : '#E5E7EB',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: isVisit
                  ? '#FEF3C7'
                  : isStock
                  ? '#FEE2E2'
                  : '#DBEAFE',
              },
            ]}
          >
            {isVisit ? (
              <Ionicons name="calendar-outline" size={22} color="#D97706" />
            ) : isStock ? (
              <Ionicons name="alert-circle-outline" size={22} color="#DC2626" />
            ) : (
              <MaterialIcons name="notifications-none" size={22} color="#2563EB" />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notifTitle,
                  { color: isDark ? '#F9FAFB' : '#111827' },
                  !item.isRead && { fontWeight: '800' },
                ]}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.notifMessage}>{item.message}</Text>
            <Text style={styles.notifDate}>
              ⏰ {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionRow}>
          {item.customerId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B98115' }]}
              onPress={() => handleVisitDone(item.customerId)}
            >
              <MaterialCommunityIcons name="calendar-check" size={16} color="#10B981" />
              <Text style={[styles.actionBtnText, { color: '#047857' }]}>Mark Visit Done</Text>
            </TouchableOpacity>
          )}

          {item.customerId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#4F46E515' }]}
              onPress={() => router.push(`/customer/${item.customerId}`)}
            >
              <MaterialIcons name="storefront" size={16} color="#4F46E5" />
              <Text style={[styles.actionBtnText, { color: '#4338CA' }]}>View Customer</Text>
            </TouchableOpacity>
          )}

          {item.rollId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#0284C715' }]}
              onPress={() => router.push(`/roll/${item.rollId}`)}
            >
              <MaterialCommunityIcons name="receipt" size={16} color="#0284C7" />
              <Text style={[styles.actionBtnText, { color: '#0369A1' }]}>View Stock Roll</Text>
            </TouchableOpacity>
          )}

          {!item.isRead ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
              onPress={() => handleToggleRead(item.id)}
            >
              <Feather name="check-circle" size={14} color="#6B7280" />
              <Text style={[styles.actionBtnText, { color: '#6B7280' }]}>Read</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}
              onPress={() => handleClearNotif(item.id)}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}>
      {/* Top Controls Header */}
      <View style={[styles.headerSection, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={[styles.headerTitleText, { color: isDark ? '#FFF' : '#111827' }]}>
              Notifications & Reminders
            </Text>
            <Text style={styles.headerSub}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread shop visit reminders.`
                : 'All visit reminders up to date.'}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.pillRow}>
          <Pressable
            style={[
              styles.pill,
              activeFilter === 'All'
                ? { backgroundColor: '#4F46E5' }
                : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
            ]}
            onPress={() => setActiveFilter('All')}
          >
            <Text
              style={[
                styles.pillText,
                { color: activeFilter === 'All' ? '#FFF' : isDark ? '#D1D5DB' : '#374151' },
              ]}
            >
              All Notifications ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              activeFilter === 'visit_reminder'
                ? { backgroundColor: '#D97706' }
                : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
            ]}
            onPress={() => setActiveFilter('visit_reminder')}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    activeFilter === 'visit_reminder' ? '#FFF' : isDark ? '#D1D5DB' : '#374151',
                },
              ]}
            >
              🗓️ Shop Visits
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              activeFilter === 'stock_alert'
                ? { backgroundColor: '#DC2626' }
                : { backgroundColor: isDark ? '#374151' : '#E5E7EB' },
            ]}
            onPress={() => setActiveFilter('stock_alert')}
          >
            <Text
              style={[
                styles.pillText,
                {
                  color:
                    activeFilter === 'stock_alert' ? '#FFF' : isDark ? '#D1D5DB' : '#374151',
                },
              ]}
            >
              ⚠️ Stock Alerts
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifs}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={54} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#F3F4F6' : '#374151' }]}>
              No Notifications Right Now
            </Text>
            <Text style={styles.emptySubtitle}>
              Reminders will automatically appear here when customer shop visits are due based on feedback frequency.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleText: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  markAllBtn: {
    backgroundColor: '#4F46E515',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  markAllText: { color: '#4F46E5', fontSize: 12, fontWeight: '700' },
  pillRow: { flexDirection: 'row', marginTop: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
  pillText: { fontSize: 12, fontWeight: '600' },
  listContent: { padding: 14, paddingBottom: 40 },
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: 15, fontWeight: '700', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444', marginLeft: 6 },
  notifMessage: { fontSize: 13, color: '#4B5563', marginTop: 4, lineHeight: 18 },
  notifDate: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB20',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptySubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
});
