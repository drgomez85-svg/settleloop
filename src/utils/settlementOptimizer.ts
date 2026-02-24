import { Member, SettlementSummary } from '../types';

/**
 * Optimizes settlements to minimize the number of transfers.
 * Uses a greedy algorithm to find minimal transfers.
 * 
 * Algorithm:
 * 1. Separate debtors (negative balance) and creditors (positive balance)
 * 2. Match largest debts with largest credits
 * 3. Create transfers until all balances are settled
 */
export function optimizeSettlements(members: Member[]): SettlementSummary {
  // Filter out members with zero balance
  const activeMembers = members.filter(m => Math.abs(m.balance) > 0.01);
  
  // Separate debtors and creditors
  const debtors = activeMembers
    .filter(m => m.balance < 0)
    .map(m => ({ ...m, balance: Math.abs(m.balance) })) // Convert to positive for easier calculation
    .sort((a, b) => b.balance - a.balance); // Sort descending

  const creditors = activeMembers
    .filter(m => m.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Sort descending

  const transfers: Array<{ from: string; to: string; amount: number }> = [];
  let totalSending = 0;
  let totalReceiving = 0;

  // Greedy matching algorithm
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    if (debtor.balance === 0) {
      debtorIndex++;
      continue;
    }

    if (creditor.balance === 0) {
      creditorIndex++;
      continue;
    }

    // Calculate transfer amount
    const transferAmount = Math.min(debtor.balance, creditor.balance);

    // Create transfer
    transfers.push({
      from: debtor.id,
      to: creditor.id,
      amount: Math.round(transferAmount * 100) / 100, // Round to 2 decimal places
    });

    totalSending += transferAmount;
    totalReceiving += transferAmount;

    // Update balances
    debtor.balance -= transferAmount;
    creditor.balance -= transferAmount;

    // Move to next if balance is zero
    if (debtor.balance < 0.01) {
      debtorIndex++;
    }
    if (creditor.balance < 0.01) {
      creditorIndex++;
    }
  }

  return {
    totalSending: Math.round(totalSending * 100) / 100,
    totalReceiving: Math.round(totalReceiving * 100) / 100,
    net: Math.round((totalSending - totalReceiving) * 100) / 100, // Should be 0
    transfers,
  };
}

/**
 * Gets members who need to send money (negative balance)
 */
export function getDebtors(members: Member[]): Member[] {
  return members.filter(m => m.balance < -0.01);
}

/**
 * Gets members who should receive money (positive balance)
 */
export function getCreditors(members: Member[]): Member[] {
  return members.filter(m => m.balance > 0.01);
}
