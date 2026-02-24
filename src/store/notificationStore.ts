import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'deposit' | 'payment' | 'info';
  title: string;
  message: string;
  amount?: number;
  senderName?: string;
  accountNumber?: string; // Last 4 digits
  timestamp: string;
  read: boolean;
}

interface NotificationStore {
  notifications: Notification[];
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  
  // Getters
  getUnreadCount: () => number;
  getRecentNotifications: (limit?: number) => Notification[];
}

// Simple ID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  addNotification: (notificationData) => {
    const newNotification: Notification = {
      ...notificationData,
      id: generateId(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications],
    }));
    
    // Auto-remove after 10 seconds (optional)
    setTimeout(() => {
      get().deleteNotification(newNotification.id);
    }, 10000);
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },

  deleteNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },

  getRecentNotifications: (limit = 10) => {
    return get().notifications.slice(0, limit);
  },
}));
