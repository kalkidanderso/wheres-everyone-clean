// src/components/Map/MapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Dimensions,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { 
  Marker, 
  PROVIDER_GOOGLE,
  Region,
  Callout,
} from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { setMapReady, setError } from '../../store/slices/uiSlice';
import { updateCurrentUserLocation } from '../../store/slices/userSlice';
import { updateUserLocation } from '../../store/slices/locationSlice';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import ClusterMarker from './ClusterMarker';
import Supercluster from 'supercluster';
import { User } from '../../types';

const { width, height } = Dimensions.get('window');

const INITIAL_REGION = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const GOOGLE_MAPS_STYLE = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// Add cluster configuration
const CLUSTER_CONFIG = {
  radius: 40,
  maxZoom: 16,
  minZoom: 0,
  nodeSize: 64,
  extent: 512,
  minPoints: 2,
};

// Add cluster style configuration
const CLUSTER_STYLES = {
  small: {
    size: 50,
    color: '#007AFF',
    textColor: '#FFFFFF',
    fontSize: 14,
  },
  medium: {
    size: 60,
    color: '#FF9500',
    textColor: '#FFFFFF',
    fontSize: 16,
  },
  large: {
    size: 70,
    color: '#FF3B30',
    textColor: '#FFFFFF',
    fontSize: 18,
  },
  xlarge: {
    size: 80,
    color: '#AF52DE',
    textColor: '#FFFFFF',
    fontSize: 20,
  },
};

// Add type definitions for cluster properties
interface ClusterProperties {
  cluster: boolean;
  point_count: number;
  point_count_abbreviated?: string;
  cluster_id?: number;
  userId?: string;
  user?: User;
}

interface ClusterFeature {
  type: 'Feature';
  properties: ClusterProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
}

