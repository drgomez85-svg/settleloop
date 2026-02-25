import { useNavigate } from 'react-router-dom';
import { useMissionStore } from '../store/missionStore';
import { useAuthStore } from '../store/authStore.ts';
import { NotificationCenter } from '../components/NotificationCenter';
import { calculateBalances } from '../utils/balanceEngine';
import { getCreditors, getDebtors } from '../utils/settlementOptimizer';

export function SettleLoopDashboard() {
  const navigate = useNavigate();
  const { missions, setDemoMode, demoMode } = useMissionStore();
  const { userName } = useAuthStore();

  // Calculate total balances across all missions
  let totalOwed = 0;
  let totalOwing = 0;

  missions.forEach((mission) => {
    if (mission.status === 'active') {
      const membersWithBalances = calculateBalances(mission);
      const creditors = getCreditors(membersWithBalances);
      const debtors = getDebtors(membersWithBalances);
      
      // Assuming current user is the first member (in real app, would be from auth)
      const currentUser = membersWithBalances[0];
      if (currentUser) {
        if (currentUser.balance > 0) {
          totalOwed += currentUser.balance;
        } else {
          totalOwing += Math.abs(currentUser.balance);
        }
      }
    }
  });

  const activeMissions = missions.filter((m) => m.status === 'active');
  const settledMissions = missions.filter((m) => m.status === 'settled');

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/')}
          style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem' }}
        >
          ← Back to Banking
        </button>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
          <NotificationCenter />
          <button
            className="btn btn-secondary"
            onClick={() => setDemoMode(!demoMode)}
            style={{ padding: 'var(--spacing-xs) var(--spacing-sm)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            👁️ {demoMode ? 'Demo' : 'Demo'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
          Welcome back, {userName || 'User'} 👋
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: 'var(--spacing-xl)' }}>
          SettleLoop
        </h1>
      </div>

      {/* Balance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ backgroundColor: 'var(--color-green)', color: 'white', padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <div style={{ fontSize: '1.25rem' }}>📈</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>You're owed</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>${totalOwed.toFixed(2)}</div>
        </div>
        <div className="card" style={{ backgroundColor: 'var(--color-coral)', color: 'white', padding: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <div style={{ fontSize: '1.25rem' }}>📉</div>
            <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>You owe</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700' }}>${totalOwing.toFixed(2)}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/mission/new')}
          style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1rem', fontWeight: '600' }}
        >
          ⚡ Create Shared Group
        </button>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            ACTIVE SHARED GROUPS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {activeMissions.map((mission) => {
              const membersWithBalances = calculateBalances(mission);
              const currentUser = membersWithBalances[0];
              const totalExpenses = mission.expenses.reduce((sum, exp) => sum + exp.amount, 0);
              const dueDate = mission.settledAt ? new Date(mission.settledAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

              return (
                <div
                  key={mission.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/mission/${mission.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-md)' }}>
                    <div style={{ fontSize: '2rem' }}>⛰️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-xs)' }}>
                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{mission.title}</h3>
                        <div style={{ fontSize: '1.25rem' }}>→</div>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                        👥 {mission.members.length} members
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                        Total expenses ${totalExpenses.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        Due {dueDate.toISOString().split('T')[0]}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {currentUser && (
                        <div
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: currentUser.balance > 0 ? 'var(--color-green)' : currentUser.balance < 0 ? 'var(--color-coral)' : 'var(--color-text-light)',
                          }}
                        >
                          Your balance {currentUser.balance > 0 ? '+' : ''}${currentUser.balance.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settled Missions */}
      {settledMissions.length > 0 && (
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            SETTLED
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {settledMissions.map((mission) => {
              const totalExpenses = mission.expenses.reduce((sum, exp) => sum + exp.amount, 0);
              const dueDate = mission.settledAt ? new Date(mission.settledAt) : new Date();

              return (
                <div
                  key={mission.id}
                  className="card"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/mission/${mission.id}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: 'var(--spacing-md)' }}>
                    <div style={{ fontSize: '2rem' }}>🍽️</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-xs)' }}>
                        <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>{mission.title}</h3>
                        <span className="badge badge-success">Settled ✓</span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                        👥 {mission.members.length} members
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                        Total expenses ${totalExpenses.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                        Due {dueDate.toISOString().split('T')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {missions.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>No shared groups yet</h3>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            Create your first shared group to start tracking shared expenses
          </p>
        </div>
      )}
    </div>
  );
}
