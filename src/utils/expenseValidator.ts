import { Expense, SplitType } from '../types';

/**
 * Validates an expense based on its split type
 */
export function validateExpense(expense: Expense): { valid: boolean; error?: string } {
  const { splitType, amount, splits } = expense;

  if (splits.length === 0) {
    return { valid: false, error: 'At least one member must be included in the split' };
  }

  switch (splitType) {
    case 'EQUAL':
      // For equal splits, each split should have the same amount
      const equalAmount = amount / splits.length;
      const tolerance = 0.01;
      for (const split of splits) {
        if (Math.abs(split.amount - equalAmount) > tolerance) {
          return { valid: false, error: 'Equal split amounts must match' };
        }
      }
      break;

    case 'AMOUNT':
      // Sum of split amounts must equal expense amount
      const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalAmount - amount) > 0.01) {
        return { valid: false, error: `Split amounts must total $${amount.toFixed(2)}` };
      }
      break;

    case 'PERCENT':
      // Sum of percentages must equal 100
      const totalPercent = splits.reduce((sum, split) => sum + (split.percent || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        return { valid: false, error: 'Percentages must total 100%' };
      }
      break;
  }

  return { valid: true };
}

/**
 * Creates default splits for an expense based on split type
 */
export function createDefaultSplits(
  memberIds: string[],
  splitType: SplitType,
  totalAmount: number
): Array<{ memberId: string; amount: number; percent?: number }> {
  switch (splitType) {
    case 'EQUAL':
      const equalAmount = totalAmount / memberIds.length;
      return memberIds.map(id => ({
        memberId: id,
        amount: Math.round(equalAmount * 100) / 100,
      }));

    case 'AMOUNT':
      return memberIds.map(id => ({
        memberId: id,
        amount: 0,
      }));

    case 'PERCENT':
      const percentPerMember = 100 / memberIds.length;
      return memberIds.map(id => ({
        memberId: id,
        amount: (totalAmount * percentPerMember) / 100,
        percent: Math.round(percentPerMember * 100) / 100,
      }));
  }
}
