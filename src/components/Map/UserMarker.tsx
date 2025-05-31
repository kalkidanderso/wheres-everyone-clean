import React from 'react';
import { Marker } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { EmojiType } from '../../constants';

export interface UserMarkerProps {
  id: string;
  name: string;
  emoji: EmojiType;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  isCurrentUser: boolean;
}

const UserMarker: React.FC<UserMarkerProps> = ({
  name,
  emoji,
  coordinate,
  isCurrentUser,
}) => (
  <Marker
    coordinate={coordinate}
    title={name}
    description={isCurrentUser ? 'You' : undefined}
  >
    <View style={[styles.markerContainer, isCurrentUser && styles.currentUserMarker]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  </Marker>
);

const styles = StyleSheet.create({
  markerContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4299E1',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentUserMarker: {
    borderColor: '#48BB78',
    backgroundColor: '#F0FFF4',
  },
  emoji: {
    fontSize: 24,
  },
});

export default UserMarker;
