import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { apiGet } from '@/lib/api';
import { formatCurrency, formatShortDate, getStatusColor } from '@/lib/format';

interface DashboardData {
  user: { id: string; name: string; email: string; phone: string; role: string };
  activeFunds: number;
  totalMemberships: number;
  totalInvested: number;
  totalPending: number;
  totalReturns: number;
  upcomingPayments: any[];
  recentPayments: any[];
  memberships: any[];
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { data, isLoading, refetch, isRefetching } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => apiGet<DashboardData>('/api/dashboard'),
  });

  const firstName = user?.name?.split(' ')[0] || 'User';

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
        paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0),
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
      }
    >
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.name}>{firstName}</Text>
        </View>
        <Pressable
          style={styles.notifBtn}
          onPress={() => {}}
        >
          <Ionicons name="notifications-outline" size={22} color={Colors.text} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
          <Ionicons name="trending-up" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statValue}>{formatCurrency(data?.totalInvested || 0)}</Text>
          <Text style={styles.statLabel}>Total Invested</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#2563EB' }]}>
          <Ionicons name="time-outline" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statValue}>{formatCurrency(data?.totalPending || 0)}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#7C3AED' }]}>
          <Ionicons name="diamond-outline" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statValue}>{formatCurrency(data?.totalReturns || 0)}</Text>
          <Text style={styles.statLabel}>Expected Returns</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D97706' }]}>
          <Ionicons name="layers-outline" size={20} color="rgba(255,255,255,0.7)" />
          <Text style={styles.statValue}>{data?.activeFunds || 0}</Text>
          <Text style={styles.statLabel}>Active Funds</Text>
        </View>
      </View>

      {(data?.upcomingPayments?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Payments</Text>
          {data!.upcomingPayments.map((payment: any) => {
            const statusStyle = getStatusColor(payment.status);
            return (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentLeft}>
                  <View style={[styles.paymentIcon, { backgroundColor: Colors.accentLight }]}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.paymentName}>{payment.chitFundName}</Text>
                    <Text style={styles.paymentDate}>
                      Month {payment.monthNumber} - Due {formatShortDate(payment.dueDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {payment.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {(data?.memberships?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Chit Funds</Text>
          {data!.memberships.map((m: any) => {
            const statusStyle = getStatusColor(m.chitFund.status);
            return (
              <Pressable
                key={m.id}
                style={({ pressed }) => [styles.fundCard, pressed && { opacity: 0.8 }]}
                onPress={() => router.push({ pathname: '/chit-detail/[id]', params: { id: m.chitFundId } })}
              >
                <View style={styles.fundHeader}>
                  <Text style={styles.fundName}>{m.chitFund.name}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {m.chitFund.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.fundDetails}>
                  <View style={styles.fundDetail}>
                    <Text style={styles.fundDetailLabel}>Amount</Text>
                    <Text style={styles.fundDetailValue}>{formatCurrency(m.chitFund.totalAmount)}</Text>
                  </View>
                  <View style={styles.fundDetail}>
                    <Text style={styles.fundDetailLabel}>Monthly</Text>
                    <Text style={styles.fundDetailValue}>{formatCurrency(m.chitFund.monthlyInstallment)}</Text>
                  </View>
                  <View style={styles.fundDetail}>
                    <Text style={styles.fundDetailLabel}>Slot</Text>
                    <Text style={styles.fundDetailValue}>#{m.slotNumber}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {(!data?.memberships || data.memberships.length === 0) && (
        <View style={styles.emptySection}>
          <Ionicons name="wallet-outline" size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No chit funds yet</Text>
          <Text style={styles.emptySubtitle}>Browse available funds and join one to get started</Text>
          <Pressable
            style={({ pressed }) => [styles.exploreBtn, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/chit-funds')}
          >
            <Text style={styles.exploreBtnText}>Explore Funds</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.white,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },
  paymentDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  paymentAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  fundCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  fundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  fundName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  fundDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  fundDetail: {
    flex: 1,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  fundDetailLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  fundDetailValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.text,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  exploreBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  exploreBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.white,
  },
});
