import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Platform, Alert
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Colors from '@/constants/colors';
import { apiGet, apiPut } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/format';

interface PaymentItem {
  id: string;
  amount: number;
  monthNumber: number;
  dueDate: string;
  paidDate: string | null;
  status: string;
  chitFundName: string;
}

type Filter = 'all' | 'pending' | 'paid' | 'overdue';

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery<PaymentItem[]>({
    queryKey: ['my-admin-payments'],
    queryFn: () => apiGet<PaymentItem[]>('/api/my-payments'),
  });

  // ⭐ Mutation to mark payment as paid
  const markPaidMutation = useMutation({
    mutationFn: (id: string) =>
      apiPut(`/api/payments/${id}`, { status: 'paid' }),

    onSuccess: () => refetch(),
  });

  const confirmMarkPaid = (id: string) => {
    Alert.alert(
      'Confirm Payment',
      'Mark this payment as paid?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => markPaidMutation.mutate(id) }
      ]
    );
  };

  const filteredData = (data || []).filter((p) =>
    filter === 'all' ? true : p.status === filter
  );

  const totalPaid = (data || [])
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0);

  const totalPending = (data || [])
    .filter((p) => p.status === 'pending')
    .reduce((s, p) => s + p.amount, 0);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
  ];

  // ⭐ Card moved inside to access mutation
  const PaymentCard = ({ payment }: { payment: PaymentItem }) => {
    const statusStyle = getStatusColor(payment.status);

    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.cardIcon, { backgroundColor: statusStyle.bg }]}>
            <Ionicons
              name={
                payment.status === 'paid'
                  ? 'checkmark-circle'
                  : payment.status === 'overdue'
                  ? 'alert-circle'
                  : 'time'
              }
              size={20}
              color={statusStyle.text}
            />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle}>{payment.chitFundName}</Text>

            <Text style={styles.cardSubtitle}>
              Month {payment.monthNumber} - Due {formatDate(payment.dueDate)}
            </Text>

            {payment.paidDate && (
              <Text style={styles.paidDate}>
                Paid on {formatDate(payment.paidDate)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.cardAmount}>
            {formatCurrency(payment.amount)}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {payment.status}
            </Text>
          </View>

          {/* ⭐ Mark Paid Button */}
          {payment.status !== 'paid' && (
            <Pressable
              style={styles.markPaidBtn}
              onPress={() => confirmMarkPaid(payment.id)}
            >
              <Text style={styles.markPaidText}>Mark Paid</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) },
        ]}
      >
        <Text style={styles.headerTitle}>Payments</Text>

        <View style={styles.summaryRow}>
          <View
            style={[styles.summaryCard, { backgroundColor: Colors.successLight }]}
          >
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={[styles.summaryLabel, { color: Colors.success }]}>
              Paid
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(totalPaid)}
            </Text>
          </View>

          <View
            style={[styles.summaryCard, { backgroundColor: Colors.warningLight }]}
          >
            <Ionicons name="time" size={16} color={Colors.warning} />
            <Text style={[styles.summaryLabel, { color: Colors.warning }]}>
              Pending
            </Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {formatCurrency(totalPending)}
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterBtn,
                filter === f.key && styles.filterBtnActive,
              ]}
              onPress={() => setFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.key && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PaymentCard payment={item} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
          paddingTop: 4,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
    marginBottom: 14,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },

  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
  },

  summaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },

  summaryValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    marginLeft: 'auto',
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },

  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },

  filterBtnActive: {
    backgroundColor: Colors.primary,
  },

  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: Colors.textSecondary,
  },

  filterTextActive: {
    color: Colors.white,
  },

  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  cardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },

  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardInfo: { flex: 1 },

  cardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.text,
  },

  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  paidDate: {
    fontSize: 11,
    color: Colors.success,
    marginTop: 2,
  },

  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },

  cardAmount: {
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
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },

  markPaidBtn: {
    marginTop: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  markPaidText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
