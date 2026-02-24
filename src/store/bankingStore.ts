import { create } from 'zustand';
import { Account, Transaction, Biller, Contact } from '../types/banking';

// Simple ID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface BankingStore {
  accounts: Account[];
  transactions: Transaction[];
  contacts: Contact[];
  billers: Biller[];
  
  // Account management
  getAccount: (id: string) => Account | undefined;
  updateAccountBalance: (id: string, amount: number) => void;
  
  // Transaction management
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  getAccountTransactions: (accountId: string) => Transaction[];
  getAllTransactions: () => Transaction[];
  
  // Contact management
  addContact: (contact: Omit<Contact, 'id'>) => void;
  getContact: (id: string) => Contact | undefined;
  
  // Transfer operations
  sendMoney: (fromAccountId: string, to: string, amount: number, description: string) => void;
  requestMoney: (fromAccountId: string, from: string, amount: number, description: string) => void;
  payBill: (fromAccountId: string, billerId: string, amount: number, accountNumber?: string) => void;
  
  // Credit account operations
  chargeCredit: (accountId: string, amount: number, description: string, category?: string) => void;
  payCreditAccount: (fromAccountId: string, toAccountId: string, amount: number) => void;
}

// Initial accounts
const initialAccounts: Account[] = [
  {
    id: 'chequing-1',
    type: 'chequing',
    name: 'Chequing',
    accountNumber: '4291',
    balance: 4832.56,
    currency: 'CAD',
  },
  {
    id: 'savings-1',
    type: 'savings',
    name: 'Savings',
    accountNumber: '7803',
    balance: 12450.00,
    currency: 'CAD',
  },
  {
    id: 'joint-1',
    type: 'joint',
    name: 'Joint Account',
    accountNumber: '6120',
    balance: 3215.75,
    currency: 'CAD',
  },
  {
    id: 'credit-1',
    type: 'credit',
    name: 'Visa Credit Card',
    accountNumber: '1234',
    balance: 1250.50, // Amount owed
    currency: 'CAD',
    creditLimit: 5000.00,
    availableCredit: 3749.50, // creditLimit - balance
  },
  {
    id: 'loc-1',
    type: 'lineOfCredit',
    name: 'Line of Credit',
    accountNumber: '5678',
    balance: 3500.00, // Amount owed
    currency: 'CAD',
    creditLimit: 10000.00,
    availableCredit: 6500.00, // creditLimit - balance
  },
];

