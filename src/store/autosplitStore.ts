import { create } from 'zustand';
import { AutoSplitRule, BillPack, RuleStatus, DetectionMethod, SplitType } from '../types';
import { Transaction } from '../types/banking';
import { useMissionStore } from './missionStore';
import { useBankingStore } from './bankingStore';
import { useAuthStore } from './authStore';

// Simple ID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface AutoSplitStore {
  rules: AutoSplitRule[];
  billPacks: BillPack[];
  
  // Rule management
  createRule: (rule: Omit<AutoSplitRule, 'id' | 'createdAt' | 'matchCount'>) => string;
  createRulesBulk: (rules: Array<Omit<AutoSplitRule, 'id' | 'createdAt' | 'matchCount'>>) => string[]; // Bulk create
  updateRule: (ruleId: string, updates: Partial<AutoSplitRule>) => void;
  deleteRule: (ruleId: string) => void;
  toggleRuleStatus: (ruleId: string) => void;
  
  // Bill Pack management
  createBillPack: (pack: Omit<BillPack, 'id' | 'createdAt'>) => string;
  updateBillPack: (packId: string, updates: Partial<BillPack>) => void;
  deleteBillPack: (packId: string) => void;
  getBillPack: (packId: string) => BillPack | undefined;
  getBillPacksForMission: (missionId: string) => BillPack[];
  
  // Getters
  getRulesForMission: (missionId: string) => AutoSplitRule[];
  getRulesForBillPack: (packId: string) => AutoSplitRule[];
  getRule: (ruleId: string) => AutoSplitRule | undefined;
  deleteRulesForMission: (missionId: string) => void; // Delete all rules for a mission
  
  // Transaction matching
  checkTransactions: () => void; // Check all transactions against active rules
  matchTransaction: (transaction: Transaction) => AutoSplitRule | null; // Find matching rule for a transaction
  
  // Auto-create expense from matched transaction
  createExpenseFromMatch: (rule: AutoSplitRule, transaction: Transaction) => void;
  
  // Monthly automation
  processMonthlyRequests: (missionId: string) => void; // Process monthly requests for a mission
  calculateMonthlyTotal: (packId: string, period: string) => { total: number; byMember: Record<string, number> }; // Calculate totals for a period
}

