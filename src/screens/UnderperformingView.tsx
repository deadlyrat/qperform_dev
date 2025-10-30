// src/screens/performance/underperforming/UnderperformingView.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Avatar,
  Button,
  Tab,
  TabList,
  type SelectTabData,
  type SelectTabEvent,
  Spinner,
  Dropdown,
  Option,
} from '@fluentui/react-components';
import { CalendarMonth24Regular, Comment24Regular } from '@fluentui/react-icons';
import './UnderperformingView.css';
import TakeActionDialog from './TakeActionDialog';
import FilterPopover from '../components/ui/FilterPopover';
import RecommendationsDialog from './RecommendationsDialog';
import { useUserRole } from '../services/useUserRole'; // <-- Import the role hook

import {
  fetchPerformanceData,
  groupByWeek,
  fetchFilters,
  calculateAgentMonthlyResults,
  generateRecommendation,
  fetchActionLog,
  fetchClientSummary, // <--- NEW: Import the client summary fetcher
  type PerformanceData,
  type FilterOptions,
  type PerformanceFilters,
  type ActionLog,
  type AgentMonthlyResults,
  type Recommendation,
  type ClientSummaryData, // <--- NEW: Import the client summary type
} from '../services/api';

// Map structure: AgentID/Email -> WeekRange -> PerformanceData[]
type GroupedPerformance = Map<string, Map<string, PerformanceData[]>>;

// --- Define state for the Recommendations Dialog ---
interface DialogState {
    isOpen: boolean;
    agentName: string;
    monthlyResults: AgentMonthlyResults;
    recommendation: Recommendation;
}

