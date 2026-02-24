import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useBankingStore } from '../store/bankingStore';
import { useNotificationStore } from '../store/notificationStore';
import { optimizeSettlements } from '../utils/settlementOptimizer';
import { calculateBalances } from '../utils/balanceEngine';
import { CANADIAN_BANKS, BankWithStyle } from '../data/banks';
import { SettlementSummary } from '../types';

type Step = 'summary' | 'bank' | 'confirm' | 'success';
type SettlementMode = 'send-request' | 'send-only' | 'request-only';

export function SettlementFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMission, markSettled, demoMode } = useMissionStore();
  const { getAccount, addTransaction } = useBankingStore();
  const { addNotification } = useNotificationStore();
  const [step, setStep] = useState<Step>('summary');
  const [selectedBank, setSelectedBank] = useState<BankWithStyle | null>(null);
  const [bankSearch, setBankSearch] = useState('');
  const [settlementMode, setSettlementMode] = useState<SettlementMode>('send-request');

  const mission = id ? getMission(id) : null;

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

  // Calculate current balances and summary
  const membersWithBalances = calculateBalances(mission);
  const summary: SettlementSummary = optimizeSettlements(membersWithBalances);

  // Determine current user (assuming first member is current user)
  const currentUser = membersWithBalances[0];
  
  // Calculate user's sends and requests
  const userSends = summary.transfers.filter(t => t.from === currentUser?.id);
  const userRequests = summary.transfers.filter(t => t.to === currentUser?.id);
  
  const totalSending = userSends.reduce((sum, t) => sum + t.amount, 0);
  const totalReceiving = userRequests.reduce((sum, t) => sum + t.amount, 0);
  const userBalance = (currentUser?.balance || 0);

  const handleNext = () => {
    if (step === 'summary') {
      if (demoMode) {
        setStep('confirm');
      } else {
        setStep('bank');
      }
    } else if (step === 'bank') {
      setStep('confirm');
    } else if (step === 'confirm') {
      // Process settlements and create notifications
      const chequingAccount = getAccount('chequing-1');
      
      // Process incoming payments (requests) - these create deposit notifications
      userRequests.forEach((transfer) => {
        const fromMember = membersWithBalances.find(m => m.id === transfer.from);
        if (fromMember && chequingAccount) {
          // Create deposit transaction for incoming e-transfer
          addTransaction({
            accountId: 'chequing-1',
            type: 'deposit',
            amount: transfer.amount,
            description: `E-Transfer from ${fromMember.name}`,
            category: 'Transfer',
            date: new Date().toISOString(),
            status: 'completed',
            sender: fromMember.name,
          });
          
          // Create notification with account details
          addNotification({
            type: 'deposit',
            title: 'Payment Received',
            message: `${fromMember.name} sent you $${transfer.amount.toFixed(2)} via e-Transfer. Deposited to account ending in ${chequingAccount.accountNumber}`,
            amount: transfer.amount,
            senderName: fromMember.name,
            accountNumber: chequingAccount.accountNumber,
          });
        }
      });
      
      markSettled(mission.id);
      setStep('success');
    }
  };

  const handleBack = () => {
    if (step === 'bank') {
      setStep('summary');
    } else if (step === 'confirm') {
      if (demoMode) {
        setStep('summary');
      } else {
        setStep('bank');
      }
    }
  };

  const filteredBanks = CANADIAN_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(bankSearch.toLowerCase())
  );

  // Step 1: Settlement Summary
  if (step === 'summary') {
    const totalSteps = 3;
    const currentStep = 1;

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-lg)' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={() => navigate(`/mission/${mission.id}`)} style={{ padding: 'var(--spacing-xs)' }}>
            ←
          </button>
          <div style={{ fontSize: '1.25rem' }}>👥</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '600', textTransform: 'uppercase' }}>
            SETTLEMENT SUMMARY
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
            <div style={{ fontSize: '1.5rem' }}>⛰️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{mission.title}</h1>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            {summary.transfers.length} transfer{summary.transfers.length !== 1 ? 's' : ''} needed to settle
          </div>
        </div>

        {/* Settlement Mode Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button
            className={settlementMode === 'send-request' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setSettlementMode('send-request')}
            style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}
          >
            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Send & Request</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Settle everything</div>
          </button>
          <button
            className={settlementMode === 'send-only' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setSettlementMode('send-only')}
            style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}
          >
            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Send Only</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Pay what you owe</div>
          </button>
          <button
            className={settlementMode === 'request-only' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setSettlementMode('request-only')}
            style={{ padding: 'var(--spacing-md)', fontSize: '0.875rem' }}
          >
            <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Request Only</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Collect what's owed</div>
          </button>
        </div>

        {/* YOU SEND Section - Show based on mode */}
        {(settlementMode === 'send-only' || settlementMode === 'send-request') && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
              YOU SEND
            </h3>
            {userSends.length > 0 ? (
              userSends.map((transfer, idx) => {
                const toMember = membersWithBalances.find((m) => m.id === transfer.to);
                return (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      backgroundColor: 'rgba(248, 113, 113, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-coral)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '1.25rem',
                      }}
                    >
                      {toMember?.name[0] || 'M'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>Send to {toMember?.name || 'Member'}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Payment</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coral)' }}>
                      ${transfer.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-light)' }}>
                No payments to send
              </div>
            )}
          </div>
        )}

        {/* YOU REQUEST Section - Show based on mode */}
        {(settlementMode === 'request-only' || settlementMode === 'send-request') && (
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
              YOU REQUEST
            </h3>
            {userRequests.length > 0 ? (
              userRequests.map((transfer, idx) => {
                const fromMember = membersWithBalances.find((m) => m.id === transfer.from);
                return (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-green)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                        fontSize: '1.25rem',
                      }}
                    >
                      {fromMember?.name[0] || 'M'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{fromMember?.name || 'Member'}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Payment request</div>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-green)' }}>
                      ${transfer.amount.toFixed(2)}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="card" style={{ padding: 'var(--spacing-md)', textAlign: 'center', color: 'var(--color-text-light)' }}>
                No payments to request
              </div>
            )}
          </div>
        )}

        {/* Settlement Calculation - Traditional Financial Design */}
        <div 
          className="card" 
          style={{ 
            marginBottom: 'var(--spacing-xl)',
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #F9FAFB 100%)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-xl)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative corner accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, rgba(15, 118, 110, 0.05) 0%, transparent 100%)',
            borderRadius: '0 0 0 100%',
          }} />
          
          {/* Header */}
          <div style={{ 
            marginBottom: 'var(--spacing-lg)',
            paddingBottom: 'var(--spacing-md)',
            borderBottom: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: '700',
            }}>
              ⚖️
            </div>
            <div>
              <h3 style={{ 
                fontSize: '0.875rem', 
                fontWeight: '700', 
                color: 'var(--color-text-light)', 
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: 'var(--spacing-xs)',
              }}>
                Settlement Calculation
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Financial summary
              </p>
            </div>
          </div>

          {/* Financial Statement Style */}
          <div style={{ 
            fontFamily: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          }}>
            {(settlementMode === 'send-only' || settlementMode === 'send-request') && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-coral)',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-xs)' }}>
                    Outgoing
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: '500' }}>
                    Amount to Send
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: totalSending > 0 ? 'var(--color-coral)' : 'var(--color-text)',
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '-0.02em',
                }}>
                  ${totalSending.toFixed(2)}
                </div>
              </div>
            )}
            {(settlementMode === 'request-only' || settlementMode === 'send-request') && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 'var(--spacing-md)',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                backgroundColor: 'rgba(5, 150, 105, 0.05)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--color-green)',
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-xs)' }}>
                    Incoming
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: '500' }}>
                    Amount to Receive
                  </div>
                </div>
                <div style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: 'var(--color-green)',
                  fontFamily: 'ui-monospace, monospace',
                  letterSpacing: '-0.02em',
                }}>
                  +${totalReceiving.toFixed(2)}
                </div>
              </div>
            )}
            
            {/* Net Balance - Traditional Ledger Style */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 'var(--spacing-md)',
                borderTop: '2px solid var(--color-border)',
                marginTop: 'var(--spacing-md)',
                padding: 'var(--spacing-md)',
                backgroundColor: userBalance !== 0 ? (userBalance > 0 ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)') : 'transparent',
                borderRadius: 'var(--radius-md)',
                border: userBalance !== 0 ? `2px solid ${userBalance > 0 ? 'var(--color-green)' : 'var(--color-coral)'}` : '2px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--color-text-muted)', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em',
                  marginBottom: 'var(--spacing-xs)',
                  fontWeight: '600',
                }}>
                  Net Position
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: '500' }}>
                  {userBalance > 0 ? 'Credit Balance' : userBalance < 0 ? 'Debit Balance' : 'Balanced'}
                </div>
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '700',
                color: userBalance > 0 ? 'var(--color-green)' : userBalance < 0 ? 'var(--color-coral)' : 'var(--color-text)',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '-0.03em',
              }}>
                {userBalance > 0 ? '+' : ''}${Math.abs(userBalance).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button with Interac Branding */}
        <button
          className="btn btn-primary"
          onClick={handleNext}
          style={{ 
            width: '100%', 
            padding: 'var(--spacing-md)', 
            fontSize: '1rem', 
            fontWeight: '600', 
            marginBottom: 'var(--spacing-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--spacing-sm)',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #0D9488 100%)',
            boxShadow: '0 4px 12px rgba(20, 184, 166, 0.3)',
          }}
        >
          <div style={{ 
            width: '24px', 
            height: '24px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.875rem',
            fontWeight: '700',
          }}>
            i
          </div>
          Settle via Interac e-Transfer®
        </button>
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.75rem', 
          color: 'var(--color-text-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
        }}>
          <span>🔒</span>
          <span>Secured by Interac • 256-bit encryption</span>
        </div>
      </div>
    );
  }

  // Step 2: Select Bank
  if (step === 'bank') {
    const totalSteps = 3;
    const currentStep = 2;

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-lg)' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Header with Interac Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ padding: 'var(--spacing-xs)' }}>
            ←
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)',
              padding: 'var(--spacing-xs) var(--spacing-md)',
              backgroundColor: 'rgba(20, 184, 166, 0.1)',
              borderRadius: 'var(--radius-md)',
            }}>
              <div style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '700',
              }}>
                i
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '600' }}>
                Interac e-Transfer®
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            Select your financial institution
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Choose where to send & receive from
          </p>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ 
            position: 'absolute', 
            left: 'var(--spacing-md)', 
            top: '50%', 
            transform: 'translateY(-50%)',
            fontSize: '1.125rem',
            color: 'var(--color-text-light)',
          }}>
            🔍
          </div>
          <input
            className="input"
            type="text"
            placeholder="Search financial institution..."
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            style={{ 
              paddingLeft: 'var(--spacing-xl)',
              fontSize: '1rem',
              padding: 'var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-xl)',
            }}
          />
        </div>

        {/* Bank List */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-xl)',
          maxHeight: '500px',
          overflowY: 'auto',
          paddingRight: 'var(--spacing-xs)',
        }}>
          {filteredBanks.map((bank) => (
            <div
              key={bank.id}
              className="card"
              style={{
                cursor: 'pointer',
                border: selectedBank?.id === bank.id ? `2px solid ${bank.color}` : '1px solid var(--color-border)',
                padding: 'var(--spacing-lg)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                transition: 'all 0.2s ease',
                backgroundColor: selectedBank?.id === bank.id ? `${bank.color}08` : 'white',
                position: 'relative',
              }}
              onClick={() => setSelectedBank(bank)}
              onMouseEnter={(e) => {
                if (selectedBank?.id !== bank.id) {
                  e.currentTarget.style.borderColor = bank.color;
                  e.currentTarget.style.backgroundColor = `${bank.color}05`;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBank?.id !== bank.id) {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {selectedBank?.id === bank.id && (
                <div style={{
                  position: 'absolute',
                  top: 'var(--spacing-xs)',
                  right: 'var(--spacing-xs)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: bank.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                }}>
                  ✓
                </div>
              )}
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  backgroundColor: bank.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '700',
                  fontSize: '1.25rem',
                  boxShadow: `0 4px 12px ${bank.color}40`,
                }}
              >
                {bank.logo}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: '600', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                  {bank.shortName}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                  {bank.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ flex: 1 }}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!selectedBank}
            style={{ flex: 1 }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Confirm Settlement
  if (step === 'confirm') {
    const totalSteps = 3;
    const currentStep = 3;

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-lg)' }}>
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: idx < currentStep ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={handleBack} style={{ padding: 'var(--spacing-xs)' }}>
            ←
          </button>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>Confirm Settlement</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>
          Review all transfers before sending
        </p>

        {/* Paying From */}
        {!demoMode && selectedBank && (
          <div
            className="card"
            style={{
              backgroundColor: `${selectedBank.color}08`,
              border: `1px solid ${selectedBank.color}20`,
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                backgroundColor: selectedBank.color,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1.25rem',
                boxShadow: `0 4px 12px ${selectedBank.color}40`,
              }}
            >
              {selectedBank.logo}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Paying from
              </div>
              <div style={{ fontWeight: '600', fontSize: '1rem' }}>{selectedBank.name}</div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setStep('bank')}
              style={{ fontSize: '0.875rem', padding: 'var(--spacing-xs) var(--spacing-sm)' }}
            >
              Change
            </button>
          </div>
        )}

        {/* Transfer Breakdown - Show sends and requests based on mode */}
        {(settlementMode === 'send-only' || settlementMode === 'send-request') && userSends.length > 0 && (
          <>
            {userSends.map((transfer, idx) => {
              const toMember = membersWithBalances.find((m) => m.id === transfer.to);
              return (
                <div
                  key={`send-${idx}`}
                  className="card"
                  style={{
                    backgroundColor: 'rgba(248, 113, 113, 0.1)',
                    marginBottom: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-coral)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '1.25rem',
                    }}
                  >
                    $
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Send to {toMember?.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Payment</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-coral)' }}>
                    ${transfer.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </>
        )}
        {(settlementMode === 'request-only' || settlementMode === 'send-request') && userRequests.length > 0 && (
          <>
            {userRequests.map((transfer, idx) => {
              const fromMember = membersWithBalances.find((m) => m.id === transfer.from);
              return (
                <div
                  key={`request-${idx}`}
                  className="card"
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    marginBottom: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-green)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '1.25rem',
                    }}
                  >
                    $
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>Request from {fromMember?.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>Payment request</div>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--color-green)' }}>
                    ${transfer.amount.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Net Summary - Traditional Financial Statement */}
        <div 
          className="card" 
          style={{ 
            marginBottom: 'var(--spacing-xl)',
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #F9FAFB 100%)',
            border: '2px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-xl)',
            fontFamily: 'ui-monospace, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          }}
        >
          <div style={{ 
            marginBottom: 'var(--spacing-lg)',
            paddingBottom: 'var(--spacing-md)',
            borderBottom: '2px solid var(--color-border)',
          }}>
            <h3 style={{ 
              fontSize: '0.875rem', 
              fontWeight: '700', 
              color: 'var(--color-text-light)', 
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Final Settlement Summary
            </h3>
          </div>
          
          {(settlementMode === 'send-only' || settlementMode === 'send-request') && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'rgba(220, 38, 38, 0.05)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--color-coral)',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: '500' }}>Total Sending:</span>
              <span style={{ 
                fontSize: '1.25rem',
                fontWeight: '700', 
                color: 'var(--color-coral)',
                fontFamily: 'ui-monospace, monospace',
              }}>
                ${totalSending.toFixed(2)}
              </span>
            </div>
          )}
          {(settlementMode === 'request-only' || settlementMode === 'send-request') && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)',
              padding: 'var(--spacing-sm) var(--spacing-md)',
              backgroundColor: 'rgba(5, 150, 105, 0.05)',
              borderRadius: 'var(--radius-md)',
              borderLeft: '3px solid var(--color-green)',
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', fontWeight: '500' }}>Total Receiving:</span>
              <span style={{ 
                fontSize: '1.25rem',
                fontWeight: '700', 
                color: 'var(--color-green)',
                fontFamily: 'ui-monospace, monospace',
              }}>
                +${totalReceiving.toFixed(2)}
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 'var(--spacing-md)',
              borderTop: '2px solid var(--color-border)',
              marginTop: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              backgroundColor: userBalance !== 0 ? (userBalance > 0 ? 'rgba(5, 150, 105, 0.08)' : 'rgba(220, 38, 38, 0.08)') : 'transparent',
              borderRadius: 'var(--radius-md)',
              border: userBalance !== 0 ? `2px solid ${userBalance > 0 ? 'var(--color-green)' : 'var(--color-coral)'}` : '2px solid var(--color-border)',
            }}
          >
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Net Balance:</span>
            <span style={{ 
              fontSize: '1.75rem',
              fontWeight: '700',
              color: userBalance > 0 ? 'var(--color-green)' : userBalance < 0 ? 'var(--color-coral)' : 'var(--color-text)',
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '-0.02em',
            }}>
              {userBalance > 0 ? '+' : ''}${Math.abs(userBalance).toFixed(2)}
            </span>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleNext}
          style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1rem', fontWeight: '600', marginBottom: 'var(--spacing-sm)' }}
        >
          ✓ Confirm & Settle All
        </button>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-xs)' }}>
          🔒 256-bit encrypted · Interac e-Transfer®
        </div>
      </div>
    );
  }

  // Step 4: Success
  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-lg)',
        }}
      >
        <div style={{ fontSize: '2.5rem' }}>⭐</div>
      </div>
      <h1 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.75rem', fontWeight: '700' }}>
        All Settled! 🎉
      </h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)', fontSize: '1rem' }}>
        ⛰️ {mission.title} is fully settled
      </p>

      <div className="card" style={{ marginBottom: 'var(--spacing-md)', textAlign: 'left' }}>
        {userBalance > 0 && (
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            You requested
          </div>
        )}
        {userBalance < 0 && (
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            You sent
          </div>
        )}
        {userBalance === 0 && (
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            Settlement complete
          </div>
        )}
        <div style={{ fontSize: '1.75rem', fontWeight: '700', color: userBalance > 0 ? 'var(--color-green)' : userBalance < 0 ? 'var(--color-coral)' : 'var(--color-text)' }}>
          {userBalance > 0 ? '+' : ''}${Math.abs(userBalance).toFixed(2)}
        </div>
      </div>

      {selectedBank && (
        <div className="card" style={{ 
          marginBottom: 'var(--spacing-xl)', 
          textAlign: 'left',
          backgroundColor: `${selectedBank.color}08`,
          border: `1px solid ${selectedBank.color}20`,
        }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Paid via
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: selectedBank.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '700',
                fontSize: '1.125rem',
                boxShadow: `0 4px 12px ${selectedBank.color}40`,
              }}
            >
              {selectedBank.logo}
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: 'var(--spacing-xs)' }}>
                {selectedBank.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                Interac e-Transfer®
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={() => navigate('/settleloop')}
        style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1rem', fontWeight: '600' }}
      >
        Back to Shared Ledgers
      </button>
    </div>
  );
}
