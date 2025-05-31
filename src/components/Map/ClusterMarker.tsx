import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import * as Animatable from 'react-native-animatable';

interface ClusterStyle {
  size: number;
  color: string;
  textColor: string;
  fontSize: number;
}

interface ClusterMarkerProps {
  coordinate: { latitude: number; longitude: number };
  pointCount: number;
  style?: ClusterStyle;
  onPress: () => void;
}

const ClusterMarker: React.FC<ClusterMarkerProps> = ({ 
  coordinate, 
  pointCount, 
  style = {
    size: 50,
    color: '#007AFF',
    textColor: '#FFFFFF',
    fontSize: 14,
  },
  onPress 
}) => {
  return (
    <Marker 
      coordinate={coordinate} 
      onPress={onPress} 
      anchor={{ x: 0.5, y: 0.5 }} 
      centerOffset={{ x: 0, y: 0 }}
    >
      <Animatable.View 
        animation="bounceIn" 
        duration={500}
        style={[
          styles.cluster,
          { 
            width: style.size, 
            height: style.size, 
            borderRadius: style.size / 2, 
            backgroundColor: style.color 
          }
        ]}
      >
        <Text 
          style={[
            styles.clusterText,
            { 
              color: style.textColor,
              fontSize: style.fontSize 
            }
          ]}
        >
          {pointCount}
        </Text>
      </Animatable.View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  cluster: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  clusterText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ClusterMarker;