// src/screens/MainScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setLoading, setError } from '../store/slices/uiSlice';
import { leaveRoom } from '../store/slices/userSlice';
import { removeUser } from '../store/slices/locationSlice';

import MapView from '../components/Map/MapView';
import JoinModal from '../components/Modals/JoinModal';
import ConnectionStatus from '../components/UI/ConnectionStatus';
import UsersList from '../components/UI/UsersList';
import ActionButtons from '../components/UI/ActionButtons';
import LoadingOverlay from '../components/UI/LoadingOverlay';
import ErrorToast from '../components/UI/ErrorToast';

const { width, height } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { showJoinModal, isLoading, error } = useSelector(
    (state: RootState) => state.ui
  );
  const { isJoined, currentUser } = useSelector((state: RootState) => state.user);
  const { users } = useSelector((state: RootState) => state.location);
  const [showUsersList, setShowUsersList] = useState(false);

  useEffect(() => {
    // Handle app lifecycle events
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background');
        // Optional: Pause location updates or reduce frequency
      } else if (nextAppState === 'active') {
        console.log('App coming to foreground');
        // Optional: Resume full location updates
      }
    };

    let subscription: any;
    
    // AppState is available on all platforms in React Native
    if (Platform.OS !== 'web') {
      subscription = AppState.addEventListener('change', handleAppStateChange);
    }

    // Cleanup function
    return () => {
      if (subscription) {
        subscription?.remove();
      }
    };
  }, []);

  // Handle cleanup when user leaves
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isJoined && currentUser) {
        handleLeaveRoom();
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [isJoined, currentUser]);

  const handleLeaveRoom = () => {
    try {
      dispatch(setLoading(true));
      
      // Remove current user from location state
      if (currentUser) {
        dispatch(removeUser(currentUser.id));
      }
      
      // Leave room
      dispatch(leaveRoom());
      
      // Clear any errors
      dispatch(setError(null));
      
      console.log('User left the room successfully');
    } catch (error) {
      console.error('Error leaving room:', error);
      dispatch(setError('Failed to leave room'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const toggleUsersList = () => {
    setShowUsersList(!showUsersList);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Connection Status Bar */}
        <ConnectionStatus />

        {/* Map View Container */}
        <View style={styles.mapContainer}>
          <MapView />
        </View>

        {/* Action Buttons - Only show when user is joined */}
        {isJoined && (
          <ActionButtons
            onToggleUsersList={toggleUsersList}
            onLeaveRoom={handleLeaveRoom}
            showUsersList={showUsersList}
            usersCount={Object.keys(users).length}
          />
        )}

        {/* Users List Overlay */}
        {showUsersList && isJoined && (
          <UsersList onClose={() => setShowUsersList(false)} />
        )}

        {/* Join Modal - Show when not joined */}
        {showJoinModal && !isJoined && <JoinModal />}

        {/* Loading Overlay */}
        {isLoading && (
          <LoadingOverlay 
            message="Connecting..." 
          />
        )}

        {/* Error Toast */}
        {error && <ErrorToast />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    borderRadius: Platform.OS === 'web' ? 0 : 12,
    overflow: 'hidden',
    marginHorizontal: Platform.OS === 'web' ? 0 : 16,
    marginVertical: Platform.OS === 'web' ? 0 : 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // Ensure map container has minimum height
    minHeight: Platform.OS === 'web' ? '70vh' : 400,
  },
});

export default MainScreen;