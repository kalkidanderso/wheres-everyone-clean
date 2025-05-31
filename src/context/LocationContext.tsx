import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { updateCurrentUserLocation } from '../store/slices/userSlice';

interface LocationContextType {
  startLocationTracking: () => Promise<void>;
  stopLocationTracking: () => void;
  getCurrentLocation: () => Promise<Location.LocationObject | null>;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, isJoined } = useSelector((state: RootState) => state.user);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission not granted');
    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
      (location) => {
        if (isJoined && currentUser) {
          const { latitude, longitude } = location.coords;
          dispatch(updateCurrentUserLocation({ latitude, longitude }));
        }
      }
    );
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) locationSubscription.current.remove();
    locationSubscription.current = null;
  };

  const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      return await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      });
    } catch (error) {
      console.error("Location error:", error);
      return null;
    }
  };

  useEffect(() => {
    if (isJoined) startLocationTracking();
    return () => stopLocationTracking();
  }, [isJoined]);

  return (
    <LocationContext.Provider value={{ startLocationTracking, stopLocationTracking, getCurrentLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};