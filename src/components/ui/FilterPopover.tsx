import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverSurface,
  Button,
  Dropdown,
  Option,
  Label,
  makeStyles,
  tokens,
  Spinner,
  type OptionOnSelectData, 
  type SelectionEvents, 
} from '@fluentui/react-components';
import { Filter24Regular } from '@fluentui/react-icons';
import { fetchFilters, type FilterOptions, type PerformanceFilters } from '../../services/api';

const useStyles = makeStyles({
  filterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '320px',
    padding: tokens.spacingHorizontalL,
  },
  filterControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  helperText: {
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
  successText: {
    fontSize: '0.75rem',
    color: tokens.colorPaletteGreenForeground1,
    marginTop: '4px',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    fontSize: '0.75rem',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
  },
});

interface FilterPopoverProps {
  filterOptions: FilterOptions;
  currentFilters: PerformanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<PerformanceFilters>>;
}

export default function FilterPopover({ filterOptions, currentFilters, setFilters }: FilterPopoverProps) {
  const styles = useStyles();
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      if (!currentFilters.client) {
        setAvailableCategories([]);
        return;
      }

      setLoadingCategories(true);
      try {
        const options = await fetchFilters({
          client: currentFilters.client,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        
        setAvailableCategories(options.categories);

        if (options.categories.length === 1 && !currentFilters.category) {
          setFilters(prev => ({
            ...prev,
            category: options.categories[0],
          }));
        }

        if (currentFilters.category && !options.categories.includes(currentFilters.category)) {
          setFilters(prev => ({
            ...prev,
            category: undefined,
            task: undefined,
          }));
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setAvailableCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [currentFilters.client, currentFilters.month, currentFilters.year]);

  useEffect(() => {
    const loadTasks = async () => {
      if (!currentFilters.client || !currentFilters.category) {
        setAvailableTasks([]);
        return;
      }

      setLoadingTasks(true);
      try {
        const options = await fetchFilters({
          client: currentFilters.client,
          category: currentFilters.category,
          month: currentFilters.month,
          year: currentFilters.year,
        });
        
        setAvailableTasks(options.tasks);

        if (options.tasks.length === 1 && !currentFilters.task) {
          setFilters(prev => ({
            ...prev,
            task: options.tasks[0],
          }));
        }

        if (currentFilters.task && !options.tasks.includes(currentFilters.task)) {
          setFilters(prev => ({
            ...prev,
            task: undefined,
          }));
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        setAvailableTasks([]);
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, [currentFilters.client, currentFilters.category, currentFilters.month, currentFilters.year]);

  const handleClientChange = (_e: SelectionEvents, data: OptionOnSelectData) => { 
    const selectedValue = data.optionValue === '' ? undefined : data.optionValue;
    
    setFilters(prev => ({
      ...prev,
      client: selectedValue,
      category: undefined,
      task: undefined,
    }));
  };

  const handleCategoryChange = (_e: SelectionEvents, data: OptionOnSelectData) => { 
    const selectedValue = data.optionValue === '' ? undefined : data.optionValue;
    
    setFilters(prev => ({
      ...prev,
      category: selectedValue,
      task: undefined,
    }));
  };

  const handleTaskChange = (_e: SelectionEvents, data: OptionOnSelectData) => { 
    const selectedValue = data.optionValue === '' ? undefined : data.optionValue;
    
    setFilters(prev => ({
      ...prev,
      task: selectedValue,
    }));
  };

  const handleClearFilters = () => {
    setFilters(prev => ({
      month: prev.month,
      year: prev.year,
    }));
  };

  const activeFilterCount = [
    currentFilters.client,
    currentFilters.category,
    currentFilters.task,
  ].filter(Boolean).length;

  return (
    <Popover openOnHover={false}>
      <PopoverTrigger disableButtonEnhancement>
        <Button icon={<Filter24Regular />} appearance="outline">
          Multi Filter: Category, Client, & Task
          {activeFilterCount > 0 && (
            <span style={{ 
              marginLeft: '8px', 
              backgroundColor: tokens.colorBrandBackground,
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverSurface>
        <div className={styles.filterContainer}>
          
          <h3 style={{ margin: '0 0 8px 0' }}>Filter Data</h3>

          <div className={styles.filterControl}>
            <Label>Client</Label>
            <Dropdown 
              placeholder="Select Client"
              value={currentFilters.client || 'Select Client'}
              selectedOptions={currentFilters.client ? [currentFilters.client] : []}
              onOptionSelect={handleClientChange}
            >
              <Option value="">All Clients</Option>
              {filterOptions.clients.map(client => (
                <Option key={client} value={client}>{client}</Option>
              ))}
            </Dropdown>
          </div>

          <div className={styles.filterControl}>
            <Label>Category</Label>
            <Dropdown 
              placeholder="Select Category"
              value={currentFilters.category || 'Select Category'}
              selectedOptions={currentFilters.category ? [currentFilters.category] : []}
              onOptionSelect={handleCategoryChange}
              disabled={!currentFilters.client || loadingCategories}
            >
              <Option value="">All Categories</Option>
              {availableCategories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Dropdown>
            
            {!currentFilters.client && (
              <span className={styles.helperText}>
                Select a client first
              </span>
            )}
            
            {loadingCategories && (
              <div className={styles.loadingContainer}>
                <Spinner size="tiny" />
                <span>Loading categories...</span>
              </div>
            )}
            
            {currentFilters.client && !loadingCategories && availableCategories.length === 0 && (
              <span className={styles.helperText}>
                No categories found for this client
              </span>
            )}
            
            {currentFilters.client && !loadingCategories && availableCategories.length === 1 && currentFilters.category && (
              <span className={styles.successText}>
                ✓ Auto-selected (only option with data)
              </span>
            )}
          </div>

          <div className={styles.filterControl}>
            <Label>Task</Label>
            <Dropdown 
              placeholder="Select Task"
              value={currentFilters.task || 'Select Task'}
              selectedOptions={currentFilters.task ? [currentFilters.task] : []}
              onOptionSelect={handleTaskChange}
              disabled={!currentFilters.client || !currentFilters.category || loadingTasks}
            >
              <Option value="">All Tasks</Option>
              {availableTasks.map(task => (
                <Option key={task} value={task}>{task}</Option>
              ))}
            </Dropdown>
            
            {(!currentFilters.client || !currentFilters.category) && (
              <span className={styles.helperText}>
                Select client and category first
              </span>
            )}
            
            {loadingTasks && (
              <div className={styles.loadingContainer}>
                <Spinner size="tiny" />
                <span>Loading tasks...</span>
              </div>
            )}
            
            {currentFilters.client && currentFilters.category && !loadingTasks && availableTasks.length === 0 && (
              <span className={styles.helperText}>
                No tasks found for this selection
              </span>
            )}
            
            {currentFilters.client && currentFilters.category && !loadingTasks && availableTasks.length === 1 && currentFilters.task && (
              <span className={styles.successText}>
                ✓ Auto-selected (only option with data)
              </span>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: tokens.spacingVerticalM,
            paddingTop: tokens.spacingVerticalM,
            borderTop: `1px solid ${tokens.colorNeutralStroke1}`
          }}>
            {activeFilterCount > 0 && (
              <span style={{ fontSize: '0.8rem', color: tokens.colorNeutralForeground3 }}>
                {activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
            <Button 
              appearance="subtle" 
              onClick={handleClearFilters}
              disabled={activeFilterCount === 0}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </PopoverSurface>
    </Popover>
  );
}