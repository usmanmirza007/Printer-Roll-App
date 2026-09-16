import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import {
  generateAutomaticNotifications,
  loadCustomers,
  loadNotifications,
  loadRolls,
  markAllNotificationsRead,
  markNotificationRead,
  recordCustomerVisit,
  saveNotifications,
  updateCustomerReminderDate,
} from '@/lib/storage';
import { AppNotification } from '@/lib/types';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
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
  const theme = Colors[isDark ? 'dark' : 'light'];

  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeFilter, setActiveFilter] = useState<'All' | 'visit_reminder' | 'stock_alert'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Awaited<ReturnType<typeof loadCustomers>>>([]);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notificationLoading, setNotificationLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const [custs, rolls] = await Promise.all([loadCustomers(), loadRolls()]);
      const data = await generateAutomaticNotifications(custs, rolls);
      setCustomers(custs);
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
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
    const token = (user as any)?.stsTokenManager?.accessToken;
    const result = await recordCustomerVisit(customerId, user?.uid, token);
    setNotifications(result.notifications);
    Alert.alert('Visit Logged!', 'Shop visit marked complete and next reminder scheduled.');
  };

  const handleOpenNotification = (notification: AppNotification) => {
    if (!notification.customerId) {
      if (!notification.isRead) handleToggleRead(notification.id);
      return;
    }

    const customer = customers.find((item) => item.id === notification.customerId);
    setSelectedNotification(notification);
    setSelectedDate(customer?.nextVisitDate ? new Date(`${customer.nextVisitDate}T12:00:00`) : new Date());
    setShowDatePicker(false);
  };

  const handleSaveReminderDate = async () => {
    setNotificationLoading(true)
    if (!selectedNotification?.customerId) return;

    const nextVisitDate = [selectedDate.getFullYear(), selectedDate.getMonth() + 1, selectedDate.getDate()]
      .map((part) => String(part).padStart(2, '0'))
      .join('-');

    try {
      const updatedCustomers = await updateCustomerReminderDate(selectedNotification.customerId, nextVisitDate);
      const updatedNotifications = await markNotificationRead(selectedNotification.id);
      // setCustomers(updatedCustomers);
      setNotifications(updatedNotifications);
      setShowDatePicker(false);
      setSelectedNotification(null);
      setNotificationLoading(false)
    } catch (error) {
      console.log('fofofo', error);
      setNotificationLoading(false);
      console.error('Failed to update reminder date:', error);
      Alert.alert('Error', 'Failed to update the customer reminder date.');
    }
  };

  const handleTestPushNotification = async () => {
    const token = (user as any)?.stsTokenManager?.accessToken;
    const nextDate = new Date().toISOString().split('T')[0];
    // await triggerVisitEndPushNotification(
    //   'Test Shop Visit',
    //   nextDate,
    //   user?.uid,
    //   token
    // );
    Alert.alert('Push Sent', 'Test push notification sent successfully!');
  };

  const renderNotifCard = ({ item }: { item: AppNotification }) => {
    const isVisit = item.type === 'visit_reminder';
    
    return (
      <Pressable
        onPress={() => handleOpenNotification(item)}
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: !item.isRead ? theme.tint : theme.border,
          },
        ]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
            {isVisit ? (
              <Ionicons name="calendar-outline" size={20} color={theme.tint} />
            ) : (
              <Ionicons name="alert-circle-outline" size={20} color={Palette.danger} />
            )}
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.notifTitle,
                  { color: theme.text },
                  !item.isRead && { fontWeight: '700' },
                ]}
              >
                {item.title}
              </Text>
              {!item.isRead && <View style={[styles.dot, { backgroundColor: theme.tint }]} />}
            </View>

            <Text style={[styles.notifMsg, { color: theme.textSecondary }]}>{item.message}</Text>
            <Text style={[styles.notifTime, { color: theme.textSecondary }]}>
              {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* Actions Bar */}
        <View style={[styles.actionsRow, { borderTopColor: theme.border }]}>
          {item.customerId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleVisitDone(item.customerId)}
            >
              <MaterialCommunityIcons name="calendar-check" size={14} color={Palette.success} />
              <Text style={[styles.actionText, { color: theme.text }]}>Mark Done</Text>
            </TouchableOpacity>
          )}

          {item.customerId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => router.push(`/customer/${item.customerId}`)}
            >
              <MaterialIcons name="storefront" size={14} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.text }]}>View Customer</Text>
            </TouchableOpacity>
          )}

          {item.rollId && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => router.push(`/roll/${item.rollId}`)}
            >
              <MaterialCommunityIcons name="receipt" size={14} color={theme.tint} />
              <Text style={[styles.actionText, { color: theme.text }]}>View Stock</Text>
            </TouchableOpacity>
          )}

          {!item.isRead ? (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleToggleRead(item.id)}
            >
              <Feather name="check" size={14} color={theme.textSecondary} />
              <Text style={[styles.actionText, { color: theme.textSecondary }]}>Read</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: theme.surface }]}
              onPress={() => handleClearNotif(item.id)}
            >
              <Feather name="trash-2" size={14} color={Palette.danger} />
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBox, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Reminders & Notifications
            </Text>
            <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
              {unreadCount > 0 ? `${unreadCount} unread shop visit reminders` : 'All reminders updated'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.markAllBtn, { backgroundColor: theme.surface, marginRight: 6 }]}
              onPress={handleTestPushNotification}
            >
              <Ionicons name="notifications-outline" size={14} color={theme.tint} />
              <Text style={[styles.markAllText, { color: theme.tint, marginLeft: 3 }]}>Test Push</Text>
            </TouchableOpacity>

            {unreadCount > 0 && (
              <TouchableOpacity style={[styles.markAllBtn, { backgroundColor: theme.surface }]} onPress={handleMarkAllRead}>
                <Text style={[styles.markAllText, { color: theme.tint }]}>Mark Read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.pillRow}>
          <Pressable
            style={[
              styles.pill,
              activeFilter === 'All'
                ? { backgroundColor: theme.tint }
                : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
            ]}
            onPress={() => setActiveFilter('All')}
          >
            <Text style={[styles.pillText, { color: activeFilter === 'All' ? '#FFF' : theme.textSecondary }]}>
              All ({notifications.length})
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              activeFilter === 'visit_reminder'
                ? { backgroundColor: theme.tint }
                : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
            ]}
            onPress={() => setActiveFilter('visit_reminder')}
          >
            <Text style={[styles.pillText, { color: activeFilter === 'visit_reminder' ? '#FFF' : theme.textSecondary }]}>
              Visits
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              activeFilter === 'stock_alert'
                ? { backgroundColor: theme.tint }
                : { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border },
            ]}
            onPress={() => setActiveFilter('stock_alert')}
          >
            <Text style={[styles.pillText, { color: activeFilter === 'stock_alert' ? '#FFF' : theme.textSecondary }]}>
              Stock Alerts
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main List */}
      <FlatList
        data={filteredNotifs}
        keyExtractor={(item) => item.id}
        renderItem={renderNotifCard}
        contentContainerStyle={styles.listPadding}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loading ? <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color={theme.tint} />
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Loading notifications...</Text>
          </View> : <View style={styles.emptyBox}>
            <Ionicons name="notifications-off-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Notifications</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Visit reminders will appear here when scheduled customer shop visits are due.
            </Text>
          </View>
        }
      />

      <Modal
        visible={Boolean(selectedNotification)}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setSelectedNotification(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Update visit reminder</Text>
            <Text style={[styles.modalCustomer, { color: theme.textSecondary }]}>
              {customers.find((item) => item.id === selectedNotification?.customerId)?.shopName || 'Customer'}
            </Text>
            <TouchableOpacity
              style={[styles.dateChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.tint} />
              <Text style={[styles.dateChipText, { color: theme.text }]}>{selectedDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                onChange={(_, date) => {
                  if (date) setSelectedDate(date);
                  setShowDatePicker(false);
                }}
                minimumDate={new Date()}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.surface }]}
                onPress={() => {
                  setShowDatePicker(false);
                  setSelectedNotification(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: theme.tint }]} onPress={handleSaveReminderDate}>
                {notificationLoading ? (
                  <ActivityIndicator size="small" color={'#fff'} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFF' }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBox: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 2 },
  markAllBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6 },
  markAllText: { fontSize: 12, fontWeight: '600' },
  pillRow: { flexDirection: 'row', marginTop: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, marginRight: 6 },
  pillText: { fontSize: 12, fontWeight: '600' },
  listPadding: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  iconBox: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { fontSize: 14, fontWeight: '600', flex: 1 },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginLeft: 6 },
  notifMsg: { fontSize: 13, marginTop: 3, lineHeight: 17 },
  notifTime: { fontSize: 11, marginTop: 4 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, marginLeft: 6 },
  actionText: { fontSize: 11, fontWeight: '600', marginLeft: 3 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 10 },
  emptySub: { fontSize: 13, textAlign: 'center', marginTop: 4, paddingHorizontal: 30 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCard: { padding: 20, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalCustomer: { fontSize: 13, marginTop: 4 },
  dateChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 16 },
  dateChipText: { marginLeft: 8, fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  modalButton: { alignItems: 'center', width: 120, paddingVertical: 10, borderRadius: 8, marginLeft: 8 },
  modalButtonText: { fontWeight: '700' },
});
