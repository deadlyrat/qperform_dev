// src/components/ui/OrientationLock.tsx

import { MobileOptimized24Regular } from '@fluentui/react-icons';
import './OrientationLock.css';

/**
 * A simple UI overlay that is shown only in portrait mode to instruct
 * the user to rotate their device to landscape.
 * This component has no props and works entirely via CSS.
 */
export default function OrientationLock() {
  return (
    // This overlay will cover the entire screen when its CSS 'display' property is not 'none'.
    <div className="orientation-lock-overlay">
      <div className="orientation-lock-content">
        <MobileOptimized24Regular className="orientation-lock-icon" />
        <h2>Please Rotate Your Device</h2>
        <p>This application is designed for the best experience in landscape mode.</p>
      </div>
    </div>
  );
}