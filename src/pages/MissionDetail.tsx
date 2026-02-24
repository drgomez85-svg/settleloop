import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useBankingStore } from '../store/bankingStore';
import { MemberCard } from '../components/MemberCard';
import { ExpenseCard } from '../components/ExpenseCard';
import { ExpenseForm } from '../components/ExpenseForm';
import { optimizeSettlements } from '../utils/settlementOptimizer';
import { Expense, Member } from '../types';
import { calculateBalances } from '../utils/balanceEngine';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAutoSplitStore } from '../store/autosplitStore';

export function MissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getMission,
    addMember,
    updateMember,
    removeMember,
    addExpense,
    updateExpense,
    removeExpense,
    markSettled,
    reopenMission,
    deleteMission,
  } = useMissionStore();
  const { contacts } = useBankingStore();

  const mission = id ? getMission(id) : null;
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMultipleMembers, setShowAddMultipleMembers] = useState(false);
  const [multipleMemberNames, setMultipleMemberNames] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingMemberName, setEditingMemberName] = useState('');
  const [showLoading, setShowLoading] = useState(false);
  const [showFromContacts, setShowFromContacts] = useState(false);
  
  const { getRulesForMission, checkTransactions, deleteRulesForMission } = useAutoSplitStore();
  const autoSplitRules = getRulesForMission(mission?.id || '');
  
  // Check for new transactions when component mounts or when transactions change
  useEffect(() => {
    if (mission?.id) {
      checkTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id]);

  if (!mission) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        <p>Shared Ledger not found</p>
        <button className="btn btn-secondary" onClick={() => navigate('/settleloop')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Recalculate balances to ensure they're always up to date
  const membersWithBalances = calculateBalances(mission);
  const summary = optimizeSettlements(membersWithBalances);
  
  // Calculate totals for export
  const currentUserForExport = membersWithBalances[0];
  const totalOwedForExport = currentUserForExport && currentUserForExport.balance > 0 ? currentUserForExport.balance : 0;
  const totalOwingForExport = currentUserForExport && currentUserForExport.balance < 0 ? Math.abs(currentUserForExport.balance) : 0;

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      addMember(mission.id, newMemberName.trim());
      setNewMemberName('');
      setShowAddMember(false);
    }
  };

  const handleAddMultipleMembers = () => {
    if (multipleMemberNames.trim()) {
      // Split by comma, newline, or semicolon
      const names = multipleMemberNames
        .split(/[,\n;]/)
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      names.forEach(name => {
        addMember(mission.id, name);
      });
      
      setMultipleMemberNames('');
      setShowAddMultipleMembers(false);
    }
  };

  const handleAddFromContact = (contactName: string) => {
    // Check if member already exists
    const existingMember = membersWithBalances.find(m => 
      m.name.toLowerCase() === contactName.toLowerCase()
    );
    
    if (!existingMember) {
      addMember(mission.id, contactName);
    }
    setShowFromContacts(false);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    setEditingMemberName(member.name);
  };

  const handleSaveMember = () => {
    if (editingMember && editingMemberName.trim()) {
      updateMember(mission.id, editingMember.id, { name: editingMemberName.trim() });
      setEditingMember(null);
      setEditingMemberName('');
    }
  };

  const handleAddExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    addExpense(mission.id, expense);
    setShowExpenseForm(false);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleUpdateExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    if (editingExpense) {
      updateExpense(mission.id, editingExpense.id, expense);
      setEditingExpense(null);
      setShowExpenseForm(false);
    }
  };

  const handleSettleAll = () => {
    setShowLoading(true);
  };

  const handleLoadingComplete = () => {
    setShowLoading(false);
    navigate(`/mission/${mission.id}/settle`);
  };

  if (showLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  if (showExpenseForm) {
    return (
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
          style={{ marginBottom: 'var(--spacing-md)' }}
        >
          ← Back
        </button>
        <ExpenseForm
          members={membersWithBalances}
          expense={editingExpense || undefined}
          onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
          onCancel={() => {
            setShowExpenseForm(false);
            setEditingExpense(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/settleloop')} style={{ padding: 'var(--spacing-xs)' }}>
          ←
        </button>
        <div style={{ fontSize: '1.5rem' }}>⛰️</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>{mission.title}</h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            {mission.members.length} members · Due {mission.settledAt ? new Date(mission.settledAt).toISOString().split('T')[0] : '2026-03-15'}
          </div>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={() => {
            // Export/share ledger details
            const exportData = {
              title: mission.title,
              members: mission.members.map(m => ({
                name: m.name,
                balance: m.balance,
              })),
              expenses: mission.expenses.map(e => ({
                title: e.title,
                amount: e.amount,
                paidBy: membersWithBalances.find(m => m.id === e.paidBy)?.name || 'Unknown',
                splits: e.splits.map(s => ({
                  member: membersWithBalances.find(m => m.id === s.memberId)?.name || 'Unknown',
                  amount: s.amount,
                })),
              })),
              summary: {
                totalExpenses: mission.expenses.reduce((sum, e) => sum + e.amount, 0),
                totalOwed: totalOwedForExport,
                totalOwing: totalOwingForExport,
              },
              settlements: summary.transfers.map(t => ({
                from: membersWithBalances.find(m => m.id === t.from)?.name || 'Unknown',
                to: membersWithBalances.find(m => m.id === t.to)?.name || 'Unknown',
                amount: t.amount,
              })),
            };
            
            // Copy to clipboard as JSON
            const jsonString = JSON.stringify(exportData, null, 2);
            navigator.clipboard.writeText(jsonString).then(() => {
              alert('Ledger details copied to clipboard!');
            }).catch(() => {
              // Fallback: show in prompt
              prompt('Ledger Details (copy this):', jsonString);
            });
          }}
          style={{ padding: 'var(--spacing-xs)' }}
          title="Export/Share Ledger"
        >
          📤
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        {mission.status === 'settled' ? (
          <button className="btn btn-secondary" onClick={() => reopenMission(mission.id)} style={{ flex: 1 }}>
            Reopen
          </button>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => markSettled(mission.id)} style={{ flex: 1 }}>
              ✓ Mark Settled
            </button>
            <button 
              className="btn btn-danger" 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${mission.title}"? This will permanently delete all members, expenses, and recurring expense rules for this shared ledger. This action cannot be undone.`)) {
                  // Delete all AutoSplit rules for this mission
                  deleteRulesForMission(mission.id);
                  
                  // Delete the mission
                  deleteMission(mission.id);
                  
                  // Navigate back to dashboard
                  navigate('/settleloop');
                }
              }}
              style={{ flex: 1 }}
            >
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {/* Members Section */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
            MEMBERS ({membersWithBalances.length})
          </h2>
          {!showAddMember && !showAddMultipleMembers && !showFromContacts && mission.status === 'active' && (
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              {contacts.length > 0 && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowFromContacts(true)}
                  style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                >
                  👥 From Contacts
                </button>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddMultipleMembers(true)}
                style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                  + Multiple
                </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowAddMember(true)}
                style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                + Add
              </button>
            </div>
          )}
        </div>

        {/* Add Single Member */}
        {showAddMember && (
          <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontWeight: '500', fontSize: '0.875rem' }}>Add Member</h3>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <input
                className="input"
                type="text"
                placeholder="Enter member name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                autoFocus
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleAddMember}>
                Add
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddMember(false);
                  setNewMemberName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Multiple Members */}
        {showAddMultipleMembers && (
          <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)', fontWeight: '500', fontSize: '0.875rem' }}>Add Multiple Members</h3>
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <textarea
                className="input"
                placeholder="Enter names separated by commas, semicolons, or new lines&#10;Example: John, Sarah, Mike"
                value={multipleMemberNames}
                onChange={(e) => setMultipleMemberNames(e.target.value)}
                rows={4}
                style={{ width: '100%', resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: 'var(--spacing-xs)' }}>
                Separate names with commas, semicolons, or new lines
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddMultipleMembers(false);
                  setMultipleMemberNames('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddMultipleMembers}
                disabled={!multipleMemberNames.trim()}
                style={{ flex: 1 }}
              >
                Add All
              </button>
            </div>
          </div>
        )}

        {/* Add From Contacts */}
        {showFromContacts && (
          <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
              <h3 style={{ fontWeight: '500', fontSize: '0.875rem' }}>Add from Contacts</h3>
              <button
                className="btn btn-secondary"
                onClick={() => setShowFromContacts(false)}
                style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
              >
                Cancel
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {contacts.map((contact) => {
                const isAlreadyMember = membersWithBalances.some(m => 
                  m.name.toLowerCase() === contact.name.toLowerCase()
                );
                return (
                  <div
                    key={contact.id}
                    className="card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-sm)',
                      opacity: isAlreadyMember ? 0.6 : 1,
                      cursor: isAlreadyMember ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !isAlreadyMember && handleAddFromContact(contact.name)}
                  >
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
                        fontSize: '0.875rem',
                      }}
                    >
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{contact.name}</div>
                      {contact.email && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{contact.email}</div>
                      )}
                    </div>
                    {isAlreadyMember ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Already added</span>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFromContact(contact.name);
                        }}
                        style={{ fontSize: '0.75rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {editingMember ? (
          <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <input
                className="input"
                type="text"
                value={editingMemberName}
                onChange={(e) => setEditingMemberName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveMember()}
                autoFocus
              />
              <button className="btn btn-primary" onClick={handleSaveMember}>
                Save
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditingMember(null);
                  setEditingMemberName('');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {membersWithBalances.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onEdit={mission.status === 'active' ? handleEditMember : undefined}
              onRemove={mission.status === 'active' ? (id) => removeMember(mission.id, id) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Optimized Settlements */}
      {mission.status === 'active' && summary.transfers.length > 0 && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            OPTIMIZED SETTLEMENTS
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {summary.transfers.map((transfer, idx) => {
              const fromMember = membersWithBalances.find((m) => m.id === transfer.from);
              const toMember = membersWithBalances.find((m) => m.id === transfer.to);
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-md)',
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
                    {toMember?.name[0] || 'Y'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settle All Button */}
      {mission.status === 'active' && summary.transfers.length > 0 && (
        <button
          className="btn btn-primary"
          onClick={handleSettleAll}
          style={{ width: '100%', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', fontSize: '1rem', fontWeight: '600' }}
        >
          ⏰ Settle All via e-Transfer
        </button>
      )}

      {/* AutoSplit Rules Quick Link */}
      {mission.status === 'active' && (
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
              RECURRING EXPENSES ({autoSplitRules.length})
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/recurring-expenses')}
              style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
            >
              Manage Rules →
            </button>
          </div>

          {autoSplitRules.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-md)' }}>
                No recurring expense rules for this ledger yet.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/recurring-expenses')}
              >
                Create Recurring Expense Rule
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: 'var(--spacing-md)' }}>
              <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-md)' }}>
                {autoSplitRules.length} active rule{autoSplitRules.length !== 1 ? 's' : ''} for this shared ledger.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/recurring-expenses')}
                style={{ width: '100%' }}
              >
                View & Manage Rules
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ledger Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
            LEDGER
          </h2>
          {mission.status === 'active' && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowExpenseForm(true)}
              style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
            >
              + Add Expense
            </button>
          )}
        </div>

        {mission.expenses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--color-text-light)' }}>No expenses yet. Add your first expense to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {mission.expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                members={membersWithBalances}
                onEdit={mission.status === 'active' ? handleEditExpense : undefined}
                onRemove={mission.status === 'active' ? (id) => removeExpense(mission.id, id) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


