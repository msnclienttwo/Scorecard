'use client';

import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  activeModal: string | null;
  searchOpen: boolean;
  notificationsOpen: boolean;
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  toggleSearch: () => void;
  toggleNotifications: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  activeModal: null,
  searchOpen: false,
  notificationsOpen: false,
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen, notificationsOpen: false })),
  toggleNotifications: () =>
    set((state) => ({ notificationsOpen: !state.notificationsOpen, searchOpen: false })),

  addToast: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    if (toast.duration !== 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, toast.duration || 4000);
    }
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
