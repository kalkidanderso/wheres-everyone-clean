// src/components/UI/ActionButtons.tsx
import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActionButtonsProps {
  onToggleUsersList: () => void;
  onLeaveRoom: () => void;
  showUsersList: boolean;
  usersCount: number;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onToggleUsersList,
  onLeaveRoom,
  showUsersList,
  usersCount,
}) => {
  const handleLeaveRoom = () => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave? You will stop sharing your location.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: onLeaveRoom,
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Users List Toggle Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.usersButton,
          showUsersList && styles.activeButton,
        ]}
        onPress={onToggleUsersList}
        activeOpacity={0.7}
      >
        <Ionicons
          name="people"
          size={20}
          color={showUsersList ? '#007AFF' : '#666'}
          style={styles.buttonIcon}
        />
        <Text style={[
          styles.buttonText,
          showUsersList && styles.activeButtonText,
        ]}>
          Users ({usersCount})
        </Text>
      </TouchableOpacity>

      {/* Leave Room Button */}
      <TouchableOpacity
        style={[styles.button, styles.leaveButton]}
        onPress={handleLeaveRoom}
        activeOpacity={0.7}
      >
        <Ionicons
          name="exit-outline"
          size={20}
          color="#FF3B30"
          style={styles.buttonIcon}
        />
        <Text style={[styles.buttonText, styles.leaveButtonText]}>
          Leave
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.select({ web: 20, default: 60 }),
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: 'white',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
  usersButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeButton: {
    backgroundColor: '#F2F8FF',
    borderColor: '#007AFF',
  },
  leaveButton: {
    backgroundColor: '#FFF2F2',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeButtonText: {
    color: '#007AFF',
  },
  leaveButtonText: {
    color: '#FF3B30',
  },
});

export default ActionButtons;