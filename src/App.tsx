// src/App.tsx

import { useState, useEffect } from 'react';
import { FluentProvider, teamsLightTheme, Spinner } from '@fluentui/react-components';
import WelcomeScreen from './screens/WelcomeScreen';
import PerformanceScreen from './screens/PerformanceScreen';
import AccessDenied from './screens/AccessDenied';
import OrientationLock from './components/ui/OrientationLock';
import { useUserRole } from './services/useUserRole';
import './App.css';

type AppState = 'welcome' | 'authenticating' | 'authorized' | 'denied';

function App() {
  const [appState, setAppState] = useState<AppState>('welcome');

  // Only authenticate when user tries to enter dashboard or is in an auth-related state
  // Pass shouldAuthenticate=true after Enter Dashboard is clicked and keep it true during auth flow
  const shouldAuth = appState === 'authenticating' || appState === 'authorized' || appState === 'denied';
  const { isLoading, isAuthorized, user } = useUserRole(shouldAuth);

  // Handle Enter Dashboard button click
  const handleEnterDashboard = () => {
    setAppState('authenticating');
  };

  // Update app state based on authentication result
  useEffect(() => {
    console.log('🔄 App.tsx useEffect:', { appState, isLoading, isAuthorized });

    // Only update state when we're in the authenticating phase and loading is complete
    if (appState === 'authenticating' && !isLoading) {
      console.log('🔄 Transitioning from authenticating to:', isAuthorized ? 'authorized' : 'denied');
      if (isAuthorized) {
        setAppState('authorized');
      } else {
        setAppState('denied');
      }
    }
  }, [appState, isLoading, isAuthorized]);

  // This function resets to welcome screen
  const handleGoToWelcome = () => {
    setAppState('welcome');
  };

  return (
    <div className="app-container">
      <OrientationLock />

      <FluentProvider theme={teamsLightTheme}>
        {appState === 'welcome' ? (
          // Show welcome screen first (no authentication yet)
          <WelcomeScreen onEnter={handleEnterDashboard} />
        ) : appState === 'authenticating' ? (
          // Show loading spinner while authenticating
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            gap: '16px'
          }}>
            <Spinner size="extra-large" label="Authenticating..." />
            <p style={{ color: '#666' }}>Verifying your OnQ credentials...</p>
          </div>
        ) : appState === 'denied' ? (
          // Show access denied screen if user is not authorized
          <AccessDenied user={user} onGoBack={handleGoToWelcome} />
        ) : (
          // Show main app dashboard for authorized users
          <PerformanceScreen onGoToWelcome={handleGoToWelcome} />
        )}
      </FluentProvider>
    </div>
  );
}

export default App;
