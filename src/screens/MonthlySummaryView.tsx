// src/screens/performance/monthly_summary/MonthlySummaryView.tsx

import { useState, useEffect } from 'react'; // <-- Import useState and useEffect
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
// --- 1. IMPORT YOUR API FUNCTIONS AND TYPES ---
import { 
  fetchMonthlySummary, 
  transformToSummaryItems,
  calculateKPIs,
  type SummaryData,
  type SummaryItem,
} from '../services/api'; // Adjust path if necessary
import './MonthlySummaryView.css';

// --- Column Definitions for the DataGrid (can stay outside the component) ---
const columns: TableColumnDefinition<SummaryItem>[] = [
  createTableColumn<SummaryItem>({
    columnId: 'client',
    renderHeaderCell: () => 'Client',
    renderCell: (item) => item.client,
  }),
  createTableColumn<SummaryItem>({
    columnId: 'category',
    renderHeaderCell: () => 'Category',
    renderCell: (item) => item.category,
  }),
  createTableColumn<SummaryItem>({
    columnId: 'totalAFTEs',
    renderHeaderCell: () => 'Total AFTEs',
    renderCell: (item) => item.totalAFTEs,
  }),
  createTableColumn<SummaryItem>({
    columnId: 'avgScore',
    renderHeaderCell: () => 'Avg Score',
    renderCell: (item) => <strong>{item.avgScore}</strong>,
  }),
  createTableColumn<SummaryItem>({
    columnId: 'trend',
    renderHeaderCell: () => 'Trend',
    renderCell: () => <ArrowTrendingLines24Regular />,
  }),
];

export default function MonthlySummaryView() {
  // --- 2. SET UP STATE FOR YOUR DATA ---
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  const [kpi, setKpi] = useState({ totalAFTEs: 0, totalUnderperformers: 0, underperformerPercentage: '0.0', avgScore: '0.0' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- 3. USE useEffect TO FETCH DATA WHEN THE COMPONENT MOUNTS ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Call your specific API function
        const rawSummaryData: SummaryData[] = await fetchMonthlySummary();

        // Use your helper functions to process the data
        const transformedItems = transformToSummaryItems(rawSummaryData);
        const calculatedKpis = calculateKPIs(rawSummaryData);

        // Update the state with the processed data
        setSummaryItems(transformedItems);
        setKpi(calculatedKpis);

      } catch (err: any) {
        console.error(err);
        setError("Failed to load summary data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // The empty array [] means this effect runs only once when the component mounts

  // --- 4. HANDLE LOADING AND ERROR STATES ---
  if (loading) {
    return <Spinner label="Loading summary data..." />;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  // --- 5. RENDER THE COMPONENT WITH DYNAMIC DATA ---
  return (
    <div className="summary-view-container">
      {/* KPI Cards Section with live data */}
      <div className="kpi-cards-grid">
        <Card className="kpi-card">
          <CardHeader header={<div className="card-title">Total AFTEs <People24Regular /></div>} />
          <div className="kpi-value">{kpi.totalAFTEs}</div>
          <div className="kpi-description">Across all clients and categories</div>
        </Card>
        <Card className="kpi-card">
          <CardHeader header={<div className="card-title">Underperformers <Warning24Regular /></div>} />
          <div className="kpi-value">{kpi.totalUnderperformers}</div>
          <div className="kpi-description">{kpi.underperformerPercentage}% of total workforce</div>
        </Card>
        <Card className="kpi-card">
          <CardHeader header={<div className="card-title">Average Score <ChartMultiple24Regular /></div>} />
          <div className="kpi-value">{kpi.avgScore}</div>
          <div className="kpi-description">Overall performance metric</div>
        </Card>
      </div>

      {/* DataGrid Section */}
      <Card className="data-grid-card">
        <h3>Performance by Client & Category</h3>
        <DataGrid 
          items={summaryItems} 
          columns={columns} 
          sortable
          getRowId={(item) => item.client + item.category}
        >
          <DataGridHeader>
            <DataGridRow>{(column) => <DataGridHeaderCell>{column.renderHeaderCell()}</DataGridHeaderCell>}</DataGridRow>
          </DataGridHeader>
          <DataGridBody<SummaryItem>>
            {({ item, rowId }) => (
              <DataGridRow<SummaryItem> key={rowId}>
                {(column) => <DataGridCell>{column.renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      </Card>
    </div>
  );
}