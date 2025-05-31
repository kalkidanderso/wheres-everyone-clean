import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, AppState, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { WebSocketProvider, useWebSocket } from './src/context/WebSocketContext';
import UserMarker, { UserMarkerProps } from './src/components/Map/UserMarker';
import Toast from './src/components/Notifications/Toast';
import UserList from './src/components/BottomSheet/UserList';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EMOJIS, EmojiType } from './src/constants';

interface User {
  id: string;
  name: string;
  emoji: EmojiType;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
}

const LOCATION_UPDATE_INTERVAL = 5000; // 5 seconds

const MainApp = () => {
  const {
    users,
    currentUser,
    isConnected,
    connect,
    updateUserLocation,
    updateUserEmoji,
  } = useWebSocket();

  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiType>('👤');
  const [region, setRegion] = useState<Region>({
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ message: '', type: 'info' });
  const locationInterval = useRef<NodeJS.Timeout>();
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showNotification('Location permission denied', 'warning');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setRegion((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));
    })();

    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser) {
      // Start location updates
      locationInterval.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          updateUserLocation(latitude, longitude);
        } catch (error) {
          console.error('Error updating location:', error);
        }
      }, LOCATION_UPDATE_INTERVAL);
    }

    return () => {
      if (locationInterval.current) {
        clearInterval(locationInterval.current);
      }
    };
  }, [currentUser]);

  const showNotification = (message: string, type: 'success' | 'info' | 'warning') => {
    setToastMessage({ message, type });
    setShowToast(true);
  };

  const handleJoin = async () => {
    if (!name.trim()) {
      showNotification('Please enter your name', 'warning');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      connect(name.trim(), selectedEmoji);
      updateUserLocation(location.coords.latitude, location.coords.longitude);
      showNotification('Successfully joined!', 'success');
    } catch (error) {
      showNotification('Error getting location', 'warning');
    }
  };

  const validUsers = users.filter((user): user is UserMarkerProps => 
    user.coordinate !== undefined && 
    typeof user.coordinate.latitude === 'number' && 
    typeof user.coordinate.longitude === 'number'
  );

  const handleUserPress = (user: User) => {
    const coordinate = user.coordinate;
    if (mapRef.current && coordinate) {
      mapRef.current.animateToRegion({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  const renderEmojiSelector = () => (
    <View style={styles.emojiSelector}>
      <Text style={styles.emojiLabel}>Choose your avatar:</Text>
      <View style={styles.emojiGrid}>
        {EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={[
              styles.emojiOption,
              selectedEmoji === emoji && styles.selectedEmoji,
            ]}
            onPress={() => setSelectedEmoji(emoji)}
          >
            <Text style={styles.emojiText}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <View style={styles.joinContainer}>
          <Text style={styles.title}>Where's Everyone?</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholderTextColor="#666"
          />
          {renderEmojiSelector()}
          <TouchableOpacity style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>Join</Text>
          </TouchableOpacity>
        </View>
        <Toast
          visible={showToast}
          message={toastMessage.message}
          type={toastMessage.type as any}
          onHide={() => setShowToast(false)}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {validUsers.map((user) => (
          <UserMarker
            key={user.id}
            {...user}
            isCurrentUser={user.id === currentUser.id}
          />
        ))}
      </MapView>
      <UserList
        users={users}
        currentUserId={currentUser.id}
        onEmojiChange={updateUserEmoji}
        onUserPress={handleUserPress}
      />
      <Toast
        visible={showToast}
        message={toastMessage.message}
        type={toastMessage.type as any}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
  },
  joinContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emojiSelector: {
    width: '100%',
    marginBottom: 24,
  },
  emojiLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  emojiOption: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedEmoji: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  emojiText: {
    fontSize: 24,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </GestureHandlerRootView>
  );
};

export default App;