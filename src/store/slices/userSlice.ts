import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: string;
  name: string;
  avatar: string;
  latitude: number;
  longitude: number;
  lastUpdated: number;
  isOnline: boolean;
}

interface UserState {
  currentUser: User | null;
  isJoined: boolean;
}

const initialState: UserState = { currentUser: null, isJoined: false };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    joinRoom: (state, action: PayloadAction<{ name: string; avatar: string }>) => {
      state.currentUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: action.payload.name,
        avatar: action.payload.avatar,
        latitude: 0,
        longitude: 0,
        lastUpdated: Date.now(),
        isOnline: true,
      };
      state.isJoined = true;
    },
    leaveRoom: (state) => {
      state.currentUser = null;
      state.isJoined = false;
    },
    updateCurrentUserLocation: (state, action: PayloadAction<{ latitude: number; longitude: number }>) => {
      if (state.currentUser) {
        state.currentUser.latitude = action.payload.latitude;
        state.currentUser.longitude = action.payload.longitude;
        state.currentUser.lastUpdated = Date.now();
      }
    },
  },
});

export const { joinRoom, leaveRoom, updateCurrentUserLocation } = userSlice.actions;
export default userSlice.reducer;