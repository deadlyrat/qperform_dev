import { useState, useEffect, useMemo } from 'react';
import {
  DataGrid,
  DataGridBody,
  DataGridRow,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridCell,
  type TableColumnDefinition,
  createTableColumn,
  TableCellLayout,
  Avatar,
  Badge,
  Button,
  Tooltip,
  makeStyles,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import { 
  BuildingMultiple24Regular,
  CommentAdd24Regular,
  ChevronDown24Regular,
  ChevronUp24Regular,
} from '@fluentui/react-icons';
import { 
  fetchPerformanceData, 
  fetchClientSummary,
  type PerformanceData,
  type ClientSummaryData,
  type PerformanceFilters 
} from '../services/api';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
  },
  gridContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  headerCell: {
    fontWeight: 600,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  clientCell: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontWeight: 600,
  },
  weekCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '200px',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.85rem',
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
  },
  statValue: {
    fontWeight: 600,
  },
  monthlyCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '220px',
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground1Hover,
  },
  monthlyHeader: {
    fontWeight: 600,
    fontSize: '0.9rem',
    marginBottom: '4px',
  },
  actionButton: {
    marginTop: '8px',
  },
  expandIcon: {
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  criticalBadge: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  lowBadge: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },
  goodBadge: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
});

interface WeeklyClientStats {
  weekRange: string;
  totalAFTEs: number;
  underperformers: number;
  actionsCount: number;
  avgScore: number;
}

interface ClientRow {
  client: string;
  weeklyStats: WeeklyClientStats[];
  monthlyResults: {
    totalAFTEs: number;
    underperformers: number;
    totalActions: number;
    avgScore: number;
    weeksWithIssues: number;
  };
}

interface ClientViewProps {
  currentFilters: PerformanceFilters;
}

