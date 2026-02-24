import { useState, useEffect } from 'react';
import { Expense, Member, SplitType } from '../types';
import { createDefaultSplits, validateExpense } from '../utils/expenseValidator';

interface ExpenseFormProps {
  members: Member[];
  expense?: Expense;
  onSave: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export function ExpenseForm({ members, expense, onSave, onCancel }: ExpenseFormProps) {
  const [title, setTitle] = useState(expense?.title || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || members[0]?.id || '');
  const [splitType, setSplitType] = useState<SplitType>(expense?.splitType || 'EQUAL');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    expense?.splits.map((s) => s.memberId) || members.map((m) => m.id)
  );
  const [splits, setSplits] = useState(expense?.splits || createDefaultSplits(selectedMembers, splitType, parseFloat(amount) || 0));
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (members.length > 0 && !paidBy) {
      setPaidBy(members[0].id);
    }
  }, [members, paidBy]);

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    if (selectedMembers.length > 0) {
      const newSplits = createDefaultSplits(selectedMembers, splitType, numAmount);
      setSplits(newSplits);
    }
  }, [splitType, selectedMembers, amount]);

  const handleMemberToggle = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      if (selectedMembers.length > 1) {
        setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
      }
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSplitChange = (memberId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSplits(
      splits.map((split) => {
        if (split.memberId === memberId) {
          if (splitType === 'PERCENT') {
            return { ...split, percent: numValue, amount: ((parseFloat(amount) || 0) * numValue) / 100 };
          } else {
            return { ...split, amount: numValue };
          }
        }
        return split;
      })
    );
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (selectedMembers.length === 0) {
      setError('At least one member must be selected');
      return;
    }
    if (!paidBy) {
      setError('Please select who paid');
      return;
    }

    const expenseData: Omit<Expense, 'id' | 'createdAt'> = {
      title: title.trim(),
      amount: numAmount,
      paidBy,
      splitType,
      splits: splits.filter((s) => selectedMembers.includes(s.memberId)),
    };

    const validation = validateExpense({ ...expenseData, id: '', createdAt: '' });
    if (!validation.valid) {
      setError(validation.error || 'Invalid expense');
      return;
    }

    onSave(expenseData);
  };

  const totalAmount = parseFloat(amount) || 0;
  const totalSplit = splits
    .filter((s) => selectedMembers.includes(s.memberId))
    .reduce((sum, s) => sum + (splitType === 'PERCENT' ? (totalAmount * (s.percent || 0)) / 100 : s.amount), 0);

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: 'var(--spacing-lg)', fontWeight: '500' }}>
        {expense ? 'Edit Expense' : 'Add Expense'}
      </h3>

      {error && (
        <div
          style={{
            padding: 'var(--spacing-sm)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--color-error)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-md)',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
            Title
          </label>
          <input
            className="input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Dinner, Gas, Groceries"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
            Amount (CAD)
          </label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
            Paid by
          </label>
          <select className="input" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
            Split Type
          </label>
          <select
            className="input"
            value={splitType}
            onChange={(e) => setSplitType(e.target.value as SplitType)}
          >
            <option value="EQUAL">Equal</option>
            <option value="AMOUNT">Amount</option>
            <option value="PERCENT">Percent</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
            Split Among
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            {members.map((member) => (
              <label
                key={member.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-sm)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.id)}
                  onChange={() => handleMemberToggle(member.id)}
                  disabled={selectedMembers.length === 1 && selectedMembers.includes(member.id)}
                />
                <span style={{ flex: 1 }}>{member.name}</span>
                {selectedMembers.includes(member.id) && (
                  <input
                    type="number"
                    step={splitType === 'PERCENT' ? '0.01' : '0.01'}
                    min="0"
                    max={splitType === 'PERCENT' ? '100' : undefined}
                    value={
                      splitType === 'PERCENT'
                        ? splits.find((s) => s.memberId === member.id)?.percent || 0
                        : splits.find((s) => s.memberId === member.id)?.amount || 0
                    }
                    onChange={(e) => handleSplitChange(member.id, e.target.value)}
                    style={{
                      width: '100px',
                      padding: 'var(--spacing-xs)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                    placeholder={splitType === 'PERCENT' ? '%' : '$'}
                  />
                )}
              </label>
            ))}
          </div>
          {splitType === 'AMOUNT' && (
            <div
              style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: '0.875rem',
                color: Math.abs(totalSplit - totalAmount) < 0.01 ? 'var(--color-green)' : 'var(--color-error)',
              }}
            >
              Total: ${totalSplit.toFixed(2)} / ${totalAmount.toFixed(2)}
            </div>
          )}
          {splitType === 'PERCENT' && (
            <div
              style={{
                marginTop: 'var(--spacing-sm)',
                fontSize: '0.875rem',
                color:
                  Math.abs(
                    splits
                      .filter((s) => selectedMembers.includes(s.memberId))
                      .reduce((sum, s) => sum + (s.percent || 0), 0) - 100
                  ) < 0.01
                    ? 'var(--color-green)'
                    : 'var(--color-error)',
              }}
            >
              Total: {splits
                .filter((s) => selectedMembers.includes(s.memberId))
                .reduce((sum, s) => sum + (s.percent || 0), 0)
                .toFixed(2)}%
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            Save
          </button>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
