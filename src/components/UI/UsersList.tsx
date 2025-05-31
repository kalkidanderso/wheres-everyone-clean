// src/components/UI/UsersList.tsx
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { User } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

interface UsersListProps {
  users: User[];
  currentUser: User | null;
}

export const UsersList: React.FC<UsersListProps> = ({ users, currentUser }) => {
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      // Current user always first
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      // Then sort by join time
      return a.joinedAt - b.joinedAt;
    });
  }, [users, currentUser]);

  const getTimeSinceJoin = (joinedAt: number) => {
    return formatDistanceToNow(joinedAt, { addSuffix: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's Here</Text>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {sortedUsers.map((user) => (
          <View
            key={user.id}
            style={[
              styles.userCard,
              user.id === currentUser?.id && styles.currentUserCard,
            ]}
          >
            <View style={styles.emojiContainer}>
              <Text style={styles.emoji} role="img" aria-label={user.name}>
                {user.emoji}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>
                  {user.name}
                  {user.id === currentUser?.id && (
                    <Text style={styles.youLabel}> (You)</Text>
                  )}
                </Text>
                <Text style={styles.timeText}>
                  {getTimeSinceJoin(user.joinedAt)}
                </Text>
              </View>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  user.isOnline ? styles.onlineDot : styles.offlineDot
                ]} />
                <Text style={styles.statusText}>
                  {user.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '60%',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  currentUserCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  emojiContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  emoji: {
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  youLabel: {
    fontSize: 14,
    color: '#3b82f6',
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  onlineDot: {
    backgroundColor: '#34C759',
  },
  offlineDot: {
    backgroundColor: '#9ca3af',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
});