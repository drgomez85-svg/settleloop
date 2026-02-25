/**
 * Unit tests for balance calculation logic
 * Run these tests to verify the balance engine works correctly
 */

import { Mission, Member, Expense } from '../types';
import { calculateBalances, validateBalances } from './balanceEngine';

/**
 * Test 1: $200 paid by Sarah, split equally between Sarah+Teresa (Mike excluded)
 * Expected: Sarah +100, Teresa -100, Mike 0
 */
export function test1_SarahPays200EqualSplit() {
  const mission: Mission = {
    id: 'test-1',
    title: 'Test Mission 1',
    members: [
      { id: 'sarah', name: 'Sarah', email: 'sarah@test.com', balance: 0 },
      { id: 'teresa', name: 'Teresa', email: 'teresa@test.com', balance: 0 },
      { id: 'mike', name: 'Mike', email: 'mike@test.com', balance: 0 },
    ],
    expenses: [
      {
        id: 'exp-1',
        title: 'Test Expense',
        amount: 200,
        paidBy: 'sarah',
        splitType: 'EQUAL',
        splits: [
          { memberId: 'sarah', amount: 100 },
          { memberId: 'teresa', amount: 100 },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
    settlements: [],
    status: 'active',
  };

  const membersWithBalances = calculateBalances(mission);
  const sarah = membersWithBalances.find(m => m.id === 'sarah');
  const teresa = membersWithBalances.find(m => m.id === 'teresa');
  const mike = membersWithBalances.find(m => m.id === 'mike');

  console.assert(sarah?.balance === 100, `Test 1 FAILED: Sarah should have +100, got ${sarah?.balance}`);
  console.assert(teresa?.balance === -100, `Test 1 FAILED: Teresa should have -100, got ${teresa?.balance}`);
  console.assert(mike?.balance === 0, `Test 1 FAILED: Mike should have 0, got ${mike?.balance}`);
  console.assert(validateBalances(membersWithBalances), 'Test 1 FAILED: Sum of balances should equal 0');

  console.log('✅ Test 1 PASSED: $200 paid by Sarah, split equally between Sarah+Teresa (Mike excluded)');
  return { sarah: sarah?.balance, teresa: teresa?.balance, mike: mike?.balance };
}

/**
 * Test 2: $500 paid by Teresa, split equally between Teresa+Mike (Sarah excluded)
 * Expected: Teresa +250, Mike -250, Sarah 0
 */
export function test2_TeresaPays500EqualSplit() {
  const mission: Mission = {
    id: 'test-2',
    title: 'Test Mission 2',
    members: [
      { id: 'sarah', name: 'Sarah', email: 'sarah@test.com', balance: 0 },
      { id: 'teresa', name: 'Teresa', email: 'teresa@test.com', balance: 0 },
      { id: 'mike', name: 'Mike', email: 'mike@test.com', balance: 0 },
    ],
    expenses: [
      {
        id: 'exp-2',
        title: 'Test Expense',
        amount: 500,
        paidBy: 'teresa',
        splitType: 'EQUAL',
        splits: [
          { memberId: 'teresa', amount: 250 },
          { memberId: 'mike', amount: 250 },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
    settlements: [],
    status: 'active',
  };

  const membersWithBalances = calculateBalances(mission);
  const sarah = membersWithBalances.find(m => m.id === 'sarah');
  const teresa = membersWithBalances.find(m => m.id === 'teresa');
  const mike = membersWithBalances.find(m => m.id === 'mike');

  console.assert(teresa?.balance === 250, `Test 2 FAILED: Teresa should have +250, got ${teresa?.balance}`);
  console.assert(mike?.balance === -250, `Test 2 FAILED: Mike should have -250, got ${mike?.balance}`);
  console.assert(sarah?.balance === 0, `Test 2 FAILED: Sarah should have 0, got ${sarah?.balance}`);
  console.assert(validateBalances(membersWithBalances), 'Test 2 FAILED: Sum of balances should equal 0');

  console.log('✅ Test 2 PASSED: $500 paid by Teresa, split equally between Teresa+Mike (Sarah excluded)');
  return { sarah: sarah?.balance, teresa: teresa?.balance, mike: mike?.balance };
}

/**
 * Test 3: Two expenses combined and verify sum of balances == 0
 * Expense 1: $200 paid by Sarah, split equally between Sarah+Teresa (Mike excluded)
 * Expense 2: $500 paid by Teresa, split equally between Teresa+Mike (Sarah excluded)
 * Expected: Sum of all balances should equal 0
 */
export function test3_TwoExpensesCombined() {
  const mission: Mission = {
    id: 'test-3',
    title: 'Test Mission 3',
    members: [
      { id: 'sarah', name: 'Sarah', email: 'sarah@test.com', balance: 0 },
      { id: 'teresa', name: 'Teresa', email: 'teresa@test.com', balance: 0 },
      { id: 'mike', name: 'Mike', email: 'mike@test.com', balance: 0 },
    ],
    expenses: [
      {
        id: 'exp-3a',
        title: 'Expense 1',
        amount: 200,
        paidBy: 'sarah',
        splitType: 'EQUAL',
        splits: [
          { memberId: 'sarah', amount: 100 },
          { memberId: 'teresa', amount: 100 },
        ],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'exp-3b',
        title: 'Expense 2',
        amount: 500,
        paidBy: 'teresa',
        splitType: 'EQUAL',
        splits: [
          { memberId: 'teresa', amount: 250 },
          { memberId: 'mike', amount: 250 },
        ],
        createdAt: new Date().toISOString(),
      },
    ],
    settlements: [],
    status: 'active',
  };

  const membersWithBalances = calculateBalances(mission);
  const sarah = membersWithBalances.find(m => m.id === 'sarah');
  const teresa = membersWithBalances.find(m => m.id === 'teresa');
  const mike = membersWithBalances.find(m => m.id === 'mike');

  // Sarah: +200 (paid) - 100 (her share) = +100
  // Teresa: +500 (paid) - 100 (share from exp1) - 250 (her share from exp2) = +150
  // Mike: -250 (his share from exp2)
  // Total: 100 + 150 - 250 = 0

  const sum = (sarah?.balance || 0) + (teresa?.balance || 0) + (mike?.balance || 0);
  console.assert(Math.abs(sum) < 0.01, `Test 3 FAILED: Sum of balances should equal 0, got ${sum}`);
  console.assert(validateBalances(membersWithBalances), 'Test 3 FAILED: validateBalances should return true');

  console.log('✅ Test 3 PASSED: Two expenses combined, sum of balances equals 0');
  console.log(`   Sarah: ${sarah?.balance}, Teresa: ${teresa?.balance}, Mike: ${mike?.balance}, Sum: ${sum}`);
  return { sarah: sarah?.balance, teresa: teresa?.balance, mike: mike?.balance, sum };
}

/**
 * Run all tests
 */
export function runAllBalanceTests() {
  console.log('🧪 Running balance calculation tests...\n');
  try {
    test1_SarahPays200EqualSplit();
    test2_TeresaPays500EqualSplit();
    test3_TwoExpensesCombined();
    console.log('\n✅ All balance calculation tests PASSED!');
    return true;
  } catch (error) {
    console.error('\n❌ Balance calculation tests FAILED:', error);
    return false;
  }
}
