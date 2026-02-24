import { useState } from 'react';
import { AutoSplitRule, DetectionMethod, SplitType, RecurrenceType, BillPack } from '../types';
import { useBankingStore } from '../store/bankingStore';
import { useAuthStore } from '../store/authStore';
import { useAutoSplitStore } from '../store/autosplitStore';
import { useMissionStore } from '../store/missionStore';

interface BulkBillWizardProps {
  missionId: string;
  billPackId?: string; // Optional: add to existing pack
  onComplete: () => void;
  onCancel: () => void;
}

interface SelectedMerchant {
  name: string;
  accountId: string;
  amount: number;
  count: number;
}

export function BulkBillWizard({ missionId, billPackId, onComplete, onCancel }: BulkBillWizardProps) {
  const { accounts, getAllTransactions } = useBankingStore();
  const { userName } = useAuthStore();
  const { createRulesBulk, createBillPack, getBillPack } = useAutoSplitStore();
  const { getMission } = useMissionStore();
  const mission = getMission(missionId);
  
  const [step, setStep] = useState(1);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedMerchants, setSelectedMerchants] = useState<SelectedMerchant[]>([]);
  const [splitConfig, setSplitConfig] = useState({
    paidBy: mission?.members.find(m => m.name === userName)?.id || mission?.members[0]?.id || '',
    participants: mission?.members.map(m => m.id) || [],
    splitType: 'EQUAL' as SplitType,
    recurrence: 'monthly' as RecurrenceType,
  });
  const [packName, setPackName] = useState('');
  const [autoSendRequest, setAutoSendRequest] = useState(true);
  const [requestDay, setRequestDay] = useState(1);
  const [safetyLimit, setSafetyLimit] = useState<number | undefined>(200);

  const availableAccounts = accounts.filter(acc => 
    acc.type === 'chequing' || acc.type === 'savings' || acc.type === 'credit'
  );

  const availableMembers = mission?.members || [];

  // Get merchants from selected accounts
  const getMerchantsFromAccounts = (accountIds: string[]): SelectedMerchant[] => {
    const transactions = getAllTransactions();
    const merchants = new Map<string, SelectedMerchant>();
    
    accountIds.forEach(accountId => {
      const accountTransactions = transactions.filter(
        t => t.accountId === accountId && 
        t.status === 'completed' &&
        (t.type === 'payment' || t.type === 'charge' || t.type === 'withdrawal')
      );
      
      accountTransactions.forEach(t => {
        const desc = t.description.toUpperCase();
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
              accountId: existing.accountId, // Keep first account
              amount: existing.amount + Math.abs(t.amount),
              count: existing.count + 1,
            });
          } else {
            merchants.set(key, {
              name: merchantName,
              accountId: accountId,
              amount: Math.abs(t.amount),
              count: 1,
            });
          }
        }
      });
    });
    
    return Array.from(merchants.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  };

  const handleAccountToggle = (accountId: string) => {
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    } else {
      setSelectedAccounts([...selectedAccounts, accountId]);
    }
  };

  const handleMerchantToggle = (merchant: SelectedMerchant) => {
    if (selectedMerchants.some(m => m.name === merchant.name)) {
      setSelectedMerchants(selectedMerchants.filter(m => m.name !== merchant.name));
    } else {
      setSelectedMerchants([...selectedMerchants, merchant]);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedAccounts.length === 0) {
      alert('Please select at least one account');
      return;
    }
    if (step === 2 && selectedMerchants.length === 0) {
      alert('Please select at least one merchant');
      return;
    }
    if (step === 3 && (!splitConfig.paidBy || splitConfig.participants.length === 0)) {
      alert('Please configure split settings');
      return;
    }
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = () => {
    if (!packName.trim() && !billPackId) {
      alert('Please enter a pack name');
      return;
    }

    // Create or get bill pack
    let finalPackId = billPackId;
    if (!finalPackId) {
      finalPackId = createBillPack({
        missionId,
        name: packName,
        autoSendMonthlyRequest: autoSendRequest,
        requestDayOfMonth: requestDay,
        safetyLimit: safetyLimit,
        mode: 'request-only',
        status: 'active',
      });
    }

    // Create rules for each selected merchant
    const rulesToCreate = selectedMerchants.map(merchant => ({
      missionId,
      billPackId: finalPackId,
      name: merchant.name,
      accountId: merchant.accountId,
      detectionMethod: 'merchant' as DetectionMethod,
      merchantMatch: merchant.name,
      paidBy: splitConfig.paidBy,
      participants: splitConfig.participants,
      splitType: splitConfig.splitType,
      splitConfig: {},
      recurrence: splitConfig.recurrence,
      expectedDayRange: { start: 1, end: 5 },
      autoCreateExpense: true,
      includeInMonthlyRequest: true,
      status: 'active' as RuleStatus,
    }));

    createRulesBulk(rulesToCreate);
    onComplete();
  };

  // Step 1: Select Accounts
  if (step === 1) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 1: Choose Accounts to Watch</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {availableAccounts.map((account) => (
            <label
              key={account.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                backgroundColor: selectedAccounts.includes(account.id) ? 'var(--color-primary-bg)' : 'var(--color-card)',
              }}
            >
              <input
                type="checkbox"
                checked={selectedAccounts.includes(account.id)}
                onChange={() => handleAccountToggle(account.id)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{account.name}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                  {account.accountNumber} • ${account.balance.toFixed(2)}
                </div>
              </div>
            </label>
          ))}
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

  // Step 2: Select Merchants
  if (step === 2) {
    const availableMerchants = getMerchantsFromAccounts(selectedAccounts);

    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 2: Select Multiple Bills</h3>
        
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            className="input"
            type="text"
            placeholder="Search merchants..."
            onChange={(e) => {
              // Simple search - could be enhanced
              const search = e.target.value.toLowerCase();
              // Filter logic would go here
            }}
            style={{ marginBottom: 'var(--spacing-sm)' }}
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: 'var(--spacing-sm)',
          maxHeight: '400px',
          overflowY: 'auto',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-md)',
        }}>
          {availableMerchants.map((merchant, idx) => {
            const isSelected = selectedMerchants.some(m => m.name === merchant.name);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleMerchantToggle(merchant)}
                style={{
                  padding: 'var(--spacing-md)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--color-primary-bg)' : 'var(--color-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                  {isSelected && <span>✓</span>}
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{merchant.name}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  ${merchant.amount.toFixed(2)} • {merchant.count}x
                </div>
              </button>
            );
          })}
        </div>

        {selectedMerchants.length > 0 && (
          <div style={{ 
            marginTop: 'var(--spacing-md)', 
            padding: 'var(--spacing-sm)', 
            backgroundColor: 'var(--color-primary-bg)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
          }}>
            {selectedMerchants.length} bill{selectedMerchants.length !== 1 ? 's' : ''} selected
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Split Settings
  if (step === 3) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 3: Apply Split Settings to All</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Paid By *
            </label>
            <select
              className="input"
              value={splitConfig.paidBy}
              onChange={(e) => setSplitConfig({ ...splitConfig, paidBy: e.target.value })}
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
                    checked={splitConfig.participants.includes(member.id)}
                    onChange={() => {
                      const current = splitConfig.participants;
                      if (current.includes(member.id)) {
                        setSplitConfig({ ...splitConfig, participants: current.filter(id => id !== member.id) });
                      } else {
                        setSplitConfig({ ...splitConfig, participants: [...current, member.id] });
                      }
                    }}
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
              value={splitConfig.splitType}
              onChange={(e) => setSplitConfig({ ...splitConfig, splitType: e.target.value as SplitType })}
            >
              <option value="EQUAL">Equal Split</option>
              <option value="PERCENT">Percentage</option>
              <option value="AMOUNT">Fixed Amount</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
              Recurrence
            </label>
            <select
              className="input"
              value={splitConfig.recurrence}
              onChange={(e) => setSplitConfig({ ...splitConfig, recurrence: e.target.value as RecurrenceType })}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-weekly</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleNext} style={{ flex: 1 }}>
            Next
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Pack Settings & Confirm
  if (step === 4) {
    const existingPack = billPackId ? getBillPack(billPackId) : null;

    return (
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Step 4: Bill Pack Settings</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {!existingPack && (
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500' }}>
                Pack Name *
              </label>
              <input
                className="input"
                type="text"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                placeholder="e.g., Subscriptions & Utilities"
              />
            </div>
          )}

          {existingPack && (
            <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Adding to:</div>
              <div>{existingPack.name}</div>
            </div>
          )}

          <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>Summary:</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
              Creating {selectedMerchants.length} bill rule{selectedMerchants.length !== 1 ? 's' : ''}:
            </div>
            {selectedMerchants.map((merchant, idx) => (
              <div key={idx} style={{ fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                • {merchant.name} ({accounts.find(a => a.id === merchant.accountId)?.name})
              </div>
            ))}
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer', marginBottom: 'var(--spacing-md)' }}>
              <input
                type="checkbox"
                checked={autoSendRequest}
                onChange={(e) => setAutoSendRequest(e.target.checked)}
              />
              <span>Auto-send monthly Interac requests</span>
            </label>

            {autoSendRequest && (
              <div style={{ marginLeft: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500', fontSize: '0.875rem' }}>
                    Send on day of month
                  </label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="31"
                    value={requestDay}
                    onChange={(e) => setRequestDay(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: '500', fontSize: '0.875rem' }}>
                    Safety limit (require review if over)
                  </label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={safetyLimit || ''}
                    onChange={(e) => setSafetyLimit(e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="e.g., 200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={() => setStep(3)} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1 }}>
            Create Bills
          </button>
        </div>
      </div>
    );
  }

  return null;
}
