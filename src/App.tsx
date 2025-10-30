// src/App.tsx

import { useState } from 'react';
import { FluentProvider, teamsLightTheme } from '@fluentui/react-components';
import WelcomeScreen from './screens/WelcomeScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import OrientationLock from './components/ui/OrientationLock'; 
import './App.css'; 

function App() {
  // State controls which screen is visible: Welcome (false) or Dashboard (true)
  const [showDashboard, setShowDashboard] = useState(false);

  const handleEnterDashboard = () => {
    setShowDashboard(true);
  };
  
  // This function resets the state to show the WelcomeScreen
  const handleGoToWelcome = () => {
    setShowDashboard(false);
  };

  return (
    <div className="app-container">
      <OrientationLock />

      <FluentProvider theme={teamsLightTheme}>
        {showDashboard ? (
          // Renders the main app dashboard.
          // It receives the navigation reset function, which is relayed to the Header.
          <PerformanceScreen onGoToWelcome={handleGoToWelcome} />
        ) : (
          // Renders the initial landing page.
          <WelcomeScreen onEnter={handleEnterDashboard} />
        )}
      </FluentProvider>
    </div>
  );
}

export default App;
