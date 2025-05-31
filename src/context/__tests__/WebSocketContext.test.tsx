import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { WebSocketProvider, useWebSocket } from '../WebSocketContext';
import { EmojiType } from '../../constants';
import { TouchableOpacity, Text, View } from 'react-native';

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Test component
const TestComponent = () => {
  const { connect, disconnect, isConnected, currentUser } = useWebSocket();
  return (
    <View>
      <TouchableOpacity onPress={() => connect('Test User', '👤' as EmojiType)}>
        <Text>Connect</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={disconnect}>
        <Text>Disconnect</Text>
      </TouchableOpacity>
      <Text>Connected: {isConnected ? 'Yes' : 'No'}</Text>
      <Text>User: {currentUser?.name || 'None'}</Text>
    </View>
  );
};

describe('WebSocketContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should connect successfully', async () => {
    const { getByText } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    // Mock WebSocket onopen event
    act(() => {
      const onopen = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      onopen();
    });

    // Click connect button
    fireEvent.press(getByText('Connect'));

    await waitFor(() => {
      expect(getByText('Connected: Yes')).toBeTruthy();
      expect(getByText('User: Test User')).toBeTruthy();
    });
  });

  it('should disconnect successfully', async () => {
    const { getByText } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    // Connect first
    act(() => {
      const onopen = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      onopen();
    });

    fireEvent.press(getByText('Connect'));

    // Then disconnect
    fireEvent.press(getByText('Disconnect'));

    await waitFor(() => {
      expect(getByText('Connected: No')).toBeTruthy();
      expect(getByText('User: None')).toBeTruthy();
    });

    expect(mockWebSocket.close).toHaveBeenCalled();
  });

  it('should handle connection errors', async () => {
    const { getByText } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    // Mock WebSocket error
    act(() => {
      const onerror = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'error'
      )[1];
      onerror(new Error('Connection failed'));
    });

    fireEvent.press(getByText('Connect'));

    await waitFor(() => {
      expect(getByText('Connected: No')).toBeTruthy();
    });
  });

  it('should handle reconnection', async () => {
    const { getByText } = render(
      <WebSocketProvider>
        <TestComponent />
      </WebSocketProvider>
    );

    // Connect
    act(() => {
      const onopen = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'open'
      )[1];
      onopen();
    });

    fireEvent.press(getByText('Connect'));

    // Mock connection close
    act(() => {
      const onclose = mockWebSocket.addEventListener.mock.calls.find(
        call => call[0] === 'close'
      )[1];
      onclose();
    });

    // Wait for reconnection attempt
    await waitFor(() => {
      expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });
  });
}); 