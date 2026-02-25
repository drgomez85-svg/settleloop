import { Expense, SplitType } from '../types';

/**
 * Validates an expense based on its split type
 * 
 * Rules:
 * - EQUAL: All splits must have equal amounts, and sum must equal expense amount
 * - AMOUNT: Sum of split amounts must equal expense amount (within tolerance)
 * - PERCENT: Sum of percentages must equal 100% (within tolerance)
 */
export function validateExpense(expense: Expense): { valid: boolean; error?: string } {
  const { splitType, amount, splits } = expense;
  const tolerance = 0.01;

  if (splits.length === 0) {
    return { valid: false, error: 'At least one member must be included in the split' };
  }

  switch (splitType) {
    case 'EQUAL':
      // For equal splits:
      // 1. Each split should have the same amount (within tolerance)
      // 2. Sum of all splits must equal expense amount (within tolerance)
      // 3. Only included members are in splits (excluded members are not in the array)
      const expectedEqualAmount = amount / splits.length;
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      
      // Check that sum equals total amount
      if (Math.abs(totalSplitAmount - amount) > tolerance) {
        return { 
          valid: false, 
          error: `Equal split total ($${totalSplitAmount.toFixed(2)}) must equal expense amount ($${amount.toFixed(2)})` 
        };
      }
      
      // Check that all amounts are equal (within tolerance)
      for (const split of splits) {
        if (Math.abs(split.amount - expectedEqualAmount) > tolerance) {
          return { valid: false, error: 'Equal split amounts must match' };
        }
      }
      break;

    case 'AMOUNT':
      // Sum of split amounts must equal expense amount (within tolerance)
      const totalAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalAmount - amount) > tolerance) {
        return { valid: false, error: `Split amounts must total $${amount.toFixed(2)} (got $${totalAmount.toFixed(2)})` };
      }
      break;

    case 'PERCENT':
      // Sum of percentages must equal 100% (within tolerance)
      const totalPercent = splits.reduce((sum, split) => sum + (split.percent || 0), 0);
      if (Math.abs(totalPercent - 100) > tolerance) {
        return { valid: false, error: `Percentages must total 100% (got ${totalPercent.toFixed(2)}%)` };
      }
      break;
  }

  return { valid: true };
}

/**
 * Creates default splits for an expense based on split type
 * 
 * For EQUAL splits, ensures cents-safe rounding so the sum equals totalAmount exactly.
 * Uses a "distribute remainder" approach: calculate base amount, then add remainder cents
 * to first N members to ensure exact total.
 */
export function createDefaultSplits(
  memberIds: string[],
  splitType: SplitType,
  totalAmount: number
): Array<{ memberId: string; amount: number; percent?: number }> {
  if (memberIds.length === 0) {
    return [];
  }

  switch (splitType) {
    case 'EQUAL':
      // Calculate base amount per person (in cents to avoid floating point errors)
      const totalCents = Math.round(totalAmount * 100);
      const baseCentsPerPerson = Math.floor(totalCents / memberIds.length);
      const remainderCents = totalCents % memberIds.length;
      
      // Create splits with base amount, then add 1 cent to first N members for remainder
      return memberIds.map((id, index) => {
        let amountCents = baseCentsPerPerson;
        // Distribute remainder cents to first N members
        if (index < remainderCents) {
          amountCents += 1;
        }
        return {
          memberId: id,
          amount: amountCents / 100, // Convert back to dollars
        };
      });

    case 'AMOUNT':
      return memberIds.map(id => ({
        memberId: id,
        amount: 0,
      }));

    case 'PERCENT':
      const percentPerMember = 100 / memberIds.length;
      // For PERCENT, calculate amount from percentage and ensure rounding is correct
      return memberIds.map(id => {
        const percent = Math.round(percentPerMember * 100) / 100;
        const amount = Math.round((totalAmount * percent) / 100 * 100) / 100;
        return {
          memberId: id,
          amount,
          percent,
        };
      });
  }
}
