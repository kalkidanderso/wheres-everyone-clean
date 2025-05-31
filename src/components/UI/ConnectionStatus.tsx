import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { Ionicons } from '@expo/vector-icons';

const ConnectionStatus: React.FC = () => {
  const { connectionStatus } = useSelector((state: RootState) => state.ui);

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected': return { text: 'Connected', color: '#34C759', icon: 'checkmark-circle' };
      case 'connecting': return { text: 'Connecting...', color: '#FF9500', icon: 'time' };
      case 'disconnected': return { text: 'Disconnected', color: '#FF3B30', icon: 'close-circle' };
      case 'error': return { text: 'Connection Error', color: '#FF3B30', icon: 'alert-circle' };
      default: return { text: 'Unknown', color: '#999', icon: 'help-circle' };
    }
  };

  const { text, color, icon } = getStatusConfig();

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ConnectionStatus;