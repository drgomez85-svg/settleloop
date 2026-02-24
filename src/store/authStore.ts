import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  userName: string;
  cardNumber: string;
  login: (cardNumber: string, password: string, userName: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userName: '',
      cardNumber: '',
      login: (cardNumber: string, password: string, userName: string) => {
        // In demo mode, any card number and password works
        set({
          isAuthenticated: true,
          userName: userName.trim(),
          cardNumber: cardNumber.trim(),
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          userName: '',
          cardNumber: '',
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
