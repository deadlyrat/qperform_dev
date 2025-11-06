// src/screens/AccessDenied.tsx

import { Card, Button } from '@fluentui/react-components';
import { ShieldError24Regular, Info24Regular, Mail24Regular, ArrowLeft24Regular } from '@fluentui/react-icons';
import type { UserProfile } from '../services/authService';
import './AccessDenied.css';

interface AccessDeniedProps {
  user: UserProfile | null;
  onGoBack?: () => void;
}

const MIS_CONTACT_EMAIL = 'ONQ.PowerBI.MIS@onqoc.com';
const MIS_CONTACT_NAME = 'MIS Team';

export default function AccessDenied({ user, onGoBack }: AccessDeniedProps) {
  // Generate email request template using Outlook Web
  const generateAccessRequestEmail = () => {
    const subject = 'QPerform Access Request';
    const body = `Hello ${MIS_CONTACT_NAME},

I am requesting access to the QPerform application.

User Information:
- Name: ${user?.displayName || 'N/A'}
- Email: ${user?.email || 'N/A'}
- Job Title: ${user?.jobTitle || 'Not Available'}
- Department: ${user?.department || 'N/A'}

Reason for Access:
[Please describe why you need access to QPerform]

Thank you for your assistance.

Best regards,
${user?.displayName || 'Your Name'}`;

    // Use Outlook Web URL instead of mailto: to open in browser where user likely has Outlook Web open
    return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(MIS_CONTACT_EMAIL)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return (
    <div className="access-denied-container">
      <Card className="access-denied-card">
        <div className="access-denied-icon">
          <ShieldError24Regular style={{ fontSize: '64px', color: '#d13438' }} />
        </div>

        <h1 className="access-denied-title">Access Denied</h1>

        <div className="access-denied-message">
          {user ? (
            <>
              <p>Hello, <strong>{user.displayName}</strong></p>
              <p>Your account does not have permission to access QPerform.</p>

              {user.jobTitle && (
                <div className="user-info-box">
                  <p><strong>Your Job Title:</strong> {user.jobTitle}</p>
                  <p><strong>Email:</strong> {user.email}</p>
                </div>
              )}
            </>
          ) : (
            <p>Unable to authenticate your account.</p>
          )}
        </div>

        <div className="access-info-box">
          <Info24Regular style={{ fontSize: '20px', color: '#0078d4' }} />
          <div className="access-info-content">
            <h3>Who can access QPerform?</h3>
            <p>This application is restricted to:</p>
            <ul>
              <li>Team Leads</li>
              <li>Supervisors</li>
              <li>Assistant Managers</li>
              <li>Managers</li>
              <li>Directors</li>
              <li>AVP and above</li>
            </ul>
          </div>
        </div>

        <div className="access-denied-footer">
          <p>If you believe you should have access, please request it below:</p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              appearance="primary"
              icon={<Mail24Regular />}
              size="large"
              as="a"
              href={generateAccessRequestEmail()}
              target="_blank"
              rel="noopener noreferrer"
            >
              Request Access via Email
            </Button>

            {onGoBack && (
              <Button
                appearance="secondary"
                icon={<ArrowLeft24Regular />}
                size="large"
                onClick={onGoBack}
              >
                Go Back
              </Button>
            )}
          </div>

          <p style={{ marginTop: '24px', fontSize: '0.9rem', color: '#666' }}>
            Contact: <strong>{MIS_CONTACT_NAME}</strong> ({MIS_CONTACT_EMAIL})
          </p>
        </div>
      </Card>
    </div>
  );
}
