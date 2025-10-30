// src/screens/WelcomeScreen.tsx

import { Button, tokens } from '@fluentui/react-components';
import { ChartMultiple24Regular } from '@fluentui/react-icons';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onEnter: () => void;
}

const ONQ_LOGO_URL = 'https://onq.global/wp-content/uploads/2025/05/OnQ_Logo_4Color-400x90.webp';

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        
        {/* NEW LOGO - Sizing controlled by inline style for precise banner display */}
        <img 
          src={ONQ_LOGO_URL} 
          alt="OnQ Global Logo" 
          className="welcome-logo" 
          style={{ width: '180px', height: 'auto', marginBottom: tokens.spacingVerticalXXL }}
        />
        
        {/* Removed <hr> tags for cleaner layout, combined text elements for better hierarchy */}
        <h1 className="welcome-title">QPerform</h1>
        <hr></hr>
        <h2 className="welcome-subtitle">
            Performance Management Suite
        </h2>

        <div className="welcome-version">Version 0.1.0</div>

        <p className="welcome-description">
          This system provides leadership members with a clear, visual, and weekly review of Production and QA performance results across all operation employees. Our focus is on highlighting "At Risk" performance and providing automated, actionable recommendations to ensure continuous improvement and compliance with OnQ's Standards.
        </p>
    
        <Button 
          appearance="primary" 
          size="large"
          icon={<ChartMultiple24Regular />}
          onClick={onEnter}
        >
          Enter Dashboard
        </Button>
      </div>

      <div className="welcome-footer">
        <p>&copy; 2025 OnQ Global. All Rights Reserved.</p>
      </div>
    </div>
  );
}
