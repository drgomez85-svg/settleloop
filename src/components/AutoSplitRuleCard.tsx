import { AutoSplitRule } from '../types';
import { useAutoSplitStore } from '../store/autosplitStore';
import { useBankingStore } from '../store/bankingStore';

interface AutoSplitRuleCardProps {
  rule: AutoSplitRule;
  onEdit: () => void;
}

export function AutoSplitRuleCard({ rule, onEdit }: AutoSplitRuleCardProps) {
  const { toggleRuleStatus, deleteRule } = useAutoSplitStore();
  const { getAccount } = useBankingStore();
  const account = getAccount(rule.accountId);

  const getDetectionDescription = () => {
    switch (rule.detectionMethod) {
      case 'merchant':
        return `Merchant: "${rule.merchantMatch}"`;
      case 'contains':
        return `Contains: "${rule.containsText}"`;
      case 'exactAmount':
        return `Amount: $${rule.exactAmount?.toFixed(2)}`;
      case 'amountRange':
        return `Amount: $${rule.amountMin?.toFixed(2)} - $${rule.amountMax?.toFixed(2)}`;
      case 'category':
        return `Category: ${rule.category}`;
      default:
        return 'Unknown';
    }
  };

  const getRecurrenceDescription = () => {
    if (!rule.recurrence) return 'One-time';
    if (rule.recurrence === 'monthly' && rule.expectedDayRange) {
      return `Monthly (around ${rule.expectedDayRange.start}-${rule.expectedDayRange.end})`;
    }
    return rule.recurrence.charAt(0).toUpperCase() + rule.recurrence.slice(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="card"
      style={{
        padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-md)',
        opacity: rule.status === 'paused' ? 0.7 : 1,
        borderLeft: `4px solid ${rule.status === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)'}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{rule.name}</h4>
            <span
              className="badge"
              style={{
                backgroundColor: rule.status === 'active' ? 'rgba(20, 184, 166, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                color: rule.status === 'active' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.125rem 0.5rem',
              }}
            >
              {rule.status === 'active' ? 'Active' : 'Paused'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            {account?.name} • {getDetectionDescription()}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            {getRecurrenceDescription()} • Matched {rule.matchCount} time{rule.matchCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => toggleRuleStatus(rule.id)}
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
            title={rule.status === 'active' ? 'Pause rule' : 'Activate rule'}
          >
            {rule.status === 'active' ? '⏸️' : '▶️'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onEdit}
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
            title="Edit rule"
          >
            ✏️
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this rule?')) {
                deleteRule(rule.id);
              }
            }}
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.75rem' }}
            title="Delete rule"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {rule.lastMatchedAt && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
          Last matched: {formatDate(rule.lastMatchedAt)}
        </div>
      )}
      
      {rule.nextExpectedMatch && (
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Next expected: {formatDate(rule.nextExpectedMatch)}
        </div>
      )}
    </div>
  );
}
