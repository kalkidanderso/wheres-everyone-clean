import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { AppDispatch, RootState } from '../../store/store';
import { joinRoom } from '../../store/slices/userSlice';
import { setShowJoinModal, setError } from '../../store/slices/uiSlice';
import { useLocation } from '../../context/LocationContext';

const { width, height } = Dimensions.get('window');

const EMOJI_OPTIONS = [
  '👨', '👩', '🧑', '👦', '👧',
  '🙂', '😊', '😄', '🤓', '😎',
  '🙋‍♂️', '🙋‍♀️', '🧑‍💼', '👨‍💻', '👩‍💻',
  '🎸', '🎨', '⚽', '🏀', '🎮',
];

const JoinModal: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { connectionStatus } = useSelector((state: RootState) => state.ui);
  const { getCurrentLocation } = useLocation();

  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(EMOJI_OPTIONS[0]);
  const [isJoining, setIsJoining] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const nameInputRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => nameInputRef.current?.focus(), 500);
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) {
      dispatch(setError('Please enter your name'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (connectionStatus !== 'connected') {
      dispatch(setError('Not connected to server. Please wait...'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      setIsJoining(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const location = await getCurrentLocation();
      if (!location) {
        dispatch(setError('Unable to get your location. Please enable location services.'));
        return;
      }

      dispatch(joinRoom({ name: name.trim(), avatar: selectedAvatar }));
      dispatch(setShowJoinModal(false));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error joining room:', error);
      dispatch(setError('Failed to join. Please try again.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsJoining(false);
    }
  };

  const handleAvatarSelect = (avatar: string) => {
    setSelectedAvatar(avatar);
    setShowEmojiPicker(false);
    Haptics.selectionAsync();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => dispatch(setShowJoinModal(false)));
  };

  const isConnected = connectionStatus === 'connected';

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      <BlurView intensity={80} style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Join "Where's Everyone"</Text>
                <Text style={styles.subtitle}>
                  Share your location with others in real-time
                </Text>
              </View>
              <View style={styles.locationIcon}>
                <Ionicons name="location" size={24} color="#007AFF" />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Connection Status */}
            <View
              style={[
                styles.connectionStatus,
                { backgroundColor: isConnected ? '#E8F5E8' : '#FFF3E0' },
              ]}
            >
              <Ionicons
                name={isConnected ? 'checkmark-circle' : 'time'}
                size={16}
                color={isConnected ? '#34C759' : '#FF9500'}
              />
              <Text
                style={[
                  styles.connectionText,
                  { color: isConnected ? '#34C759' : '#FF9500' },
                ]}
              >
                {isConnected ? 'Connected to server' : 'Connecting to server...'}
              </Text>
            </View>

            {/* Avatar Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose your avatar</Text>
              <TouchableOpacity
                style={styles.avatarButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.selectedAvatar}>{selectedAvatar}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              {showEmojiPicker && (
                <Animated.View style={styles.emojiPicker}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.emojiScrollContent}
                  >
                    {EMOJI_OPTIONS.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.emojiOption,
                          selectedAvatar === emoji && styles.selectedEmoji,
                        ]}
                        onPress={() => handleAvatarSelect(emoji)}
                      >
                        <Text style={styles.emojiText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}
            </View>

            {/* Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enter your name</Text>
              <TextInput
                ref={nameInputRef}
                style={styles.input}
                placeholder="Your display name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleJoin}
              />
            </View>

            {/* Join Button */}
            <TouchableOpacity
              style={[
                styles.joinButton,
                (!name.trim() || !isConnected) && styles.joinButtonDisabled,
              ]}
              onPress={handleJoin}
              disabled={!name.trim() || !isConnected || isJoining}
              activeOpacity={0.7}
            >
              {isJoining ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.joinButtonText}>Join Map</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    position: 'relative',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  locationIcon: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  connectionText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAvatar: {
    fontSize: 32,
  },
  emojiPicker: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emojiScrollContent: {
    paddingHorizontal: 10,
  },
  emojiOption: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedEmoji: {
    backgroundColor: '#007AFF',
  },
  emojiText: {
    fontSize: 24,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  joinButtonDisabled: {
    backgroundColor: '#999',
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JoinModal;