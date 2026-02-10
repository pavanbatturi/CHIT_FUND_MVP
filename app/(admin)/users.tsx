import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Platform,
  Linking, // ⭐ added Linking
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { apiGet, apiPost } from "@/lib/api";
import { formatDate } from "@/lib/format";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

interface ChitFund {
  id: string;
  name: string;
  availableSlots: number;
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showAssign, setShowAssign] = useState(false);

  const {
    data: users,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<UserItem[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiGet<UserItem[]>("/api/admin/users"),
  });

  const { data: funds } = useQuery<ChitFund[]>({
    queryKey: ["admin-chit-funds"],
    queryFn: () => apiGet<ChitFund[]>("/api/chit-funds"),
  });

  const assignMutation = useMutation({
    mutationFn: (body: { userId: string; chitFundId: string }) =>
      apiPost("/api/admin/assign-user", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chit-funds"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setShowAssign(false);
      setSelectedUser(null);
      Alert.alert("Success", "User assigned to chit fund!");
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  });

  function handleAssign(chitFundId: string) {
    if (!selectedUser) return;
    assignMutation.mutate({ userId: selectedUser.id, chitFundId });
  }

  // ⭐ WhatsApp Draw Countdown Logic
  function getDaysUntilDraw() {
    const today = new Date();
    let drawDate = new Date(today.getFullYear(), today.getMonth(), 15);

    if (today.getDate() > 15) {
      drawDate = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    }

    const diffTime = drawDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ⭐ WhatsApp Reminder Function
  function sendDrawReminder(user: UserItem) {
    const days = getDaysUntilDraw();

    const message = `Hello ${user.name} 👋,

Reminder that your chit fund draw will be held on 15th of every month.

The draw will happen in ${days} day${days > 1 ? "s" : ""}.

Please ensure your payment is completed before the draw date.

Thank you 🙏`;

    const encodedMessage = encodeURIComponent(message);
    const phone = "919701771625";

    const url = `https://wa.me/${phone}?text=${encodedMessage}`;

    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open WhatsApp"),
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  const availableFunds = (funds || []).filter((f) => f.availableSlots > 0);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
          },
        ]}
      >
        <Text style={styles.headerTitle}>All Users</Text>
        <Text style={styles.headerSubtitle}>
          {users?.length || 0} registered users
        </Text>
      </View>

      <FlatList
        data={users || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      item.role === "admin"
                        ? "#F3E8FF"
                        : Colors.surfaceSecondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: item.role === "admin" ? "#7C3AED" : Colors.primary,
                    },
                  ]}
                >
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.role === "admin" && (
                    <View style={styles.roleBadge}>
                      <Text style={styles.roleText}>Admin</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardEmail}>{item.email}</Text>
                <Text style={styles.cardMeta}>
                  {item.phone} - Joined {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>

            {item.role !== "admin" && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={({ pressed }) => [
                    styles.assignBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    setSelectedUser(item);
                    setShowAssign(true);
                  }}
                >
                  <Ionicons name="add" size={18} color="#7C3AED" />
                </Pressable>

                {/* ⭐ WhatsApp Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.whatsappBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => sendDrawReminder(item)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="white" />
                </Pressable>
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0),
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
          />
        }
        scrollEnabled={(users?.length ?? 0) > 0}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={48}
              color={Colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No users yet</Text>
          </View>
        }
      />

      <Modal visible={showAssign} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign to Fund</Text>
              <Pressable
                onPress={() => {
                  setShowAssign(false);
                  setSelectedUser(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            {selectedUser && (
              <Text style={styles.assigningText}>
                Assigning: {selectedUser.name}
              </Text>
            )}
            <FlatList
              data={availableFunds}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={({ pressed }) => [
                    styles.fundOption,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => handleAssign(item.id)}
                  disabled={assignMutation.isPending}
                >
                  <View>
                    <Text style={styles.fundOptionName}>{item.name}</Text>
                    <Text style={styles.fundOptionSlots}>
                      {item.availableSlots} slots available
                    </Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color="#7C3AED" />
                </Pressable>
              )}
              contentContainerStyle={{ padding: 20 }}
              scrollEnabled={(availableFunds?.length ?? 0) > 0}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No available funds</Text>
                  <Text style={styles.emptySubtitle}>
                    All chit funds are fully subscribed
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: Colors.text,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  cardInfo: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: "#F3E8FF",
    borderRadius: 4,
  },
  roleText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#7C3AED",
  },
  cardEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  cardMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 1,
  },
  assignBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },

  // ⭐ WhatsApp style
  whatsappBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.text,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    color: Colors.text,
  },
  assigningText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  fundOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  fundOptionName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  fundOptionSlots: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
