import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBankingStore } from '../store/bankingStore';

export function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getAccount, getAccountTransactions, accounts, payCreditAccount, chargeCredit } = useBankingStore();
  const [showPayCredit, setShowPayCredit] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');

  const account = id ? getAccount(id) : null;
  const transactions = account ? getAccountTransactions(account.id) : [];
  const isCreditAccount = account?.type === 'credit' || account?.type === 'lineOfCredit';
  const assetAccounts = accounts.filter(acc => 
    (acc.type === 'chequing' || acc.type === 'savings' || acc.type === 'joint') && acc.id !== account?.id
  );

  if (!account) {
    return (
      <div style={{ padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        <p>Account not found</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
      }
    } catch {
      return dateString;
    }
  };

  const handlePayCredit = () => {
    if (payAmount && fromAccountId && account) {
      const amount = parseFloat(payAmount);
      if (amount > 0) {
        payCreditAccount(fromAccountId, account.id, amount);
        setShowPayCredit(false);
        setPayAmount('');
        setFromAccountId('');
      }
    }
  };

  const handleChargeCredit = () => {
    if (account) {
      const amount = parseFloat(prompt('Enter charge amount:') || '0');
      const description = prompt('Enter description:') || 'Credit Card Purchase';
      if (amount > 0) {
        chargeCredit(account.id, amount, description);
      }
    }
  };

  const getTransactionIcon = (transaction: typeof transactions[0]) => {
    switch (transaction.type) {
      case 'deposit':
      case 'request':
        return '💰';
      case 'withdrawal':
        return '💸';
      case 'transfer':
        return '📤';
      case 'payment':
        return '💳';
      case 'charge':
        return '🛒';
      case 'creditPayment':
        return '✅';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (transaction: typeof transactions[0]) => {
    switch (transaction.type) {
      case 'deposit':
      case 'request':
        return '#10B981';
      case 'withdrawal':
        return '#DC2626';
      case 'transfer':
        return '#F97316';
      case 'payment':
        return '#9333EA';
      case 'charge':
        return '#DC2626';
      case 'creditPayment':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>{account.name}</h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            ••••{account.accountNumber}
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
        {isCreditAccount ? (
          <>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)' }}>
              Amount Owed
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)', color: 'var(--color-coral)' }}>
              ${account.balance.toFixed(2)}
            </div>
            {account.creditLimit && (
              <>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                  Credit Limit: ${account.creditLimit.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-green)', fontWeight: '600' }}>
                  Available: ${account.availableCredit?.toFixed(2) || '0.00'}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)' }}>
              Available Balance
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
              ${account.balance.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
              {account.currency}
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      {isCreditAccount ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowPayCredit(true)}
            style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <div style={{ fontSize: '1.5rem' }}>💳</div>
            <div style={{ fontSize: '0.875rem' }}>Make Payment</div>
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleChargeCredit}
            style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <div style={{ fontSize: '1.5rem' }}>🛒</div>
            <div style={{ fontSize: '0.875rem' }}>Add Charge</div>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/send')}
            style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <div style={{ fontSize: '1.5rem' }}>📤</div>
            <div style={{ fontSize: '0.875rem' }}>Send</div>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/request')}
            style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <div style={{ fontSize: '1.5rem' }}>📥</div>
            <div style={{ fontSize: '0.875rem' }}>Request</div>
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/pay-bill')}
            style={{ padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-xs)' }}
          >
            <div style={{ fontSize: '1.5rem' }}>💳</div>
            <div style={{ fontSize: '0.875rem' }}>Pay Bill</div>
          </button>
        </div>
      )}

      {/* Pay Credit Modal */}
      {showPayCredit && (
        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontWeight: '500' }}>Make Payment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
                From Account
              </label>
              <select
                className="input"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
              >
                <option value="">Select account...</option>
                {assetAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ••••{acc.accountNumber} - ${acc.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
                Amount (CAD)
              </label>
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                max={account?.balance}
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                style={{ fontSize: '1.25rem', fontWeight: '600', textAlign: 'center' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowPayCredit(false);
                  setPayAmount('');
                  setFromAccountId('');
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePayCredit}
                disabled={!payAmount || !fromAccountId || parseFloat(payAmount) <= 0}
                style={{ flex: 1 }}
              >
                Pay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-md)' }}>
          Transactions
        </h2>
        {transactions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <p style={{ color: 'var(--color-text-light)' }}>No transactions yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
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
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: getTransactionColor(transaction),
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}
                >
                  {getTransactionIcon(transaction)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>
                    {transaction.description}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                    {formatDate(transaction.date)} • {transaction.category || transaction.type}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: isCreditAccount
                      ? (transaction.type === 'creditPayment' ? 'var(--color-green)' : 'var(--color-coral)')
                      : (transaction.amount > 0 ? 'var(--color-green)' : 'var(--color-text)'),
                  }}
                >
                  {isCreditAccount
                    ? (transaction.type === 'creditPayment' ? '-' : '+')
                    : (transaction.amount > 0 ? '+' : '')}
                  ${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
