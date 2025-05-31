// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import locationReducer from './slices/locationSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    location: locationReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['location/updateUserLocation'],
        ignoredPaths: ['location.users'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
// ⬆️ STOP HERE - DELETE EVERYTHING ELSE ⬆️