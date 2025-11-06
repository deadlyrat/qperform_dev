// src/services/dataverseService.ts
// Service for fetching employee data from Microsoft Dataverse

import { getDataverseAccessToken } from './authService';

/**
 * Employee information from Dataverse
 */
export interface DataverseEmployee {
  systemuserid: string;
  fullname: string;
  internalemailaddress: string;
  jobtitle?: string;
  businessunitid?: string;
  entityimage?: string; // Base64 encoded image
  entityimage_url?: string; // URL to fetch image
}

/**
 * Cache for employee photos to avoid repeated API calls
 */
const photoCache = new Map<string, string>();

/**
 * Configuration
 */
const DATAVERSE_URL = import.meta.env.VITE_DATAVERSE_URL || 'https://orgdf3b8790.api.crm.dynamics.com/api/data/v9.2';
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

/**
 * Gets an access token for Dataverse API calls
 */
async function getDataverseToken(): Promise<string | null> {
  if (USE_MOCK_DATA) {
    return null;
  }

  // Get token from authService
  return await getDataverseAccessToken();
}

/**
 * Fetches employee information from Dataverse by email
 */
export async function getEmployeeByEmail(email: string): Promise<DataverseEmployee | null> {
  if (USE_MOCK_DATA) {
    console.log('🔧 Mock mode: Returning mock employee data for', email);
    return {
      systemuserid: 'mock-id-' + email,
      fullname: email.split('@')[0].replace('.', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      internalemailaddress: email,
      jobtitle: 'Agent',
    };
  }

  try {
    const token = await getDataverseToken();
    if (!token) {
      console.warn('⚠️ No Dataverse token available');
      return null;
    }

    const query = `${DATAVERSE_URL}/systemusers?$filter=internalemailaddress eq '${email}'&$select=systemuserid,fullname,internalemailaddress,jobtitle,businessunitid,entityimage_url`;

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    if (!response.ok) {
      console.error('❌ Dataverse API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data.value || data.value.length === 0) {
      console.warn('⚠️ Employee not found in Dataverse:', email);
      return null;
    }

    return data.value[0];
  } catch (error) {
    console.error('❌ Failed to fetch employee from Dataverse:', error);
    return null;
  }
}

/**
 * Fetches employee photo from Dataverse
 * Returns a data URL (base64 encoded image) or null
 */
export async function getEmployeePhoto(systemuserid: string): Promise<string | null> {
  // Check cache first
  if (photoCache.has(systemuserid)) {
    return photoCache.get(systemuserid)!;
  }

  if (USE_MOCK_DATA) {
    // Return a placeholder avatar for mock mode
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const color = colors[systemuserid.length % colors.length];
    const initial = systemuserid.charAt(0).toUpperCase();

    // Generate SVG avatar
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${color}"/>
        <text x="20" y="20" font-size="16" fill="white" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-weight="600">${initial}</text>
      </svg>
    `.trim();

    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
    photoCache.set(systemuserid, dataUrl);
    return dataUrl;
  }

  try {
    const token = await getDataverseToken();
    if (!token) {
      return null;
    }

    // Fetch the entity image
    const query = `${DATAVERSE_URL}/systemusers(${systemuserid})/entityimage/$value`;

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'image/jpeg,image/png,image/gif',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('ℹ️ No photo found for user:', systemuserid);
        return null;
      }
      console.error('❌ Failed to fetch photo:', response.status);
      return null;
    }

    // Convert blob to data URL
    const blob = await response.blob();
    const dataUrl = await blobToDataURL(blob);

    // Cache the photo
    photoCache.set(systemuserid, dataUrl);

    return dataUrl;
  } catch (error) {
    console.error('❌ Failed to fetch employee photo:', error);
    return null;
  }
}

/**
 * Converts a Blob to a data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Batch fetch employee data for multiple emails
 * This is more efficient than individual queries
 */
export async function getEmployeesByEmails(emails: string[]): Promise<Map<string, DataverseEmployee>> {
  const employeeMap = new Map<string, DataverseEmployee>();

  if (USE_MOCK_DATA) {
    console.log('🔧 Mock mode: Returning mock employee data for', emails.length, 'emails');
    for (const email of emails) {
      const employee = await getEmployeeByEmail(email);
      if (employee) {
        employeeMap.set(email, employee);
      }
    }
    return employeeMap;
  }

  try {
    const token = await getDataverseToken();
    if (!token) {
      console.warn('⚠️ No Dataverse token available');
      return employeeMap;
    }

    // Build OData filter for multiple emails
    // Example: (internalemailaddress eq 'user1@domain.com' or internalemailaddress eq 'user2@domain.com')
    const filterConditions = emails.map(email => `internalemailaddress eq '${email}'`).join(' or ');
    const query = `${DATAVERSE_URL}/systemusers?$filter=(${filterConditions})&$select=systemuserid,fullname,internalemailaddress,jobtitle,businessunitid,entityimage_url`;

    const response = await fetch(query, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'OData-MaxVersion': '4.0',
        'OData-Version': '4.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
        'Prefer': 'odata.maxpagesize=500', // Fetch up to 500 records
      },
    });

    if (!response.ok) {
      console.error('❌ Dataverse API error:', response.status);
      return employeeMap;
    }

    const data = await response.json();

    if (data.value && data.value.length > 0) {
      for (const employee of data.value) {
        employeeMap.set(employee.internalemailaddress, employee);
      }
      console.log(`✅ Fetched ${data.value.length} employees from Dataverse`);
    }

    return employeeMap;
  } catch (error) {
    console.error('❌ Failed to batch fetch employees:', error);
    return employeeMap;
  }
}

/**
 * Generates a fallback avatar with initials when no photo is available
 */
export function generateAvatarInitials(name: string, email?: string): string {
  const displayName = name || email || 'Unknown';
  const nameParts = displayName.split(/[\s.@]/);

  let initials = '';
  if (nameParts.length >= 2) {
    initials = nameParts[0].charAt(0) + nameParts[1].charAt(0);
  } else {
    initials = nameParts[0].substring(0, 2);
  }

  return initials.toUpperCase();
}

/**
 * Generates a color for an avatar based on the name/email
 */
export function generateAvatarColor(identifier: string): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ];

  // Use a simple hash to consistently assign a color
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Clears the photo cache (useful when switching users or refreshing data)
 */
export function clearPhotoCache(): void {
  photoCache.clear();
  console.log('🔄 Photo cache cleared');
}
