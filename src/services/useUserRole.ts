// src/services/useUserRole.ts

import { useState, useMemo } from 'react';

// Define the possible roles based on the Development Timeline
export type UserRole = 'Developer' | 'Director' | 'AVP' | 'MIS' | 'User';

/**
 * Hook to manage and simulate the current user's role for security and feature toggling.
 * In a production Power App, this would authenticate the user via the Power Platform SDK
 * and look up their role against a secure Dataverse or PostgreSQL table.
 */
export const useUserRole = () => {
    // START: Default role for local development testing
    const [role, setRole] = useState<UserRole>('Director'); 
    
    // Determine permissions based on the active role
    const permissions = useMemo(() => {
        // Roles authorized to submit performance actions (Write Access)
        const canTakeAction = role === 'Director' || role === 'AVP';

        // Roles that receive full reports (e.g., AVP, Director)
        const receivesReports = role === 'Director' || role === 'AVP';

        // Roles that receive weekly notifications (e.g., MIS)
        const receivesNotifications = role === 'MIS';
        
        return {
            canTakeAction,
            receivesReports,
            receivesNotifications
        };
    }, [role]);

    return {
        role,
        ...permissions,
        // Setter is exposed for development environment testing (via Header component)
        setRole 
    };
};
