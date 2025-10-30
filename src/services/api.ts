// src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// --- Types ---
export interface PerformanceData {
  agent_email: string;
  agent_id: string;
  agent_name?: string;
  position: string;
  office: string;
  client: string;
  task: string;
  category: string;
  kpi_qa: number;
  flag_qa: string;
  kpi_avg_prod: number;
  flag_prod: string;
  week_range: string;
  start_date: string;
  end_date: string;
  month_num: number;
  month_name: string;
  year_num: number;
}

export interface SummaryData {
  client: string;
  category: string;
  total_aftes: number;
  underperformers: number;
  weeks_with_issues: number;
  avg_score: number;
}

export interface MonthlySummaryResponse {
  overall: {
    total_aftes: number;
    underperformers: number;
    avg_score: number;
  };
  details: Array<{
    client: string;
    category: string;
    total_aftes: number;
    avg_score: number;
  }>;
}

export interface SummaryItem {
  client: string;
  category: string;
  totalAFTEs: number;
  underperformers: number;
  weeksWithIssues: number;
  avgScore: number;
}

export interface ActionLog {
  id: number;
  agent_email: string;
  action_type: string;
  description: string;
  taken_by: string;
  action_date: string;
  client: string;
  category: string;
}

export interface FilterOptions {
  categories: string[];
  clients: string[];
  tasks: string[];
  months: string[];
  years: number[];
}

export interface PerformanceFilters {
  month?: string;
  year?: string;
  category?: string;
  client?: string;
  task?: string;
}

export interface ClientSummaryData {
  client: string;
  total_aftes: number;
  underperformers: number;
  weeks_with_issues: number;
  avg_score: number;
}

export interface AgentWarning {
  agent_email: string;
  warning_level: number;
  issue_date: string;
  expiration_date: string;
}

export interface AgentMonthlyResults {
  compliantWeeks: number;
  totalWeeks: number;
  actionCount: number;
}

export interface Recommendation {
  action: string;
  isCritical: boolean;
  notes: string;
}

// --- API Functions ---

export async function fetchPerformanceData(filters?: PerformanceFilters): Promise<PerformanceData[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month);
    if (filters?.year) params.append('year', filters.year);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.client) params.append('client', filters.client);
    if (filters?.task) params.append('task', filters.task);
    
    const url = `${API_BASE_URL}/api/performance-data${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching performance data:', error);
    throw error;
  }
}

export async function fetchMonthlySummary(filters?: PerformanceFilters): Promise<MonthlySummaryResponse> {
  try {
    const params = new URLSearchParams();
    if (filters?.month) params.append('month', filters.month);
    if (filters?.year) params.append('year', filters.year);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.client) params.append('client', filters.client);
    if (filters?.task) params.append('task', filters.task);

    const url = `${API_BASE_URL}/api/monthly-summary${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching summary data:', error);
    throw error;
  }
}

export async function fetchFilters(cascadingFilters?: { 
  client?: string; 
  category?: string;
  month?: string;
  year?: string;
}): Promise<FilterOptions> {
  try {
    const params = new URLSearchParams();
    if (cascadingFilters?.client) params.append('client', cascadingFilters.client);
    if (cascadingFilters?.category) params.append('category', cascadingFilters.category);
    if (cascadingFilters?.month) params.append('month', cascadingFilters.month);
    if (cascadingFilters?.year) params.append('year', cascadingFilters.year);
    
    const url = `${API_BASE_URL}/api/filters${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching filters:', error);
    throw error;
  }
}

export async function fetchActionLog(): Promise<ActionLog[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/action-log`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching action log:', error);
    throw error;
  }
}

export async function createAction(action: Omit<ActionLog, 'id'>): Promise<{ success: boolean; id: number }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/action-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(action),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating action:', error);
    throw error;
  }
}

