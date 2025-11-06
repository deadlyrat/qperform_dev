// src/services/performanceScoring.ts
// Performance scoring and classification system

/**
 * Performance status levels
 */
export type PerformanceStatus = 'Great' | 'Good' | 'Normal' | 'Low' | 'Critical';

/**
 * Performance scoring standards based on requirements
 */
export const PERFORMANCE_STANDARDS = {
  PRODUCTION: {
    GREAT: { min: 101.00, label: 'Great', description: '> 101.00%' },
    GOOD: { min: 100.00, max: 100.99, label: 'Good', description: '100.00% - 100.99%' },
    NORMAL: { min: 99.00, max: 99.99, label: 'Normal', description: '99.00% - 99.99%' },
    LOW: { min: 98.01, max: 98.99, label: 'Low', description: '98.01% - 98.99%' },
    CRITICAL: { max: 98.00, label: 'Critical', description: '< 98.00%' },
  },
  QA: {
    GREAT: { min: 100.00, label: 'Great', description: '>= 100%' },
    GOOD: { min: 99.00, max: 99.99, label: 'Good', description: '99.00% - 99.99%' },
    NORMAL: { min: 98.00, max: 98.99, label: 'Normal', description: '98.00% - 98.99%' },
    LOW: { min: 97.01, max: 97.99, label: 'Low', description: '97.01% - 97.99%' },
    CRITICAL: { max: 97.00, label: 'Critical', description: '< 97.00%' },
  },
};

/**
 * Color scheme for performance statuses
 */
export const PERFORMANCE_COLORS = {
  Great: {
    background: '#10b981', // green-500
    text: '#ffffff',
    light: '#d1fae5', // green-100
    border: '#059669', // green-600
  },
  Good: {
    background: '#84cc16', // lime-500
    text: '#ffffff',
    light: '#ecfccb', // lime-100
    border: '#65a30d', // lime-600
  },
  Normal: {
    background: '#facc15', // yellow-400
    text: '#000000',
    light: '#fef9c3', // yellow-100
    border: '#eab308', // yellow-500
  },
  Low: {
    background: '#f97316', // orange-500
    text: '#ffffff',
    light: '#ffedd5', // orange-100
    border: '#ea580c', // orange-600
  },
  Critical: {
    background: '#ef4444', // red-500
    text: '#ffffff',
    light: '#fee2e2', // red-100
    border: '#dc2626', // red-600
  },
};

/**
 * Calculate production performance status from score
 */
export function getProductionStatus(score: number): PerformanceStatus {
  const percentage = score * 100;

  if (percentage > 101.00) return 'Great';
  if (percentage >= 100.00) return 'Good';
  if (percentage >= 99.00) return 'Normal';
  if (percentage > 98.00) return 'Low';
  return 'Critical';
}

/**
 * Calculate QA performance status from score
 */
export function getQAStatus(score: number): PerformanceStatus {
  const percentage = score * 100;

  if (percentage >= 100.00) return 'Great';
  if (percentage >= 99.00) return 'Good';
  if (percentage >= 98.00) return 'Normal';
  if (percentage > 97.00) return 'Low';
  return 'Critical';
}

/**
 * Normalize flag values from database to PerformanceStatus
 * Database may have inconsistent casing or typos
 */
export function normalizeFlag(flag: string | null | undefined): PerformanceStatus {
  if (!flag) return 'Normal';

  const normalized = flag.trim().toLowerCase();

  if (normalized.includes('great') || normalized.includes('excellent')) return 'Great';
  if (normalized.includes('good')) return 'Good';
  if (normalized.includes('normal') || normalized.includes('ok')) return 'Normal';
  if (normalized.includes('low') || normalized.includes('warning')) return 'Low';
  if (normalized.includes('critical') || normalized.includes('poor')) return 'Critical';

  // Default to Normal if unrecognized
  return 'Normal';
}

/**
 * Get the worst status between production and QA
 * Used for overall performance assessment
 */
export function getWorstStatus(prodStatus: PerformanceStatus, qaStatus: PerformanceStatus): PerformanceStatus {
  const statusPriority: Record<PerformanceStatus, number> = {
    'Critical': 5,
    'Low': 4,
    'Normal': 3,
    'Good': 2,
    'Great': 1,
  };

  return statusPriority[prodStatus] > statusPriority[qaStatus] ? prodStatus : qaStatus;
}

/**
 * Check if a status is considered underperforming
 */
export function isUnderperforming(status: PerformanceStatus): boolean {
  return status === 'Critical' || status === 'Low';
}

/**
 * Get color for a status
 */
export function getStatusColor(status: PerformanceStatus): typeof PERFORMANCE_COLORS.Great {
  return PERFORMANCE_COLORS[status];
}

/**
 * Get background color for a status
 */
export function getStatusBackgroundColor(status: PerformanceStatus): string {
  return PERFORMANCE_COLORS[status].background;
}

/**
 * Get text color for a status
 */
export function getStatusTextColor(status: PerformanceStatus): string {
  return PERFORMANCE_COLORS[status].text;
}

/**
 * Get light background color for a status (for subtle backgrounds)
 */
export function getStatusLightColor(status: PerformanceStatus): string {
  return PERFORMANCE_COLORS[status].light;
}

/**
 * Get border color for a status
 */
export function getStatusBorderColor(status: PerformanceStatus): string {
  return PERFORMANCE_COLORS[status].border;
}

/**
 * Format score as percentage with 2 decimal places
 */
export function formatScore(score: number): string {
  return `${(score * 100).toFixed(2)}%`;
}

/**
 * Get emoji indicator for status
 */
export function getStatusEmoji(status: PerformanceStatus): string {
  const emojis: Record<PerformanceStatus, string> = {
    'Great': '🌟',
    'Good': '✅',
    'Normal': '➖',
    'Low': '⚠️',
    'Critical': '🚨',
  };
  return emojis[status];
}

/**
 * Get CSS class name for status
 */
export function getStatusClassName(status: PerformanceStatus): string {
  return `status-${status.toLowerCase()}`;
}

/**
 * Calculate overall performance metrics for an agent
 */
export interface PerformanceMetrics {
  productionScore: number;
  productionStatus: PerformanceStatus;
  qaScore: number;
  qaStatus: PerformanceStatus;
  overallStatus: PerformanceStatus;
  isUnderperforming: boolean;
  productionPercentage: string;
  qaPercentage: string;
}

export function calculatePerformanceMetrics(
  prodScore: number,
  qaScore: number
): PerformanceMetrics {
  const prodStatus = getProductionStatus(prodScore);
  const qaStatus = getQAStatus(qaScore);
  const overallStatus = getWorstStatus(prodStatus, qaStatus);

  return {
    productionScore: prodScore,
    productionStatus: prodStatus,
    qaScore: qaScore,
    qaStatus: qaStatus,
    overallStatus: overallStatus,
    isUnderperforming: isUnderperforming(overallStatus),
    productionPercentage: formatScore(prodScore),
    qaPercentage: formatScore(qaScore),
  };
}
