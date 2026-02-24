# SettleLoop

A bank-native shared expense and settlement engine integrated with Interac e-Transfer, embedded inside a mobile banking app.

## Overview

SettleLoop is NOT a standalone Splitwise clone. It is a bank-native shared expense and settlement engine that:

- Optimizes settlements to minimize transfers
- Executes transfers via Interac e-Transfer
- Enables one-click settlement
- Keeps social finance inside the banking app

## Features

### 🏦 Banking Home
- View accounts (Chequing, Savings, Joint)
- Quick Actions: Send, Request, Pay Bill, **Split Expense** → navigates to SettleLoop

### 🔁 SettleLoop Dashboard
- Create and manage Shared Ledgers (groups/trips)
- View all active and settled shared ledgers
- Demo mode toggle for presentations

### 👥 Shared Ledger Management
- Add custom participants (no login required)
- Auto-generate avatars from initials
- Rename and remove participants
- Real-time balance calculation

### 💳 Expense System
- Add expenses with title, amount (CAD), and payer
- Three split types:
  - **EQUAL**: Split equally among selected members
  - **AMOUNT**: Assign specific CAD amounts (must total expense)
  - **PERCENT**: Assign percentages (must total 100%)
- Exclude members from specific expenses
- Dynamic balance updates

### ⚖️ Balance Engine
- Balances always derived from expenses (source of truth)
- Positive balance = member is owed money
- Negative balance = member owes money
- Sum of all balances equals 0

### 🔄 Optimized Settlements
- Calculates minimal number of transfers
- Greedy algorithm matches largest debts with largest credits
- Example: If Alex gets $715, Jason owes $305, Emma owes $245, Priya owes $165
  - Optimized: Jason → Alex $305, Emma → Alex $245, Priya → Alex $165

### 💸 Settlement Flow (4 Steps)
1. **Settlement Summary**: View total sending/receiving and transfers
2. **Select Bank**: Choose Canadian FI (TD, RBC, BMO, etc.)
3. **Confirm Settlement**: Review breakdown and confirm
4. **Success**: Confirmation screen with settlement details

### ✅ Settle / Unsettle Logic
- **Mark Settled**: Locks ledger, zeros balances, shows settled badge
- **Reopen**: Restores balances from expenses, unlocks ledger

### 📤 Invite & Payment Links
- Generate invite links for shared ledgers
- Generate payment links for individual members
- Send All Requests (one-click to all debtors)

### 🧪 Demo Mode
- Skip bank selection
- Auto-complete settlements
- Simulate success instantly
- Perfect for hackathon presentations

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **Zustand** for state management
- **React Router** for navigation
- **CSS Variables** for theming

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Architecture

### Data Models

**Shared Ledger** (formerly Mission)
```typescript
{
  id: string;
  title: string;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  status: 'active' | 'settled';
  settledAt?: string;
}
```

**Member**
```typescript
{
  id: string;
  name: string;
  balance: number; // positive = gets money, negative = owes money
}
```

**Expense**
```typescript
{
  id: string;
  title: string;
  amount: number; // CAD
  paidBy: string; // memberId
  splitType: 'EQUAL' | 'AMOUNT' | 'PERCENT';
  splits: ExpenseSplit[];
  createdAt: string;
}
```

**Settlement**
```typescript
{
  id: string;
  from: string; // memberId
  to: string; // memberId
  amount: number;
  status: 'pending' | 'completed' | 'reversed';
  createdAt: string;
  completedAt?: string;
}
```

### Key Algorithms

1. **Balance Engine** (`src/utils/balanceEngine.ts`)
   - Calculates balances from all expenses
   - Ensures sum equals zero
   - Never hardcodes balances

2. **Settlement Optimizer** (`src/utils/settlementOptimizer.ts`)
   - Greedy algorithm for minimal transfers
   - Matches largest debts with largest credits

3. **Expense Validator** (`src/utils/expenseValidator.ts`)
   - Validates split types
   - Ensures amounts total correctly

## Design System

- **Theme**: Light, Simplii-inspired
- **Colors**:
  - Primary: Teal (#14B8A6)
  - Coral: For "owes" (#F87171)
  - Green: For positive balance (#10B981)
  - Background: Soft grey (#F5F5F5)
  - Cards: White (#FFFFFF)
- **Typography**: System fonts, clean and readable
- **Borders**: Minimal, rounded cards

## Project Structure

```
src/
├── components/       # Reusable UI components
├── data/            # Static data (banks, etc.)
├── pages/           # Page components
├── store/           # Zustand state management
├── styles/          # Global styles
├── types/           # TypeScript types
└── utils/           # Utility functions (balance engine, optimizer, etc.)
```

## License

MIT
