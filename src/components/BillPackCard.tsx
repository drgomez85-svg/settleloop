import { BillPack } from '../types';
import { useAutoSplitStore } from '../store/autosplitStore';
import { useMissionStore } from '../store/missionStore';
import { useBankingStore } from '../store/bankingStore';

interface BillPackCardProps {
  pack: BillPack;
  onEdit?: () => void;
  onAddBills?: () => void;
}

export function BillPackCard({ pack, onEdit, onAddBills }: BillPackCardProps) {
  const { getRulesForBillPack, calculateMonthlyTotal, updateBillPack, deleteBillPack } = useAutoSplitStore();
  const { getMission } = useMissionStore();
  const { accounts } = useBankingStore();
  
  const mission = getMission(pack.missionId);
  const rules = getRulesForBillPack(pack.id);
  const activeRules = rules.filter(r => r.status === 'active');
  
  // Calculate current month totals
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { total, byMember } = calculateMonthlyTotal(pack.id, currentPeriod);
  
  // Count imported expenses this month
  const importedCount = mission?.expenses.filter(e => {
    if (!e.autoSplitRuleId) return false;
    const rule = activeRules.find(r => r.id === e.autoSplitRuleId);
    if (!rule) return false;
    const expenseDate = new Date(e.createdAt);
    const periodStart = new Date(currentPeriod);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    return expenseDate >= periodStart && expenseDate < periodEnd;
  }).length || 0;

  const formatPeriod = (period: string) => {
    const date = new Date(period);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{pack.name}</h3>
            {pack.status === 'active' && (
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                backgroundColor: 'var(--color-green)', 
                color: 'white', 
                borderRadius: 'var(--radius-sm)',
              }}>
                Active
              </span>
            )}
            {pack.status === 'paused' && (
              <span style={{ 
                fontSize: '0.75rem', 
                padding: '2px 8px', 
                backgroundColor: 'var(--color-text-muted)', 
                color: 'white', 
                borderRadius: 'var(--radius-sm)',
              }}>
                Paused
              </span>
            )}
          </div>
          {pack.description && (
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)' }}>
              {pack.description}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
          {onEdit && (
            <button
              className="btn btn-secondary"
              onClick={onEdit}
              style={{ padding: 'var(--spacing-xs)', fontSize: '0.75rem' }}
              title="Edit pack"
            >
              ✏️
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${pack.name}"? This will remove the pack but keep the bill rules.`)) {
                deleteBillPack(pack.id);
              }
            }}
            style={{ padding: 'var(--spacing-xs)', fontSize: '0.75rem' }}
            title="Delete pack"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Bills (Rules) */}
      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
          Bills ({activeRules.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {activeRules.slice(0, 5).map((rule) => {
            const account = accounts.find(a => a.id === rule.accountId);
            return (
              <div key={rule.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 'var(--spacing-xs)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
              }}>
                <div>
                  <div style={{ fontWeight: '500' }}>{rule.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                    {account?.name} • {rule.splitType === 'EQUAL' ? 'Equal' : rule.splitType}
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {rule.status === 'active' ? '✓' : '⏸️'}
                </div>
              </div>
            );
          })}
          {activeRules.length > 5 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', padding: 'var(--spacing-xs)' }}>
              +{activeRules.length - 5} more
            </div>
          )}
        </div>
        {onAddBills && (
          <button
            className="btn btn-secondary"
            onClick={onAddBills}
            style={{ 
              width: '100%', 
              marginTop: 'var(--spacing-sm)', 
              fontSize: '0.875rem',
              padding: 'var(--spacing-xs)',
            }}
          >
            + Add Bills to Pack
          </button>
        )}
      </div>

      {/* This Month Summary */}
      <div style={{ 
        padding: 'var(--spacing-md)', 
        backgroundColor: 'var(--color-primary-bg)', 
        borderRadius: 'var(--radius-md)',
        marginBottom: 'var(--spacing-md)',
      }}>
        <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-sm)' }}>
          This Month ({formatPeriod(currentPeriod)})
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Imported bills:</div>
          <div style={{ fontWeight: '600' }}>{importedCount}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Total:</div>
          <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>${total.toFixed(2)}</div>
        </div>
        {Object.entries(byMember).length > 0 && (
          <div style={{ marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
            {Object.entries(byMember).map(([memberId, amount]) => {
              const member = mission?.members.find(m => m.id === memberId);
              return (
                <div key={memberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xs)' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{member?.name || 'Unknown'} owes:</div>
                  <div style={{ fontWeight: '600', color: 'var(--color-coral)' }}>${amount.toFixed(2)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Automation Settings */}
      {pack.autoSendMonthlyRequest && (
        <div style={{ 
          padding: 'var(--spacing-md)', 
          backgroundColor: 'var(--color-background)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ fontSize: '1.25rem' }}>✅</span>
            <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>Auto-send monthly Interac requests</div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            Send on: {pack.requestDayOfMonth}{getOrdinalSuffix(pack.requestDayOfMonth)} of each month
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            Mode: {pack.mode === 'request-only' ? 'Request only' : pack.mode}
          </div>
          {pack.safetyLimit && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
              Safety limit: ${pack.safetyLimit.toFixed(2)} (requires review if exceeded)
            </div>
          )}
          {pack.lastRequestPeriod && (
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
              Last sent: {formatPeriod(pack.lastRequestPeriod)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  if (n > 3 && n < 21) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
