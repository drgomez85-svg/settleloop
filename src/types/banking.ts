export type AccountType = 'chequing' | 'savings' | 'joint' | 'credit' | 'lineOfCredit';

export type TransactionType = 'transfer' | 'bill' | 'deposit' | 'withdrawal' | 'request' | 'payment' | 'charge' | 'creditPayment';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Account {
  id: string;
  type: AccountType;
  name: string;
  accountNumber: string; // Last 4 digits
  balance: number; // For credit accounts: positive = debt owed, negative = credit available
  currency: string;
  creditLimit?: number; // For credit accounts
  availableCredit?: number; // For credit accounts
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category?: string;
  date: string;
  status: TransactionStatus;
  recipient?: string;
  sender?: string;
  biller?: string;
  reference?: string;
}

export interface Biller {
  id: string;
  name: string;
  category: string;
  accountNumber?: string;
  icon: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}
