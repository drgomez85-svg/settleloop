import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAutoSplitStore } from '../store/autosplitStore';
import { useMissionStore } from '../store/missionStore';
import { useBankingStore } from '../store/bankingStore';
import { AutoSplitRuleCard } from '../components/AutoSplitRuleCard';
import { AutoSplitRuleWizard } from '../components/AutoSplitRuleWizard';
import { BulkBillWizard } from '../components/BulkBillWizard';
import { BillPackCard } from '../components/BillPackCard';

export function RecurringExpenses() {
  const navigate = useNavigate();
  const { rules, billPacks, getBillPacksForMission } = useAutoSplitStore();
  const { missions } = useMissionStore();
  const [showWizard, setShowWizard] = useState(false);
  const [showBulkWizard, setShowBulkWizard] = useState(false);
  const [showMissionSelector, setShowMissionSelector] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);

  const activeMissions = missions.filter((m) => m.status === 'active');
  const activeRules = rules.filter((r) => r.status === 'active');
  const pausedRules = rules.filter((r) => r.status === 'paused');

  const handleCreateRule = () => {
    if (activeMissions.length === 0) {
      alert('Please create a Shared Ledger first before adding recurring expense rules.');
      navigate('/mission/new');
      return;
    }
    
    if (activeMissions.length === 1) {
      setSelectedMissionId(activeMissions[0].id);
      setEditingRule(null);
      setShowWizard(true);
    } else {
      // Show mission selector
      setShowMissionSelector(true);
    }
  };

  const handleMissionSelect = (missionId: string) => {
    setSelectedMissionId(missionId);
    setEditingRule(null);
    setShowMissionSelector(false);
    setShowWizard(true);
  };

  const handleMissionSelectForBulk = (missionId: string) => {
    setSelectedMissionId(missionId);
    setShowMissionSelector(false);
    setShowBulkWizard(true);
  };

  // Mission Selector Modal
  if (showMissionSelector) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setShowMissionSelector(false)}
          >
            ← Back
          </button>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 'var(--spacing-lg)', fontWeight: '600' }}>
            Select Shared Ledger
          </h2>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            Choose which shared ledger this recurring expense rule should apply to:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {activeMissions.map((mission) => (
              <button
                key={mission.id}
                className="btn btn-secondary"
                onClick={() => handleMissionSelect(mission.id)}
                style={{
                  padding: 'var(--spacing-md)',
                  textAlign: 'left',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
                    {mission.title}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                    {mission.members.length} members
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem' }}>→</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Bulk Wizard View
  if (showBulkWizard && selectedMissionId) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowBulkWizard(false);
              setSelectedMissionId(null);
              setSelectedPackId(null);
            }}
          >
            ← Back
          </button>
        </div>
        <BulkBillWizard
          missionId={selectedMissionId}
          billPackId={selectedPackId || undefined}
          onComplete={() => {
            setShowBulkWizard(false);
            setSelectedMissionId(null);
            setSelectedPackId(null);
          }}
          onCancel={() => {
            setShowBulkWizard(false);
            setSelectedMissionId(null);
            setSelectedPackId(null);
          }}
        />
      </div>
    );
  }

  // Wizard View
  if (showWizard && selectedMissionId) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setShowWizard(false);
              setSelectedMissionId(null);
              setEditingRule(null);
            }}
          >
            ← Back
          </button>
        </div>
        <AutoSplitRuleWizard
          missionId={selectedMissionId}
          onComplete={() => {
            setShowWizard(false);
            setSelectedMissionId(null);
            setEditingRule(null);
          }}
          onCancel={() => {
            setShowWizard(false);
            setSelectedMissionId(null);
            setEditingRule(null);
          }}
          editingRule={editingRule}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/settleloop')}
          style={{ padding: 'var(--spacing-xs)' }}
        >
          ←
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', flex: 1 }}>Recurring Expenses</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (activeMissions.length === 0) {
                alert('Please create a Shared Ledger first before adding bills.');
                navigate('/mission/new');
                return;
              }
              if (activeMissions.length === 1) {
                setSelectedMissionId(activeMissions[0].id);
                setShowBulkWizard(true);
              } else {
                setShowMissionSelector(true);
              }
            }}
            style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
          >
            + Add Multiple Bills
          </button>
          <button
            className="btn btn-primary"
            onClick={handleCreateRule}
            style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '0.875rem' }}
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
            {billPacks.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Bill Packs</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-green)' }}>
            {activeRules.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Active Rules</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-md)' }}>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
            {pausedRules.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Paused</div>
        </div>
      </div>

      {/* Bill Packs */}
      {missions.map((mission) => {
        const packs = getBillPacksForMission(mission.id);
        if (packs.length === 0) return null;
        
        return (
          <div key={mission.id} style={{ marginBottom: 'var(--spacing-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
                {mission.title} - BILL PACKS ({packs.length})
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedMissionId(mission.id);
                  setShowBulkWizard(true);
                }}
                style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                + Add Pack
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {packs.map((pack) => (
                <BillPackCard
                  key={pack.id}
                  pack={pack}
                  onAddBills={() => {
                    setSelectedMissionId(mission.id);
                    setSelectedPackId(pack.id);
                    setShowBulkWizard(true);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Standalone Rules (not in packs) */}
      {activeRules.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            ACTIVE RULES ({activeRules.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {activeRules.filter(r => !r.billPackId).map((rule) => {
              const mission = missions.find((m) => m.id === rule.missionId);
              return (
                <div key={rule.id}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                    {mission?.title || 'Unknown Ledger'}
                  </div>
                  <AutoSplitRuleCard
                    rule={rule}
                    onEdit={() => {
                      setSelectedMissionId(rule.missionId);
                      setEditingRule(rule);
                      setShowWizard(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Paused Rules */}
      {pausedRules.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            PAUSED RULES ({pausedRules.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {pausedRules.map((rule) => {
              const mission = missions.find((m) => m.id === rule.missionId);
              return (
                <div key={rule.id}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xs)' }}>
                    {mission?.title || 'Unknown Ledger'}
                  </div>
                  <AutoSplitRuleCard
                    rule={rule}
                    onEdit={() => {
                      setSelectedMissionId(rule.missionId);
                      setEditingRule(rule);
                      setShowWizard(true);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rules.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔄</div>
          <h3 style={{ marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>No recurring expense rules yet</h3>
          <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-lg)' }}>
            Create rules to automatically split recurring expenses like subscriptions, rent, and utilities
          </p>
          {activeMissions.length === 0 ? (
            <div>
              <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-md)' }}>
                You need to create a Shared Group first
              </p>
              <button className="btn btn-primary" onClick={() => navigate('/mission/new')}>
                Create Shared Group
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleCreateRule}>
              Create Your First Rule
            </button>
          )}
        </div>
      )}
    </div>
  );
}
