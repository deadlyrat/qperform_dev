// src/services/warningService.ts
// Frontend service for Warning & Recommendation Engine

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Warning types
 */
export type WarningType = 'Verbal' | 'Written' | 'Coaching';

/**
 * Warning data structure
 */
export interface Warning {
  warning_id: number;
  agent_id: string;
  agent_email: string;
  agent_name?: string;
  warning_type: WarningType;
  warning_subtype?: string;
  metric_type: 'Production' | 'QA';
  issued_by: string;
  issued_by_email?: string;
  issued_date: string;
  expires_date?: string;
  is_active: boolean;
  notes?: string;
  related_week_start?: string;
  related_week_end?: string;
  client?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Recommendation data structure
 */
export interface Recommendation {
  recommendation_id?: number;
  agent_email: string;
  agent_name?: string;
  recommendation_type: string;
  case: string; // 'A', 'B', 'C', 'D', 'E', 'First'
  metric_type: 'Production' | 'QA';
  recommendation_text: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  generated_date: string;
  generated_for_week_start?: string;
  generated_for_week_end?: string;
  is_actioned: boolean;
  actioned_date?: string;
  actioned_by?: string;
  actioned_by_email?: string;
  action_notes?: string;
  client?: string;
  category?: string;
}

/**
 * Create warning data structure
 */
export interface CreateWarningData {
  agentId: string;
  agentEmail: string;
  agentName?: string;
  warningType: WarningType;
  warningSubtype?: string;
  metricType: 'Production' | 'QA';
  issuedBy: string;
  issuedByEmail?: string;
  issuedDate?: Date;
  notes?: string;
  weekStartDate?: Date;
  weekEndDate?: Date;
  client?: string;
  category?: string;
}

/**
 * Get all warnings for an agent
 */
export async function getWarnings(
  agentEmail: string,
  metricType?: 'Production' | 'QA'
): Promise<Warning[]> {
  try {
    const url = new URL(`${API_URL}/api/warnings/${encodeURIComponent(agentEmail)}`);
    if (metricType) {
      url.searchParams.append('metricType', metricType);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch warnings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching warnings:', error);
    throw error;
  }
}

/**
 * Get active warnings for an agent
 */
export async function getActiveWarnings(
  agentEmail: string,
  metricType: 'Production' | 'QA'
): Promise<Warning[]> {
  try {
    const url = new URL(`${API_URL}/api/warnings/${encodeURIComponent(agentEmail)}/active`);
    url.searchParams.append('metricType', metricType);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch active warnings: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching active warnings:', error);
    throw error;
  }
}

/**
 * Create a new warning
 */
export async function createWarning(warningData: CreateWarningData): Promise<{ warningId: number }> {
  try {
    const response = await fetch(`${API_URL}/api/warnings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warningData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create warning: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating warning:', error);
    throw error;
  }
}

/**
 * Generate recommendation for an agent
 */
export async function generateRecommendation(
  agentEmail: string,
  metricType: 'Production' | 'QA',
  weekStartDate: Date,
  weekEndDate: Date
): Promise<Recommendation> {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentEmail,
        metricType,
        weekStartDate: weekStartDate.toISOString(),
        weekEndDate: weekEndDate.toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate recommendation: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
}

/**
 * Get recommendations for an agent
 */
export async function getRecommendations(
  agentEmail: string,
  options?: {
    metricType?: 'Production' | 'QA';
    actionedOnly?: boolean;
  }
): Promise<Recommendation[]> {
  try {
    const url = new URL(`${API_URL}/api/recommendations/${encodeURIComponent(agentEmail)}`);

    if (options?.metricType) {
      url.searchParams.append('metricType', options.metricType);
    }

    if (options?.actionedOnly !== undefined) {
      url.searchParams.append('actionedOnly', String(options.actionedOnly));
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

/**
 * Get all unactioned recommendations
 */
export async function getUnactionedRecommendations(): Promise<Recommendation[]> {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/unactioned/all`);

    if (!response.ok) {
      throw new Error(`Failed to fetch unactioned recommendations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching unactioned recommendations:', error);
    throw error;
  }
}

/**
 * Mark a recommendation as actioned
 */
export async function markRecommendationActioned(
  recommendationId: number,
  actionedBy: string,
  actionedByEmail: string,
  actionNotes?: string
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/recommendations/${recommendationId}/action`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        actionedBy,
        actionedByEmail,
        actionNotes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark recommendation as actioned: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking recommendation as actioned:', error);
    throw error;
  }
}

/**
 * Get case description for display
 */
export function getCaseDescription(caseType: string): string {
  const descriptions: Record<string, string> = {
    'First': 'First offense - Initial verbal warning',
    'A': 'Case A: Second verbal warning + coaching required',
    'B': 'Case B: Written warning for substandard work',
    'C': 'Case C: Employee offboarding - Critical risk',
    'D': 'Case D: Leadership behavior report required',
    'E': 'Case E: Leadership written warning',
  };

  return descriptions[caseType] || 'Unknown case';
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: Recommendation['priority']): string {
  const colors = {
    'Low': '#10b981',
    'Medium': '#f59e0b',
    'High': '#f97316',
    'Critical': '#ef4444',
  };

  return colors[priority];
}
