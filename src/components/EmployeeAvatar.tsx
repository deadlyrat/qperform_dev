// src/components/EmployeeAvatar.tsx
// Component for displaying employee avatars with photos from Dataverse

import { useState, useEffect } from 'react';
import { getEmployeePhoto, generateAvatarInitials, generateAvatarColor } from '../services/dataverseService';
import './EmployeeAvatar.css';

export interface EmployeeAvatarProps {
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Avatar component that displays employee photos from Dataverse
 * Falls back to initials if no photo is available
 */
export function EmployeeAvatar({
  employeeId,
  employeeName,
  employeeEmail,
  size = 'medium',
  className = '',
}: EmployeeAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Fetch photo when component mounts or employeeId changes
  useEffect(() => {
    let isMounted = true;

    async function loadPhoto() {
      if (!employeeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const photo = await getEmployeePhoto(employeeId);

        if (isMounted) {
          setPhotoUrl(photo);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load employee photo:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPhoto();

    return () => {
      isMounted = false;
    };
  }, [employeeId]);

  // Generate initials for fallback
  const initials = generateAvatarInitials(employeeName || '', employeeEmail);
  const color = generateAvatarColor(employeeId || employeeEmail || employeeName || '');

  const sizeClass = `avatar-${size}`;

  // If we have a photo and it loaded successfully, show it
  if (photoUrl && !error) {
    return (
      <div className={`employee-avatar ${sizeClass} ${className}`}>
        <img
          src={photoUrl}
          alt={employeeName || employeeEmail || 'Employee'}
          className="avatar-image"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Otherwise, show initials with colored background
  return (
    <div
      className={`employee-avatar avatar-initials ${sizeClass} ${className}`}
      style={{ backgroundColor: color }}
      title={employeeName || employeeEmail}
    >
      {loading ? (
        <div className="avatar-loading">⋯</div>
      ) : (
        <span className="avatar-text">{initials}</span>
      )}
    </div>
  );
}

/**
 * Compact avatar for use in lists/tables
 */
export function CompactEmployeeAvatar({
  employeeId,
  employeeName,
  employeeEmail,
}: EmployeeAvatarProps) {
  return (
    <div className="compact-employee-avatar">
      <EmployeeAvatar
        employeeId={employeeId}
        employeeName={employeeName}
        employeeEmail={employeeEmail}
        size="small"
      />
      <div className="employee-info">
        <div className="employee-name">{employeeName || employeeEmail || 'Unknown'}</div>
        {employeeEmail && employeeName && (
          <div className="employee-email">{employeeEmail}</div>
        )}
      </div>
    </div>
  );
}
