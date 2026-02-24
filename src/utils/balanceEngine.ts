import { Mission, Member, Expense } from '../types';

/**
 * Calculates balances for all members based on expenses.
 * Balances are the source of truth - always derived from expenses.
 * 
 * Rules:
 * - Positive balance = member is owed money
 * - Negative balance = member owes money
 * - Sum of all balances must equal 0
 */
export function calculateBalances(mission: Mission): Member[] {
  // Initialize balances to zero
  const balances = new Map<string, number>();
  mission.members.forEach(member => {
    balances.set(member.id, 0);
  });

  // Process each expense
  mission.expenses.forEach(expense => {
    const paidBy = expense.paidBy;
    const totalAmount = expense.amount;

    // Add the full amount to the payer's balance (they paid, so they're owed)
    balances.set(paidBy, (balances.get(paidBy) || 0) + totalAmount);

    // Subtract each member's share from their balance (they owe their share)
    expense.splits.forEach(split => {
      let splitAmount = 0;

      switch (expense.splitType) {
        case 'EQUAL':
          splitAmount = split.amount;
          break;
        case 'AMOUNT':
          splitAmount = split.amount;
          break;
        case 'PERCENT':
          splitAmount = (totalAmount * (split.percent || 0)) / 100;
          break;
      }

      balances.set(split.memberId, (balances.get(split.memberId) || 0) - splitAmount);
    });
  });

  // Convert to Member array with updated balances
  return mission.members.map(member => ({
    ...member,
    balance: balances.get(member.id) || 0,
  }));
}

/**
 * Validates that the sum of all balances equals zero
 */
export function validateBalances(members: Member[]): boolean {
  const sum = members.reduce((acc, member) => acc + member.balance, 0);
  // Allow small floating point errors
  return Math.abs(sum) < 0.01;
}
