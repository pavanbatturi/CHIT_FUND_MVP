import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { confirmSignOut } from '@/lib/confirm-sign-out';

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  function handleLogout() {
    confirmSignOut(async () => {
      await logout();
    });
  }

  function handleSwitchToUser() {
    router.replace('/(tabs)');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors.background }]}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16),
        paddingBottom: 100 + (Platform.OS === 'web' ? 34 : 0),
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.adminAvatar}>
          <Ionicons name="shield" size={28} color="#7C3AED" />
        </View>
        <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.profileEmail}>{user?.email || ''}</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>Administrator</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          onPress={handleSwitchToUser}
        >
          <View style={[styles.menuIcon, { backgroundColor: Colors.primaryLight + '18' }]}>
            <Ionicons name="swap-horizontal" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.menuLabel}>Switch to User View</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.menuItem, pressed && { opacity: 0.7 }]}
          onPress={() => Alert.alert('ChitTrack Admin', 'Version 1.0.0\nAdmin Dashboard for Chit Fund Management')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="information-circle-outline" size={20} color="#2563EB" />
          </View>
          <Text style={styles.menuLabel}>About</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: Colors.text,
  },
  profileCard: {
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  adminAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: Colors.text,
  },
  profileEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  adminBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
  },
  adminBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#7C3AED',
  },
  section: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: Colors.text,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.errorLight,
  },
  logoutText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: Colors.error,
  },
});
