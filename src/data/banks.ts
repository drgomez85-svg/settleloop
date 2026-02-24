import { Bank } from '../types';

export interface BankWithStyle extends Bank {
  color: string;
  logo: string;
  shortName: string;
}

export const CANADIAN_BANKS: BankWithStyle[] = [
  { id: 'td', name: 'TD Canada Trust', code: 'TD', color: '#4A90E2', logo: 'TD', shortName: 'TD' },
  { id: 'rbc', name: 'RBC Royal Bank', code: 'RBC', color: '#DC143C', logo: 'RBC', shortName: 'RBC' },
  { id: 'bmo', name: 'BMO Bank of Montreal', code: 'BMO', color: '#0066A1', logo: 'BMO', shortName: 'BMO' },
  { id: 'scotiabank', name: 'Scotiabank', code: 'BNS', color: '#E31837', logo: 'BNS', shortName: 'Scotiabank' },
  { id: 'cibc', name: 'CIBC', code: 'CM', color: '#A62E2E', logo: 'CIBC', shortName: 'CIBC' },
  { id: 'simplii', name: 'Simplii Financial', code: 'SIMPLII', color: '#14B8A6', logo: 'S', shortName: 'Simplii' },
  { id: 'tangerine', name: 'Tangerine', code: 'TNG', color: '#FF6600', logo: 'T', shortName: 'Tangerine' },
  { id: 'desjardins', name: 'Desjardins', code: 'DESJ', color: '#0066CC', logo: 'D', shortName: 'Desjardins' },
  { id: 'national', name: 'National Bank', code: 'NA', color: '#003366', logo: 'NB', shortName: 'National' },
  { id: 'hsbc', name: 'HSBC Bank Canada', code: 'HSBC', color: '#DC143C', logo: 'HSBC', shortName: 'HSBC' },
  { id: 'laurentian', name: 'Laurentian Bank', code: 'LB', color: '#0066CC', logo: 'LB', shortName: 'Laurentian' },
  { id: 'atb', name: 'ATB Financial', code: 'ATB', color: '#00A651', logo: 'ATB', shortName: 'ATB' },
];
