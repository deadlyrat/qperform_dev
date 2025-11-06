// src/components/PerformanceScoreBadge.tsx
// Component for displaying performance scores with color-coded badges

import {
  type PerformanceStatus,
  getStatusColor,
  getStatusEmoji,
  formatScore,
} from '../services/performanceScoring';
import './PerformanceScoreBadge.css';

export interface PerformanceScoreBadgeProps {
  status: PerformanceStatus;
  score?: number;
  showEmoji?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'solid' | 'outline' | 'subtle';
  className?: string;
}

/**
 * Badge component for displaying performance status with color coding
 */
export function PerformanceScoreBadge({
  status,
  score,
  showEmoji = false,
  size = 'medium',
  variant = 'solid',
  className = '',
}: PerformanceScoreBadgeProps) {
  const colors = getStatusColor(status);
  const emoji = showEmoji ? getStatusEmoji(status) : '';

  const getStyles = () => {
    switch (variant) {
      case 'solid':
        return {
          backgroundColor: colors.background,
          color: colors.text,
          border: `1px solid ${colors.border}`,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: colors.background,
          border: `2px solid ${colors.background}`,
        };
      case 'subtle':
        return {
          backgroundColor: colors.light,
          color: colors.border,
          border: `1px solid ${colors.background}`,
        };
      default:
        return {};
    }
  };

  return (
    <div
      className={`performance-badge performance-badge-${size} performance-badge-${variant} ${className}`}
      style={getStyles()}
      title={`Performance: ${status}${score !== undefined ? ` - ${formatScore(score)}` : ''}`}
    >
      {emoji && <span className="badge-emoji">{emoji}</span>}
      <span className="badge-text">{status}</span>
      {score !== undefined && (
        <span className="badge-score">{formatScore(score)}</span>
      )}
    </div>
  );
}

/**
 * Compact badge variant showing only score with color
 */
export function CompactScoreBadge({
  status,
  score,
  size = 'small',
}: Pick<PerformanceScoreBadgeProps, 'status' | 'score' | 'size'>) {
  const colors = getStatusColor(status);

  return (
    <div
      className={`compact-score-badge compact-score-badge-${size}`}
      style={{
        backgroundColor: colors.background,
        color: colors.text,
      }}
      title={`${status}: ${score !== undefined ? formatScore(score) : 'N/A'}`}
    >
      {score !== undefined ? formatScore(score) : 'N/A'}
    </div>
  );
}

/**
 * Status indicator dot (minimal visual indicator)
 */
export function StatusDot({
  status,
  size = 8,
}: {
  status: PerformanceStatus;
  size?: number;
}) {
  const colors = getStatusColor(status);

  return (
    <div
      className="status-dot"
      style={{
        width: size,
        height: size,
        backgroundColor: colors.background,
        borderRadius: '50%',
        display: 'inline-block',
      }}
      title={status}
    />
  );
}
