import { Member } from '../types';
import { generateInitials, generateColor } from '../utils/avatarGenerator';

interface MemberCardProps {
  member: Member;
  onEdit?: (member: Member) => void;
  onRemove?: (memberId: string) => void;
  showBalance?: boolean;
}

export function MemberCard({ member, onEdit, onRemove, showBalance = true }: MemberCardProps) {
  const initials = generateInitials(member.name);
  const color = generateColor(member.name);
  const isPositive = member.balance > 0.01;
  const isNegative = member.balance < -0.01;
  const isZero = !isPositive && !isNegative;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '600',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>{member.name}</div>
        {showBalance && (
          <div
            style={{
              fontSize: '0.875rem',
              color: isPositive
                ? 'var(--color-green)'
                : isNegative
                ? 'var(--color-coral)'
                : 'var(--color-text-light)',
            }}
          >
            {isPositive && `Gets $${Math.abs(member.balance).toFixed(2)}`}
            {isNegative && `Owes $${Math.abs(member.balance).toFixed(2)}`}
            {isZero && 'Settled up'}
          </div>
        )}
      </div>
      {(onEdit || onRemove) && (
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          {onEdit && (
            <button
              className="btn btn-secondary"
              style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
              onClick={() => onEdit(member)}
            >
              Edit
            </button>
          )}
          {onRemove && (
            <button
              className="btn btn-danger"
              style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
              onClick={() => onRemove(member.id)}
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
