import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useMissionStore } from '../store/missionStore';
import { useAuthStore } from '../store/authStore';

const MISSION_ICONS = [
  { emoji: '⛰️', name: 'Mountain' },
  { emoji: '🏠', name: 'House' },
  { emoji: '👥', name: 'People' },
  { emoji: '✈️', name: 'Plane' },
  { emoji: '🎉', name: 'Party' },
  { emoji: '🛒', name: 'Shopping' },
  { emoji: '🎮', name: 'Gaming' },
  { emoji: '💼', name: 'Business' },
];

const DEMO_MEMBERS = [
  { id: 'sarah', name: 'Sarah' },
  { id: 'mike', name: 'Mike' },
  { id: 'priya', name: 'Priya' },
];

export function NewMission() {
  const navigate = useNavigate();
  const { createMission } = useMissionStore();
  const { userName } = useAuthStore();
  const [selectedIcon, setSelectedIcon] = useState(MISSION_ICONS[0].emoji);
  const [missionName, setMissionName] = useState('');
  
  // Create current user member object
  const currentUserMember = userName 
    ? { id: 'current-user', name: userName, isCurrentUser: true }
    : { id: 'current-user', name: 'You', isCurrentUser: true };
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>(['current-user']);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [customMembers, setCustomMembers] = useState<Array<{ id: string; name: string; email?: string }>>([]);

  const handleMemberToggle = (memberId: string) => {
    // Now the current user can be toggled like any other member
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleAddMember = () => {
    if (newMemberName.trim() && newMemberEmail.trim()) {
      const trimmedName = newMemberName.trim();
      const trimmedEmail = newMemberEmail.trim();
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        alert('Please enter a valid email address');
        return;
      }
      
      // Check if member already exists (including current user)
      const allMembers = [currentUserMember, ...DEMO_MEMBERS, ...customMembers];
      const exists = allMembers.some(m => 
        m.name.toLowerCase() === trimmedName.toLowerCase() ||
        ('email' in m && typeof m.email === 'string' && m.email.toLowerCase() === trimmedEmail.toLowerCase())
      );
      
      if (!exists) {
        const newMember = {
          id: `custom-${Date.now()}`,
          name: trimmedName,
          email: trimmedEmail,
        };
        setCustomMembers([...customMembers, newMember]);
        setSelectedMembers([...selectedMembers, newMember.id]);
        setNewMemberName('');
        setNewMemberEmail('');
        setShowAddMemberModal(false);
      } else {
        alert('A member with this name or email already exists');
      }
    }
  };

  const handleCreate = () => {
    if (missionName.trim()) {
      const missionId = createMission(missionName.trim());
      
      // Add all selected members (including current user if selected)
      const { addMember } = useMissionStore.getState();
      const allMembers = [currentUserMember, ...DEMO_MEMBERS, ...customMembers];
      
      selectedMembers.forEach((memberId) => {
        const member = allMembers.find((m) => m.id === memberId);
        if (member) {
          // For current user and demo members, use a placeholder email
          // In a real app, this would come from the user's profile
          const email = 'email' in member && typeof member.email === 'string' 
            ? member.email 
            : `${member.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
          addMember(missionId, member.name, email);
        }
      });

      navigate(`/mission/${missionId}`);
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-lg)', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/settleloop')}>
          ←
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>New Shared Group</h1>
      </div>

      {/* Icon Selection */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-md)', fontWeight: '500' }}>Icon</label>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', overflowX: 'auto', paddingBottom: 'var(--spacing-sm)' }}>
          {MISSION_ICONS.map((icon) => (
            <button
              key={icon.emoji}
              onClick={() => setSelectedIcon(icon.emoji)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-md)',
                border: selectedIcon === icon.emoji ? '3px solid var(--color-primary)' : '1px solid var(--color-border)',
                backgroundColor: selectedIcon === icon.emoji ? 'rgba(20, 184, 166, 0.1)' : 'var(--color-card)',
                fontSize: '2rem',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Mission Name */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: '500' }}>Group Name</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Banff Road Trip"
          value={missionName}
          onChange={(e) => setMissionName(e.target.value)}
        />
      </div>

      {/* Members */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <label style={{ fontWeight: '500' }}>Members ({selectedMembers.length} selected)</label>
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddMemberModal(true)}
            style={{ 
              fontSize: '0.875rem', 
              padding: 'var(--spacing-xs) var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
            }}
          >
            <span>+</span>
            <span>Add Person</span>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {/* Current User First */}
          <div
            key={currentUserMember.id}
            onClick={() => handleMemberToggle(currentUserMember.id)}
            style={{
              padding: 'var(--spacing-md)',
              border: selectedMembers.includes(currentUserMember.id)
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: selectedMembers.includes(currentUserMember.id) 
                ? 'rgba(15, 118, 110, 0.1)' 
                : 'var(--color-card)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: selectedMembers.includes(currentUserMember.id) 
                  ? 'var(--color-primary)' 
                  : 'var(--color-text-light)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '600',
                fontSize: '1.25rem',
                transition: 'all 0.2s ease',
              }}
            >
              {currentUserMember.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, fontWeight: '500' }}>
              {currentUserMember.name}
              {currentUserMember.isCurrentUser && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--color-text-muted)', 
                  marginLeft: 'var(--spacing-xs)',
                  fontWeight: '400',
                }}>
                  (you)
                </span>
              )}
            </div>
            {selectedMembers.includes(currentUserMember.id) && (
              <div style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: '700' }}>✓</div>
            )}
          </div>
          
          {/* Other Members */}
          {[...DEMO_MEMBERS, ...customMembers].map((member) => (
            <div
              key={member.id}
              onClick={() => handleMemberToggle(member.id)}
              style={{
                padding: 'var(--spacing-md)',
                border: selectedMembers.includes(member.id)
                  ? '2px solid var(--color-primary)'
                  : '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: selectedMembers.includes(member.id) 
                  ? 'rgba(15, 118, 110, 0.1)' 
                  : 'var(--color-card)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: selectedMembers.includes(member.id)
                    ? 'var(--color-primary)'
                    : 'var(--color-text-light)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '1.25rem',
                  transition: 'all 0.2s ease',
                }}
              >
                {member.name[0].toUpperCase()}
              </div>
              <div style={{ flex: 1, fontWeight: '500' }}>{member.name}</div>
              {selectedMembers.includes(member.id) && (
                <div style={{ color: 'var(--color-primary)', fontSize: '1.25rem', fontWeight: '700' }}>✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Button */}
      <button
        className="btn btn-primary"
        onClick={handleCreate}
        disabled={!missionName.trim()}
        style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1rem', fontWeight: '600' }}
      >
        Create Shared Group
      </button>

      {/* Add Member Modal */}
      {showAddMemberModal && (
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMemberModal(false);
              setNewMemberName('');
            }
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: 'var(--spacing-xl)',
              animation: 'slideIn 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)' }}>
                Add Person
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                Enter the name and email of the person you want to add to this group
              </p>
            </div>

            {/* Input Fields */}
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-text)',
                }}
              >
                Name *
              </label>
              <input
                className="input"
                type="text"
                placeholder="Enter person's name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMemberName.trim()) {
                    handleAddMember();
                  } else if (e.key === 'Escape') {
                    setShowAddMemberModal(false);
                    setNewMemberName('');
                    setNewMemberEmail('');
                  }
                }}
                autoFocus
                style={{
                  fontSize: '1rem',
                  padding: 'var(--spacing-md)',
                }}
              />
            </div>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  marginBottom: 'var(--spacing-sm)',
                  color: 'var(--color-text)',
                }}
              >
                Email *
              </label>
              <input
                className="input"
                type="email"
                placeholder="person@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMemberName.trim() && newMemberEmail.trim()) {
                    handleAddMember();
                  }
                }}
                style={{
                  fontSize: '1rem',
                  padding: 'var(--spacing-md)',
                }}
                required
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddMemberModal(false);
                  setNewMemberName('');
                  setNewMemberEmail('');
                }}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  fontSize: '0.875rem',
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddMember}
                disabled={!newMemberName.trim() || !newMemberEmail.trim()}
                style={{
                  padding: 'var(--spacing-sm) var(--spacing-lg)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                }}
              >
                Add Person
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