export async function fetchClientSummary(filters?: { month?: string; year?: string }): Promise<ClientSummaryData[]> {
    try {
        const params = new URLSearchParams();
        if (filters?.month) params.append('month', filters.month);
        if (filters?.year) params.append('year', filters.year);
        
        const url = `${API_BASE_URL}/api/client-summary${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching client summary:', error);
        throw error;
    }
}

export async function fetchAgentWarnings(agentEmail: string): Promise<AgentWarning[]> {
    try {
        const url = `${API_BASE_URL}/api/warnings/${agentEmail}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error fetching warnings for ${agentEmail}:`, error);
        return [];
    }
}

// --- Transformation Functions ---

export function transformToSummaryItems(data: SummaryData[]): SummaryItem[] {
  return data.map(item => ({
    client: item.client,
    category: item.category,
    totalAFTEs: item.total_aftes,
    underperformers: item.underperformers,
    weeksWithIssues: item.weeks_with_issues,
    avgScore: item.avg_score,
  }));
}

export function calculateKPIs(data: SummaryData[]) {
  const totalAFTEs = data.reduce((sum, item) => sum + item.total_aftes, 0);
  const totalUnderperformers = data.reduce((sum, item) => sum + item.underperformers, 0);
  const avgScore = data.length > 0 
    ? data.reduce((sum, item) => sum + item.avg_score, 0) / data.length 
    : 0;

  return {
    totalAFTEs,
    totalUnderperformers,
    underperformerPercentage: totalAFTEs > 0 
      ? ((totalUnderperformers / totalAFTEs) * 100).toFixed(1) 
      : '0.0',
    avgScore: avgScore.toFixed(1),
  };
}

export function groupByWeek(data: PerformanceData[]) {
  const grouped = new Map<string, Map<string, PerformanceData[]>>();
  
  data.forEach(item => {
    const key = `${item.agent_email}`;
    if (!grouped.has(key)) {
      grouped.set(key, new Map());
    }
    
    const agentData = grouped.get(key)!;
    if (!agentData.has(item.week_range)) {
      agentData.set(item.week_range, []);
    }
    agentData.get(item.week_range)!.push(item);
  });
  
  return grouped;
}

export function calculateAgentMonthlyResults(
  agentWeeksData: Map<string, PerformanceData[]>, 
  agentEmail: string, 
  actionLog: ActionLog[] = []
): AgentMonthlyResults {
  let compliantWeeks = 0;
  const totalWeeks = agentWeeksData.size;

  agentWeeksData.forEach(recordsInWeek => {
    const isCompliant = !recordsInWeek.some(
      d => d.flag_qa === 'Critical' || d.flag_qa === 'Low' || d.flag_prod === 'Critical' || d.flag_prod === 'Low'
    );
    if (isCompliant) {
      compliantWeeks++;
    }
  });

  const actionCount = actionLog.filter(action => action.agent_email === agentEmail).length;

  return {
    compliantWeeks,
    totalWeeks,
    actionCount,
  };
}

export function generateRecommendation(results: AgentMonthlyResults): Recommendation {
  const nonCompliantWeeks = results.totalWeeks - results.compliantWeeks;

  if (nonCompliantWeeks === 0) {
    return {
      action: "No Action Required",
      isCritical: false,
      notes: "Agent demonstrated 100% compliance this month. Maintain coaching.",
    };
  }
  
  if (nonCompliantWeeks === 1 && results.actionCount < 1) {
    return {
      action: "Level 1: Focused Coaching",
      isCritical: false,
      notes: "One non-compliant week detected. Initiate light coaching session.",
    };
  }

  if (nonCompliantWeeks >= 2 && results.actionCount < 1) {
    return {
      action: "Level 2: Written Warning Required",
      isCritical: true,
      notes: `Agent has ${nonCompliantWeeks} non-compliant weeks. Requires a formal Written Warning.`,
    };
  }

  if (nonCompliantWeeks >= 2 && results.actionCount >= 1) {
    return {
      action: "Level 3: Final Warning / Escalation",
      isCritical: true,
      notes: `Persistent issues (${nonCompliantWeeks} weeks) despite prior action(s). Escalation/Final Warning pending.`,
    };
  }

  return {
    action: "Review Required",
    isCritical: true,
    notes: "Performance pattern does not fit standard cases. Requires manual review by leadership.",
  };
}