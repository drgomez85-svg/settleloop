import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useBankingStore } from '../store/bankingStore';
import { useNotificationStore } from '../store/notificationStore';
import { optimizeSettlements } from '../utils/settlementOptimizer';
import { calculateBalances } from '../utils/balanceEngine';
import { SettlementSummary } from '../types';

type Step = 'summary' | 'success';
type SettlementMode = 'send-request' | 'send-only' | 'request-only';

export function SettlementFlow() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMission, markSettled, demoMode } = useMissionStore();
  const { getAccount, addTransaction } = useBankingStore();
  const { addNotification } = useNotificationStore();
  const [step, setStep] = useState<Step>('summary');
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
      // Mark settlement as initiated
      const { updateMission } = useMissionStore.getState();
      updateMission(mission.id, {
        settlementInitiatedAt: new Date().toISOString(),
      });
      
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
          Confirm
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

  // Success: E-Transfer Confirmation
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
        {userBalance > 0 ? 'E-transfer request sent' : 'E-transfer Sent'}
      </h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)', fontSize: '1rem' }}>
        Your Interac e-Transfer has been successfully processed
      </p>

      {userBalance > 0 && (
        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'left', padding: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', lineHeight: '1.6' }}>
            We will monitor the money transfer and mark bill as settled when is received. If the money is not received within 48 hours the system will do a gentle reminder to the person. This flows only happens when people owe you money and you have to request.
          </div>
        </div>
      )}

      {userBalance > 0 && (
        <p style={{ 
          color: 'var(--color-text-light)', 
          marginBottom: 'var(--spacing-md)', 
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          If the money is not received within 48 hours the system will do a gentle reminder to the person
        </p>
      )}

      <button
        className="btn btn-primary"
        onClick={() => navigate('/settleloop')}
        style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1rem', fontWeight: '600' }}
      >
        Back to Share Group
      </button>
    </div>
  );
}