const CustomMapView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, isJoined } = useSelector((state: RootState) => state.user);
  const { users, selectedUserId } = useSelector((state: RootState) => state.location);
  const { isMapReady } = useSelector((state: RootState) => state.ui);
  
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [clusters, setClusters] = useState<any[]>([]);
  const supercluster = useRef<Supercluster>();
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Initialize supercluster
  useEffect(() => {
    supercluster.current = new Supercluster({
      ...CLUSTER_CONFIG,
      map: (props: any) => ({
        ...props,
        cluster: true,
      }),
      reduce: (acc: any, props: any) => {
        acc.point_count = (acc.point_count || 0) + (props.point_count || 0);
        acc.point_count_abbreviated = props.point_count_abbreviated;
      },
    });
  }, []);

  // Initialize map and location tracking
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          dispatch(setError('Location permission denied'));
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };

        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion);

        if (currentUser && isJoined) {
          dispatch(updateCurrentUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }));
          dispatch(updateUserLocation({
            userId: currentUser.id,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            lastUpdated: Date.now(),
            isOnline: true,
          }));
        }

        dispatch(setMapReady(true));
      } catch (error) {
        console.error('Error initializing map:', error);
        dispatch(setError('Failed to get location'));
      }
    };

    if (isJoined && !isMapReady) {
      initializeMap();
    }
  }, [isJoined, isMapReady, currentUser, dispatch]);

  // Start location tracking when joined
  useEffect(() => {
    const startLocationTracking = async () => {
      if (!isJoined || !currentUser) return;

      try {
        locationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const { latitude, longitude } = location.coords;
            
            dispatch(updateCurrentUserLocation({ latitude, longitude }));
            dispatch(updateUserLocation({
              userId: currentUser.id,
              latitude,
              longitude,
              lastUpdated: Date.now(),
              isOnline: true,
            }));
          }
        );
      } catch (error) {
        console.error('Error starting location tracking:', error);
        dispatch(setError('Failed to track location'));
      }
    };

    if (isJoined && isMapReady) {
      startLocationTracking();
    }

    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, [isJoined, isMapReady, currentUser, dispatch]);

  // Update clusters when users change or region changes
  useEffect(() => {
    if (!supercluster.current || !users) return;

    const points = Object.values(users).map((user) => ({
      type: 'Feature' as const,
      properties: { 
        cluster: false,
        userId: user.id,
        user,
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [user.longitude, user.latitude],
      },
    }));

    supercluster.current.load(points);

    const clusters = supercluster.current.getClusters(
      [region.longitude - region.longitudeDelta,
       region.latitude - region.latitudeDelta,
       region.longitude + region.longitudeDelta,
       region.latitude + region.latitudeDelta],
      Math.floor(Math.log2(360 / region.longitudeDelta) - 1)
    );

    setClusters(clusters);
  }, [users, region]);

  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const formatLastUpdated = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderMarker = (user: any, isCurrentUser = false) => {
    const isSelected = selectedUserId === user.id;
    const isOffline = Date.now() - user.lastUpdated > 300000; // 5 minutes

    return (
      <Marker
        key={user.id}
        coordinate={{
          latitude: user.latitude,
          longitude: user.longitude,
        }}
        title={isCurrentUser ? 'You' : user.name}
      >
        <Animatable.View
          animation={isSelected ? 'pulse' : undefined}
          iterationCount="infinite"
          style={[
            styles.marker,
            isCurrentUser && styles.currentUserMarker,
            isSelected && styles.selectedMarker,
            isOffline && styles.offlineMarker,
          ]}
        >
          <Text style={styles.markerEmoji}>{user.avatar}</Text>
        </Animatable.View>
        <Callout>
          <View style={styles.callout}>
            <Text style={styles.calloutTitle}>
              {isCurrentUser ? 'You' : user.name}
            </Text>
            <Text style={styles.calloutSubtitle}>
              Last updated: {formatLastUpdated(user.lastUpdated)}
            </Text>
            {isOffline && (
              <Text style={styles.offlineText}>Offline</Text>
            )}
          </View>
        </Callout>
      </Marker>
    );
  };

  // Update cluster rendering
  const renderCluster = (cluster: ClusterFeature) => {
    const pointCount = cluster.properties.point_count;
    let style = CLUSTER_STYLES.small;
    
    if (pointCount >= 50) {
      style = CLUSTER_STYLES.xlarge;
    } else if (pointCount >= 25) {
      style = CLUSTER_STYLES.large;
    } else if (pointCount >= 10) {
      style = CLUSTER_STYLES.medium;
    }

    const clusterId = cluster.properties.cluster_id;
    if (!clusterId) return null;

    return (
      <ClusterMarker
        key={`cluster-${clusterId}`}
        coordinate={{
          latitude: cluster.geometry.coordinates[1],
          longitude: cluster.geometry.coordinates[0],
        }}
        pointCount={pointCount}
        style={style}
        onPress={() => {
          const zoom = Math.min(
            supercluster.current?.getClusterExpansionZoom(clusterId) ?? 20,
            20
          );
          
          // Add haptic feedback
          if (Platform.OS !== 'web') {
            const Haptics = require('expo-haptics');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          mapRef.current?.animateCamera({
            center: {
              latitude: cluster.geometry.coordinates[1],
              longitude: cluster.geometry.coordinates[0],
            },
            zoom,
          });
        }}
      />
    );
  };

  if (!isJoined) {
    return (
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderEmoji}>🗺️</Text>
        <Text style={styles.placeholderTitle}>Welcome to Where's Everyone</Text>
        <Text style={styles.placeholderSubtitle}>
          Join to start sharing your location
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={INITIAL_REGION}
        region={region}
        onRegionChangeComplete={handleRegionChange}
        customMapStyle={GOOGLE_MAPS_STYLE}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
      >
        {clusters.map((cluster) => {
          if (cluster.properties.cluster) {
            return renderCluster(cluster);
          }

          const user = cluster.properties.user;
          return renderMarker(user, user.id === currentUser?.id);
        })}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (currentUser) {
              mapRef.current?.animateToRegion({
                latitude: currentUser.latitude,
                longitude: currentUser.longitude,
                latitudeDelta: 0.0922,
                longitudeDelta: 0.0421,
              });
            }
          }}
        >
          <Ionicons name="locate" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  marker: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  currentUserMarker: {
    borderColor: '#34C759',
    backgroundColor: '#E8F5E8',
  },
  selectedMarker: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF3E0',
    transform: [{ scale: 1.1 }],
  },
  offlineMarker: {
    borderColor: '#8E8E93',
    opacity: 0.7,
  },
  markerEmoji: {
    fontSize: 24,
  },
  callout: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minWidth: 120,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  offlineText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  controls: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 32 : 24,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default CustomMapView;