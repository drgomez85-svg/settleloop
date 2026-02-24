import { create } from 'zustand';
import { Mission, Member, Expense, Settlement } from '../types';
import { calculateBalances } from '../utils/balanceEngine';

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
  addMember: (missionId: string, name: string) => void;
  updateMember: (missionId: string, memberId: string, updates: Partial<Member>) => void;
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
}

export const useMissionStore = create<MissionStore>((set, get) => ({
  missions: [],
  currentMissionId: null,
  demoMode: false,

  createMission: (title) => {
    const id = generateId();
    const newMission: Mission = {
      id,
      title,
      members: [],
      expenses: [],
      settlements: [],
      status: 'active',
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

  addMember: (missionId, name) => {
    const newMember: Member = {
      id: generateId(),
      name,
      balance: 0,
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
}));
