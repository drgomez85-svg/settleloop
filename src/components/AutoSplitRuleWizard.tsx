import { useState } from 'react';
import { AutoSplitRule, DetectionMethod, SplitType, RecurrenceType } from '../types';
import { useBankingStore } from '../store/bankingStore';
import { useAuthStore } from '../store/authStore';
import { useAutoSplitStore } from '../store/autosplitStore';
import { useMissionStore } from '../store/missionStore';

interface AutoSplitRuleWizardProps {
  missionId: string;
  onComplete: () => void;
  onCancel: () => void;
  editingRule?: AutoSplitRule;
}

export function AutoSplitRuleWizard({ missionId, onComplete, onCancel, editingRule }: AutoSplitRuleWizardProps) {
  const { accounts, getAllTransactions } = useBankingStore();
  const { userName } = useAuthStore();
  const { createRule, updateRule } = useAutoSplitStore();
  const { getMission } = useMissionStore();
  const mission = getMission(missionId);
  
  // Get unique merchants from transactions for the selected account
  const getMerchantsFromTransactions = (accountId: string) => {
    const transactions = getAllTransactions();
    const accountTransactions = transactions.filter(
      t => t.accountId === accountId && 
      t.status === 'completed' &&
      (t.type === 'payment' || t.type === 'charge' || t.type === 'withdrawal')
    );
    
    // Extract unique merchant names from descriptions
    const merchants = new Map<string, { name: string; amount: number; count: number }>();
    
    accountTransactions.forEach(t => {
      const desc = t.description.toUpperCase();
      // Extract merchant name (remove common suffixes)
      let merchantName = desc
        .replace(/\s+(COM|CA|INC|LLC|LTD)$/i, '')
        .replace(/\s+PAYMENT$/i, '')
        .trim();
      
      if (merchantName && merchantName.length > 2) {
        const key = merchantName;
        if (merchants.has(key)) {
          const existing = merchants.get(key)!;
          merchants.set(key, {
            name: merchantName,
            amount: existing.amount + Math.abs(t.amount),
            count: existing.count + 1,
          });
        } else {
          merchants.set(key, {
            name: merchantName,
            amount: Math.abs(t.amount),
            count: 1,
          });
        }
      }
    });
    
    // Sort by frequency (count) and return as array
    return Array.from(merchants.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 most frequent
  };
  
  const [step, setStep] = useState(1);
  const [ruleData, setRuleData] = useState<Partial<AutoSplitRule>>({
    name: editingRule?.name || '',
    accountId: editingRule?.accountId || '',
    detectionMethod: editingRule?.detectionMethod || 'merchant',
    merchantMatch: editingRule?.merchantMatch || '',
    containsText: editingRule?.containsText || '',
    exactAmount: editingRule?.exactAmount,
    amountMin: editingRule?.amountMin,
    amountMax: editingRule?.amountMax,
    category: editingRule?.category || '',
    paidBy: editingRule?.paidBy || (mission?.members.find(m => m.name === userName)?.id || mission?.members[0]?.id || ''),
    participants: editingRule?.participants || [],
    splitType: editingRule?.splitType || 'EQUAL',
    splitConfig: editingRule?.splitConfig || {},
    recurrence: editingRule?.recurrence || 'monthly',
    expectedDayOfMonth: editingRule?.expectedDayOfMonth,
    expectedDayRange: editingRule?.expectedDayRange || { start: 1, end: 5 },
    actions: {
      autoCreateExpense: editingRule?.actions?.autoCreateExpense !== undefined ? editingRule.actions.autoCreateExpense : true,
      autoSendRequests: editingRule?.actions?.autoSendRequests || false,
    },
    status: editingRule?.status || 'active',
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = () => {
    if (!ruleData.name || !ruleData.accountId || !ruleData.paidBy || !ruleData.participants || ruleData.participants.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingRule) {
      updateRule(editingRule.id, ruleData as Partial<AutoSplitRule>);
    } else {
      createRule({
        ...ruleData,
        missionId,
      } as Omit<AutoSplitRule, 'id' | 'createdAt' | 'matchCount'>);
    }
    onComplete();
  };

  const availableAccounts = accounts.filter(acc => 
    acc.type === 'chequing' || acc.type === 'savings' || acc.type === 'credit'
  );

  const availableMembers = mission?.members || [];

  // Step 1: Name and Account
  if (step === 1) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 1: Rule Name & Account</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Rule Name *
            </label>
            <input
              className="input"
              type="text"
              value={ruleData.name}
              onChange={(e) => setRuleData({ ...ruleData, name: e.target.value })}
              placeholder="e.g., Netflix Subscription"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Watch Account *
            </label>
            <select
              className="input"
              value={ruleData.accountId}
              onChange={(e) => setRuleData({ ...ruleData, accountId: e.target.value })}
            >
              <option value="">Select an account</option>
              {availableAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumber}) - ${acc.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Detection Method
  if (step === 2) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 2: How to Detect</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Detection Method *
            </label>
            <select
              className="input"
              value={ruleData.detectionMethod}
              onChange={(e) => setRuleData({ ...ruleData, detectionMethod: e.target.value as DetectionMethod })}
            >
              <option value="merchant">Merchant Name (e.g., "NETFLIX")</option>
              <option value="contains">Contains Text</option>
              <option value="exactAmount">Exact Amount</option>
              <option value="amountRange">Amount Range</option>
              <option value="category">Category</option>
            </select>
          </div>

          {ruleData.detectionMethod === 'merchant' && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Merchant Name *
              </label>
              {ruleData.accountId ? (
                <>
                  <input
                    className="input"
                    type="text"
                    value={ruleData.merchantMatch || ''}
                    onChange={(e) => setRuleData({ ...ruleData, merchantMatch: e.target.value })}
                    placeholder="e.g., NETFLIX, ROGERS, TORONTO HYDRO"
                    style={{ marginBottom: 'var(--spacing-sm)' }}
                  />
                  {(() => {
                    const merchants = getMerchantsFromTransactions(ruleData.accountId);
                    if (merchants.length > 0) {
                      return (
                        <div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                            Or select from your recent transactions:
                          </div>
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                            gap: 'var(--spacing-sm)',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            padding: 'var(--spacing-sm)',
                            backgroundColor: 'var(--color-background)',
                            borderRadius: 'var(--radius-md)',
                          }}>
                            {merchants.map((merchant, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                  setRuleData({ 
                                    ...ruleData, 
                                    merchantMatch: merchant.name,
                                    name: ruleData.name || merchant.name,
                                  });
                                }}
                                style={{
                                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                                  fontSize: '0.75rem',
                                  textAlign: 'left',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                                title={`${merchant.name} - $${merchant.amount.toFixed(2)} (${merchant.count}x)`}
                              >
                                {merchant.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : (
                <input
                  className="input"
                  type="text"
                  value={ruleData.merchantMatch || ''}
                  onChange={(e) => setRuleData({ ...ruleData, merchantMatch: e.target.value })}
                  placeholder="Select an account first to see suggestions"
                  disabled
                />
              )}
            </div>
          )}

          {ruleData.detectionMethod === 'contains' && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Text to Match *
              </label>
              <input
                className="input"
                type="text"
                value={ruleData.containsText || ''}
                onChange={(e) => setRuleData({ ...ruleData, containsText: e.target.value })}
                placeholder="e.g., Netflix, Rogers"
              />
            </div>
          )}

          {ruleData.detectionMethod === 'exactAmount' && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Exact Amount (CAD) *
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={ruleData.exactAmount || ''}
                onChange={(e) => setRuleData({ ...ruleData, exactAmount: parseFloat(e.target.value) || undefined })}
                placeholder="0.00"
              />
            </div>
          )}

          {ruleData.detectionMethod === 'amountRange' && (
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                  Min Amount (CAD) *
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={ruleData.amountMin || ''}
                  onChange={(e) => setRuleData({ ...ruleData, amountMin: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                  Max Amount (CAD) *
                </label>
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={ruleData.amountMax || ''}
                  onChange={(e) => setRuleData({ ...ruleData, amountMax: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {ruleData.detectionMethod === 'category' && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Category *
              </label>
              <input
                className="input"
                type="text"
                value={ruleData.category || ''}
                onChange={(e) => setRuleData({ ...ruleData, category: e.target.value })}
                placeholder="e.g., Entertainment, Utilities"
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Split Setup
  if (step === 3) {
    const handleParticipantToggle = (memberId: string) => {
      const current = ruleData.participants || [];
      if (current.includes(memberId)) {
        setRuleData({ ...ruleData, participants: current.filter(id => id !== memberId) });
      } else {
        setRuleData({ ...ruleData, participants: [...current, memberId] });
      }
    };

    const handleSplitValueChange = (index: number, value: number) => {
      const values = ruleData.splitConfig?.values || [];
      const newValues = [...values];
      newValues[index] = value;
      setRuleData({ ...ruleData, splitConfig: { ...ruleData.splitConfig, values: newValues } });
    };

    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 3: Split Setup</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Paid By *
            </label>
            <select
              className="input"
              value={ruleData.paidBy}
              onChange={(e) => setRuleData({ ...ruleData, paidBy: e.target.value })}
            >
              {availableMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Participants *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              {availableMembers.map((member) => (
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
                    checked={(ruleData.participants || []).includes(member.id)}
                    onChange={() => handleParticipantToggle(member.id)}
                  />
                  <span>{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Split Type *
            </label>
            <select
              className="input"
              value={ruleData.splitType}
              onChange={(e) => {
                const newSplitType = e.target.value as SplitType;
                setRuleData({ 
                  ...ruleData, 
                  splitType: newSplitType,
                  splitConfig: { values: newSplitType === 'EQUAL' ? undefined : [] }
                });
              }}
            >
              <option value="EQUAL">Equal Split</option>
              <option value="PERCENT">Percentage</option>
              <option value="AMOUNT">Fixed Amount</option>
            </select>
          </div>

          {ruleData.splitType === 'PERCENT' && ruleData.participants && ruleData.participants.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Percentages (must total 100%)
              </label>
              {ruleData.participants.map((memberId, idx) => {
                const member = availableMembers.find(m => m.id === memberId);
                const values = ruleData.splitConfig?.values || [];
                return (
                  <div key={memberId} style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                      {member?.name}
                    </label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={values[idx] || 0}
                      onChange={(e) => handleSplitValueChange(idx, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {ruleData.splitType === 'AMOUNT' && ruleData.participants && ruleData.participants.length > 0 && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Fixed Amounts (CAD)
              </label>
              {ruleData.participants.map((memberId, idx) => {
                const member = availableMembers.find(m => m.id === memberId);
                const values = ruleData.splitConfig?.values || [];
                return (
                  <div key={memberId} style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem' }}>
                      {member?.name}
                    </label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={values[idx] || 0}
                      onChange={(e) => handleSplitValueChange(idx, parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Recurrence
  if (step === 4) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 4: Recurrence (Optional)</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Recurrence Pattern
            </label>
            <select
              className="input"
              value={ruleData.recurrence || 'monthly'}
              onChange={(e) => setRuleData({ ...ruleData, recurrence: e.target.value as RecurrenceType })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {ruleData.recurrence === 'monthly' && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Expected Day Range (e.g., 1-5 for "around the 1st")
              </label>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="31"
                    value={ruleData.expectedDayRange?.start || 1}
                    onChange={(e) => setRuleData({
                      ...ruleData,
                      expectedDayRange: { start: parseInt(e.target.value) || 1, end: ruleData.expectedDayRange?.end || 5 }
                    })}
                    placeholder="Start"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="31"
                    value={ruleData.expectedDayRange?.end || 5}
                    onChange={(e) => setRuleData({
                      ...ruleData,
                      expectedDayRange: { start: ruleData.expectedDayRange?.start || 1, end: parseInt(e.target.value) || 5 }
                    })}
                    placeholder="End"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Confirm & Enable
  if (step === 5) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 5: Confirm & Enable</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Rule Name:</strong> {ruleData.name}
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Account:</strong> {availableAccounts.find(a => a.id === ruleData.accountId)?.name}
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Detection:</strong> {ruleData.detectionMethod}
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Split:</strong> {ruleData.splitType} among {ruleData.participants?.length || 0} participants
            </div>
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <strong>Recurrence:</strong> {ruleData.recurrence || 'One-time'}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ruleData.actions?.autoCreateExpense ?? true}
              onChange={(e) => setRuleData({ ...ruleData, actions: { autoCreateExpense: e.target.checked, autoSendRequests: ruleData.actions?.autoSendRequests ?? false } })}
            />
            <span>Auto-create ledger expense when matched</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={ruleData.actions?.autoSendRequests ?? false}
              onChange={(e) => setRuleData({ ...ruleData, actions: { autoCreateExpense: ruleData.actions?.autoCreateExpense ?? true, autoSendRequests: e.target.checked } })}
            />
            <span>Auto-send request to other participants</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            {editingRule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
