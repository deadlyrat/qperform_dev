// src/screens/performance/action_log/ActionLogView.tsx

import * as React from 'react';
import { useState, useEffect } from 'react'; // <-- Import hooks
import { Card, Input, Spinner } from '@fluentui/react-components'; // <-- Import Spinner
import { Search24Regular } from '@fluentui/react-icons';
import { fetchActionLog, type ActionLog } from '../services/api'; // <-- Import API function
import './ActionLogView.css';

// --- MOCK Data REMOVED ---

export default function ActionLogView() {
  const [actionLogItems, setActionLogItems] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Function to load data
  const loadActionLog = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchActionLog();
      setActionLogItems(data);
    } catch (err) {
      console.error('Error fetching action log:', err);
      setError("Failed to load action history. Check API connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActionLog();
  }, []); // Load once on mount

  const handleSearchChange = (_e: React.ChangeEvent<HTMLInputElement>, data: { value: string }) => {
    setSearchTerm(data.value);
  };
  
  const filteredItems = actionLogItems.filter(item => 
      item.agent_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <Spinner label="Loading action history..." />;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  return (
    <div className="action-log-container">
      <div className="action-log-header">
        <h3>Action History</h3>
        <Input
          contentAfter={<Search24Regular />}
          placeholder="Search actions..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="action-log-list">
        {filteredItems.length === 0 && <p>No actions found.</p>}
        {filteredItems.map((item) => (
          <Card key={item.id} className="action-log-card">
            <div className="card-main-header">
              <span className="action-type">{item.action_type}</span>
              <span className="employee-name">{item.agent_email.split('@')[0]}</span>
            </div>
            <p className="action-details">{item.description}</p>
            <div className="card-footer">
              <span>Taken by: {item.taken_by}</span>
              <span>•</span>
              <span>{new Date(item.action_date).toLocaleDateString()}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}