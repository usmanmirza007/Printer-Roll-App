import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { loadNotifications } from '@/lib/storage';
import { AppNotification } from '@/lib/types';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const notifs: AppNotification[] = await loadNotifications();
      const count = notifs.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      // fallback
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 3000);
      return () => clearInterval(interval);
    }, [])
  );

  const activeColor = '#4F46E5'; // Sleek Indigo accent
  const inactiveColor = colorScheme === 'dark' ? '#9CA3AF' : '#6B7280';
  const bgColor = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        headerShown: true,
        headerStyle: {
          backgroundColor: bgColor,
          elevation: 2,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 19,
          color: colorScheme === 'dark' ? '#F9FAFB' : '#111827',
        },
        tabBarStyle: {
          backgroundColor: bgColor,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#374151' : '#E5E7EB',
        },
      }}
    >
      {/* 1. Customers Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Customers',
          headerTitle: 'Customer Records',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'people' : 'people-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Rolls Inventory Tab */}
      <Tabs.Screen
        name="rolls"
        options={{
          title: 'Roll Inventory',
          headerTitle: 'Thermal Roll Catalog',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Notifications & Reminders Tab */}
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          headerTitle: 'Reminders & Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={25}
                color={color}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />

      {/* 4. Dashboard / Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Dashboard',
          headerTitle: 'Business Overview',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'insights' : 'bar-chart'}
              size={26}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});