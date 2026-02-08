import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { apiGet, apiPost } from "@/lib/api";
import { formatCurrency, formatDate, getStatusColor } from "@/lib/format";

interface ChitFundDetail {
  id: string;
  name: string;
  description: string | null;
  totalAmount: number;
  monthlyInstallment: number;
  duration: number;
  totalSlots: number;
  availableSlots: number;
  organizerName: string;
  organizerContact: string | null;
  status: string;
  startDate: string | null;
  members: Array<{
    id: string;
    slotNumber: number;
    user: { name: string; email: string };
  }>;
  userMembership: any | null;
}

export default function ChitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [joining, setJoining] = useState(false);

  const { data: fund, isLoading } = useQuery<ChitFundDetail>({
    queryKey: ["chit-fund", id],
    queryFn: () => apiGet<ChitFundDetail>(`/api/chit-funds/${id}`),
  });

  const joinMutation = useMutation({
    mutationFn: () => apiPost(`/api/chit-funds/${id}/join`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chit-fund", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["my-memberships"] });
      Alert.alert("Success", "You have joined this chit fund!");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to join");
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!fund) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Fund not found</Text>
      </View>
    );
  }

  const statusStyle = getStatusColor(fund.status);
  const filledSlots = fund.totalSlots - fund.availableSlots;
  const fillPercent = (filledSlots / fund.totalSlots) * 100;
  const alreadyJoined = !!fund.userMembership;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 8),
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.topBarTitle}>Fund Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 120 + (Platform.OS === "web" ? 34 : 0),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="shield-checkmark"
              size={36}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.heroName}>{fund.name}</Text>
          <View
            style={[styles.statusBadgeLg, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusTextLg, { color: statusStyle.text }]}>
              {fund.status}
            </Text>
          </View>
        </View>

        {fund.description && (
          <View style={styles.descSection}>
            <Text style={styles.descText}>{fund.description}</Text>
          </View>
        )}

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="cash-outline" size={18} color="#16A34A" />
            </View>
            <Text style={styles.detailLabel}>Total Amount</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(fund.totalAmount)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="calendar-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.detailLabel}>Monthly</Text>
            <Text style={styles.detailValue}>
              {formatCurrency(fund.monthlyInstallment)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="time-outline" size={18} color="#D97706" />
            </View>
            <Text style={styles.detailLabel}>Duration</Text>
            <Text style={styles.detailValue}>{fund.duration} months</Text>
          </View>
          <View style={styles.detailItem}>
            <View style={[styles.detailIcon, { backgroundColor: "#F3E8FF" }]}>
              <Ionicons name="people-outline" size={18} color="#7C3AED" />
            </View>
            <Text style={styles.detailLabel}>Total Slots</Text>
            <Text style={styles.detailValue}>{fund.totalSlots}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Slot Availability</Text>
          <View style={styles.slotInfo}>
            <View style={styles.slotInfoRow}>
              <Text style={styles.slotInfoLabel}>Filled</Text>
              <Text style={styles.slotInfoValue}>
                {filledSlots} / {fund.totalSlots}
              </Text>
            </View>
            <View style={styles.progressBg}>
              <View
                style={[styles.progressFill, { width: `${fillPercent}%` }]}
              />
            </View>
            <Text style={styles.slotsAvailableText}>
              {fund.availableSlots} slots available
            </Text>
          </View>
        </View>

        {fund.startDate && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Start Date</Text>
            <Text style={styles.dateText}>{formatDate(fund.startDate)}</Text>
          </View>
        )}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Organizer</Text>
          <View style={styles.organizerInfo}>
            <View style={styles.organizerAvatar}>
              <Ionicons name="person" size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.organizerName}>{fund.organizerName}</Text>
              {fund.organizerContact && (
                <Text style={styles.organizerContact}>
                  {fund.organizerContact}
                </Text>
              )}
            </View>
          </View>
        </View>

        {fund.members.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>
              Members ({fund.members.length})
            </Text>
            {fund.members.map((m) => (
              <View key={m.id} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>
                    {m.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.user.name}</Text>
                  <Text style={styles.memberSlot}>Slot #{m.slotNumber}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {!alreadyJoined &&
        fund.availableSlots > 0 &&
        fund.status !== "completed" &&
        fund.status !== "cancelled" && (
          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom:
                  insets.bottom + (Platform.OS === "web" ? 34 : 16),
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.joinBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                joinMutation.isPending && { opacity: 0.6 },
              ]}
              onPress={() =>
                Alert.alert(
                  "Help & Support",
                  "For any help or support, contact us:\n\nEmail: admin@chittracker@gmail.com\nPhone: 9701554623",
                )
              }
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color={Colors.white} />
                  <Text style={styles.joinBtnText}>Join This Fund</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

      {alreadyJoined && (
        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16),
            },
          ]}
        >
          <View style={styles.joinedBanner}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={Colors.success}
            />
            <Text style={styles.joinedText}>
              You are a member (Slot #{fund.userMembership.slotNumber})
            </Text>
          </View>
        </View>
      )}
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
  errorText: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: Colors.textSecondary,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  topBarTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.text,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + "18",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  statusBadgeLg: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusTextLg: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    textTransform: "uppercase",
  },
  descSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  descText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: "center",
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    width: "48%",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexGrow: 1,
    flexBasis: "45%",
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.text,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
    marginBottom: 12,
  },
  slotInfo: {
    gap: 8,
  },
  slotInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  slotInfoLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  slotInfoValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.text,
  },
  progressBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.surfaceSecondary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  slotsAvailableText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    color: Colors.success,
  },
  dateText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.text,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  organizerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight + "18",
    justifyContent: "center",
    alignItems: "center",
  },
  organizerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.text,
  },
  organizerContact: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.textSecondary,
  },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitial: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.primary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: Colors.text,
  },
  memberSlot: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  joinBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.white,
  },
  joinedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    backgroundColor: Colors.successLight,
    borderRadius: 14,
  },
  joinedText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.success,
  },
});
