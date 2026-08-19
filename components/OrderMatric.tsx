import Colors, { Palette } from '@/constants/Colors';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

type OrderMetricsProps = {
  totalCount: number;
  pendingCount: number;
  inProgressCount: number;
  invoicedCount: number;
  deliveredCount: number;
  cancelledCount: number;
};

export default function OrderMetrics({
  totalCount,
  pendingCount,
  inProgressCount,
  invoicedCount,
  deliveredCount,
  cancelledCount,
}: OrderMetricsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = Colors[isDark ? 'dark' : 'light'];

  const metrics = [
    {
      label: 'Total Orders',
      value: totalCount,
      color: theme.text,
    },
    {
      label: 'Pending',
      value: pendingCount,
      color: Palette.warning,
    },
    {
      label: 'In Progress',
      value: inProgressCount,
      color: theme.tint,
    },
    {
      label: 'Invoice',
      value: invoicedCount,
      color: Palette.primary,
    },
    {
      label: 'Delivered',
      value: deliveredCount,
      color: Palette.success,
    },
    {
      label: 'Cancelled',
      value: cancelledCount,
      color: Palette.danger,
    },
  ];

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.metricsRow}>
        {metrics.map((item) => (
          <View
            key={item.label}
            style={[
              styles.metricChip,
              { backgroundColor: theme.surface },
            ]}
          >
            <Text style={[styles.metricVal, { color: item.color }]}>
              {item.value}
            </Text>
            <Text
              style={[
                styles.metricLbl,
                { color: theme.textSecondary },
              ]}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  metricsRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    gap: 5,
  },
  metricChip: {
    minWidth: 80,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  metricLbl: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});