// src/services/useUserRole.ts

import { useState, useEffect, useMemo } from 'react';
import { authenticateUser, getUserPermissions, type UserRole, type UserProfile } from './authService';

/**
 * Hook to manage user authentication and role-based permissions
 * Uses Microsoft authentication via Power Apps SDK
 * @param shouldAuthenticate - If true, triggers authentication. If false, returns loading state.
 */
export const useUserRole = (shouldAuthenticate: boolean = true) => {
    const [role, setRole] = useState<UserRole | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(shouldAuthenticate);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!shouldAuthenticate) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;
        let hasStarted = false;

        const loadUser = async () => {
            // Prevent multiple simultaneous auth calls
            if (hasStarted) return;
            hasStarted = true;

            try {
                console.log('🔐 Starting authentication...');
                setIsLoading(true);
                const authResult = await authenticateUser();

                if (!isMounted) return;

                console.log('🔐 User authentication complete:', {
                    user: authResult.user?.displayName,
                    role: authResult.role,
                    authorized: authResult.isAuthorized,
                });

                if (!isMounted) return;

                // Update all state together in one batch
                setUser(authResult.user);
                setRole(authResult.role);
                setIsAuthorized(authResult.isAuthorized);
                setIsLoading(false);

                console.log('🔐 Loading set to false, isAuthorized:', authResult.isAuthorized);
            } catch (error) {
                console.error('❌ Authentication error:', error);
                if (isMounted) {
                    setRole('Unauthorized');
                    setIsAuthorized(false);
                    setIsLoading(false);
                }
            }
        };

        loadUser();

        return () => {
            isMounted = false;
        };
    }, [shouldAuthenticate]);

    // Determine permissions based on the active role
    const permissions = useMemo(() => {
        if (!role || role === 'Unauthorized') {
            return {
                canTakeAction: false,
                canViewReports: false,
                canViewAllClients: false,
                receivesNotifications: false,
            };
        }

        return getUserPermissions(role);
    }, [role]);

    return {
        role,
        user,
        isLoading,
        isAuthorized,
        ...permissions,
    };
};

// Re-export types for convenience
export type { UserRole, UserProfile };
