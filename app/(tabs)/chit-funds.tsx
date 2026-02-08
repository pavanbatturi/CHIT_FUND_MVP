import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { apiGet } from '@/lib/api';
import { formatCurrency, getStatusColor } from '@/lib/format';

interface ChitFund {
  id: string;
  name: string;
  description: string | null;
  totalAmount: number;
  monthlyInstallment: number;
  duration: number;
  totalSlots: number;
  availableSlots: number;
  organizerName: string;
  status: string;
}

function ChitFundCard({ fund }: { fund: ChitFund }) {
  const statusStyle = getStatusColor(fund.status);
  const filledSlots = fund.totalSlots - fund.availableSlots;
  const fillPercent = (filledSlots / fund.totalSlots) * 100;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
      onPress={() => router.push({ pathname: '/chit-detail/[id]', params: { id: fund.id } })}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIconContainer}>
          <Ionicons
            name={fund.status === 'active' ? 'shield-checkmark' : 'diamond-outline'}
            size={22}
            color={Colors.primary}
          />
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {fund.status}
          </Text>
        </View>
      </View>

      <Text style={styles.cardName}>{fund.name}</Text>
      {fund.description && (
        <Text style={styles.cardDesc} numberOfLines={2}>{fund.description}</Text>
      )}

      <View style={styles.cardStats}>
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>Total</Text>
          <Text style={styles.cardStatValue}>{formatCurrency(fund.totalAmount)}</Text>
        </View>
        <View style={styles.cardStatDivider} />
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>Monthly</Text>
          <Text style={styles.cardStatValue}>{formatCurrency(fund.monthlyInstallment)}</Text>
        </View>
        <View style={styles.cardStatDivider} />
        <View style={styles.cardStat}>
          <Text style={styles.cardStatLabel}>Duration</Text>
          <Text style={styles.cardStatValue}>{fund.duration} mo</Text>
        </View>
      </View>

      <View style={styles.slotsSection}>
        <View style={styles.slotsHeader}>
          <Text style={styles.slotsLabel}>Slots filled</Text>
          <Text style={styles.slotsCount}>
            {filledSlots}/{fund.totalSlots}
          </Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${fillPercent}%` }]} />
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.organizerRow}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.textSecondary} />
          <Text style={styles.organizerText}>{fund.organizerName}</Text>
        </View>
        {fund.availableSlots > 0 && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>{fund.availableSlots} slots open</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function ChitFundsScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, refetch, isRefetching } = useQuery<ChitFund[]>({
    queryKey: ['chit-funds'],
    queryFn: () => apiGet<ChitFund[]>('/api/chit-funds'),
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12),
      }]}>
        <Text style={styles.headerTitle}>Available Funds</Text>
        <Text style={styles.headerSubtitle}>{data?.length || 0} chit fund schemes</Text>
      </View>

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChitFundCard fund={item} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0) }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        scrollEnabled={(data?.length ?? 0) > 0}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No funds available</Text>
            <Text style={styles.emptySubtitle}>Check back later for new chit fund schemes</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  cardName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 14,
  },
  cardStats: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  cardStat: {
    flex: 1,
    alignItems: 'center',
  },
  cardStatLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  cardStatValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: Colors.text,
  },
  cardStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  slotsSection: {
    marginBottom: 14,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  slotsLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  slotsCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: Colors.text,
  },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceSecondary,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textSecondary,
  },
  availableBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availableText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: Colors.success,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