export const useAutoSplitStore = create<AutoSplitStore>((set, get) => ({
  rules: [],
  billPacks: [],

  createRule: (ruleData) => {
    const id = generateId();
    const newRule: AutoSplitRule = {
      ...ruleData,
      id,
      createdAt: new Date().toISOString(),
      matchCount: 0,
      status: ruleData.status || 'active',
      includeInMonthlyRequest: ruleData.includeInMonthlyRequest !== undefined ? ruleData.includeInMonthlyRequest : true,
    };
    set((state) => ({
      rules: [...state.rules, newRule],
    }));
    return id;
  },

  createRulesBulk: (rulesData) => {
    const ids: string[] = [];
    const newRules: AutoSplitRule[] = rulesData.map((ruleData) => {
      const id = generateId();
      ids.push(id);
      return {
        ...ruleData,
        id,
        createdAt: new Date().toISOString(),
        matchCount: 0,
        status: ruleData.status || 'active',
        includeInMonthlyRequest: ruleData.includeInMonthlyRequest !== undefined ? ruleData.includeInMonthlyRequest : true,
        actions: ruleData.actions || {
          autoCreateExpense: true,
          autoSendRequests: false,
        },
      };
    });
    set((state) => ({
      rules: [...state.rules, ...newRules],
    }));
    return ids;
  },

  updateRule: (ruleId, updates) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    }));
  },

  deleteRule: (ruleId) => {
    set((state) => ({
      rules: state.rules.filter((r) => r.id !== ruleId),
    }));
  },

  toggleRuleStatus: (ruleId) => {
    set((state) => ({
      rules: state.rules.map((r) =>
        r.id === ruleId
          ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
          : r
      ),
    }));
  },

  getRulesForMission: (missionId) => {
    return get().rules.filter((r) => r.missionId === missionId);
  },

  deleteRulesForMission: (missionId) => {
    set((state) => ({
      rules: state.rules.filter((r) => r.missionId !== missionId),
      billPacks: state.billPacks.filter((p) => p.missionId !== missionId),
    }));
  },

  // Bill Pack management
  createBillPack: (packData) => {
    const id = generateId();
    const newPack: BillPack = {
      ...packData,
      id,
      createdAt: new Date().toISOString(),
      status: packData.status || 'active',
    };
    set((state) => ({
      billPacks: [...state.billPacks, newPack],
    }));
    return id;
  },

  updateBillPack: (packId, updates) => {
    set((state) => ({
      billPacks: state.billPacks.map((p) =>
        p.id === packId ? { ...p, ...updates } : p
      ),
    }));
  },

  deleteBillPack: (packId) => {
    // Also remove billPackId from all rules in this pack
    set((state) => ({
      billPacks: state.billPacks.filter((p) => p.id !== packId),
      rules: state.rules.map((r) =>
        r.billPackId === packId ? { ...r, billPackId: undefined } : r
      ),
    }));
  },

  getBillPack: (packId) => {
    return get().billPacks.find((p) => p.id === packId);
  },

  getBillPacksForMission: (missionId) => {
    return get().billPacks.filter((p) => p.missionId === missionId);
  },

  getRulesForBillPack: (packId) => {
    return get().rules.filter((r) => r.billPackId === packId);
  },

  getRule: (ruleId) => {
    return get().rules.find((r) => r.id === ruleId);
  },

  matchTransaction: (transaction) => {
    const activeRules = get().rules.filter((r) => r.status === 'active');
    
    for (const rule of activeRules) {
      // Check if transaction is from the watched account
      if (transaction.accountId !== rule.accountId) continue;
      
      // Check detection method
      let matches = false;
      
      switch (rule.detectionMethod) {
        case 'merchant':
          if (rule.merchantMatch) {
            matches = transaction.description.toLowerCase().includes(
              rule.merchantMatch.toLowerCase()
            );
          }
          break;
          
        case 'contains':
          if (rule.containsText) {
            matches = transaction.description.toLowerCase().includes(
              rule.containsText.toLowerCase()
            );
          }
          break;
          
        case 'exactAmount':
          if (rule.exactAmount !== undefined) {
            matches = Math.abs(Math.abs(transaction.amount) - rule.exactAmount) < 0.01;
          }
          break;
          
        case 'amountRange':
          if (rule.amountMin !== undefined && rule.amountMax !== undefined) {
            const absAmount = Math.abs(transaction.amount);
            matches = absAmount >= rule.amountMin && absAmount <= rule.amountMax;
          }
          break;
          
        case 'category':
          if (rule.category && transaction.category) {
            matches = transaction.category.toLowerCase() === rule.category.toLowerCase();
          }
          break;
      }
      
      if (matches) {
        // Check if this transaction was already matched by this rule
        if (rule.lastMatchedTransactionId === transaction.id) {
          continue; // Already processed
        }
        
        // For monthly recurring rules, check if we've already matched this month
        if (rule.recurrence === 'monthly' && rule.lastMatchedAt) {
          const lastMatchDate = new Date(rule.lastMatchedAt);
          const transactionDate = new Date(transaction.date);
          
          // Check if both dates are in the same month and year
          if (
            lastMatchDate.getFullYear() === transactionDate.getFullYear() &&
            lastMatchDate.getMonth() === transactionDate.getMonth()
          ) {
            continue; // Already matched this month
          }
        }
        
        return rule;
      }
    }
    
    return null;
  },

  checkTransactions: () => {
    const { getAllTransactions } = useBankingStore.getState();
    const transactions = getAllTransactions();
    
    // Check recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter((t) => {
      const txDate = new Date(t.date);
      return txDate >= thirtyDaysAgo && t.status === 'completed';
    });
    
    for (const transaction of recentTransactions) {
      const matchingRule = get().matchTransaction(transaction);
      if (matchingRule && matchingRule.actions.autoCreateExpense) {
        get().createExpenseFromMatch(matchingRule, transaction);
      }
    }
  },

  createExpenseFromMatch: (rule, transaction) => {
    const { addExpense } = useMissionStore.getState();
    const mission = useMissionStore.getState().getMission(rule.missionId);
    
    if (!mission) return;
    
    // Check if this transaction was already imported (duplicate detection)
    const existingExpense = mission.expenses.find(
      e => e.importedFrom === transaction.id || 
      (e.autoSplitRuleId === rule.id && e.importedFrom === transaction.id)
    );
    
    if (existingExpense) {
      console.log(`Transaction ${transaction.id} already imported as expense ${existingExpense.id}`);
      return; // Already imported, skip
    }
    
    // Get the total transaction amount (always use absolute value)
    const totalAmount = Math.abs(transaction.amount);
    
    // Calculate splits based on split type - divide the total amount according to the rule
    let splits: Array<{ memberId: string; amount: number; percent?: number }> = [];
    
    if (rule.splitType === 'EQUAL') {
      // Divide total amount equally among all participants
      const amountPerPerson = totalAmount / rule.participants.length;
      // Handle rounding to ensure total adds up correctly
      const roundedAmounts = rule.participants.map(() => 
        Math.floor(amountPerPerson * 100) / 100
      );
      const remainder = totalAmount - roundedAmounts.reduce((sum, amt) => sum + amt, 0);
      // Add remainder to first participant to account for rounding
      roundedAmounts[0] = Math.round((roundedAmounts[0] + remainder) * 100) / 100;
      
      splits = rule.participants.map((memberId, idx) => ({
        memberId,
        amount: roundedAmounts[idx],
      }));
    } else if (rule.splitType === 'PERCENT' && rule.splitConfig.values) {
      // Divide total amount by percentage
      splits = rule.participants.map((memberId, idx) => {
        const percent = rule.splitConfig.values![idx];
        const amount = (totalAmount * percent) / 100;
        return {
          memberId,
          amount: Math.round(amount * 100) / 100,
          percent,
        };
      });
      
      // Ensure total adds up correctly (handle rounding)
      const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
      const difference = totalAmount - totalSplit;
      if (Math.abs(difference) > 0.01) {
        // Adjust first split to account for rounding differences
        splits[0].amount = Math.round((splits[0].amount + difference) * 100) / 100;
      }
    } else if (rule.splitType === 'AMOUNT' && rule.splitConfig.values) {
      // Use fixed amounts from config
      splits = rule.participants.map((memberId, idx) => ({
        memberId,
        amount: rule.splitConfig.values![idx],
      }));
      
      // Validate that fixed amounts sum to total
      const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(totalSplit - totalAmount) > 0.01) {
        console.warn(`AutoSplit rule ${rule.id}: Fixed amounts (${totalSplit}) don't match transaction amount (${totalAmount})`);
      }
    }
    
    // Create the expense with the total transaction amount
    addExpense(rule.missionId, {
      title: rule.name || transaction.description,
      amount: totalAmount, // Total amount of the transaction
      paidBy: rule.paidBy,
      splitType: rule.splitType,
      splits, // Splits that divide the total amount
      importedFrom: transaction.id,
      autoSplitRuleId: rule.id,
    });
    
    // Update rule with match info
    get().updateRule(rule.id, {
      lastMatchedAt: new Date().toISOString(),
      lastMatchedTransactionId: transaction.id,
      matchCount: rule.matchCount + 1,
    });
    
    // Note: Monthly requests are handled separately via processMonthlyRequests
  },

  calculateMonthlyTotal: (packId, period) => {
    const pack = get().getBillPack(packId);
    if (!pack) return { total: 0, byMember: {} };

    const rules = get().getRulesForBillPack(packId).filter(r => r.status === 'active' && r.includeInMonthlyRequest);
    const mission = useMissionStore.getState().getMission(pack.missionId);
    if (!mission) return { total: 0, byMember: {} };

    // Get expenses created this period that match these rules
    const periodStart = new Date(period); // e.g., "2026-02-01"
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const periodExpenses = mission.expenses.filter(e => {
      if (!e.autoSplitRuleId) return false;
      const rule = rules.find(r => r.id === e.autoSplitRuleId);
      if (!rule) return false;
      const expenseDate = new Date(e.createdAt);
      return expenseDate >= periodStart && expenseDate < periodEnd;
    });

    const byMember: Record<string, number> = {};
    let total = 0;

    periodExpenses.forEach(expense => {
      total += expense.amount;
      expense.splits.forEach(split => {
        if (split.memberId !== expense.paidBy) {
          byMember[split.memberId] = (byMember[split.memberId] || 0) + split.amount;
        }
      });
    });

    return { total, byMember };
  },

  processMonthlyRequests: (missionId) => {
    const packs = get().getBillPacksForMission(missionId).filter(p => 
      p.status === 'active' && p.autoSendMonthlyRequest
    );

    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    packs.forEach(pack => {
      // Check if it's time to send (based on requestDayOfMonth)
      if (now.getDate() !== pack.requestDayOfMonth) {
        return; // Not the right day
      }

      // Check if we already sent this month
      if (pack.lastRequestPeriod === currentPeriod) {
        return; // Already sent this month
      }

      // Calculate totals
      const { total, byMember } = get().calculateMonthlyTotal(pack.id, currentPeriod);

      // Check safety limit
      if (pack.safetyLimit && total > pack.safetyLimit) {
        // Don't auto-send, but mark for review
        // In a real implementation, this would create a pending review item
        console.log(`Monthly request for pack ${pack.id} exceeds safety limit. Requires review.`);
        return;
      }

      // Send requests (in demo mode, just create notifications)
      const mission = useMissionStore.getState().getMission(missionId);
      if (!mission) return;

      Object.entries(byMember).forEach(([memberId, amount]) => {
        if (amount > 0.01) {
          const member = mission.members.find(m => m.id === memberId);
          if (member && pack.mode === 'request-only') {
            // Create request transaction
            const { requestMoney } = useBankingStore.getState();
            requestMoney('chequing-1', member.name, amount, `Monthly bills - ${pack.name}`);
            
            // Create notification
            import('./notificationStore').then(({ useNotificationStore }) => {
              useNotificationStore.getState().addNotification({
                type: 'info',
                title: 'Monthly Request Sent',
                message: `Requested $${amount.toFixed(2)} from ${member.name} for ${pack.name}`,
                amount: amount,
              });
            });
          }
        }
      });

      // Update pack with last sent info
      get().updateBillPack(pack.id, {
        lastRequestSentAt: new Date().toISOString(),
        lastRequestPeriod: currentPeriod,
      });
    });
  },
}));
