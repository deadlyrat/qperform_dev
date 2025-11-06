// src/services/authService.ts
// Authentication using Microsoft Dataverse Web API

import { PublicClientApplication, InteractionRequiredAuthError, type Configuration, type AccountInfo } from '@azure/msal-browser';

// ====================================
// Dataverse Configuration
// ====================================
const DATAVERSE_URL = import.meta.env.VITE_DATAVERSE_URL || 'https://orgdf3b8790.api.crm.dynamics.com/api/data/v9.2';

// MSAL Configuration for Dataverse authentication
const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_DATAVERSE_CLIENT_ID || 'YOUR_CLIENT_ID_HERE',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_DATAVERSE_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  }
};

// Initialize MSAL instance
let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
}

/**
 * Gets an access token for Dataverse API calls
 * Export this so other services can use it
 */
export async function getDataverseAccessToken(): Promise<string | null> {
  // Check if using mock authentication
  if (import.meta.env.VITE_USE_MOCK_AUTH === 'true') {
    return null; // No token needed in mock mode
  }

  try {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();

    if (accounts.length === 0) {
      return null;
    }

    const account = accounts[0];

    try {
      const response = await msal.acquireTokenSilent({
        scopes: [`${DATAVERSE_URL}/.default`],
        account: account,
      });
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        const response = await msal.acquireTokenPopup({
          scopes: [`${DATAVERSE_URL}/.default`],
          account: account,
        });
        return response.accessToken;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to get Dataverse access token:', error);
    return null;
  }
}

/**
 * MIS Contact Information for Access Requests
 * Contact: ONQ.PowerBI.MIS@onqoc.com (MIS Team)
 * This account has full developer access and control over QPerform
 */
export const MIS_CONTACT = {
  email: 'ONQ.PowerBI.MIS@onqoc.com',
  name: 'MIS Team',
  role: 'Administrator',
};

/**
 * User profile information from Microsoft authentication
 */
export interface UserProfile {
  email: string;
  displayName: string;
  jobTitle?: string;
  department?: string;
  id: string;
}

/**
 * Role types based on job titles
 */
export type UserRole = 'AVP' | 'Director' | 'Manager' | 'Assistant Manager' | 'Supervisor' | 'Team Lead' | 'Agent' | 'Unauthorized';

/**
 * Job titles that have access to the app
 * Based on requirements: Team Lead, Supervisor, Assistant Manager, Manager and above
 */
const AUTHORIZED_TITLES = [
  // Executive roles
  'AVP',
  'Assistant Vice President',
  'Vice President',
  'VP',
  'Senior Vice President',
  'SVP',

  // Director roles
  'Director',
  'Associate Director',
  'Senior Director',

  // Manager roles
  'Manager',
  'Senior Manager',
  'Assistant Manager',

  // Supervisor roles
  'Supervisor',
  'Senior Supervisor',

  // Team Lead roles
  'Team Lead',
  'Team Leader',
  'Lead',
];

/**
 * Fetches user information from Dataverse SystemUser table
 */
async function fetchUserFromDataverse(email: string): Promise<UserProfile | null> {
  try {
    const token = await getDataverseAccessToken();
    if (!token) {
      console.error('❌ No Dataverse access token available');
      return null;
    }

    // Query Dataverse SystemUser table for user information
    // Using OData query to filter by email (internalemailaddress)
    const query = `${DATAVERSE_URL}/systemusers?$filter=internalemailaddress eq '${email}'&$select=systemuserid,fullname,internalemailaddress,jobtitle,businessunitid`;

    console.log('🔍 Fetching user from Dataverse:', email);

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Prefer': 'odata.include-annotations="*"',
      },
    });

    if (!response.ok) {
      console.error('❌ Dataverse API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.value || data.value.length === 0) {
      console.warn('⚠️ User not found in Dataverse:', email);
      return null;
    }

    const dataverseUser = data.value[0];

    const userProfile: UserProfile = {
      id: dataverseUser.systemuserid,
      email: dataverseUser.internalemailaddress,
      displayName: dataverseUser.fullname,
      jobTitle: dataverseUser.jobtitle,
      department: undefined, // Can be fetched from businessunit if needed
    };

    console.log('✅ User fetched from Dataverse:', userProfile);

    return userProfile;
  } catch (error) {
    console.error('❌ Failed to fetch user from Dataverse:', error);
    return null;
  }
}

/**
 * Gets the current user's profile from Microsoft authentication
 */
