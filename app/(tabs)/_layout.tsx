import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { loadNotifications } from '@/lib/storage';
import { AppNotification } from '@/lib/types';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Tabs, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];
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

  return (
    <Tabs
      initialRouteName='index'
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        headerShown: true,
        headerStyle: {
          backgroundColor: theme.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
          color: theme.text,
        },
        tabBarStyle: {
          backgroundColor: theme.card,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      {/* 1. Customers Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Customers',
          headerTitle: 'Customer Directory',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'people' : 'people-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 2. Rolls Inventory Tab */}
      <Tabs.Screen
        name="rolls"
        options={{
          title: 'Stock Rolls',
          headerTitle: 'Roll Stock Catalog',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={25}
              color={color}
            />
          ),
        }}
      />

      {/* 3. Notifications Tab */}
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Reminders',
          headerTitle: 'Reminders & Alerts',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? 'notifications' : 'notifications-outline'}
                size={24}
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

      {/* 4. Dashboard Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Dashboard',
          headerTitle: 'Sales Overview',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name={focused ? 'bar-chart' : 'bar-chart'}
              size={25}
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
    backgroundColor: Palette.danger,
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