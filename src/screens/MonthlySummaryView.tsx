// src/screens/performance/monthly_summary/MonthlySummaryView.tsx

import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  type TableColumnDefinition,
  createTableColumn,
  Spinner,
} from '@fluentui/react-components';
import { 
  People24Regular, 
  Warning24Regular, 
  ChartMultiple24Regular, 
  ArrowTrendingLines24Regular 
} from '@fluentui/react-icons';
import { 
  fetchMonthlySummary, 
  type MonthlySummaryResponse,
} from '../services/api';
import './MonthlySummaryView.css';

// Detail row item for the table
interface DetailItem {
  client: string;
  category: string;
  total_aftes: number;
  avg_score: number;
}

// Column Definitions for the DataGrid
const columns: TableColumnDefinition<DetailItem>[] = [
  createTableColumn<DetailItem>({
    columnId: 'client',
    renderHeaderCell: () => 'Client',
    renderCell: (item) => item.client,
  }),
  createTableColumn<DetailItem>({
    columnId: 'category',
    renderHeaderCell: () => 'Category',
    renderCell: (item) => item.category,
  }),
  createTableColumn<DetailItem>({
    columnId: 'total_aftes',
    renderHeaderCell: () => 'Total AFTEs',
    renderCell: (item) => item.total_aftes,
  }),
  createTableColumn<DetailItem>({
    columnId: 'avg_score',
    renderHeaderCell: () => 'Avg Score',
    renderCell: (item) => <strong>{item.avg_score}%</strong>,
  }),
  createTableColumn<DetailItem>({
    columnId: 'trend',
    renderHeaderCell: () => 'Trend',
    renderCell: () => <ArrowTrendingLines24Regular style={{ color: '#107c10' }} />,
  }),
];

interface MonthlySummaryViewProps {
  currentFilters?: {
    month?: string;
    year?: string;
    client?: string;
    category?: string;
    task?: string;
  };
}

export default function MonthlySummaryView({ currentFilters }: MonthlySummaryViewProps) {
  const [data, setData] = useState<MonthlySummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use filters from props
  const month = currentFilters?.month;
  const year = currentFilters?.year;
  // Note: client, category, task filters would need backend support

  useEffect(() => {
    loadData();
  }, [month, year, currentFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching monthly summary with filters:', { month, year });

      // Fetch monthly summary data with filters
      const summaryData = await fetchMonthlySummary({ month, year });
      
      console.log('✅ Received data:', summaryData);
      
      // Check if it's the NEW format (object with overall & details)
      // or OLD format (array of items)
      if (Array.isArray(summaryData)) {
        console.log('⚠️ OLD API FORMAT DETECTED - Converting...');
        
        // Convert old format to new format
        const totalAFTEs = summaryData.reduce((sum, item: any) => sum + (item.total_aftes || 0), 0);
        const totalUnderperformers = summaryData.reduce((sum, item: any) => sum + (item.underperformers || 0), 0);
        const avgScore = summaryData.length > 0
          ? summaryData.reduce((sum, item: any) => sum + (item.avg_score || 0), 0) / summaryData.length
          : 0;
        
        const convertedData: MonthlySummaryResponse = {
          overall: {
            total_aftes: totalAFTEs,
            underperformers: totalUnderperformers,
            avg_score: parseFloat((avgScore * 100).toFixed(2)), // Convert to percentage
          },
          details: summaryData.map((item: any) => ({
            client: item.client,
            category: item.category,
            total_aftes: item.total_aftes,
            avg_score: parseFloat((item.avg_score * 100).toFixed(2)), // Convert to percentage
          })),
        };
        
        console.log('✅ Converted to new format:', convertedData);
        setData(convertedData);
      } else {
        // New format - use as is
        console.log('✅ NEW API FORMAT - Using directly');
        console.log('📊 Overall data:', summaryData?.overall);
        console.log('📋 Details length:', summaryData?.details?.length);
        setData(summaryData as MonthlySummaryResponse);
      }

    } catch (err: any) {
      console.error('❌ Error loading monthly summary:', err);
      setError("Failed to load summary data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Handle loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
        <Spinner size="large" label="Loading summary data..." />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  // Handle no data state
  if (!data || !data.overall || !data.details) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        No data available for the selected period.
      </div>
    );
  }

  const { overall, details } = data;
  
  // Calculate underperformer percentage with safe defaults
  const totalAFTEs = overall.total_aftes || 0;
  const underperformers = overall.underperformers || 0;
  const avgScore = overall.avg_score || 0;
  
  const underperformerPercentage = totalAFTEs > 0 
    ? ((underperformers / totalAFTEs) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="summary-view-container">
      {/* KPI Cards Section with live data */}
      <div className="kpi-cards-grid">
        <Card className="kpi-card">
          <CardHeader 
            header={
              <div className="card-title">
                Total AFTEs 
                <People24Regular />
              </div>
            } 
          />
          <div className="kpi-value">{totalAFTEs}</div>
          <div className="kpi-description">Across all clients and categories</div>
        </Card>

        <Card className="kpi-card">
          <CardHeader 
            header={
              <div className="card-title">
                Underperformers 
                <Warning24Regular style={{ color: '#d13438' }} />
              </div>
            } 
          />
          <div className="kpi-value">{underperformers}</div>
          <div className="kpi-description">{underperformerPercentage}% of total workforce</div>
        </Card>

        <Card className="kpi-card">
          <CardHeader 
            header={
              <div className="card-title">
                Average Score 
                <ChartMultiple24Regular />
              </div>
            } 
          />
          <div className="kpi-value">
            {avgScore > 0 ? `${avgScore}%` : 'N/A'}
          </div>
          <div className="kpi-description">Overall performance metric</div>
        </Card>
      </div>

      {/* DataGrid Section */}
      <Card className="data-grid-card">
        <h3>Performance by Client & Category</h3>
        <div style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'auto' }}>
          <DataGrid 
            items={details} 
            columns={columns} 
            sortable
            getRowId={(item) => `${item.client}-${item.category}`}
          >
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<DetailItem>>
              {({ item, rowId }) => (
                <DataGridRow<DetailItem> key={rowId}>
                  {({ renderCell }) => (
                    <DataGridCell>{renderCell(item)}</DataGridCell>
                  )}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
        </div>
      </Card>
    </div>
  );
}