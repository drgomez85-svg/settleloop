import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBankingStore } from '../store/bankingStore';

export function PayBill() {
  const navigate = useNavigate();
  const { accounts, billers, payBill } = useBankingStore();
  const [step, setStep] = useState<'select-biller' | 'details' | 'confirm' | 'success'>('select-biller');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [selectedBiller, setSelectedBiller] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [billerSearch, setBillerSearch] = useState('');

  const filteredBillers = billers.filter((biller) =>
    biller.name.toLowerCase().includes(billerSearch.toLowerCase()) ||
    biller.category.toLowerCase().includes(billerSearch.toLowerCase())
  );

  const groupedBillers = filteredBillers.reduce((acc, biller) => {
    if (!acc[biller.category]) {
      acc[biller.category] = [];
    }
    acc[biller.category].push(biller);
    return acc;
  }, {} as Record<string, typeof billers>);

  const handleSelectBiller = (billerId: string) => {
    setSelectedBiller(billerId);
    setStep('details');
  };

  const handleContinue = () => {
    if (step === 'details') {
      if (amount && parseFloat(amount) > 0) {
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      // Pay bill
      const numAmount = parseFloat(amount);
      payBill(selectedAccount, selectedBiller, numAmount, accountNumber || undefined);
      setStep('success');
    }
  };

  if (step === 'select-biller') {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Pay Bill</h1>
        </div>

        {/* Select Account */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            From Account
          </label>
          <select
            className="input"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ••••{account.accountNumber} - ${account.balance.toFixed(2)}
              </option>
            ))}
          </select>
        </div>

        {/* Search Billers */}
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <input
            className="input"
            type="text"
            placeholder="Search billers..."
            value={billerSearch}
            onChange={(e) => setBillerSearch(e.target.value)}
            style={{ paddingLeft: 'var(--spacing-xl)' }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 'var(--spacing-md)', top: '50%', transform: 'translateY(-50%)' }}>
              🔍
            </div>
          </div>
        </div>

        {/* Billers by Category */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
          {Object.entries(groupedBillers).map(([category, categoryBillers]) => (
            <div key={category}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
                {category}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {categoryBillers.map((biller) => (
                  <div
                    key={biller.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      border: selectedBiller === biller.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                    }}
                    onClick={() => handleSelectBiller(biller.id)}
                  >
                    <div style={{ fontSize: '2rem' }}>{biller.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{biller.name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{biller.category}</div>
                    </div>
                    {selectedBiller === biller.id && (
                      <div style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>✓</div>
                    )}
                    <div style={{ fontSize: '1.25rem', color: 'var(--color-text-light)' }}>→</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'details') {
    const account = accounts.find((a) => a.id === selectedAccount);
    const biller = billers.find((b) => b.id === selectedBiller);

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('select-biller')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Pay Bill</h1>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ fontSize: '2rem' }}>{biller?.icon}</div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '1.125rem' }}>{biller?.name}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{biller?.category}</div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            From Account
          </div>
          <div style={{ fontWeight: '600' }}>{account?.name} ••••{account?.accountNumber}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Balance: ${account?.balance.toFixed(2)}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Account Number (optional)
          </label>
          <input
            className="input"
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Enter account number if required"
          />
        </div>

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Amount (CAD)
          </label>
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            max={account?.balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={{ fontSize: '1.5rem', fontWeight: '600', textAlign: 'center' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('select-biller')} style={{ flex: 1 }}>
            Back
          </button>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (account?.balance || 0)}
            style={{ flex: 1 }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const account = accounts.find((a) => a.id === selectedAccount);
    const biller = billers.find((b) => b.id === selectedBiller);

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('details')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Confirm Payment</h1>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>Biller:</span>
            <span style={{ fontWeight: '600' }}>{biller?.name}</span>
          </div>
          {accountNumber && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
              <span style={{ color: 'var(--color-text-light)' }}>Account Number:</span>
              <span style={{ fontWeight: '600' }}>{accountNumber}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>From Account:</span>
            <span style={{ fontWeight: '600' }}>{account?.name} ••••{account?.accountNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>Amount:</span>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              ${parseFloat(amount).toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('details')} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleContinue} style={{ flex: 1 }}>
            Pay Bill
          </button>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>✅</div>
      <h1 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.5rem', fontWeight: '600' }}>
        Bill Paid!
      </h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>
        Your payment of ${parseFloat(amount).toFixed(2)} has been processed successfully.
      </p>
      <button
        className="btn btn-primary"
        onClick={() => navigate('/')}
        style={{ width: '100%', padding: 'var(--spacing-md)' }}
      >
        Back to Home
      </button>
    </div>
  );
}
