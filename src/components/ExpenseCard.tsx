import { Expense, ExpenseCategory, Member } from '../types';
import { generateInitials, generateColor } from '../utils/avatarGenerator';
import { useBankingStore } from '../store/bankingStore';

interface ExpenseCardProps {
  expense: Expense;
  members: Member[];
  onEdit?: (expense: Expense) => void;
  onRemove?: (expenseId: string) => void;
}

export function ExpenseCard({ expense, members, onEdit, onRemove }: ExpenseCardProps) {
  const { getAccount } = useBankingStore();
  const paidBy = members.find((m) => m.id === expense.paidBy);
  const paidByInitials = paidBy ? generateInitials(paidBy.name) : '?';
  const paidByColor = paidBy ? generateColor(paidBy.name) : '#999';
  const sourceAccount = expense.sourceAccountId ? getAccount(expense.sourceAccountId) : null;

  const createdDate = expense.createdAt ? new Date(expense.createdAt) : null;
  const formattedDate = createdDate
    ? createdDate.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const CATEGORY_ICON_MAP: Record<ExpenseCategory, string> = {
    food: '🍔',
    groceries: '🛒',
    transport: '🚕',
    lodging: '🏨',
    entertainment: '🎟️',
    reimbursement: '💸',
    other: '🧾',
  };

  const getCategoryIcon = () => {
    if (expense.category && CATEGORY_ICON_MAP[expense.category]) {
      return CATEGORY_ICON_MAP[expense.category];
    }
    const title = expense.title.toLowerCase();
    if (title.includes('coffee') || title.includes('tea') || title.includes('juice')) return '☕';
    if (title.includes('breakfast') || title.includes('lunch') || title.includes('dinner') || title.includes('burger')) return '🍔';
    if (title.includes('uber') || title.includes('taxi') || title.includes('lyft')) return '🚕';
    if (title.includes('flight') || title.includes('plane')) return '✈️';
    if (title.includes('hotel') || title.includes('airbnb')) return '🏨';
    if (title.includes('grocery') || title.includes('market')) return '🛒';
    if (title.includes('ticket') || title.includes('museum') || title.includes('show')) return '🎟️';
    if (title.includes('reimbursement') || title.includes('settlement')) return '💸';
    return '🧾';
  };

  return (
    <div
      className="card"
      style={{
        padding: 'var(--spacing-md)',
        backgroundColor: 'var(--color-surface, var(--color-card))',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{ fontSize: '1.5rem' }}>{getCategoryIcon()}</div>
          <div>
            <h4 style={{ fontWeight: '500', margin: 0 }}>{expense.title}</h4>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              {formattedDate && `${formattedDate} • `}Paid by {paidBy?.name || 'Unknown'}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--color-primary)' }}>
            ${expense.amount.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
            {expense.splitType} • {expense.splits.length} member{expense.splits.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--spacing-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
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
          {expense.importedFrom && sourceAccount && (
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                padding: '2px 8px',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
              }}
            >
              <span>📥</span>
              <span>Imported from {sourceAccount.name}</span>
            </div>
          )}
        </div>
        {(onEdit || onRemove) && (
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            {onEdit && (
              <button
                className="btn btn-secondary"
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
                onClick={() => onEdit(expense)}
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                className="btn btn-danger"
                style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
                onClick={() => onRemove(expense.id)}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
