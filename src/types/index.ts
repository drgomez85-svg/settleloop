export type SplitType = 'EQUAL' | 'AMOUNT' | 'PERCENT';

export type MissionStatus = 'active' | 'settled';

export type SettlementStatus = 'pending' | 'completed' | 'reversed';

export interface Member {
  id: string;
  name: string;
  balance: number; // positive = gets money, negative = owes money
}

export interface ExpenseSplit {
  memberId: string;
  amount: number; // for EQUAL and AMOUNT
  percent?: number; // for PERCENT
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // CAD
  paidBy: string; // memberId
  splitType: SplitType;
  splits: ExpenseSplit[];
  createdAt: string;
  importedFrom?: string; // transactionId if imported from AutoSplit
  autoSplitRuleId?: string; // ruleId that created this expense
}

export interface Settlement {
  id: string;
  from: string; // memberId
  to: string; // memberId
  amount: number;
  status: SettlementStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Mission {
  id: string;
  title: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  status: MissionStatus;
  settledAt?: string;
}

export interface SettlementSummary {
  totalSending: number;
  totalReceiving: number;
  net: number;
  transfers: Array<{
    from: string;
    to: string;
    amount: number;
  }>;
}

export interface Bank {
  id: string;
  name: string;
  code: string;
}

// AutoSplit Rules Types
export type RecurrenceType = 'monthly' | 'weekly' | 'biweekly' | 'custom';
export type DetectionMethod = 'merchant' | 'contains' | 'exactAmount' | 'amountRange' | 'category';
export type RuleStatus = 'active' | 'paused';

export interface BillPack {
  id: string;
  missionId: string; // Which shared ledger this pack belongs to
  name: string; // e.g., "Subscriptions & Utilities"
  description?: string;
  
  // Monthly automation settings
  autoSendMonthlyRequest: boolean; // Send one consolidated request per month
  requestDayOfMonth: number; // Day to send request (e.g., 1st)
  safetyLimit?: number; // Require review if total exceeds this amount
  mode: 'request-only' | 'send-request' | 'send-only';
  
  // Status
  status: RuleStatus;
  createdAt: string;
  lastRequestSentAt?: string; // Last time monthly request was sent
  lastRequestPeriod?: string; // e.g., "Feb 2026"
}

export interface AutoSplitRule {
  id: string;
  missionId: string; // Which shared ledger this rule belongs to
  billPackId?: string; // Optional: group rules into a bill pack
  name: string; // User-friendly name (e.g., "Netflix Subscription")
  
  // Transaction source
  accountId: string; // Which account to watch (credit card, chequing, savings)
  
  // Detection criteria
  detectionMethod: DetectionMethod;
  merchantMatch?: string; // Exact merchant name (case-insensitive)
  containsText?: string; // Text that must be in description
  exactAmount?: number; // Exact amount to match
  amountMin?: number; // Minimum amount for range
  amountMax?: number; // Maximum amount for range
  category?: string; // Transaction category
  
  // Split configuration
  paidBy: string; // memberId - who paid (usually the logged-in user)
  participants: string[]; // memberIds - who to split with
  splitType: SplitType;
  splitConfig: {
    // For EQUAL: no config needed
    // For PERCENT: array of percentages matching participants order
    // For AMOUNT: array of amounts matching participants order
    values?: number[];
  };
  
  // Recurrence
  recurrence?: RecurrenceType;
  expectedDayOfMonth?: number; // 1-31, for monthly
  expectedDayRange?: { start: number; end: number }; // e.g., 1-5 for "around the 1st"
  
  // Behavior
  actions: {
    autoCreateExpense: boolean; // Auto-create expense when matched
    autoSendRequests: boolean; // Auto-send requests to other participants
  };
  includeInMonthlyRequest: boolean; // Include in monthly consolidated request (if part of pack)
  
  // Status
  status: RuleStatus;
  createdAt: string;
  lastMatchedAt?: string; // Last time a transaction matched
  lastMatchedTransactionId?: string; // Last matched transaction
  matchCount: number; // How many times this rule has matched
  
  // Next expected match (calculated)
  nextExpectedMatch?: string; // ISO date string
}
