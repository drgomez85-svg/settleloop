import { Mission, Member } from '../types';
import { useMissionStore } from '../store/missionStore';

// Check if settlement needs a reminder (48 hours after initiation)
export function checkSettlementReminders() {
  const { missions, sendReminder } = useMissionStore.getState();
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  missions.forEach((mission) => {
    // Only check active missions with initiated settlements
    if (mission.status === 'active' && mission.settlementInitiatedAt) {
      const initiatedAt = new Date(mission.settlementInitiatedAt);
      
      // If settlement was initiated more than 48 hours ago and not yet settled
      if (initiatedAt < fortyEightHoursAgo && !mission.settledAt) {
        // Check each member who owes money and send reminder if they have email
        const membersWithBalances = calcBalances(mission);
        membersWithBalances.forEach((member) => {
          // Send reminder to members who owe money and haven't been reminded in the last 24 hours
          if (member.balance < -0.01 && member.email) {
            const lastReminder = member.lastReminderSent 
              ? new Date(member.lastReminderSent) 
              : null;
            const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            // Only send if no reminder in last 24 hours
            if (!lastReminder || lastReminder < twentyFourHoursAgo) {
              sendReminder(mission.id, member.id);
            }
          }
        });
      }
    }
  });
}

// Helper function to calculate balances (imported from balanceEngine)
import { calculateBalances as calcBalances } from './balanceEngine';

function calculateBalances(mission: Mission): Member[] {
  return calcBalances(mission);
}

// Run check every hour
if (typeof window !== 'undefined') {
  setInterval(checkSettlementReminders, 60 * 60 * 1000);
  // Also run immediately on load
  checkSettlementReminders();
}
