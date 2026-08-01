'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  matchSubscriptions: string[];

  connect: () => void;
  disconnect: () => void;
  subscribe: (matchId: string) => void;
  unsubscribe: (matchId: string) => void;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  matchSubscriptions: [],

  connect: () => {
    const existing = get().socket;
    // `active` is true while connected or attempting to connect, so repeated
    // calls (e.g. StrictMode double-mount in dev) never create a second socket.
    if (existing?.connected || existing?.active) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    const socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => set({ isConnected: true }));
    socket.on('disconnect', () => set({ isConnected: false }));

    socket.connect();
    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false, matchSubscriptions: [] });
    }
  },

  subscribe: (matchId) => {
    const { socket, matchSubscriptions } = get();
    if (!socket) return;

    if (!matchSubscriptions.includes(matchId)) {
      socket.emit('subscribe:match', matchId);
      set({ matchSubscriptions: [...matchSubscriptions, matchId] });
    }
  },

  unsubscribe: (matchId) => {
    const { socket, matchSubscriptions } = get();
    if (!socket) return;

    socket.emit('unsubscribe:match', matchId);
    set({
      matchSubscriptions: matchSubscriptions.filter((id) => id !== matchId),
    });
  },

  emit: (event, data) => {
    const { socket } = get();
    if (socket) {
      socket.emit(event, data);
    }
  },

  on: (event, callback) => {
    const { socket } = get();
    if (socket) {
      socket.on(event, callback);
    }
  },

  off: (event, callback) => {
    const { socket } = get();
    if (socket) {
      if (callback) {
        socket.off(event, callback);
      } else {
        socket.removeAllListeners(event);
      }
    }
  },
}));
