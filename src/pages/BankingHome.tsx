import { useNavigate } from 'react-router-dom';
import { useBankingStore } from '../store/bankingStore';
import { useAuthStore } from '../store/authStore';
import { NotificationCenter } from '../components/NotificationCenter';
import '../styles/global.css';

export function BankingHome() {
  const navigate = useNavigate();
  const { accounts, getAllTransactions } = useBankingStore();
  const { userName, logout } = useAuthStore();
  
  // Get first letter of name for avatar
  const userInitial = userName ? userName[0].toUpperCase() : 'U';
  
  // Calculate total balance (assets minus debts)
  const assetAccounts = accounts.filter(acc => acc.type === 'chequing' || acc.type === 'savings' || acc.type === 'joint');
  const debtAccounts = accounts.filter(acc => acc.type === 'credit' || acc.type === 'lineOfCredit');
  const totalAssets = assetAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalDebts = debtAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalBalance = totalAssets - totalDebts;
  
  // Get recent transactions (all accounts, sorted by date)
  const allTransactions = getAllTransactions().sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);
  
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
  
  const getTransactionIcon = (transaction: typeof allTransactions[0]) => {
    switch (transaction.type) {
      case 'deposit':
      case 'request':
        return '💰';
      case 'withdrawal':
        return '☕';
      case 'transfer':
        return '🍀';
      case 'payment':
        return transaction.description.includes('Netflix') ? '🎬' : '💳';
      default:
        return '📝';
    }
  };
  
  const getTransactionColor = (transaction: typeof allTransactions[0]) => {
    if (transaction.description.includes('Tim Hortons')) return '#DC2626';
    if (transaction.description.includes('Sarah')) return '#10B981';
    if (transaction.description.includes('Loblaws')) return '#6B7280';
    if (transaction.description.includes('Netflix')) return '#9333EA';
    if (transaction.description.includes('Payroll')) return '#F97316';
    return '#6B7280';
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            WELCOME BACK
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
            {userName || 'User'} 👋
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <NotificationCenter />
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
              cursor: 'pointer',
            }}
            onClick={logout}
            title="Logout"
          >
            {userInitial}
          </div>
        </div>
      </div>

      {/* Total Balance */}
      <div className="card" style={{ marginBottom: 'var(--spacing-xl)', position: 'relative' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
          TOTAL BALANCE
        </div>
        <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
          ${totalBalance.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
          CAD • {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </div>
        <div style={{ position: 'absolute', top: 'var(--spacing-md)', right: 'var(--spacing-md)' }}>
          👁️
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/send')}
          style={{
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '1.5rem' }}>📤</div>
          <div style={{ fontSize: '0.875rem' }}>Send</div>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/request')}
          style={{
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '1.5rem' }}>📥</div>
          <div style={{ fontSize: '0.875rem' }}>Request</div>
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/pay-bill')}
          style={{
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ fontSize: '1.5rem' }}>💳</div>
          <div style={{ fontSize: '0.875rem' }}>Pay Bill</div>
        </button>
        <button
          className="btn btn-primary"
          style={{
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            borderRadius: 'var(--radius-lg)',
          }}
          onClick={() => navigate('/settleloop')}
        >
          <div style={{ fontSize: '1.5rem' }}>👥</div>
          <div style={{ fontSize: '0.875rem' }}>Split Expense</div>
        </button>
      </div>

      {/* Your Accounts */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
            YOUR ACCOUNTS
          </h2>
          <button style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            See all
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {accounts.map((account) => {
            const getIcon = () => {
              switch (account.type) {
                case 'chequing':
                  return '💼';
                case 'savings':
                  return '🐷';
                case 'joint':
                  return '👥';
                case 'credit':
                  return '💳';
                case 'lineOfCredit':
                  return '📊';
                default:
                  return '💳';
              }
            };
            
            const isCreditAccount = account.type === 'credit' || account.type === 'lineOfCredit';
            const displayBalance = isCreditAccount 
              ? account.balance.toFixed(2) 
              : account.balance.toFixed(2);
            const displayLabel = isCreditAccount ? 'Owed' : 'Balance';
            
            return (
              <div
                key={account.id}
                className="card"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}
                onClick={() => navigate(`/account/${account.id}`)}
              >
                <div style={{ fontSize: '2rem' }}>{getIcon()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>{account.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                    {isCreditAccount && account.availableCredit !== undefined
                      ? `Available: $${account.availableCredit.toFixed(2)}`
                      : `****${account.accountNumber}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
                    {displayLabel}
                  </div>
                  <div style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600',
                    color: isCreditAccount ? 'var(--color-coral)' : 'var(--color-text)'
                  }}>
                    {isCreditAccount ? '-' : ''}${displayBalance}
                  </div>
                </div>
                <div style={{ fontSize: '1.25rem', color: 'var(--color-text-light)' }}>→</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>
            RECENT ACTIVITY
          </h2>
          <button style={{ fontSize: '0.875rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            View all
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {allTransactions.map((transaction) => (
            <div key={transaction.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
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
                <div style={{ fontWeight: '500', marginBottom: 'var(--spacing-xs)' }}>{transaction.description}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                  {formatDate(transaction.date)} • {transaction.category || transaction.type}
                </div>
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: transaction.amount > 0 ? 'var(--color-green)' : 'var(--color-text)',
                }}
              >
                {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}







