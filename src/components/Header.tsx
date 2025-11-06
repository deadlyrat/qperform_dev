// src/components/Header.tsx

import { Avatar } from '@fluentui/react-components';
import { AlertUrgent24Regular, Settings24Regular } from '@fluentui/react-icons';
import './Header.css';
import { useUserRole } from '../services/useUserRole'; 

// --- UPDATED LOGO URL ---
const logoUrl = 'https://onq.global/wp-content/uploads/2025/05/OnQ_Logo_4Color-400x90.webp';

// Define the type for the props
type HeaderProps = {
  userName: string;
  notificationCount: number;
  onLogoClick: () => void;
};

// Accept the props as an argument
export default function Header({ userName, notificationCount, onLogoClick }: HeaderProps) {
  const { role, user } = useUserRole();

  return (
    <header className="app-header">
      {/* Make the logo area clickable */}
      <div
        className="header-left"
        onClick={onLogoClick}
        style={{ cursor: 'pointer' }}
      >
        {/* Adjusted style for banner logo aspect ratio */}
        <img
          src={logoUrl}
          alt="OnQ Logo"
          className="header-logo"
          style={{ height: '30px', width: 'auto' }}
        />
        <div className="header-title-group">
          <span className="header-title">QPerform</span>
          {/* Display current role dynamically */}
          <span className="header-subtitle">Role: {role || 'Loading...'}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="notification-icon">
          <AlertUrgent24Regular />
          {/* Only show the badge if the count is greater than 0 */}
          {notificationCount > 0 && (
            <div className="notification-badge">{notificationCount}</div>
          )}
        </div>
        <Settings24Regular />
        {/* Use the user's display name from authentication */}
        <Avatar name={user?.displayName || userName} size={32} />
      </div>
    </header>
  );
}
