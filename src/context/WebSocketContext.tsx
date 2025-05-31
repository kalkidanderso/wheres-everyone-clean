// src/context/WebSocketContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import Toast from '../components/Notifications/Toast';
import { EmojiType } from '../constants';

interface User {
  id: string;
  name: string;
  emoji: EmojiType;
  coordinate?: {
    latitude: number;
    longitude: number;
  };
  lastUpdated: number;
  joinedAt: number;
  isOnline: boolean;
}

interface WebSocketContextType {
  users: User[];
  currentUser: User | null;
  isConnected: boolean;
  connect: (name: string, emoji: EmojiType) => void;
  disconnect: () => void;
  updateUserLocation: (latitude: number, longitude: number) => void;
  updateUserEmoji: (emoji: EmojiType) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

const WS_RECONNECT_DELAY = 3000; // 3 seconds
const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds - increased for stability
const WS_SERVER_URL = process.env.REACT_APP_WS_URL || 'ws://192.168.30.247:8084';

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState({ message: '', type: 'info' });
  
  // Use refs to avoid circular dependencies
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const usersMap = useRef<Map<string, User>>(new Map());
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const isConnecting = useRef(false);
  const currentUserRef = useRef<User | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Update refs when state changes
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    wsRef.current = ws;
  }, [ws]);

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning') => {
    setToastMessage({ message, type });
    setShowToast(true);
  }, []);

  const updateUsersList = useCallback(() => {
    setUsers(Array.from(usersMap.current.values()));
  }, []);

  // Fixed sendHeartbeat without circular dependency
  const sendHeartbeat = useCallback(() => {
    const currentWs = wsRef.current;
    const user = currentUserRef.current;
    
    if (currentWs && user && currentWs.readyState === WebSocket.OPEN) {
      try {
        console.log('Sending heartbeat for user:', user.id);
        currentWs.send(JSON.stringify({
          type: 'heartbeat',
          user: { id: user.id },
        }));
      } catch (error) {
        console.error('Error sending heartbeat:', error);
      }
    }
  }, []);

  const connect = useCallback((name: string, emoji: EmojiType) => {
    if (isConnecting.current) {
      console.log('Already connecting, skipping...');
      return;
    }

    console.log('Starting connection process...');

    try {
      isConnecting.current = true;

      // Clear any existing connection
      if (wsRef.current) {
        console.log('Closing existing connection');
        wsRef.current.close();
        setWs(null);
        wsRef.current = null;
      }

      // Clear any existing intervals/timeouts
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = undefined;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = undefined;
      }

      console.log('Creating new WebSocket connection to:', WS_SERVER_URL);
      const newWs = new WebSocket(WS_SERVER_URL);
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const user: User = {
        id: userId,
        name,
        emoji,
        joinedAt: Date.now(),
        lastUpdated: Date.now(),
        isOnline: true,
      };

      console.log('Created user:', user);

      newWs.onopen = () => {
        console.log('WebSocket connection opened successfully');
        setIsConnected(true);
        setCurrentUser(user);
        currentUserRef.current = user;
        
        // Wait a bit before sending join message to ensure connection is stable
        setTimeout(() => {
          if (newWs.readyState === WebSocket.OPEN) {
            console.log('Sending join message');
            newWs.send(JSON.stringify({
              type: 'join',
              user,
            }));
            showNotification('Connected successfully', 'success');

            // Start heartbeat after successful join
            setTimeout(() => {
              if (heartbeatInterval.current) {
                clearInterval(heartbeatInterval.current);
              }
              heartbeatInterval.current = setInterval(sendHeartbeat, WS_HEARTBEAT_INTERVAL);
              console.log('Started heartbeat interval');
            }, 1000);
          }
        }, 100);
        
        isConnecting.current = false;
      };

      newWs.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { type, user: remoteUser, users: remoteUsers } = message;
          console.log('Received message:', type);

          switch (type) {
            case 'existing_users':
              if (Array.isArray(remoteUsers)) {
                console.log('Received existing users:', remoteUsers.length);
                usersMap.current.clear();
                remoteUsers.forEach(user => {
                  usersMap.current.set(user.id, user);
                });
                updateUsersList();
              }
              break;

            case 'join':
              if (remoteUser.id !== user.id) {
                console.log('User joined:', remoteUser.name);
                usersMap.current.set(remoteUser.id, remoteUser);
                updateUsersList();
                showNotification(`${remoteUser.name} joined the room`, 'info');
              }
              break;

            case 'leave':
              if (usersMap.current.has(remoteUser.id)) {
                console.log('User left:', remoteUser.name);
                usersMap.current.delete(remoteUser.id);
                updateUsersList();
                showNotification(`${remoteUser.name} left the room`, 'info');
              }
              break;

            case 'update':
              if (usersMap.current.has(remoteUser.id)) {
                usersMap.current.set(remoteUser.id, {
                  ...usersMap.current.get(remoteUser.id)!,
                  ...remoteUser,
                });
                updateUsersList();
              }
              break;

            case 'emoji':
              if (usersMap.current.has(remoteUser.id)) {
                const existingUser = usersMap.current.get(remoteUser.id)!;
                usersMap.current.set(remoteUser.id, {
                  ...existingUser,
                  emoji: remoteUser.emoji,
                });
                updateUsersList();
                
                if (remoteUser.id === currentUserRef.current?.id) {
                  setCurrentUser(prev => prev ? { ...prev, emoji: remoteUser.emoji } : null);
                  currentUserRef.current = { ...currentUserRef.current!, emoji: remoteUser.emoji };
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      };

      newWs.onerror = (error) => {
        console.error('WebSocket error:', error);
        showNotification('Connection error occurred', 'warning');
        isConnecting.current = false;
      };

      newWs.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
        setIsConnected(false);
        
        // Clear heartbeat interval
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = undefined;
        }

        // Clear users map
        usersMap.current.clear();
        updateUsersList();

        // Only show notification and attempt reconnect if we had a successful connection
        if (currentUserRef.current && !isConnecting.current) {
          showNotification('Disconnected from server', 'warning');
          
          // Attempt to reconnect
          console.log('Scheduling reconnection in', WS_RECONNECT_DELAY, 'ms');
          reconnectTimeout.current = setTimeout(() => {
            const user = currentUserRef.current;
            if (user) {
              console.log('Attempting to reconnect...');
              connect(user.name, user.emoji);
            }
          }, WS_RECONNECT_DELAY);
        }
        
        isConnecting.current = false;
      };

      setWs(newWs);
      wsRef.current = newWs;

    } catch (error) {
      console.error('Connection error:', error);
      showNotification('Failed to connect to server', 'warning');
      isConnecting.current = false;
    }
  }, [showNotification, updateUsersList, sendHeartbeat]);

  const disconnect = useCallback(() => {
    console.log('Disconnecting...');
    
    const currentWs = wsRef.current;
    const user = currentUserRef.current;
    
    if (currentWs && user) {
      try {
        if (currentWs.readyState === WebSocket.OPEN) {
          currentWs.send(JSON.stringify({
            type: 'leave',
            user,
          }));
        }
      } catch (error) {
        console.error('Error sending leave message:', error);
      }
      
      currentWs.close();
    }
    
    setWs(null);
    wsRef.current = null;
    setCurrentUser(null);
    currentUserRef.current = null;
    usersMap.current.clear();
    updateUsersList();
    setIsConnected(false);

    // Clear intervals and timeouts
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = undefined;
    }
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = undefined;
    }
  }, [updateUsersList]);

  const updateUserLocation = useCallback((latitude: number, longitude: number) => {
    const currentWs = wsRef.current;
    const user = currentUserRef.current;
    
    if (currentWs && user && currentWs.readyState === WebSocket.OPEN) {
      const updatedUser = {
        ...user,
        coordinate: { latitude, longitude },
      };
      try {
        currentWs.send(JSON.stringify({
          type: 'update',
          user: updatedUser,
        }));
      } catch (error) {
        console.error('Error updating location:', error);
      }
    }
  }, []);

  const updateUserEmoji = useCallback((emoji: EmojiType) => {
    const currentWs = wsRef.current;
    const user = currentUserRef.current;
    
    if (currentWs && user && currentWs.readyState === WebSocket.OPEN) {
      const updatedUser = {
        ...user,
        emoji,
      };
      try {
        currentWs.send(JSON.stringify({
          type: 'emoji',
          user: updatedUser,
        }));
      } catch (error) {
        console.error('Error updating emoji:', error);
      }
    }
  }, []);

  // Simplified AppState handling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('AppState changed to:', nextAppState);
      
      if (nextAppState === 'background') {
        // Don't disconnect on background, just pause heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = undefined;
        }
      } else if (nextAppState === 'active') {
        // Resume heartbeat if connected
        const user = currentUserRef.current;
        const currentWs = wsRef.current;
        
        if (user && currentWs && currentWs.readyState === WebSocket.OPEN) {
          if (heartbeatInterval.current) {
            clearInterval(heartbeatInterval.current);
          }
          heartbeatInterval.current = setInterval(sendHeartbeat, WS_HEARTBEAT_INTERVAL);
        } else if (user && !isConnecting.current) {
          // Reconnect if we have a user but no connection
          console.log('Reconnecting on app active...');
          connect(user.name, user.emoji);
        }
      }
    });

    return () => {
      subscription.remove();
      
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect, sendHeartbeat]);

  return (
    <WebSocketContext.Provider
      value={{
        users,
        currentUser,
        isConnected,
        connect,
        disconnect,
        updateUserLocation,
        updateUserEmoji,
      }}
    >
      {children}
      <Toast
        visible={showToast}
        message={toastMessage.message}
        type={toastMessage.type as any}
        onHide={() => setShowToast(false)}
      />
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};