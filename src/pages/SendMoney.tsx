import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useBankingStore } from '../store/bankingStore';
import { CANADIAN_BANKS } from '../data/banks';

export function SendMoney() {
  const navigate = useNavigate();
  const { accounts, contacts, sendMoney } = useBankingStore();
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>('select');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [bankSearch, setBankSearch] = useState('');

  const handleSelectContact = (contactId: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setSelectedContact(contactId);
      setEmail(contact.email || '');
      setStep('details');
    }
  };

  const handleContinue = () => {
    if (step === 'select') {
      if (selectedContact) {
        handleSelectContact(selectedContact);
      } else if (email) {
        setStep('details');
      }
    } else if (step === 'details') {
      if (amount && parseFloat(amount) > 0) {
        setStep('confirm');
      }
    } else if (step === 'confirm') {
      // Send money
      const numAmount = parseFloat(amount);
      const recipient = selectedContact
        ? contacts.find((c) => c.id === selectedContact)?.name || email
        : email;
      sendMoney(selectedAccount, recipient, numAmount, message || 'E-Transfer');
      setStep('success');
    }
  };

  const filteredBanks = CANADIAN_BANKS.filter((bank) =>
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  if (step === 'select') {
    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Send Money</h1>
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

        {/* Select Contact or Enter Email */}
        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Send To
          </label>
          
          {contacts.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)' }}>
                Recent Contacts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="card"
                    style={{
                      cursor: 'pointer',
                      border: selectedContact === contact.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-md)',
                      padding: 'var(--spacing-md)',
                    }}
                    onClick={() => handleSelectContact(contact.id)}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '600',
                      }}
                    >
                      {contact.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500' }}>{contact.name}</div>
                      {contact.email && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{contact.email}</div>
                      )}
                    </div>
                    {selectedContact === contact.id && (
                      <div style={{ color: 'var(--color-primary)', fontSize: '1.25rem' }}>✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-sm)' }}>
            Or enter email
          </div>
          <input
            className="input"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSelectedContact('');
            }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={!selectedAccount || (!selectedContact && !email)}
          style={{ width: '100%', padding: 'var(--spacing-md)' }}
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 'details') {
    const account = accounts.find((a) => a.id === selectedAccount);
    const recipient = selectedContact
      ? contacts.find((c) => c.id === selectedContact)?.name || email
      : email;

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('select')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Send Money</h1>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            From
          </div>
          <div style={{ fontWeight: '600' }}>{account?.name} ••••{account?.accountNumber}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
            Balance: ${account?.balance.toFixed(2)}
          </div>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xs)' }}>
            To
          </div>
          <div style={{ fontWeight: '600' }}>{recipient}</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>{email}</div>
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

        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>
            Message (optional)
          </label>
          <input
            className="input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's this for?"
            maxLength={50}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('select')} style={{ flex: 1 }}>
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
    const recipient = selectedContact
      ? contacts.find((c) => c.id === selectedContact)?.name || email
      : email;

    return (
      <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('details')}>
            ←
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Confirm Transfer</h1>
        </div>

        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>From:</span>
            <span style={{ fontWeight: '600' }}>{account?.name} ••••{account?.accountNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>To:</span>
            <span style={{ fontWeight: '600' }}>{recipient}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
            <span style={{ color: 'var(--color-text-light)' }}>Amount:</span>
            <span style={{ fontWeight: '700', fontSize: '1.25rem', color: 'var(--color-primary)' }}>
              ${parseFloat(amount).toFixed(2)}
            </span>
          </div>
          {message && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)', borderTop: '1px solid var(--color-border)' }}>
              <span style={{ color: 'var(--color-text-light)' }}>Message:</span>
              <span style={{ fontWeight: '500' }}>{message}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button className="btn btn-secondary" onClick={() => setStep('details')} style={{ flex: 1 }}>
            Back
          </button>
          <button className="btn btn-primary" onClick={handleContinue} style={{ flex: 1 }}>
            Send Money
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
        Money Sent!
      </h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: 'var(--spacing-xl)' }}>
        Your e-Transfer of ${parseFloat(amount).toFixed(2)} has been sent successfully.
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
