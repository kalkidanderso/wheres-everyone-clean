import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UiState {
  isLoading: boolean;
  error: string | null;
  showJoinModal: boolean;
  connectionStatus: ConnectionStatus;
  isMapReady: boolean;
  showUsersList: boolean;
  notifications: Array<{
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: number;
  }>;
}

const initialState: UiState = { 
  isLoading: false, 
  error: null, 
  showJoinModal: true,
  connectionStatus: 'disconnected',
  isMapReady: false,
  showUsersList: false,
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      if (action.payload) {
        // Auto-clear error after 5 seconds
        setTimeout(() => {
          state.error = null;
        }, 5000);
      }
    },

    setShowJoinModal: (state, action: PayloadAction<boolean>) => {
      state.showJoinModal = action.payload;
    },

    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    setMapReady: (state, action: PayloadAction<boolean>) => {
      state.isMapReady = action.payload;
    },

    setShowUsersList: (state, action: PayloadAction<boolean>) => {
      state.showUsersList = action.payload;
    },

    addNotification: (state, action: PayloadAction<{
      message: string;
      type: 'info' | 'success' | 'warning' | 'error';
    }>) => {
      const notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: action.payload.message,
        type: action.payload.type,
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
      
      // Keep only last 10 notifications
      if (state.notifications.length > 10) {
        state.notifications = state.notifications.slice(-10);
      }
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
    },

    // Reset UI state (useful when user leaves)
    resetUiState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.showJoinModal = true;
      state.connectionStatus = 'disconnected';
      state.showUsersList = false;
      state.notifications = [];
      // Keep isMapReady as it doesn't need to reset
    },
  },
});

export const { 
  setLoading, 
  setError, 
  setShowJoinModal,
  setConnectionStatus,
  setMapReady,
  setShowUsersList,
  addNotification,
  removeNotification,
  clearAllNotifications,
  resetUiState,
} = uiSlice.actions;

export default uiSlice.reducer;