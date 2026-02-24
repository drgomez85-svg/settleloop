/**
 * Generates avatar initials from a name
 */
export function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates a color from a name (deterministic)
 */
export function generateColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a teal/coral color palette
  const colors = [
    '#14B8A6', // Teal
    '#F87171', // Coral
    '#34D399', // Green
    '#60A5FA', // Blue
    '#A78BFA', // Purple
    '#FB7185', // Pink
  ];
  
  return colors[Math.abs(hash) % colors.length];
}
