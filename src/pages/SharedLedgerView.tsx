import { useParams } from 'react-router-dom';
import { useMissionStore } from '../store/missionStore';
import { MemberCard } from '../components/MemberCard';
import { ExpenseCard } from '../components/ExpenseCard';
import { calculateBalances } from '../utils/balanceEngine';
import { optimizeSettlements } from '../utils/settlementOptimizer';

export function SharedLedgerView() {
  const { token } = useParams<{ token: string }>();
  const { getMissionByShareToken } = useMissionStore();
  
  const mission = token ? getMissionByShareToken(token) : null;

  if (!mission) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔒</div>
        <h2 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: '600' }}>Ledger Not Found</h2>
        <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
          This shared ledger link is invalid or has been removed.
        </p>
      </div>
    );
  }

  const membersWithBalances = calculateBalances(mission);
  const summary = optimizeSettlements(membersWithBalances);

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)', 
          marginBottom: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-primary-bg)',
          borderRadius: 'var(--radius-md)',
        }}>
          <span style={{ fontSize: '1.25rem' }}>👁️</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Read-Only View
          </span>
        </div>
        <div style={{ fontSize: '1.5rem' }}>⛰️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
          {mission.title}
        </h1>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
          {mission.members.length} members · {mission.expenses.length} expenses
        </div>
      </div>

      {/* Balance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            Total Expenses
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            ${mission.expenses.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            Status
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '600', color: mission.status === 'active' ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
            {mission.status === 'active' ? 'Active' : 'Settled'}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
          MEMBERS ({membersWithBalances.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
          {membersWithBalances.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </div>

      {/* Settlement Summary */}
      {summary.transfers.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            SETTLEMENT SUMMARY
          </h2>
          <div className="card" style={{ padding: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {summary.transfers.map((transfer, idx) => {
                const fromMember = membersWithBalances.find((m) => m.id === transfer.from);
                const toMember = membersWithBalances.find((m) => m.id === transfer.to);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-sm)',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-coral)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                      }}
                    >
                      {fromMember?.name[0] || 'M'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>
                        {fromMember?.name} pays ${transfer.amount.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>→</div>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                      }}
                    >
                      {toMember?.name[0] || 'M'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{toMember?.name}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ledger Section */}
      <div>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
          LEDGER
        </h2>

        {mission.expenses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--color-text-light)' }}>No expenses yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {mission.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={membersWithBalances}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
