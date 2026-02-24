import { Expense, Member } from '../types';
import { generateInitials, generateColor } from '../utils/avatarGenerator';

interface ExpenseCardProps {
  expense: Expense;
  members: Member[];
  onEdit?: (expense: Expense) => void;
  onRemove?: (expenseId: string) => void;
}

export function ExpenseCard({ expense, members, onEdit, onRemove }: ExpenseCardProps) {
  const paidBy = members.find((m) => m.id === expense.paidBy);
  const paidByInitials = paidBy ? generateInitials(paidBy.name) : '?';
  const paidByColor = paidBy ? generateColor(paidBy.name) : '#999';

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>{expense.title}</h4>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>
            ${expense.amount.toFixed(2)}
          </div>
        </div>
        {(onEdit || onRemove) && (
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {onEdit && (
              <button
                className="btn btn-secondary"
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
                onClick={() => onEdit(expense)}
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                className="btn btn-danger"
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
                onClick={() => onRemove(expense.id)}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: paidByColor,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '600',
          }}
        >
          {paidByInitials}
        </div>
        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
          Paid by {paidBy?.name || 'Unknown'}
        </span>
      </div>

      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
        Split: {expense.splitType} • {expense.splits.length} member{expense.splits.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
