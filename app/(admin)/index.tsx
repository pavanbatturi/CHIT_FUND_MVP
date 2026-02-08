import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { apiGet } from '@/lib/api';
import { formatCurrency } from '@/lib/format';

interface AdminStats {
  totalUsers: number;
  activeChitFunds: number;
  totalRevenue: number;
  totalPayments: number;
}

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => apiGet<AdminStats>('/api/admin/stats'),
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const stats = [
    {
      icon: 'people' as const,
      label: 'Total Users',
      value: data?.totalUsers?.toString() || '0',
      color: '#2563EB',
      bg: '#DBEAFE',
    },
    {
      icon: 'shield-checkmark' as const,
      label: 'Active Funds',
      value: data?.activeChitFunds?.toString() || '0',
      color: '#16A34A',
      bg: '#DCFCE7',
    },
    {
      icon: 'cash' as const,
      label: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue || 0),
      color: '#7C3AED',
      bg: '#F3E8FF',
    },
    {
      icon: 'receipt' as const,
      label: 'Total Payments',
      value: data?.totalPayments?.toString() || '0',
      color: '#D97706',
      bg: '#FEF3C7',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
        paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0),
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />
      }
    >
      <View style={styles.header}>
        <View style={styles.adminBadge}>
          <Ionicons name="shield" size={14} color="#7C3AED" />
          <Text style={styles.adminBadgeText}>Admin Panel</Text>
        </View>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Overview of your chit fund operations</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
              <Ionicons name={stat.icon} size={22} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionCards}>
          <View style={styles.actionCard}>
            <Ionicons name="add-circle" size={24} color="#7C3AED" />
            <Text style={styles.actionText}>Create new chit funds from the Funds tab</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons name="person-add" size={24} color="#2563EB" />
            <Text style={styles.actionText}>Assign users to funds from the Users tab</Text>
          </View>
          <View style={styles.actionCard}>
            <Ionicons name="card" size={24} color="#16A34A" />
            <Text style={styles.actionText}>Track and update payment statuses</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    marginBottom: 8,
  },
  adminBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#7C3AED',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexGrow: 1,
    flexBasis: '45%',
  },
  statIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quickActions: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  actionCards: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
});
