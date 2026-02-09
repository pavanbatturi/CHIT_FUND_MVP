import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

import Colors from "@/constants/colors";
import { apiGet, apiPut } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/format";

type Filter = "all" | "pending" | "paid" | "overdue";

interface PaymentItem {
  id: string;
  userName: string;
  chitFundName: string;
  amount: number;
  monthNumber: number;
  dueDate: string;
  paidDate?: string | null;
  status: Filter;
}

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  // Fetch Payments
  const { data, isLoading, refetch, isRefetching } = useQuery<PaymentItem[]>({
    queryKey: ["admin-payments"],
    queryFn: () => apiGet("/api/admin/payments"),
  });

  // Update Payment Status
  const markPaidMutation = useMutation({
    mutationFn: (id: string) =>
      apiPut(`/api/admin/payments/${id}`, { status: "paid" }),
    onSuccess: () => refetch(),
  });

  const confirmMarkPaid = (id: string) => {
    Alert.alert("Confirm Payment", "Mark this payment as paid?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: () => markPaidMutation.mutate(id) },
    ]);
  };

  const filteredData = (data || []).filter((p) =>
    filter === "all" ? true : p.status === filter,
  );

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "paid", label: "Paid" },
    { key: "overdue", label: "Overdue" },
  ];

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + (Platform.OS === "web" ? 60 : 12) },
        ]}
      >
        <Text style={styles.headerTitle}>Admin Payments</Text>

        {/* Filters */}
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

      {/* Payment List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);

          return (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <View
                  style={[styles.cardIcon, { backgroundColor: statusStyle.bg }]}
                >
                  <Ionicons
                    name={
                      item.status === "paid"
                        ? "checkmark-circle"
                        : item.status === "overdue"
                          ? "alert-circle"
                          : "time"
                    }
                    size={20}
                    color={statusStyle.text}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.chitFundName}</Text>

                  <Text style={styles.cardSubtitle}>User: {item.userName}</Text>

                  <Text style={styles.cardSubtitle}>
                    Month {item.monthNumber} • Due {formatDate(item.dueDate)}
                  </Text>

                  {item.paidDate && (
                    <Text style={styles.paidDate}>
                      Paid on {formatDate(item.paidDate)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>
                  {formatCurrency(item.amount)}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: statusStyle.text }]}
                  >
                    {item.status}
                  </Text>
                </View>

                {item.status !== "paid" && (
                  <Pressable
                    style={styles.markPaidBtn}
                    onPress={() => confirmMarkPaid(item.id)}
                  >
                    <Text style={styles.markPaidText}>Mark Paid</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={48}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No payments found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
    color: Colors.text,
  },

  filterRow: {
    flexDirection: "row",
    gap: 8,
  },

  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },

  filterBtnActive: {
    backgroundColor: Colors.primary,
  },

  filterText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },

  filterTextActive: {
    color: Colors.white,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  cardLeft: {
    flexDirection: "row",
    gap: 12,
    flex: 1,
  },

  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
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
    alignItems: "flex-end",
    gap: 4,
  },

  cardAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
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
    fontFamily: "Inter_600SemiBold",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
});