export default function UnderperformingView() {
  const { role } = useUserRole();
  
  // Controls permissions for "Take Action"
  const canTakeAction = role === 'Director' || role === 'AVP';

  // --- STATE DECLARATIONS ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<PerformanceData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedPerformance>(new Map());
  const [actionLogData, setActionLogData] = useState<ActionLog[]>([]);
  const [clientSummaryData, setClientSummaryData] = useState<ClientSummaryData[]>([]); // <--- NEW: State for client data
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    months: [],
    years: [],
    clients: [],
    categories: [],
    tasks: [],
  });
  const [filters, setFilters] = useState<PerformanceFilters>({});
  
  // Dialog States
  const [isTakeActionOpen, setIsTakeActionOpen] = useState(false);
  const [recommendationsDialogState, setRecommendationsDialogState] = useState<DialogState>({
    isOpen: false,
    agentName: '',
    monthlyResults: {} as AgentMonthlyResults,
    recommendation: {} as Recommendation,
  });
  
  // Tab State
  const [viewMode, setViewMode] = useState<string>('employee');

  const onViewModeSelect = (_e: SelectTabEvent, data: SelectTabData) => {
    setViewMode(data.selectedValue as string);
  };

  // --- DATA FETCHING & PROCESSING ---

  // Fetches initial filter options once on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const options = await fetchFilters();
        setFilterOptions(options);

        // Set initial filters to the latest month and year available
        if (options.months.length > 0) {
            setFilters(prev => ({
                ...prev,
                month: options.months[0],
                year: String(options.years[0]),
            }));
        } else {
            setLoading(false); // No data available, stop loading
        }
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    };
    loadFilters();
  }, []);


  // Combined data fetching function (Updated to fetch Client Summary too)
  const loadData = useCallback(async (currentFilters: PerformanceFilters) => {
    // Only proceed if month/year are set (i.e., initial filter fetch is complete)
    if (!currentFilters.month || !currentFilters.year) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all three data sets concurrently
      const [performanceData, logData, clientData] = await Promise.all([
          fetchPerformanceData(currentFilters),
          fetchActionLog(),
          fetchClientSummary(currentFilters), // <--- NEW: Fetch client data
      ]);

      const grouped = groupByWeek(performanceData);

      setRawData(performanceData);
      setGroupedData(grouped);
      setActionLogData(logData);
      setClientSummaryData(clientData); // <--- NEW: Set client summary data

    } catch (err) {
      console.error('Error fetching data:', err);
      setError("Failed to load performance data. Check API server and network.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect to reload data whenever filters change
  useEffect(() => {
    if (filters.month && filters.year) {
        loadData(filters);
    }
  }, [filters, loadData]);

  // --- RECOMMENDATIONS LOGIC ---
  const handleViewRecommendations = (agentEmail: string, agentName: string) => {
    // 1. Filter raw weekly data for the selected agent
    const agentRawData = rawData.filter(d => d.agent_email === agentEmail);

    // 2. Calculate monthly results (compliant weeks, etc.)
    const monthlyResults = calculateAgentMonthlyResults(agentRawData);

    // 3. Generate the recommendation (Level 1, 2, 3, etc.)
    const currentRecommendation = generateRecommendation(monthlyResults, actionLogData);

    // 4. Open the dialog
    setRecommendationsDialogState({
      isOpen: true,
      agentName: agentName,
      monthlyResults: monthlyResults,
      recommendation: currentRecommendation,
    });
  };

  const handleRecommendationClose = () => {
    setRecommendationsDialogState(prev => ({ ...prev, isOpen: false }));
  };

  // --- RENDER HELPERS ---

  // Helper to color-code the flag for better visualization
  const getFlagClass = (flag: string) => {
    switch (flag) {
      case 'Critical':
        return 'flag-critical';
      case 'Low':
        return 'flag-low';
      case 'Compliant':
        return 'flag-compliant';
      default:
        return 'flag-default';
    }
  };

  // Renders the main grid view grouped by employee
  const renderEmployeeGrid = () => {
    if (loading && groupedData.size === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner size="large" label="Loading initial data..." />
        </div>
      );
    }

    if (error) {
      return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }

    if (groupedData.size === 0) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>No employee performance data found for the selected filters.</div>;
    }
    
    // Determine the number of weeks based on the first agent's data structure
    const weeks = Array.from(groupedData.values()).flatMap(m => Array.from(m.keys())).sort();
    const uniqueWeeks = [...new Set(weeks)];
    
    const headers = ["Employee", "Client/Task", ...uniqueWeeks.map(w => `Wk: ${w}`), "Actions"];
    const gridColumnsStyle = { 
        gridTemplateColumns: `1.5fr 1.5fr repeat(${uniqueWeeks.length}, 1fr) 1.5fr`
    };

    return (
      <div className="performance-grid-container">
        <div className="custom-grid-container" style={gridColumnsStyle}>
          <div className="grid-header-row">
            {headers.map(header => <div key={header} className="grid-header-cell">{header}</div>)}
          </div>
          {Array.from(groupedData.entries()).map(([agentEmail, weeksMap]) => {
            const firstEntry = weeksMap.values().next().value[0] as PerformanceData;
            const agentName = firstEntry?.agent_name || agentEmail;
            const clientTask = `${firstEntry?.client || 'N/A'} / ${firstEntry?.task || 'N/A'}`;

            return (
              <div key={agentEmail} className="grid-body-row">
                {/* Employee Column */}
                <div className="grid-card">
                  <Avatar name={agentName} size={24} style={{ marginRight: '8px' }} />
                  <strong>{agentName}</strong>
                  <span style={{ fontSize: '0.8em', color: '#666' }}>{agentEmail}</span>
                </div>
                
                {/* Client/Task Column */}
                <div className="grid-card">
                    {clientTask}
                </div>

                {/* Weekly Performance Columns */}
                {uniqueWeeks.map(week => {
                  const weekData = weeksMap.get(week);
                  
                  // Use combined flag if multiple records exist, defaulting to first one's flag
                  let flag = weekData ? weekData[0].flag_qa || weekData[0].flag_prod : 'N/A';
                  let score = weekData ? weekData[0].kpi_qa : null;

                  if (weekData && weekData.some(d => d.flag_qa === 'Critical' || d.flag_prod === 'Critical')) {
                      flag = 'Critical';
                  } else if (weekData && weekData.some(d => d.flag_qa === 'Low' || d.flag_prod === 'Low')) {
                      flag = 'Low';
                  } else if (weekData && weekData.some(d => d.flag_qa === 'Compliant' && d.flag_prod === 'Compliant')) {
                      flag = 'Compliant';
                  }

                  return (
                    <div 
                      key={week} 
                      className={`grid-card ${getFlagClass(flag)}`}
                      title={`QA Score: ${score !== null ? (score * 100).toFixed(2) + '%' : 'N/A'}`}
                    >
                      {flag === 'Critical' || flag === 'Low' ? (
                          <Comment24Regular size={16} />
                      ) : (
                          flag
                      )}
                    </div>
                  );
                })}

                {/* Actions Column (View Recommendations) */}
                <div className="grid-card">
                  <Button 
                    size="small" 
                    appearance="subtle" 
                    onClick={() => handleViewRecommendations(agentEmail, agentName)}
                  >
                    View Recs
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // NEW RENDERER: Renders the Client Category summary grid
  const renderClientGrid = () => {
      if (loading && clientSummaryData.length === 0) {
          return (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Spinner size="large" label="Loading client data..." />
              </div>
          );
      }
      
      if (error) {
          return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
      }
      
      if (clientSummaryData.length === 0) {
          return <div style={{padding: '20px', textAlign: 'center'}}>No client summary data found for the selected filters.</div>;
      }
      
      const headers = ["Client Name", "Total AFTEs", "Underperformers", "Weeks with Issues", "Avg. QA Score"];
      
      // Define grid columns for the Client Summary view
      const gridColumnsStyle = { gridTemplateColumns: `1.5fr repeat(${headers.length - 1}, 1fr)` };

      return (
        <div className="performance-grid-container">
          <div className="custom-grid-container" style={gridColumnsStyle}>
            <div className="grid-header-row">
              {headers.map(header => <div key={header} className="grid-header-cell">{header}</div>)}
            </div>
            {clientSummaryData.map(item => (
              <div key={item.client} className="grid-body-row">
                {/* Client Name Cell */}
                <div className="grid-card">
                    <strong>{item.client}</strong>
                </div>
                {/* Metrics Cells */}
                <div className="grid-card">{item.total_aftes}</div>
                <div className="grid-card">{item.underperformers}</div>
                <div className="grid-card">{item.weeks_with_issues}</div>
                <div className="grid-card">{item.avg_score}%</div>
              </div>
            ))}
          </div>
        </div>
      );
  };


  // --- MAIN COMPONENT RETURN ---
  return (
    <div className="underperforming-view-container">

      <TakeActionDialog 
        isOpen={isTakeActionOpen} 
        onClose={() => setIsTakeActionOpen(false)} 
        onActionTaken={loadData} // Reloads data after an action is taken
        filters={filters}
      />
      
      <RecommendationsDialog
        isOpen={recommendationsDialogState.isOpen}
        onClose={handleRecommendationClose}
        agentName={recommendationsDialogState.agentName}
        monthlyResults={recommendationsDialogState.monthlyResults}
        recommendation={recommendationsDialogState.recommendation}
      />

      <div className="top-filters-row">
        {/* Left Filters: Dropdowns */}
        <div className="left-filters">
            {/* Popover Filter (Client/Category/Task) */}
            <FilterPopover 
                filterOptions={filterOptions}
                currentFilters={filters}
                setFilters={setFilters}
            />
            
            {/* Month Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CalendarMonth24Regular />
                <Dropdown 
                    placeholder="Select Month"
                    selectedOptions={filters.month ? [filters.month] : []}
                    onOptionSelect={(_e, data) => setFilters(prev => ({ ...prev, month: data.optionValue }))}
                    style={{ minWidth: '100px' }}
                >
                    {filterOptions.months.map(month => (
                        <Option key={month} value={month}>{month}</Option>
                    ))}
                </Dropdown>
            </div>

            {/* Year Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Dropdown 
                    placeholder="Select Year"
                    selectedOptions={filters.year ? [filters.year] : []}
                    onOptionSelect={(_e, data) => setFilters(prev => ({ ...prev, year: data.optionValue }))}
                    style={{ minWidth: '80px' }}
                >
                    {filterOptions.years.map(year => (
                        <Option key={String(year)} value={String(year)}>{year}</Option>
                    ))}
                </Dropdown>
            </div>
        </div>

        {/* Right Filters: Take Action Button (Role-Based Visibility) */}
        <div className="right-filters">
            {/* FINAL SECURITY CHECK: Only show/enable if user role allows it */}
            {canTakeAction ? (
                <Button appearance="primary" onClick={() => setIsTakeActionOpen(true)}>Nav: Take Action</Button>
            ) : (
                 <Button 
                    appearance="primary" 
                    disabled 
                    title={`Role (${role}) does not have permission to take action.`} // Dynamic title for clarity
                >
                    Nav: Take Action
                </Button>
            )}
        </div>
      </div>

      <div className="category-toggle">
        <TabList selectedValue={viewMode} onTabSelect={onViewModeSelect}>
            <Tab value="employee">Employee Category</Tab>
            <Tab value="client">Client Category</Tab>
        </TabList>
      </div>

      {/* Conditionally render the correct grid based on the viewMode state */}
      {viewMode === 'employee' ? renderEmployeeGrid() : renderClientGrid()}

      {/* Show loading spinner while filtering/re-fetching */}
      {loading && (groupedData.size > 0 || clientSummaryData.length > 0) &&
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Spinner size="small" label="Updating data..." />
        </div>
      }
    </div>
  );
}