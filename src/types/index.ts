import { EmojiType } from '../constants';

export interface User {
  id: string;
  name: string;
  emoji: EmojiType;
  joinedAt: number;
  lastUpdated: number;
  isOnline: boolean;
  latitude?: number;
  longitude?: number;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'info' | 'warning';
}