export async function getCurrentUser(): Promise<UserProfile | null> {
  // Check if we should use mock authentication (for development without Dataverse)
  const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

  if (useMockAuth) {
    console.log('🔧 Using mock authentication (VITE_USE_MOCK_AUTH=true)');
    console.log('✅ Mock user authenticated');
    return {
      id: 'dev-user-123',
      email: 'pablo.aguirre@onqglobal.com',
      displayName: 'Pablo Aguirre',
      jobTitle: 'Director',
      department: 'MIS',
    };
  }

  // Production Dataverse authentication
  try {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();

    let account: AccountInfo;

    if (accounts.length === 0) {
      // No user signed in - trigger interactive login
      console.log('🔐 No user signed in - triggering login popup...');
      try {
        const loginResponse = await msal.loginPopup({
          scopes: [`${DATAVERSE_URL}/.default`],
          prompt: 'select_account',
        });
        account = loginResponse.account;
      } catch (loginError) {
        console.error('❌ Login failed:', loginError);
        return null;
      }
    } else {
      // User already signed in
      account = accounts[0];

      // Try to get fresh token silently
      try {
        await msal.acquireTokenSilent({
          scopes: [`${DATAVERSE_URL}/.default`],
          account: account,
        });
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          // Silent token acquisition failed, use popup
          try {
            const response = await msal.acquireTokenPopup({
              scopes: [`${DATAVERSE_URL}/.default`],
              account: account,
            });
            account = response.account;
          } catch (popupError) {
            console.error('❌ Token acquisition failed:', popupError);
            return null;
          }
        }
      }
    }

    // Fetch full user profile from Dataverse SystemUser table
    const userProfile = await fetchUserFromDataverse(account.username);

    if (!userProfile) {
      console.error('❌ Failed to fetch user profile from Dataverse');
      return null;
    }

    return userProfile;
  } catch (error) {
    console.error('❌ Failed to authenticate user:', error);

    // For local development, return a mock user
    if (import.meta.env.DEV) {
      console.warn('⚠️ Running in development mode - using mock user');
      return {
        id: 'dev-user-123',
        email: 'pablo.aguirre@onqglobal.com',
        displayName: 'Pablo Aguirre',
        jobTitle: 'Director',
        department: 'MIS',
      };
    }

    return null;
  }
}

/**
 * Special accounts with automatic full access (bypass job title check)
 */
const AUTO_APPROVED_EMAILS = [
  'ONQ.PowerBI.MIS@onqoc.com',  // MIS Team - Administrator account
];

/**
 * Determines if a user has access based on their email or job title
 */
export function isUserAuthorized(email?: string, jobTitle?: string): boolean {
  // Check if email is in auto-approved list (MIS Team, etc.)
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const isAutoApproved = AUTO_APPROVED_EMAILS.some(
      approvedEmail => normalizedEmail === approvedEmail.toLowerCase()
    );

    if (isAutoApproved) {
      console.log(`🔐 Auto-approved account: "${email}" ✅ Administrator Access Granted`);
      return true;
    }
  }

  // Check job title for regular users
  if (!jobTitle) {
    console.warn('⚠️ No job title provided for authorization check');
    return false;
  }

  const normalizedTitle = jobTitle.trim().toLowerCase();

  const isAuthorized = AUTHORIZED_TITLES.some(
    authorizedTitle => normalizedTitle.includes(authorizedTitle.toLowerCase())
  );

  console.log(`🔐 Authorization check for "${jobTitle}": ${isAuthorized ? '✅ Granted' : '❌ Denied'}`);

  return isAuthorized;
}

/**
 * Maps email and job title to a specific role for permission checking
 */
export function getUserRole(email?: string, jobTitle?: string): UserRole {
  // Check if this is an auto-approved account (MIS Team)
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    if (AUTO_APPROVED_EMAILS.some(approvedEmail => normalizedEmail === approvedEmail.toLowerCase())) {
      return 'Director'; // Give MIS Team director-level access
    }
  }

  if (!jobTitle) {
    return 'Unauthorized';
  }

  const normalizedTitle = jobTitle.trim().toLowerCase();

  // Check for AVP
  if (normalizedTitle.includes('avp') ||
      normalizedTitle.includes('assistant vice president') ||
      normalizedTitle.includes('vice president') ||
      normalizedTitle.includes('vp') ||
      normalizedTitle.includes('svp')) {
    return 'AVP';
  }

  // Check for Director
  if (normalizedTitle.includes('director')) {
    return 'Director';
  }

  // Check for Manager
  if (normalizedTitle.includes('manager')) {
    return normalizedTitle.includes('assistant') ? 'Assistant Manager' : 'Manager';
  }

  // Check for Supervisor
  if (normalizedTitle.includes('supervisor')) {
    return 'Supervisor';
  }

  // Check for Team Lead
  if (normalizedTitle.includes('team lead') ||
      normalizedTitle.includes('team leader') ||
      normalizedTitle.includes('lead')) {
    return 'Team Lead';
  }

  // Default to Agent if title doesn't match
  return 'Agent';
}

/**
 * Gets user permissions based on their role
 */
export function getUserPermissions(role: UserRole) {
  const canTakeAction = role === 'Director' || role === 'AVP';
  const canViewReports = role !== 'Unauthorized' && role !== 'Agent';
  const canViewAllClients = role === 'Director' || role === 'AVP';
  const receivesNotifications = role === 'Director' || role === 'AVP';

  return {
    canTakeAction,
    canViewReports,
    canViewAllClients,
    receivesNotifications,
  };
}

/**
 * Main authentication check - returns user profile and authorization status
 */
export async function authenticateUser(): Promise<{
  user: UserProfile | null;
  isAuthorized: boolean;
  role: UserRole;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      isAuthorized: false,
      role: 'Unauthorized',
    };
  }

  console.log('🔍 Authenticating user:', { email: user.email, jobTitle: user.jobTitle });

  const isAuthorized = isUserAuthorized(user.email, user.jobTitle);
  const role = isAuthorized ? getUserRole(user.email, user.jobTitle) : 'Unauthorized';

  console.log('🔍 Authentication result:', { isAuthorized, role });

  return {
    user,
    isAuthorized,
    role,
  };
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  try {
    const msal = await getMsalInstance();
    await msal.logoutPopup();
    console.log('✅ User signed out');
  } catch (error) {
    console.error('❌ Sign out error:', error);
  }
}
