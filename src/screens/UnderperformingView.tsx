// src/screens/UnderperformingView.tsx

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
  Card,
} from '@fluentui/react-components';
import { CalendarMonth24Regular, Comment24Regular, BuildingMultiple24Regular, CommentAdd24Regular } from '@fluentui/react-icons';
import './UnderperformingView.css';
import TakeActionDialog from './TakeActionDialog';
import FilterPopover from '../components/ui/FilterPopover';
import RecommendationsDialog from './RecommendationsDialog';
import { useUserRole } from '../services/useUserRole';
import { EmployeeAvatar } from '../components/EmployeeAvatar';

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

interface UnderperformingViewProps {
  currentFilters?: PerformanceFilters;
  onFiltersChange?: (filters: PerformanceFilters) => void;
}

export default function UnderperformingView({ currentFilters, onFiltersChange }: UnderperformingViewProps) {
  const { role } = useUserRole();

  // Controls permissions for "Take Action"
  const canTakeAction = role === 'Director' || role === 'AVP';

  // --- STATE DECLARATIONS ---
  // Start with loading true - will be set to false once data is loaded or if no filters exist
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
  const [filters, setFilters] = useState<PerformanceFilters>(currentFilters || {});
  
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

        // Only auto-select current month/year if no filters are already set
        // (i.e., when coming from welcome screen, not when switching tabs)
        const hasExistingFilters = currentFilters && (currentFilters.month || currentFilters.year);

        if (!hasExistingFilters && options.months.length > 0) {
          // Get current date info
          const now = new Date();
          const currentMonthName = now.toLocaleString('en-US', { month: 'long' });
          const currentYear = now.getFullYear();

          console.log('🔍 Auto-loading current month/year (first load from welcome)...');
          console.log('Current date:', now.toISOString());
          console.log('Current month from JS:', currentMonthName);
          console.log('Current year from JS:', currentYear);
          console.log('Available months from DB:', options.months);
          console.log('Available years from DB:', options.years);

          const monthToUse = options.months.find(m =>
            m.trim().toLowerCase() === currentMonthName.toLowerCase()
          );

          const yearToUse = options.years.includes(currentYear)
            ? currentYear
            : options.years[0];

          const finalMonth = monthToUse || options.months[options.months.length - 1];
          const finalYear = String(yearToUse);

          console.log('✅ Final selection:');
          console.log('  - Month:', finalMonth);
          console.log('  - Year:', finalYear);

          setFilters({
            month: finalMonth,
            year: finalYear,
          });
        } else if (hasExistingFilters) {
          console.log('✅ Using existing filters from tab switch:', currentFilters);
          // Don't set loading to false - let the loadData effect handle it
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Failed to load filter options", err);
      }
    };
    loadFilters();
  }, []);

  // Sync local filters with shared filters from parent when they change externally
  useEffect(() => {
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  // Notify parent component when filters change
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Combined data fetching function
  const loadData = useCallback(async (currentFilters: PerformanceFilters) => {
    if (!currentFilters.month || !currentFilters.year) {
        setLoading(false);
        return;
    }

    try {
      setLoading(true);
      setError(null);

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

  useEffect(() => {
    if (filters.month && filters.year) {
        loadData(filters);
    }
  }, [filters, loadData]);

  const employeeList = useMemo(() =>
    Array.from(groupedData.keys()).map(key => {
        const weeksMap = groupedData.get(key);
        const firstRecord = weeksMap
            ? Array.from(weeksMap.values())[0]?.[0]
            : null;

        const email = firstRecord?.agent_email || key;
        const name = firstRecord?.agent_name || email.split('@')[0] || 'Unknown Agent';

        return { id: key, name: name, email: email };
    }),
    [groupedData]
  );

  // Extract unique week ranges from raw data for the Take Action dialog
  const weekRanges = useMemo(() => {
    const uniqueWeeks = new Map<string, { start_date: string; end_date: string; week_range: string }>();

    rawData.forEach(record => {
      const key = `${record.start_date}_${record.end_date}`;
      if (!uniqueWeeks.has(key)) {
        uniqueWeeks.set(key, {
          start_date: record.start_date,
          end_date: record.end_date,
          week_range: record.week_range,
        });
      }
    });

    // Sort by start_date descending (most recent first)
    return Array.from(uniqueWeeks.values()).sort((a, b) =>
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
  }, [rawData]);


  // --- RECOMMENDATIONS LOGIC ---
  const handleViewRecommendations = (agentEmail: string, agentName: string) => {
    const agentRawData = rawData.filter(d => d.agent_email === agentEmail);
    const agentWeeksMap = groupByWeek(agentRawData);
    // groupByWeek returns Map<string, Map<string, PerformanceData[]>>, we need the inner Map
    const agentWeeksData = agentWeeksMap.get(agentEmail) || new Map<string, PerformanceData[]>();
    const monthlyResults = calculateAgentMonthlyResults(agentWeeksData, agentEmail, actionLogData);
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

  const getFlagBadgeClass = (flag: string | undefined) => {
    if (!flag) return '';
    switch (flag.toLowerCase()) {
        case 'great': return 'badge-great';
        case 'good': return 'badge-good';
        case 'normal': return 'badge-normal';
        case 'low': return 'badge-low';
        case 'critical': return 'badge-critical';
        default: return '';
    }
  };

  // Renders the entire employee grid with weeks as columns
  const renderEmployeeGrid = () => {
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Spinner size="large" label="Loading data..." />
        </div>
      );
    }
    if (error) {
      return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;
    }
    if (groupedData.size === 0) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>No performance data found for the selected filters.</div>;
    }

    const allWeeksSet = new Set<string>();
    groupedData.forEach(weeksMap => {
      weeksMap.forEach((_, weekRange) => allWeeksSet.add(weekRange));
    });

    const uniqueWeeks = Array.from(allWeeksSet).sort((a, b) => {
      const weekA = rawData.find(d => d.week_range === a);
      const weekB = rawData.find(d => d.week_range === b);
      if (!weekA || !weekB) return 0;
      return new Date(weekA.start_date).getTime() - new Date(weekB.start_date).getTime();
    });

    const weekHeaders = uniqueWeeks.map((weekRange, i) => {
        const weekData = rawData.find(d => d.week_range === weekRange);
        const weekLabel = `Week ${i + 1}`;
        return { label: weekLabel, weekRange, startDate: weekData?.start_date };
    });

    const gridColumnsStyle = { gridTemplateColumns: `200px repeat(${weekHeaders.length}, minmax(180px, 1fr)) 200px` };

    return (
      <Card className="data-grid-card">
        <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <div className="custom-grid-container" style={gridColumnsStyle}>
            <div className="grid-header-row">
              <div className="grid-header-cell">Employee List</div>
            {weekHeaders.map((w, i) => (
              <div key={`week-header-${i}`} className="grid-header-cell">
                <div>
                  <div style={{ fontWeight: 600 }}>{w.label}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>{w.weekRange}</div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '8px', 
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid #e0e0e0'
                  }}>
                    <div style={{ flex: 1, fontSize: '0.7rem', fontWeight: 600 }}>Weekly Score</div>
                    <div style={{ 
                      width: '1px', 
                      backgroundColor: '#e0e0e0',
                      margin: '0 4px'
                    }}></div>
                    <div style={{ flex: 1, fontSize: '0.7rem', fontWeight: 600 }}>Action Taken</div>
                  </div>
                </div>
              </div>
            ))}
            <div className="grid-header-cell">Monthly Results</div>
          </div>

          {Array.from(groupedData.keys()).map(agentKey => {
            const weeksMap = groupedData.get(agentKey);
            if (!weeksMap || weeksMap.size === 0) return null;

            const firstWeekData = Array.from(weeksMap.values())[0];
            const firstRecord = firstWeekData?.[0];

            const agentName = firstRecord?.agent_name || firstRecord?.agent_email.split('@')[0] || 'Unknown Agent';
            const agentEmail = firstRecord?.agent_email || agentKey;

            const agentActions = actionLogData.filter(log => log.agent_email === agentEmail);

            return (
              <div key={agentKey} className="grid-body-row">
                <div className="grid-card" style={{ gap: '8px' }}>
                  <EmployeeAvatar
                    employeeId={firstRecord?.agent_id}
                    employeeName={agentName}
                    employeeEmail={agentEmail}
                    size="medium"
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{agentName}</span>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>{agentEmail}</span>
                  </div>
                </div>

                {weekHeaders.map((weekInfo) => {
                  const weekData = weeksMap.get(weekInfo.weekRange);
                  if (!weekData || weekData.length === 0) {
                    return (
                      <div key={`${agentKey}-${weekInfo.weekRange}`} className="grid-card">
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>No Data</span>
                      </div>
                    );
                  }

                  const firstRecord = weekData[0];
                  
                  // Calculate weekly score as percentage
                  const weeklyScorePercent = Math.round(firstRecord.kpi_qa * 100);
                  
                  const weekStartDate = new Date(firstRecord.start_date);
                  const weekEndDate = new Date(weekStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                  
                  const weekActions = agentActions.filter(action => {
                    const actionDate = new Date(action.action_date);
                    return actionDate >= weekStartDate && actionDate < weekEndDate;
                  });
                  
                  const actionCount = weekActions.length;
                  const actionStatusText = actionCount > 0 
                    ? `${actionCount} Action${actionCount > 1 ? 's' : ''}`
                    : 'No Action';

                  // Determine score color based on flag
                  const scoreBadgeClass = getFlagBadgeClass(firstRecord.flag_qa);

                  return (
                    <div key={`${agentKey}-${weekInfo.weekRange}`} className="grid-card">
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '8px',
                        width: '100%'
                      }}>
                        {/* Weekly Score Side - Show Percentage */}
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <span className={`flag-badge ${scoreBadgeClass}`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {weeklyScorePercent}%
                          </span>
                        </div>

                        {/* Vertical Divider */}
                        <div style={{ 
                          width: '1px', 
                          height: '40px',
                          backgroundColor: '#e0e0e0'
                        }}></div>

                        {/* Action Taken Side */}
                        <div style={{ 
                          flex: 1, 
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 600,
                            color: actionCount > 0 ? '#2e7d32' : '#f57c00'
                          }}>
                            {actionStatusText}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="grid-card" style={{ gap: '12px' }}>
                  {(() => {
                    const totalWeeks = uniqueWeeks.length;
                    
                    const compliantWeeks = uniqueWeeks.filter(week => {
                      const weekData = weeksMap.get(week);
                      if (!weekData || weekData.length === 0) return false;
                      
                      return weekData.some(d => {
                        const qaOk = d.flag_qa === 'Great' || d.flag_qa === 'Good' || d.flag_qa === 'Normal';
                        const prodOk = d.flag_prod === 'Great' || d.flag_prod === 'Good' || d.flag_prod === 'Normal';
                        return qaOk && prodOk;
                      });
                    }).length;
                    
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
      </Card>
    );
  };

  // Renders the Client Category grid with weekly breakdown
  const renderClientGrid = () => {
    if (loading) {
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

    // Get all unique weeks from the performance data
    const allWeeksSet = new Set<string>();
    rawData.forEach(record => allWeeksSet.add(record.week_range));
    
    const uniqueWeeks = Array.from(allWeeksSet).sort((a, b) => {
      const weekA = rawData.find(d => d.week_range === a);
      const weekB = rawData.find(d => d.week_range === b);
      if (!weekA || !weekB) return 0;
      return new Date(weekA.start_date).getTime() - new Date(weekB.start_date).getTime();
    });

    const weekHeaders = uniqueWeeks.map((weekRange, i) => {
      const weekData = rawData.find(d => d.week_range === weekRange);
      return { 
        label: `Week ${i + 1}`, 
        weekRange, 
        startDate: weekData?.start_date 
      };
    });

    // Group data by client and week
    const clientWeekData = new Map<string, Map<string, PerformanceData[]>>();
    
    rawData.forEach(record => {
      if (!clientWeekData.has(record.client)) {
        clientWeekData.set(record.client, new Map());
      }
      const clientWeeks = clientWeekData.get(record.client)!;
      
      if (!clientWeeks.has(record.week_range)) {
        clientWeeks.set(record.week_range, []);
      }
      clientWeeks.get(record.week_range)!.push(record);
    });

    const gridColumnsStyle = { 
      gridTemplateColumns: `200px repeat(${weekHeaders.length}, minmax(180px, 1fr)) 220px` 
    };

    return (
      <Card className="data-grid-card">
        <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'auto' }}>
          <div className="custom-grid-container" style={gridColumnsStyle}>
            {/* Header Row */}
          <div className="grid-header-row">
            <div className="grid-header-cell">Client Name</div>
            {weekHeaders.map((w, i) => (
              <div key={`week-header-${i}`} className="grid-header-cell">
                <div>
                  <div>{w.label}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>{w.weekRange}</div>
                </div>
              </div>
            ))}
            <div className="grid-header-cell">Monthly Results</div>
          </div>

          {/* Client Rows */}
          {Array.from(clientWeekData.keys()).sort().map(clientName => {
            const clientWeeks = clientWeekData.get(clientName)!;
            const clientSummary = clientSummaryData.find(s => s.client === clientName);

            return (
              <div key={clientName} className="grid-body-row">
                {/* Client Name Column */}
                <div className="grid-card" style={{ gap: '8px' }}>
                  <Avatar
                    icon={<BuildingMultiple24Regular />}
                    color="colorful"
                    size={32}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600 }}>{clientName}</span>
                  </div>
                </div>

                {/* Week Columns */}
                {weekHeaders.map((weekInfo) => {
                  const weekData = clientWeeks.get(weekInfo.weekRange);
                  
                  if (!weekData || weekData.length === 0) {
                    return (
                      <div key={`${clientName}-${weekInfo.weekRange}`} className="grid-card">
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>No Data</span>
                      </div>
                    );
                  }

                  // Calculate weekly stats
                  const uniqueAgents = new Set(weekData.map(r => r.agent_id));
                  const totalAFTEs = uniqueAgents.size;

                  const underperformingAgents = new Set(
                    weekData
                      .filter(r => r.flag_qa === 'Critical' || r.flag_qa === 'Low' || 
                                  r.flag_prod === 'Critical' || r.flag_prod === 'Low')
                      .map(r => r.agent_id)
                  );
                  const underperformers = underperformingAgents.size;

                  const avgScore = Math.round(
                    (weekData.reduce((sum, r) => sum + r.kpi_qa, 0) / weekData.length) * 100
                  );

                  // Get actions for this week and client
                  const weekStartDate = new Date(weekData[0].start_date);
                  const weekEndDate = new Date(weekStartDate.getTime() + (7 * 24 * 60 * 60 * 1000));
                  
                  const weekActions = actionLogData.filter(action => {
                    const actionDate = new Date(action.action_date);
                    return action.client === clientName && 
                           actionDate >= weekStartDate && 
                           actionDate < weekEndDate;
                  });
                  const actionsCount = weekActions.length;

                  const scoreBadgeClass = avgScore >= 95 ? 'badge-great' : 
                                         avgScore >= 85 ? 'badge-good' : 
                                         avgScore >= 75 ? 'badge-normal' : 'badge-low';

                  return (
                    <div key={`${clientName}-${weekInfo.weekRange}`} className="grid-card">
                      <span style={{ fontSize: '0.75rem' }}>AFTEs: {totalAFTEs}</span>
                      <span style={{ fontSize: '0.75rem', color: underperformers > 0 ? '#d13438' : undefined }}>
                        Underperformers: {underperformers}
                      </span>
                      <span style={{ fontSize: '0.75rem' }}>
                        Actions: {actionsCount}
                      </span>
                      <span className={`flag-badge ${scoreBadgeClass}`} style={{ fontSize: '0.75rem' }}>
                        Score: {avgScore}%
                      </span>
                    </div>
                  );
                })}

                {/* Monthly Results Column */}
                <div className="grid-card" style={{ gap: '12px' }}>
                  {clientSummary ? (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Total AFTEs: {clientSummary.total_aftes}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d13438' }}>
                          Underperformers: {clientSummary.underperformers}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Weeks w/ Issues: {clientSummary.weeks_with_issues}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Monthly Score: {clientSummary.avg_score}%
                        </span>
                      </div>
                      <Button 
                        size="small" 
                        appearance="subtle"
                        icon={<CommentAdd24Regular />}
                        title="Add Note for Client"
                      >
                        Add Note
                      </Button>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>No summary data</span>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </Card>
    );
  };


  // --- MAIN COMPONENT RETURN ---
  return (
    <div className="underperforming-view-container">

      <TakeActionDialog
        isOpen={isTakeActionOpen}
        onDismiss={() => setIsTakeActionOpen(false)}
        employees={employeeList}
        weekRanges={weekRanges}
        onActionSuccess={() => loadData(filters)}
      />
      
      <RecommendationsDialog
        isOpen={recommendationsDialogState.isOpen}
        onDismiss={handleRecommendationClose}
        agentName={recommendationsDialogState.agentName}
        monthlyResults={recommendationsDialogState.monthlyResults}
        recommendation={recommendationsDialogState.recommendation}
      />

      <div className="top-filters-row">
        <div className="left-filters">
            <FilterPopover 
                filterOptions={filterOptions}
                currentFilters={filters}
                setFilters={setFilters}
            />
            
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
                        <Option key={String(year)} value={String(year)} text={String(year)}>{year}</Option>
                    ))}
                </Dropdown>
            </div>
        </div>

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

      {viewMode === 'employee' ? renderEmployeeGrid() : renderClientGrid()}

      {loading && (groupedData.size > 0 || clientSummaryData.length > 0) &&
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <Spinner size="small" label="Updating data..." />
        </div>
      }
    </div>
  );
}