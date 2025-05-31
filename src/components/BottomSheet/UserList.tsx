import React, { useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { useWebSocket } from '../../context/WebSocketContext';
import { EMOJIS, EmojiType } from '../../constants';

interface User {
  id: string;
  name: string;
  emoji: EmojiType;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
}

interface UserListProps {
  users: User[];
  currentUserId: string;
  onEmojiChange: (emoji: EmojiType) => void;
  onUserPress: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({
  users,
  currentUserId,
  onEmojiChange,
  onUserPress,
}) => {
  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['25%', '50%', '90%'], []);

  const handleUserPress = useCallback((user: User) => {
    onUserPress(user);
    bottomSheetRef.current?.collapse();
  }, [onUserPress]);

  const handleEmojiChange = useCallback((emoji: EmojiType) => {
    onEmojiChange(emoji);
    bottomSheetRef.current?.collapse();
  }, [onEmojiChange]);

  const renderUser = useCallback((user: User) => {
    const isCurrentUser = user.id === currentUserId;

    return (
      <TouchableOpacity
        key={user.id}
        style={[styles.userItem, isCurrentUser && styles.currentUserItem]}
        onPress={() => !isCurrentUser && handleUserPress(user)}
      >
        <View style={styles.userInfo}>
          <Text style={styles.emoji}>{user.emoji}</Text>
          <Text style={styles.userName}>{user.name} {isCurrentUser && '(You)'}</Text>
        </View>
        {isCurrentUser && (
          <View style={styles.emojiSelector}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiOption,
                  user.emoji === emoji && styles.selectedEmoji,
                ]}
                onPress={() => handleEmojiChange(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }, [currentUserId, handleUserPress, handleEmojiChange]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Users ({users.length})</Text>
        <View style={styles.userList}>
          {users.map(renderUser)}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  handleIndicator: {
    backgroundColor: '#CBD5E0',
    width: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2D3748',
  },
  userList: {
    flex: 1,
  },
  userItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F7FAFC',
    marginBottom: 8,
  },
  currentUserItem: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#90CDF4',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    color: '#2D3748',
    fontWeight: '500',
  },
  emojiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  emojiOption: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
  },
  selectedEmoji: {
    backgroundColor: '#BEE3F8',
    borderWidth: 1,
    borderColor: '#63B3ED',
  },
  emojiText: {
    fontSize: 20,
  },
});

export default UserList; 