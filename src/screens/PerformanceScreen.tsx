// src/screens/performance/PerformanceScreen.tsx

import { useState } from 'react';
import { Tab, TabList, type SelectTabData, type SelectTabEvent } from '@fluentui/react-components';

// Import the main layout components and its corresponding stylesheet
import Header from '../components/Header';
import './PerformanceScreen.css';
import { useUserRole } from '../services/useUserRole'; // <-- Import the role hook

// Import the three view components that will be shown in the tabs
import MonthlySummaryView from './MonthlySummaryView';
import ActionLogView from './ActionLogView';
import UnderperformingView from './UnderperformingView';

// Define a TypeScript type for our possible views to prevent typos and errors
type View = 'underperforming' | 'summary' | 'actionlog';

// NEW PROPS INTERFACE (received from App.tsx)
interface PerformanceScreenProps {
  onGoToWelcome: () => void;
}

export default function PerformanceScreen({ onGoToWelcome }: PerformanceScreenProps) {
  const [selectedView, setSelectedView] = useState<View>('underperforming');
  // 1. Get role and permission flags from the hook
  const { role, receivesReports, receivesNotifications } = useUserRole(); 

  const onTabSelect = (_event: SelectTabEvent, data: SelectTabData) => {
    setSelectedView(data.value as View);
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'underperforming':
        return <UnderperformingView />;
      case 'summary':
        return <MonthlySummaryView />;
      case 'actionlog':
        return <ActionLogView />;
      default:
        return null;
    }
  };

  // User details (Name for Avatar, notifications for badge)
  const currentUser = {
    name: "Pablo Aguirre",
    notifications: 3,
  };
  
  // 2. Custom message based on role (Acknowledging notification recipients)
  const getRoleMessage = () => {
      if (receivesReports) {
          // Director/AVP Role: Receives full reports
          return `Your role (${role}) receives automated Weekly Performance Reports and has full action authority.`;
      }
      if (receivesNotifications) {
          // MIS Role: Receives weekly notifications
          return `Your role (${role}) receives Weekly Notifications to monitor high-risk trends.`;
      }
      // Standard User Role: View-only
      return `Your role (${role}) has view-only access to all dashboards.`;
  };

  return (
    <div className="performance-screen-container">
      
      {/* Pass the welcome reset function to the Header's logo click handler */}
      <Header 
        userName={currentUser.name} 
        notificationCount={currentUser.notifications} 
        onLogoClick={onGoToWelcome} 
      />
      
      <main className="performance-screen-content">
        
        {/* Screen Title and Role-Based Message Banner */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: '0 0 4px 0' }}>Performance Review</h2>
          {/* Display the role-based notification and permission summary */}
          <p style={{ color: '#005a9e', margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
            {getRoleMessage()}
          </p>
        </div>

        {/* The Tab Navigation Component from Fluent UI */}
        <TabList selectedValue={selectedView} onTabSelect={onTabSelect}>
          <Tab value="underperforming">Underperforming Review</Tab>
          <Tab value="summary">Monthly Summary</Tab>
          <Tab value="actionlog">Action Log</Tab>
        </TabList>

        {/* The area where the selected view will be rendered */}
        <div style={{ marginTop: '20px' }}>
          {renderContent()}
        </div>

      </main>
    </div>
  );
}
