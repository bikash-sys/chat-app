import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { fetchUsersList } from '../services/api';
import { UserProfile } from '../types';

export default function HomeScreen() {
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();

  const loadUsers = useCallback(async () => {
    try {
      const usersList = await fetchUsersList();
      setUsers(usersList);
    } catch (err: any) {
      console.error('[Home] Failed to load users:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile && !userProfile.name) {
        router.replace('/profile-setup');
      } else if (userProfile) {
        loadUsers();
      }
    }
  }, [user, userProfile, authLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item._id, name: item.name || item.phone } })}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name ? item.name[0] : item.phone[0] || 'U').toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name || 'Unnamed User'}</Text>
          <Text style={styles.userPhone}>{item.phone}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  if (authLoading || (loading && !refreshing)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading registered users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Profile Info Card */}
      <View style={styles.profileHeader}>
        <View style={styles.myAvatar}>
          <Text style={styles.myAvatarText}>
            {(userProfile?.name ? userProfile.name[0] : 'ME').toUpperCase()}
          </Text>
        </View>
        <View style={styles.myInfo}>
          <Text style={styles.myName}>{userProfile?.name || 'My Profile'}</Text>
          <Text style={styles.myPhone}>{userProfile?.phone || user?.phoneNumber || ''}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Available Users</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item._id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No other registered users found.</Text>
            <Text style={styles.emptySubtext}>
              When another user logs in, they will appear in this list.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6C6C70',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  myAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  myAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
  },
  myInfo: {
    flex: 1,
  },
  myName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  myPhone: {
    fontSize: 13,
    color: '#6C6C70',
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: '#FF3B3015',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C6C70',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  userPhone: {
    fontSize: 13,
    color: '#6C6C70',
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
    fontWeight: '400',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A3A3C',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 6,
  },
});
