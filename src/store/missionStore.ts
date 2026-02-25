import { create } from 'zustand';
import { Mission, Member, Expense, Settlement } from '../types';
import { calculateBalances } from '../utils/balanceEngine';
import { useNotificationStore } from './notificationStore';

// Simple ID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface MissionStore {
  missions: Mission[];
  currentMissionId: string | null;
  demoMode: boolean;
  
  // Mission management
  createMission: (title: string) => string;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  setCurrentMission: (id: string | null) => void;
  
  // Member management
  addMember: (missionId: string, name: string, email: string) => void;
  updateMember: (missionId: string, memberId: string, updates: Partial<Member>) => void;
  sendReminder: (missionId: string, memberId: string) => void;
  removeMember: (missionId: string, memberId: string) => void;
  
  // Expense management
  addExpense: (missionId: string, expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (missionId: string, expenseId: string, updates: Partial<Expense>) => void;
  removeExpense: (missionId: string, expenseId: string) => void;
  
  // Settlement management
  addSettlement: (missionId: string, settlement: Omit<Settlement, 'id' | 'createdAt'>) => void;
  updateSettlement: (missionId: string, settlementId: string, updates: Partial<Settlement>) => void;
  markSettlementComplete: (missionId: string, settlementId: string) => void;
  reverseSettlement: (missionId: string, settlementId: string) => void;
  
  // Mission status
  markSettled: (missionId: string) => void;
  reopenMission: (missionId: string) => void;
  
  // Demo mode
  setDemoMode: (enabled: boolean) => void;
  
  // Getters
  getCurrentMission: () => Mission | null;
  getMission: (id: string) => Mission | undefined;
  getMissionByShareToken: (shareToken: string) => Mission | undefined;
  generateShareToken: (missionId: string) => string;
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  missions: [],
  currentMissionId: null,
  demoMode: false,

  createMission: (title) => {
    const id = generateId();
    const shareToken = `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
    const newMission: Mission = {
      id,
      title,
      members: [],
      expenses: [],
      settlements: [],
      status: 'active',
      shareToken,
    };
    set((state) => ({
      missions: [...state.missions, newMission],
      currentMissionId: id,
    }));
    return id;
  },

  updateMission: (id, updates) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },

  deleteMission: (id) => {
    set((state) => ({
      missions: state.missions.filter((m) => m.id !== id),
      currentMissionId: state.currentMissionId === id ? null : state.currentMissionId,
    }));
  },

  setCurrentMission: (id) => {
    set({ currentMissionId: id });
  },

  addMember: (missionId, name, email) => {
    const newMember: Member = {
      id: generateId(),
      name,
      balance: 0,
      email: email,
    };
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? { ...m, members: [...m.members, newMember] }
          : m
      ),
    }));
    // Recalculate balances
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  updateMember: (missionId, memberId, updates) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? {
              ...m,
              members: m.members.map((mem) =>
                mem.id === memberId ? { ...mem, ...updates } : mem
              ),
            }
          : m
      ),
    }));
  },

  removeMember: (missionId, memberId) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? {
              ...m,
              members: m.members.filter((mem) => mem.id !== memberId),
              expenses: m.expenses.map((exp) => ({
                ...exp,
                splits: exp.splits.filter((s) => s.memberId !== memberId),
              })),
            }
          : m
      ),
    }));
    // Recalculate balances
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  addExpense: (missionId, expense) => {
    const newExpense: Expense = {
      ...expense,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? { ...m, expenses: [...m.expenses, newExpense] }
          : m
      ),
    }));
    // Recalculate balances
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  updateExpense: (missionId, expenseId, updates) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? {
              ...m,
              expenses: m.expenses.map((exp) =>
                exp.id === expenseId ? { ...exp, ...updates } : exp
              ),
            }
          : m
      ),
    }));
    // Recalculate balances
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  removeExpense: (missionId, expenseId) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? { ...m, expenses: m.expenses.filter((exp) => exp.id !== expenseId) }
          : m
      ),
    }));
    // Recalculate balances
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  addSettlement: (missionId, settlement) => {
    const newSettlement: Settlement = {
      ...settlement,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? { ...m, settlements: [...m.settlements, newSettlement] }
          : m
      ),
    }));
  },

  updateSettlement: (missionId, settlementId, updates) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId
          ? {
              ...m,
              settlements: m.settlements.map((s) =>
                s.id === settlementId ? { ...s, ...updates } : s
              ),
            }
          : m
      ),
    }));
  },

  markSettlementComplete: (missionId, settlementId) => {
    get().updateSettlement(missionId, settlementId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  },

  reverseSettlement: (missionId, settlementId) => {
    get().updateSettlement(missionId, settlementId, {
      status: 'reversed',
    });
    // Recalculate balances after reversal
    const mission = get().getMission(missionId);
    if (mission) {
      const updatedMembers = calculateBalances(mission);
      get().updateMission(missionId, { members: updatedMembers });
    }
  },

  markSettled: (missionId) => {
    const mission = get().getMission(missionId);
    if (!mission) return;
    
    // Zero out balances and lock ledger
    const zeroedMembers = mission.members.map((m) => ({ ...m, balance: 0 }));
    get().updateMission(missionId, {
      status: 'settled',
      settledAt: new Date().toISOString(),
      members: zeroedMembers,
    });
    
    // Add notification for settlement completion
    import('./notificationStore').then(({ useNotificationStore }) => {
      const mission = get().getMission(missionId);
      if (mission) {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Settlement Complete',
          message: `All payments for "${mission.title}" have been settled successfully.`,
        });
      }
    });
  },

  reopenMission: (missionId) => {
    const mission = get().getMission(missionId);
    if (!mission) return;
    
    // Restore balances by recalculating from expenses
    const restoredMembers = calculateBalances(mission);
    get().updateMission(missionId, {
      status: 'active',
      settledAt: undefined,
      members: restoredMembers,
    });
  },

  setDemoMode: (enabled) => {
    set({ demoMode: enabled });
  },

  getCurrentMission: () => {
    const state = get();
    if (!state.currentMissionId) return null;
    return state.missions.find((m) => m.id === state.currentMissionId) || null;
  },

  getMission: (id) => {
    return get().missions.find((m) => m.id === id);
  },

  getMissionByShareToken: (shareToken) => {
    return get().missions.find((m) => m.shareToken === shareToken);
  },

  sendReminder: (missionId, memberId) => {
    const mission = get().getMission(missionId);
    if (!mission) return;
    
    const member = mission.members.find(m => m.id === memberId);
    if (!member || !member.email) return;
    
    // Update last reminder sent timestamp
    get().updateMember(missionId, memberId, {
      lastReminderSent: new Date().toISOString(),
    });
    
    // In a real app, this would send an email via backend from the bank
    // For demo, we'll open the user's email client as if the bank is sending the reminder
    const subject = encodeURIComponent(`Reminder: Settlement for ${mission.title}`);
    const body = encodeURIComponent(
      `Hi ${member.name},\n\n` +
      `This is a gentle reminder that you have an outstanding balance in the shared group "${mission.title}".\n\n` +
      `Balance: ${member.balance > 0 ? `You are owed $${member.balance.toFixed(2)}` : `You owe $${Math.abs(member.balance).toFixed(2)}`}\n\n` +
      `Please settle up when convenient.\n\n` +
      `Thank you!`
    );
    if (typeof window !== 'undefined') {
      window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
      
      // Let the current user know a reminder was sent (bank-style)
      try {
        useNotificationStore.getState().addNotification({
          type: 'info',
          title: 'Settlement Reminder Sent',
          message: `We just reminded ${member.name} about this settlement in "${mission.title}". The reminder is sent from the bank, not your personal email.`,
        });
      } catch {
        // Fallback if notifications are unavailable
        alert(`We just reminded ${member.name} about this settlement.`);
      }
    }
  },

  generateShareToken: (missionId) => {
    const shareToken = `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
    get().updateMission(missionId, { shareToken });
    return shareToken;
  },
}));
