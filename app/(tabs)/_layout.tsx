import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
      }}
    >
      {/* 1. Customers */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="people" size={size || 26} color={color} />
          ),
        }}
      />

      {/* 2. Rolls / Inventory */}
      <Tabs.Screen
        name="rolls"
        options={{
          title: 'Rolls',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory-2" size={size || 26} color={color} />
          ),
        }}
      />

      {/* 3. Reminders (Most Important) */}
      <Tabs.Screen
        name="notification"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size || 26} color={color} />
          ),
        }}
      />

      {/* 4. Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="account-circle" size={size || 26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}