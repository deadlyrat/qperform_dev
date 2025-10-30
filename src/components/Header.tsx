// src/components/Header.tsx

// Removed 'import * as React from "react";' to fix TS6133
import { 
  Avatar, 
  Dropdown, 
  Option, 
  Label, 
  type OptionOnSelectData, 
  type SelectionEvents 
} from '@fluentui/react-components'; 
// Removed ChevronDown24Regular import since we no longer use it explicitly
import { AlertUrgent24Regular, Settings24Regular } from '@fluentui/react-icons'; 
import './Header.css';
import { useUserRole, type UserRole } from '../services/useUserRole'; 

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
  const { role, setRole } = useUserRole();

  // Correctly use Fluent UI types for the handler signature
  const handleRoleChange = (
    _e: SelectionEvents, 
    data: OptionOnSelectData
  ) => {
    // Check if the role setter function exists and if optionValue is defined
    if (setRole && data.optionValue) {
      // The value will be set as one of the UserRole strings
      setRole(data.optionValue as UserRole);
    }
  };

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
          <span className="header-subtitle">Role: {role}</span>
        </div>
      </div>
      <div className="header-right">
        {/* Role Switcher (Visible to Developers Only) */}
        {role === 'Developer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Label size="small" htmlFor="role-switcher">Switch Role:</Label>
            <Dropdown
              id="role-switcher"
              size="small"
              placeholder="Select Role"
              selectedOptions={[role]}
              // Applied the correctly typed handler
              onOptionSelect={handleRoleChange} 
              // FIX 2: Removed the problematic contentAfter prop, relying on default behavior
              style={{ minWidth: '120px' }}
            >
              <Option value="Developer">Developer</Option>
              <Option value="Director">Director</Option>
              <Option value="AVP">AVP</Option>
              <Option value="MIS">MIS</Option>
              <Option value="User">User</Option>
            </Dropdown>
          </div>
        )}

        <div className="notification-icon">
          <AlertUrgent24Regular />
          {/* Only show the badge if the count is greater than 0 */}
          {notificationCount > 0 && (
            <div className="notification-badge">{notificationCount}</div>
          )}
        </div>
        <Settings24Regular />
        {/* Use the dynamic userName prop for the Avatar */}
        <Avatar name={userName} size={32} />
      </div>
    </header>
  );
}
