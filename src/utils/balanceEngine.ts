import { Mission, Member, Expense } from '../types';

/**
 * Calculates balances for all members based on expenses.
 * Balances are the source of truth - always derived from expenses.
 * 
 * Rules:
 * - Positive balance = member is owed money
 * - Negative balance = member owes money
 * - Sum of all balances must equal 0
 * - Only members in expense.splits are included in the split (excluded members contribute 0)
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
    const currentPayerBalance = balances.get(paidBy) || 0;
    balances.set(paidBy, currentPayerBalance + totalAmount);

    // Subtract each member's share from their balance (they owe their share)
    // Only members in expense.splits are included - excluded members are not in splits
    expense.splits.forEach(split => {
      let splitAmount = 0;

      switch (expense.splitType) {
        case 'EQUAL':
          // For EQUAL splits, the amount is pre-calculated and stored in split.amount
          // It should already be divided by the number of included members
          splitAmount = split.amount;
          break;
        case 'AMOUNT':
          // For AMOUNT splits, use the exact amount specified
          splitAmount = split.amount;
          break;
        case 'PERCENT':
          // For PERCENT splits, calculate from percentage
          splitAmount = (totalAmount * (split.percent || 0)) / 100;
          break;
      }

      // Round to 2 decimal places to avoid floating point errors
      splitAmount = Math.round(splitAmount * 100) / 100;

      const currentMemberBalance = balances.get(split.memberId) || 0;
      balances.set(split.memberId, currentMemberBalance - splitAmount);
    });
  });

  // Convert to Member array with updated balances
  // Round balances to 2 decimal places to avoid floating point errors
  return mission.members.map(member => ({
    ...member,
    balance: Math.round((balances.get(member.id) || 0) * 100) / 100,
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
