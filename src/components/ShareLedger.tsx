import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Mission } from '../types';

interface ShareLedgerProps {
  mission: Mission;
  onClose: () => void;
}

export function ShareLedger({ mission, onClose }: ShareLedgerProps) {
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate share URL
  const shareUrl = mission.shareToken 
    ? `${window.location.origin}/share/${mission.shareToken}`
    : '';

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSendEmail = () => {
    if (email.trim() && shareUrl) {
      // In a real app, this would send an email via backend
      // For demo, we'll just show a success message
      const subject = encodeURIComponent(`Shared Group: ${mission.title}`);
      const body = encodeURIComponent(
        `You've been invited to collaborate in the shared group "${mission.title}".\n\n` +
        `Open it here: ${shareUrl}\n\n` +
        `You can add expenses inside this shared group.\n` +
        `This link does NOT give access to any banking accounts.`
      );
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setEmail('');
      }, 3000);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-lg)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Share Group</h2>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: 'var(--spacing-xs)', fontSize: '1.25rem' }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            Magic Link
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
            <input
              className="input"
              type="text"
              value={shareUrl}
              readOnly
              style={{ flex: 1, fontSize: '0.875rem' }}
            />
            <button
              className="btn btn-primary"
              onClick={handleCopyLink}
              style={{ whiteSpace: 'nowrap' }}
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Share this link to let someone add expenses inside this shared group. It does <b>not</b> give access to your banking accounts.
          </p>
        </div>

        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            QR Code
          </h3>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: 'var(--spacing-lg)',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--spacing-sm)',
          }}>
            {shareUrl && (
              <QRCodeSVG
                value={shareUrl}
                size={200}
                level="M"
                includeMargin={true}
              />
            )}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Scan with your phone to open the shared group (group-only access)
          </p>
        </div>

        <div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-text-light)', textTransform: 'uppercase', marginBottom: 'var(--spacing-md)' }}>
            Email Invite
          </h3>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <input
              className="input"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSendEmail();
                }
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSendEmail}
              disabled={!email.trim() || emailSent}
              style={{ whiteSpace: 'nowrap' }}
            >
              {emailSent ? '✓ Sent' : 'Send'}
            </button>
          </div>
          {emailSent && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-green)', marginTop: 'var(--spacing-xs)' }}>
              Email invite sent! (Opens your email client)
            </p>
          )}
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Send an email invitation with the share link
          </p>
        </div>
      </div>
    </div>
  );
}
