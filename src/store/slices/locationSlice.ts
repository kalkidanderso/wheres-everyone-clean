import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from './userSlice';

interface LocationState {
  users: { [userId: string]: User };
  selectedUserId: string | null;
  lastUpdateTime: number;
}

const initialState: LocationState = { 
  users: {}, 
  selectedUserId: null,
  lastUpdateTime: Date.now(),
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    addUser: (state, action: PayloadAction<User>) => {
      state.users[action.payload.id] = action.payload;
      state.lastUpdateTime = Date.now();
    },

    removeUser: (state, action: PayloadAction<string>) => {
      delete state.users[action.payload];
      if (state.selectedUserId === action.payload) {
        state.selectedUserId = null;
      }
      state.lastUpdateTime = Date.now();
    },

    updateUserLocation: (state, action: PayloadAction<{ 
      userId: string; 
      latitude: number; 
      longitude: number; 
      lastUpdated?: number;
      isOnline?: boolean;
    }>) => {
      const user = state.users[action.payload.userId];
      if (user) {
        user.latitude = action.payload.latitude;
        user.longitude = action.payload.longitude;
        user.lastUpdated = action.payload.lastUpdated || Date.now();
        user.isOnline = action.payload.isOnline !== undefined ? action.payload.isOnline : true;
        state.lastUpdateTime = Date.now();
      }
    },

    updateUserStatus: (state, action: PayloadAction<{
      userId: string;
      isOnline: boolean;
    }>) => {
      const user = state.users[action.payload.userId];
      if (user) {
        user.isOnline = action.payload.isOnline;
        if (!action.payload.isOnline) {
          user.lastUpdated = Date.now();
        }
        state.lastUpdateTime = Date.now();
      }
    },

    selectUser: (state, action: PayloadAction<string | null>) => {
      state.selectedUserId = action.payload;
    },

    clearAllUsers: (state) => {
      state.users = {};
      state.selectedUserId = null;
      state.lastUpdateTime = Date.now();
    },

    // Bulk update users (useful for initial sync)
    setUsers: (state, action: PayloadAction<{ [userId: string]: User }>) => {
      state.users = action.payload;
      state.lastUpdateTime = Date.now();
    },

    // Mark users as offline if they haven't updated recently
    markStaleUsersOffline: (state, action: PayloadAction<{ staleThreshold: number }>) => {
      const now = Date.now();
      const threshold = action.payload.staleThreshold;
      
      Object.values(state.users).forEach(user => {
        if (now - user.lastUpdated > threshold) {
          user.isOnline = false;
        }
      });
      state.lastUpdateTime = now;
    },
  },
});

export const { 
  addUser, 
  removeUser, 
  updateUserLocation, 
  updateUserStatus,
  selectUser, 
  clearAllUsers,
  setUsers,
  markStaleUsersOffline,
} = locationSlice.actions;

export default locationSlice.reducer;