export default function ClientView({ currentFilters }: ClientViewProps) {
  const styles = useStyles();
  
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<ClientRow[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadClientData();
  }, [currentFilters]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      // Fetch detailed performance data
      const performanceData = await fetchPerformanceData(currentFilters);
      
      // Fetch client summary
      const clientSummary = await fetchClientSummary({
        month: currentFilters.month,
        year: currentFilters.year,
      });

      // Process data by client and week
      const clientMap = new Map<string, {
        weeks: Map<string, PerformanceData[]>,
        summary: ClientSummaryData | undefined,
      }>();

      // Group performance data by client and week
      performanceData.forEach(record => {
        if (!clientMap.has(record.client)) {
          clientMap.set(record.client, {
            weeks: new Map(),
            summary: clientSummary.find(s => s.client === record.client),
          });
        }

        const clientEntry = clientMap.get(record.client)!;
        
        if (!clientEntry.weeks.has(record.week_range)) {
          clientEntry.weeks.set(record.week_range, []);
        }
        
        clientEntry.weeks.get(record.week_range)!.push(record);
      });

      // Transform into ClientRow format
      const rows: ClientRow[] = Array.from(clientMap.entries()).map(([client, data]) => {
        const weeklyStats: WeeklyClientStats[] = [];
        
        // Get all unique weeks sorted by start date
        const sortedWeeks = Array.from(data.weeks.keys()).sort((a, b) => {
          const recordsA = data.weeks.get(a)!;
          const recordsB = data.weeks.get(b)!;
          return new Date(recordsA[0].start_date).getTime() - new Date(recordsB[0].start_date).getTime();
        });

        // Calculate stats for each week
        sortedWeeks.forEach(weekRange => {
          const weekRecords = data.weeks.get(weekRange)!;
          
          // Count unique agents
          const uniqueAgents = new Set(weekRecords.map(r => r.agent_id));
          const totalAFTEs = uniqueAgents.size;

          // Count underperformers (agents with Critical or Low flags)
          const underperformingAgents = new Set(
            weekRecords
              .filter(r => r.flag_qa === 'Critical' || r.flag_qa === 'Low' || 
                          r.flag_prod === 'Critical' || r.flag_prod === 'Low')
              .map(r => r.agent_id)
          );
          const underperformers = underperformingAgents.size;

          // Calculate average score
          const avgScore = weekRecords.reduce((sum, r) => sum + r.kpi_qa, 0) / weekRecords.length;

          // Actions count would come from action log - for now set to 0
          const actionsCount = 0;

          weeklyStats.push({
            weekRange,
            totalAFTEs,
            underperformers,
            actionsCount,
            avgScore: Math.round(avgScore * 100),
          });
        });

        // Monthly results from summary
        const summary = data.summary;
        const monthlyResults = {
          totalAFTEs: summary?.total_aftes || 0,
          underperformers: summary?.underperformers || 0,
          totalActions: 0, // Would come from action log
          avgScore: summary?.avg_score || 0,
          weeksWithIssues: summary?.weeks_with_issues || 0,
        };

        return {
          client,
          weeklyStats,
          monthlyResults,
        };
      });

      // Sort by client name
      rows.sort((a, b) => a.client.localeCompare(b.client));

      setClientData(rows);
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (client: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(client)) {
      newExpanded.delete(client);
    } else {
      newExpanded.add(client);
    }
    setExpandedClients(newExpanded);
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) return { color: 'success' as const, text: 'Excellent' };
    if (score >= 85) return { color: 'success' as const, text: 'Good' };
    if (score >= 75) return { color: 'warning' as const, text: 'Fair' };
    return { color: 'danger' as const, text: 'Low' };
  };

  const columns: TableColumnDefinition<ClientRow>[] = useMemo(() => {
    // Get all unique weeks from the data
    const allWeeks = new Set<string>();
    clientData.forEach(row => {
      row.weeklyStats.forEach(stat => allWeeks.add(stat.weekRange));
    });
    const sortedWeeks = Array.from(allWeeks).sort();

    const cols: TableColumnDefinition<ClientRow>[] = [
      createTableColumn<ClientRow>({
        columnId: 'client',
        renderHeaderCell: () => 'Client',
        renderCell: (item) => (
          <TableCellLayout>
            <div className={styles.clientCell}>
              <div 
                className={styles.expandIcon}
                onClick={() => toggleExpand(item.client)}
              >
                {expandedClients.has(item.client) ? (
                  <ChevronUp24Regular />
                ) : (
                  <ChevronDown24Regular />
                )}
              </div>
              <Avatar
                icon={<BuildingMultiple24Regular />}
                color="colorful"
                size={32}
              />
              <span>{item.client}</span>
            </div>
          </TableCellLayout>
        ),
      }),
    ];

    // Add column for each week
    sortedWeeks.forEach((weekRange, index) => {
      cols.push(
        createTableColumn<ClientRow>({
          columnId: `week${index + 1}`,
          renderHeaderCell: () => (
            <div>
              <div style={{ fontWeight: 600 }}>Week {index + 1}</div>
              <div style={{ fontSize: '0.75rem', color: tokens.colorNeutralForeground3 }}>
                {weekRange}
              </div>
            </div>
          ),
          renderCell: (item) => {
            const weekStat = item.weeklyStats.find(s => s.weekRange === weekRange);
            if (!weekStat) {
              return (
                <TableCellLayout>
                  <div className={styles.weekCell}>
                    <span style={{ color: tokens.colorNeutralForeground3 }}>No data</span>
                  </div>
                </TableCellLayout>
              );
            }

            const scoreBadge = getScoreBadge(weekStat.avgScore);

            return (
              <TableCellLayout>
                <div className={styles.weekCell}>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>AFTEs:</span>
                    <span className={styles.statValue}>{weekStat.totalAFTEs}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Underperformers:</span>
                    <span className={styles.statValue} style={{ 
                      color: weekStat.underperformers > 0 ? tokens.colorPaletteRedForeground1 : undefined 
                    }}>
                      {weekStat.underperformers}
                    </span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Actions:</span>
                    <span className={styles.statValue}>{weekStat.actionsCount}</span>
                  </div>
                  <div className={styles.statRow}>
                    <span className={styles.statLabel}>Avg Score:</span>
                    <Badge appearance="filled" color={scoreBadge.color} size="small">
                      {weekStat.avgScore}%
                    </Badge>
                  </div>
                </div>
              </TableCellLayout>
            );
          },
        })
      );
    });

    // Add monthly results column
    cols.push(
      createTableColumn<ClientRow>({
        columnId: 'monthly',
        renderHeaderCell: () => 'Monthly Results',
        renderCell: (item) => {
          const { monthlyResults } = item;
          const scoreBadge = getScoreBadge(monthlyResults.avgScore);
          const upPercentage = monthlyResults.totalAFTEs > 0 
            ? ((monthlyResults.underperformers / monthlyResults.totalAFTEs) * 100).toFixed(1)
            : '0.0';

          return (
            <TableCellLayout>
              <div className={styles.monthlyCell}>
                <div className={styles.monthlyHeader}>
                  {currentFilters.month || 'All Months'} Summary
                </div>
                
                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total AFTEs:</span>
                  <span className={styles.statValue}>{monthlyResults.totalAFTEs}</span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Underperformers:</span>
                  <span className={styles.statValue} style={{ 
                    color: tokens.colorPaletteRedForeground1 
                  }}>
                    {monthlyResults.underperformers} ({upPercentage}%)
                  </span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Total Actions:</span>
                  <span className={styles.statValue}>{monthlyResults.totalActions}</span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Weeks w/ Issues:</span>
                  <span className={styles.statValue}>{monthlyResults.weeksWithIssues}</span>
                </div>

                <div className={styles.statRow}>
                  <span className={styles.statLabel}>Monthly Score:</span>
                  <Badge appearance="filled" color={scoreBadge.color} size="small">
                    {monthlyResults.avgScore}%
                  </Badge>
                </div>

                <Tooltip content="Add note or comment for this client" relationship="label">
                  <Button
                    icon={<CommentAdd24Regular />}
                    appearance="subtle"
                    size="small"
                    className={styles.actionButton}
                  >
                    Add Note
                  </Button>
                </Tooltip>
              </div>
            </TableCellLayout>
          );
        },
      })
    );

    return cols;
  }, [clientData, expandedClients, currentFilters, styles]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spinner size="large" label="Loading client data..." />
      </div>
    );
  }

  if (clientData.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        gap: tokens.spacingVerticalM,
      }}>
        <BuildingMultiple24Regular style={{ fontSize: '48px', color: tokens.colorNeutralForeground3 }} />
        <div style={{ fontSize: '1.1rem', color: tokens.colorNeutralForeground2 }}>
          No client data found
        </div>
        <div style={{ fontSize: '0.9rem', color: tokens.colorNeutralForeground3 }}>
          Try adjusting your filters or date range
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.gridContainer}>
        <DataGrid
          items={clientData}
          columns={columns}
          sortable
          size="small"
          resizableColumns
        >
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => (
                <DataGridHeaderCell className={styles.headerCell}>
                  {renderHeaderCell()}
                </DataGridHeaderCell>
              )}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<ClientRow>>
            {({ item, rowId }) => (
              <DataGridRow<ClientRow> key={rowId}>
                {({ renderCell }) => (
                  <DataGridCell>{renderCell(item)}</DataGridCell>
                )}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </div>

      <div style={{ 
        fontSize: '0.85rem', 
        color: tokens.colorNeutralForeground3,
        marginTop: tokens.spacingVerticalM,
      }}>
        Showing {clientData.length} client{clientData.length !== 1 ? 's' : ''} for{' '}
        {currentFilters.month || 'all months'} {currentFilters.year || ''}
      </div>
    </div>
  );
}