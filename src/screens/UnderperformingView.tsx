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
import { useUserRole } from '../services/useUserRole';

import {
  fetchPerformanceData,
  groupByWeek,
  fetchFilters,
  calculateAgentMonthlyResults,
  generateRecommendation,
  fetchActionLog,
  fetchClientSummary, 
  type PerformanceData,
  type FilterOptions,
  type PerformanceFilters,
  type ActionLog,
  type AgentMonthlyResults,
  type Recommendation,
  type ClientSummaryData, 
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
  const [clientSummaryData, setClientSummaryData] = useState<ClientSummaryData[]>([]);
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
    const newValue = data.value as string;
    console.log('Switching to tab:', newValue);
    setViewMode(newValue);
  };

  // --- DATA FETCHING & PROCESSING ---

  // Fetches initial filter options once on component mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const options = await fetchFilters();
        setFilterOptions(options);

        // Get current date info
        const now = new Date();
        const currentMonthName = now.toLocaleString('en-US', { month: 'long' }); // e.g., "October"
        const currentYear = now.getFullYear(); // e.g., 2025

        console.log('🔍 Auto-loading current month/year...');
        console.log('Current date:', now.toISOString());
        console.log('Current month from JS:', currentMonthName);
        console.log('Current year from JS:', currentYear);
        console.log('Available months from DB:', options.months);
        console.log('Available years from DB:', options.years);

        // Find current month in database (trim spaces and case-insensitive match)
        const monthToUse = options.months.find(m => 
          m.trim().toLowerCase() === currentMonthName.toLowerCase()
        );
        
        // Find current year in database
        const yearToUse = options.years.includes(currentYear)
          ? currentYear
          : options.years[0];

        // Use found values or fallback to most recent data
        const finalMonth = monthToUse || options.months[options.months.length - 1];
        const finalYear = String(yearToUse);

        console.log('✅ Final selection:');
        console.log('  - Month:', finalMonth);
        console.log('  - Year:', finalYear);

        if (options.months.length > 0) {
            setFilters({
                month: finalMonth,
                year: finalYear,
            });
        } else {
            setLoading(false);
        }
      } catch (err) {
        console.error("❌ Failed to load filter options", err);
      }
    };
    loadFilters();
  }, []);


  // Combined data fetching function
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
          fetchClientSummary(currentFilters), 
      ]);

      const grouped = groupByWeek(performanceData);

      setRawData(performanceData);
      setGroupedData(grouped);
      setActionLogData(logData);
      setClientSummaryData(clientData); 

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

  // --- Employee List for TakeActionDialog ---
  const employeeList = useMemo(() =>
    Array.from(groupedData.keys()).map(key => {
        const weeksMap = groupedData.get(key);
        const firstRecord = weeksMap 
            ? Array.from(weeksMap.values())[0]?.[0] 
            : null;

        const email = firstRecord?.agent_email || key; 
        const name = firstRecord?.agent_name || email.split('@')[0] || 'Unknown Agent';

        return { id: key, name: name };
    }),
    [groupedData]
  );


  // --- RECOMMENDATIONS LOGIC ---
  const handleViewRecommendations = (agentEmail: string, agentName: string) => {
    const agentRawData = rawData.filter(d => d.agent_email === agentEmail);
    const agentWeeksMap = groupByWeek(agentRawData);
    const monthlyResults = calculateAgentMonthlyResults(agentWeeksMap, agentEmail, actionLogData);
    const currentRecommendation = generateRecommendation(monthlyResults);

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
    
    const weeks = Array.from(groupedData.values()).flatMap(m => Array.from(m.keys())).sort();
    const uniqueWeeks = [...new Set(weeks)];
    
    const headers = ["Employee", "Client/Task", ...uniqueWeeks.map(w => `Wk: ${w}`), "Monthly Results"];
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
            
            const agentActions = actionLogData.filter(a => a.agent_email === agentEmail);

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
                  
                  let flag = weekData ? weekData[0].flag_qa || weekData[0].flag_prod : 'N/A';
                  let score = weekData && weekData[0].kpi_qa !== null ? weekData[0].kpi_qa : null;
                  let scorePercent = score !== null ? (score * 100).toFixed(1) + '%' : 'N/A';

                  if (weekData && weekData.some(d => d.flag_qa === 'Critical' || d.flag_prod === 'Critical')) {
                      flag = 'Critical';
                  } else if (weekData && weekData.some(d => d.flag_qa === 'Low' || d.flag_prod === 'Low')) {
                      flag = 'Low';
                  } else if (weekData && weekData.some(d => d.flag_qa === 'Compliant' && d.flag_prod === 'Compliant')) {
                      flag = 'Compliant';
                  }
                  
                  const actionTakenThisWeek = agentActions.some(action => {
                    const actionDate = new Date(action.action_date);
                    const weekStartDate = weekData ? new Date(weekData[0].start_date) : null;
                    
                    if (weekStartDate) {
                        const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
                        return actionDate.getTime() >= weekStartDate.getTime() && 
                               actionDate.getTime() < (weekStartDate.getTime() + sevenDaysInMs);
                    }
                    return false;
                  });
                  
                  const actionStatusText = actionTakenThisWeek ? 'Action Taken' : 'No Action';
                  const actionStatusClass = actionTakenThisWeek ? 'action-taken-yes' : 'action-taken-no';

                  return (
                    <div 
                      key={week} 
                      className={`grid-card weekly-performance-card ${getFlagClass(flag)}`}
                      title={`Compliance: ${flag}`}
                    >
                      <span className="weekly-score-value">
                          {scorePercent}
                      </span>
                      <span className={`weekly-action-status ${actionStatusClass}`}>
                          {actionStatusText}
                      </span>
                    </div>
                  );
                })}

                {/* Monthly Results Column */}
                <div className="grid-card" style={{ gap: '12px' }}>
                  {/* Calculate monthly results */}
                  {(() => {
                    const totalWeeks = uniqueWeeks.length;
                    
                    // Count compliant weeks (Great, Good, or Normal for BOTH QA and Prod)
                    const compliantWeeks = uniqueWeeks.filter(week => {
                      const weekData = weeksMap.get(week);
                      if (!weekData || weekData.length === 0) return false;
                      
                      // A week is compliant if flags are NOT 'Low' or 'Critical'
                      // i.e., flags are 'Great', 'Good', or 'Normal'
                      return weekData.some(d => {
                        const qaOk = d.flag_qa === 'Great' || d.flag_qa === 'Good' || d.flag_qa === 'Normal';
                        const prodOk = d.flag_prod === 'Great' || d.flag_prod === 'Good' || d.flag_prod === 'Normal';
                        return qaOk && prodOk;
                      });
                    }).length;
                    
                    // Count weeks where action was taken
                    const weeksWithAction = uniqueWeeks.filter(week => {
                      const weekData = weeksMap.get(week);
                      if (!weekData || weekData.length === 0) return false;
                      
                      const weekStartDate = new Date(weekData[0].start_date);
                      const weekEndDate = new Date(weekStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                      
                      return agentActions.some(action => {
                        const actionDate = new Date(action.action_date);
                        return actionDate >= weekStartDate && actionDate < weekEndDate;
                      });
                    }).length;
                    
                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Score: {compliantWeeks}/{totalWeeks}
                          </span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Actions: {weeksWithAction}/{totalWeeks}
                          </span>
                        </div>
                        <Button 
                          size="small" 
                          appearance="subtle"
                          icon={<Comment24Regular />}
                          onClick={() => handleViewRecommendations(agentEmail, agentName)}
                          title="View Recommendations"
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Renders the Client Category summary grid
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
      const gridColumnsStyle = { gridTemplateColumns: `1.5fr repeat(${headers.length - 1}, 1fr)` };

      return (
        <div className="performance-grid-container">
          <div className="custom-grid-container" style={gridColumnsStyle}>
            <div className="grid-header-row">
              {headers.map(header => <div key={header} className="grid-header-cell">{header}</div>)}
            </div>
            {clientSummaryData.map(item => (
              <div key={item.client} className="grid-body-row">
                <div className="grid-card">
                    <strong>{item.client}</strong>
                </div>
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
        onDismiss={() => setIsTakeActionOpen(false)} 
        employees={employeeList}
        onActionSuccess={() => loadData(filters)}
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
                    value={filters.month || ''}
                    onOptionSelect={(_e, data) => {
                      setFilters(prev => ({ 
                        ...prev, 
                        month: data.optionValue || undefined 
                      }));
                    }}
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
                    value={filters.year || ''}
                    onOptionSelect={(_e, data) => {
                      setFilters(prev => ({ 
                        ...prev, 
                        year: data.optionValue || undefined 
                      }));
                    }}
                    style={{ minWidth: '80px' }}
                >
                    {filterOptions.years.map(year => (
                        <Option key={String(year)} value={String(year)}>{year}</Option>
                    ))}
                </Dropdown>
            </div>
        </div>

        {/* Right Filters: Take Action Button */}
        <div className="right-filters">
            {canTakeAction ? (
                <Button appearance="primary" onClick={() => setIsTakeActionOpen(true)}>
                  Nav: Take Action
                </Button>
            ) : (
                <Button 
                    appearance="primary" 
                    disabled 
                    title={`Role (${role}) does not have permission to take action.`}
                >
                    Nav: Take Action
                </Button>
            )}
        </div>
      </div>

      <div className="category-toggle">
        <TabList 
          selectedValue={viewMode} 
          onTabSelect={onViewModeSelect}
        >
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