// Initial transactions
const initialTransactions: Transaction[] = [
  {
    id: 't1',
    accountId: 'chequing-1',
    type: 'withdrawal',
    amount: -6.45,
    description: 'Tim Hortons',
    category: 'Food & Drink',
    date: new Date().toISOString(),
    status: 'completed',
  },
  {
    id: 't2',
    accountId: 'chequing-1',
    type: 'deposit',
    amount: 250.00,
    description: 'E-Transfer from Sarah',
    category: 'Transfer',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    sender: 'Sarah',
  },
  {
    id: 't3',
    accountId: 'chequing-1',
    type: 'withdrawal',
    amount: -87.32,
    description: 'Loblaws Grocery',
    category: 'Grocery',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't4',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -16.49,
    description: 'Netflix',
    category: 'Entertainment',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Netflix',
  },
  {
    id: 't5',
    accountId: 'chequing-1',
    type: 'deposit',
    amount: 2845.00,
    description: 'Payroll Deposit',
    category: 'Income',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't6',
    accountId: 'credit-1',
    type: 'charge',
    amount: 250.00,
    description: 'Amazon Purchase',
    category: 'Shopping',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't7',
    accountId: 'credit-1',
    type: 'charge',
    amount: 89.50,
    description: 'Restaurant',
    category: 'Food & Drink',
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't8',
    accountId: 'credit-1',
    type: 'creditPayment',
    amount: -500.00,
    description: 'Payment from Chequing',
    category: 'Payment',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't9',
    accountId: 'loc-1',
    type: 'charge',
    amount: 2000.00,
    description: 'Home Renovation',
    category: 'Home Improvement',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 't10',
    accountId: 'loc-1',
    type: 'creditPayment',
    amount: -500.00,
    description: 'Payment from Savings',
    category: 'Payment',
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  // Popular recurring transactions - Chequing
  {
    id: 't11',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -16.49,
    description: 'NETFLIX.COM',
    category: 'Entertainment',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Netflix',
  },
  {
    id: 't12',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -12.99,
    description: 'SPOTIFY',
    category: 'Entertainment',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Spotify',
  },
  {
    id: 't13',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -89.99,
    description: 'ROGERS WIRELESS',
    category: 'Utilities',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Rogers',
  },
  {
    id: 't14',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -125.50,
    description: 'TORONTO HYDRO',
    category: 'Utilities',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Toronto Hydro',
  },
  {
    id: 't15',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -45.00,
    description: 'ENBRIDGE GAS',
    category: 'Utilities',
    date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Enbridge',
  },
  {
    id: 't16',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -9.99,
    description: 'DISNEY PLUS',
    category: 'Entertainment',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Disney+',
  },
  {
    id: 't17',
    accountId: 'chequing-1',
    type: 'payment',
    amount: -1200.00,
    description: 'RENT PAYMENT',
    category: 'Housing',
    date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  // Popular recurring transactions - Credit Card
  {
    id: 't18',
    accountId: 'credit-1',
    type: 'charge',
    amount: 16.49,
    description: 'NETFLIX.COM',
    category: 'Entertainment',
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Netflix',
  },
  {
    id: 't19',
    accountId: 'credit-1',
    type: 'charge',
    amount: 12.99,
    description: 'SPOTIFY',
    category: 'Entertainment',
    date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Spotify',
  },
  {
    id: 't20',
    accountId: 'credit-1',
    type: 'charge',
    amount: 89.99,
    description: 'ROGERS WIRELESS',
    category: 'Utilities',
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Rogers',
  },
  {
    id: 't21',
    accountId: 'credit-1',
    type: 'charge',
    amount: 9.99,
    description: 'DISNEY PLUS',
    category: 'Entertainment',
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Disney+',
  },
  {
    id: 't22',
    accountId: 'credit-1',
    type: 'charge',
    amount: 14.99,
    description: 'AMAZON PRIME',
    category: 'Shopping',
    date: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Amazon Prime',
  },
  {
    id: 't23',
    accountId: 'credit-1',
    type: 'charge',
    amount: 11.99,
    description: 'APPLE MUSIC',
    category: 'Entertainment',
    date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Apple Music',
  },
  {
    id: 't24',
    accountId: 'credit-1',
    type: 'charge',
    amount: 125.50,
    description: 'TORONTO HYDRO',
    category: 'Utilities',
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    biller: 'Toronto Hydro',
  },
];

// Initial contacts
const initialContacts: Contact[] = [
  { id: 'c1', name: 'Sarah', email: 'sarah@example.com' },
  { id: 'c2', name: 'Mike', email: 'mike@example.com' },
  { id: 'c3', name: 'Priya', email: 'priya@example.com' },
  { id: 'c4', name: 'John', email: 'john@example.com' },
  { id: 'c5', name: 'Emma', email: 'emma@example.com' },
];

// Initial billers
const initialBillers: Biller[] = [
  { id: 'b1', name: 'Netflix', category: 'Entertainment', icon: '🎬' },
  { id: 'b2', name: 'Spotify', category: 'Entertainment', icon: '🎵' },
  { id: 'b3', name: 'Rogers', category: 'Utilities', icon: '📱' },
  { id: 'b4', name: 'Hydro One', category: 'Utilities', icon: '⚡' },
  { id: 'b5', name: 'Bell', category: 'Utilities', icon: '📞' },
  { id: 'b6', name: 'Visa', category: 'Credit Card', icon: '💳' },
  { id: 'b7', name: 'Mastercard', category: 'Credit Card', icon: '💳' },
  { id: 'b8', name: 'Property Tax', category: 'Government', icon: '🏛️' },
];

export const useBankingStore = create<BankingStore>((set, get) => ({
  accounts: initialAccounts,
  transactions: initialTransactions,
  contacts: initialContacts,
  billers: initialBillers,

  getAccount: (id) => {
    return get().accounts.find((acc) => acc.id === id);
  },

  updateAccountBalance: (id, amount) => {
    set((state) => ({
      accounts: state.accounts.map((acc) => {
        if (acc.id === id) {
          const newBalance = acc.balance + amount;
          // For credit accounts, update available credit
          if (acc.type === 'credit' || acc.type === 'lineOfCredit') {
            const availableCredit = (acc.creditLimit || 0) - newBalance;
            return { ...acc, balance: newBalance, availableCredit };
          }
          return { ...acc, balance: newBalance };
        }
        return acc;
      }),
    }));
  },

  addTransaction: (transaction) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
    };
    set((state) => ({
      transactions: [newTransaction, ...state.transactions],
    }));
    
    // Update account balance based on account type and transaction type
    const account = get().getAccount(transaction.accountId);
    const isCreditAccount = account?.type === 'credit' || account?.type === 'lineOfCredit';
    
    if (transaction.type === 'deposit' || transaction.type === 'request') {
      // Deposits increase balance for regular accounts
      get().updateAccountBalance(transaction.accountId, transaction.amount);
    } else if (transaction.type === 'charge') {
      // Charges increase debt (balance) for credit accounts
      get().updateAccountBalance(transaction.accountId, Math.abs(transaction.amount));
    } else if (transaction.type === 'creditPayment') {
      // Payments reduce debt (balance) for credit accounts
      get().updateAccountBalance(transaction.accountId, -Math.abs(transaction.amount));
    } else {
      // Withdrawals, transfers, payments decrease balance for regular accounts
      get().updateAccountBalance(transaction.accountId, -Math.abs(transaction.amount));
    }
    
    // Check for AutoSplit rule matches when a new transaction is added
    if (transaction.status === 'completed') {
      // Import autosplitStore dynamically to avoid circular dependency
      import('./autosplitStore').then(({ useAutoSplitStore }) => {
        const { matchTransaction, createExpenseFromMatch } = useAutoSplitStore.getState();
        const matchingRule = matchTransaction(newTransaction);
        if (matchingRule && matchingRule.actions.autoCreateExpense) {
          createExpenseFromMatch(matchingRule, newTransaction);
        }
      });
    }
  },

  getAccountTransactions: (accountId) => {
    return get().transactions.filter((t) => t.accountId === accountId);
  },

  getAllTransactions: () => {
    return get().transactions;
  },

  addContact: (contact) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
    };
    set((state) => ({
      contacts: [...state.contacts, newContact],
    }));
  },

  getContact: (id) => {
    return get().contacts.find((c) => c.id === id);
  },

  sendMoney: (fromAccountId, to, amount, description) => {
    const transaction: Omit<Transaction, 'id'> = {
      accountId: fromAccountId,
      type: 'transfer',
      amount: -amount,
      description: description || `E-Transfer to ${to}`,
      category: 'Transfer',
      date: new Date().toISOString(),
      status: 'completed',
      recipient: to,
    };
    get().addTransaction(transaction);
  },

  requestMoney: (fromAccountId, from, amount, description) => {
    const transaction: Omit<Transaction, 'id'> = {
      accountId: fromAccountId,
      type: 'request',
      amount: amount,
      description: description || `Payment request from ${from}`,
      category: 'Transfer',
      date: new Date().toISOString(),
      status: 'pending',
      sender: from,
    };
    get().addTransaction(transaction);
  },

  payBill: (fromAccountId, billerId, amount, accountNumber) => {
    const biller = get().billers.find((b) => b.id === billerId);
    const transaction: Omit<Transaction, 'id'> = {
      accountId: fromAccountId,
      type: 'payment',
      amount: -amount,
      description: biller?.name || 'Bill Payment',
      category: biller?.category || 'Bills',
      date: new Date().toISOString(),
      status: 'completed',
      biller: biller?.name,
      reference: accountNumber,
    };
    get().addTransaction(transaction);
  },

  chargeCredit: (accountId, amount, description, category) => {
    const transaction: Omit<Transaction, 'id'> = {
      accountId,
      type: 'charge',
      amount: amount,
      description: description || 'Credit Card Purchase',
      category: category || 'Purchase',
      date: new Date().toISOString(),
      status: 'completed',
    };
    get().addTransaction(transaction);
  },

  payCreditAccount: (fromAccountId, toAccountId, amount) => {
    const toAccount = get().getAccount(toAccountId);
    const fromAccount = get().getAccount(fromAccountId);
    
    if (!toAccount || !fromAccount) return;
    
    // Check if it's a credit account
    if (toAccount.type !== 'credit' && toAccount.type !== 'lineOfCredit') {
      return;
    }
    
    // Check if from account has sufficient funds
    if (fromAccount.balance < amount) {
      return;
    }
    
    // Create payment transaction on credit account (reduces debt)
    const creditPayment: Omit<Transaction, 'id'> = {
      accountId: toAccountId,
      type: 'creditPayment',
      amount: -amount,
      description: `Payment from ${fromAccount.name}`,
      category: 'Payment',
      date: new Date().toISOString(),
      status: 'completed',
    };
    get().addTransaction(creditPayment);
    
    // Create withdrawal transaction on source account
    const withdrawal: Omit<Transaction, 'id'> = {
      accountId: fromAccountId,
      type: 'transfer',
      amount: -amount,
      description: `Payment to ${toAccount.name}`,
      category: 'Payment',
      date: new Date().toISOString(),
      status: 'completed',
    };
    get().addTransaction(withdrawal);
  },
}));
