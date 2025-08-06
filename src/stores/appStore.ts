import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface Modal {
  id: string;
  type: 'confirmation' | 'form' | 'info';
  title: string;
  content?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppState {
  // Loading states
  isLoading: boolean;
  loadingMessage?: string;
  
  // Navigation
  currentPage: string;
  previousPage?: string;
  
  // Notifications
  notifications: Notification[];
  
  // Modals
  modals: Modal[];
  
  // Actions
  setLoading: (loading: boolean, message?: string) => void;
  setCurrentPage: (page: string) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modal: Omit<Modal, 'id'>) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isLoading: false,
  loadingMessage: undefined,
  currentPage: 'dashboard',
  previousPage: undefined,
  notifications: [],
  modals: [],
  
  setLoading: (loading, message) => 
    set({ isLoading: loading, loadingMessage: message }),
  
  setCurrentPage: (page) => 
    set((state) => ({ 
      currentPage: page, 
      previousPage: state.currentPage 
    })),
  
  addNotification: (notification) => {
    const id = Math.random().toString(36).slice(2);
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));
    
    // Auto-remove notification after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },
  
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
  
  clearNotifications: () =>
    set({ notifications: [] }),
  
  openModal: (modal) => {
    const id = Math.random().toString(36).slice(2);
    const newModal = { ...modal, id };
    
    set((state) => ({
      modals: [...state.modals, newModal]
    }));
  },
  
  closeModal: (id) =>
    set((state) => ({
      modals: state.modals.filter(m => m.id !== id)
    })),
  
  closeAllModals: () =>
    set({ modals: [] }),
}));