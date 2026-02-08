import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert,
  Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
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

export default function ManageFundsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({
    name: '', description: '', totalAmount: '', monthlyInstallment: '',
    duration: '', totalSlots: '', organizerName: '', organizerContact: '',
  });

  const { data, isLoading, refetch, isRefetching } = useQuery<ChitFund[]>({
    queryKey: ['admin-chit-funds'],
    queryFn: () => apiGet<ChitFund[]>('/api/chit-funds'),
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => apiPost('/api/admin/chit-funds', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chit-funds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setShowCreate(false);
      resetForm();
      Alert.alert('Success', 'Chit fund created!');
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/chit-funds/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chit-funds'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  const generatePaymentsMutation = useMutation({
    mutationFn: (chitFundId: string) => apiPost('/api/admin/create-payments', { chitFundId }),
    onSuccess: (data: any) => {
      Alert.alert('Success', `Created ${(data as any).count} payment records`);
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => Alert.alert('Error', err.message),
  });

  function resetForm() {
    setFormData({
      name: '', description: '', totalAmount: '', monthlyInstallment: '',
      duration: '', totalSlots: '', organizerName: '', organizerContact: '',
    });
  }

  function handleCreate() {
    if (!formData.name || !formData.totalAmount || !formData.monthlyInstallment || !formData.duration || !formData.totalSlots || !formData.organizerName) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const slots = parseInt(formData.totalSlots);
    createMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      totalAmount: parseInt(formData.totalAmount),
      monthlyInstallment: parseInt(formData.monthlyInstallment),
      duration: parseInt(formData.duration),
      totalSlots: slots,
      availableSlots: slots,
      organizerName: formData.organizerName,
      organizerContact: formData.organizerContact || null,
      status: 'active',
      startDate: new Date().toISOString(),
    });
  }

  function handleDelete(id: string, name: string) {
    Alert.alert('Delete Fund', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  function handleGeneratePayments(id: string, name: string) {
    Alert.alert('Generate Payments', `Generate payment records for all members of "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Generate', onPress: () => generatePaymentsMutation.mutate(id) },
    ]);
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, {
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12),
      }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Manage Funds</Text>
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.7 }]}
            onPress={() => setShowCreate(true)}
          >
            <Ionicons name="add" size={22} color={Colors.white} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={data || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const statusStyle = getStatusColor(item.status);
          const filled = item.totalSlots - item.availableSlots;
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.text }]}>{item.status}</Text>
                </View>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.cardStat}>
                  {formatCurrency(item.totalAmount)} - {item.duration}mo - {filled}/{item.totalSlots} slots
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.generateBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleGeneratePayments(item.id, item.name)}
                >
                  <Ionicons name="receipt-outline" size={16} color="#2563EB" />
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Payments</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && { opacity: 0.7 }]}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0),
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />
        }
        scrollEnabled={(data?.length ?? 0) > 0}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No funds yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to create your first chit fund</Text>
          </View>
        }
      />

      <Modal visible={showCreate} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Chit Fund</Text>
              <Pressable onPress={() => { setShowCreate(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              {[
                { key: 'name', label: 'Fund Name *', placeholder: 'e.g. Golden Circle Fund' },
                { key: 'description', label: 'Description', placeholder: 'Brief description', multiline: true },
                { key: 'totalAmount', label: 'Total Amount *', placeholder: 'e.g. 500000', keyboard: 'numeric' as const },
                { key: 'monthlyInstallment', label: 'Monthly Installment *', placeholder: 'e.g. 25000', keyboard: 'numeric' as const },
                { key: 'duration', label: 'Duration (months) *', placeholder: 'e.g. 20', keyboard: 'numeric' as const },
                { key: 'totalSlots', label: 'Total Slots *', placeholder: 'e.g. 20', keyboard: 'numeric' as const },
                { key: 'organizerName', label: 'Organizer Name *', placeholder: 'e.g. ChitTrack Finance' },
                { key: 'organizerContact', label: 'Organizer Contact', placeholder: 'Phone number' },
              ].map((field) => (
                <View key={field.key} style={styles.formField}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput
                    style={[styles.formInput, field.multiline && { height: 80, textAlignVertical: 'top' }]}
                    value={(formData as any)[field.key]}
                    onChangeText={(text) => setFormData({ ...formData, [field.key]: text })}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType={(field as any).keyboard || 'default'}
                    multiline={field.multiline}
                  />
                </View>
              ))}

              <Pressable
                style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.85 }, createMutation.isPending && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.createBtnText}>Create Fund</Text>
                )}
              </Pressable>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.text,
    flex: 1,
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, textTransform: 'uppercase' as const },
  cardStats: { marginBottom: 12 },
  cardStat: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  generateBtn: {
    backgroundColor: '#DBEAFE',
  },
  deleteBtn: {
    backgroundColor: Colors.errorLight,
  },
  actionBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: Colors.text },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: Colors.textSecondary },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  modalForm: {
    padding: 20,
  },
  formField: {
    marginBottom: 14,
  },
  formLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  createBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: Colors.white,
  },
});
