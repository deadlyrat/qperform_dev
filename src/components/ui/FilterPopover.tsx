import * as React from 'react';
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
  // FIX: Import types using the 'type' keyword
  type OptionOnSelectData, 
  type SelectionEvents, 
} from '@fluentui/react-components';
import { Filter24Regular } from '@fluentui/react-icons';
import { type FilterOptions, type PerformanceFilters } from '../../services/api';

// Simple styles for layout within the popover
const useStyles = makeStyles({
  filterContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '300px',
    padding: tokens.spacingHorizontalL,
  },
  filterControl: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
});

interface FilterPopoverProps {
  filterOptions: FilterOptions;
  currentFilters: PerformanceFilters;
  setFilters: React.Dispatch<React.SetStateAction<PerformanceFilters>>;
}

export default function FilterPopover({ filterOptions, currentFilters, setFilters }: FilterPopoverProps) {
  const styles = useStyles();

  // Unified handler now uses Fluent UI's specific type OptionOnSelectData
  // Both parameters (event and data) need to use the imported types.
  const handleFilterChange = (filterName: keyof PerformanceFilters) => 
    (_e: SelectionEvents, data: OptionOnSelectData) => { 
      // data.optionValue is string | undefined. Use the value, if it's the empty string, treat it as undefined
      const selectedValue = data.optionValue === '' ? undefined : data.optionValue;
      
      setFilters(prev => ({
        ...prev,
        [filterName]: selectedValue,
      }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <Popover openOnHover={false}>
      <PopoverTrigger disableButtonEnhancement>
        <Button icon={<Filter24Regular />} appearance="outline">
          Multi Filter: Category, Client, & Task
        </Button>
      </PopoverTrigger>

      <PopoverSurface>
        <div className={styles.filterContainer}>
          
          <h3>Filter Data</h3>

          {/* Client Filter */}
          <div className={styles.filterControl}>
            <Label>Client</Label>
            <Dropdown 
              placeholder="Select Client"
              selectedOptions={currentFilters.client ? [currentFilters.client] : []}
              onOptionSelect={handleFilterChange('client')}
            >
              <Option value="">All Clients</Option>
              {filterOptions.clients.map(client => (
                <Option key={client} value={client}>{client}</Option>
              ))}
            </Dropdown>
          </div>

          {/* Category Filter */}
          <div className={styles.filterControl}>
            <Label>Category</Label>
            <Dropdown 
              placeholder="Select Category"
              selectedOptions={currentFilters.category ? [currentFilters.category] : []}
              onOptionSelect={handleFilterChange('category')}
            >
              <Option value="">All Categories</Option>
              {filterOptions.categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Dropdown>
          </div>

          {/* Task Filter */}
          <div className={styles.filterControl}>
            <Label>Task</Label>
            <Dropdown 
              placeholder="Select Task"
              selectedOptions={currentFilters.task ? [currentFilters.task] : []}
              onOptionSelect={handleFilterChange('task')}
            >
              <Option value="">All Tasks</Option>
              {filterOptions.tasks.map(task => (
                <Option key={task} value={task}>{task}</Option>
              ))}
            </Dropdown>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: tokens.spacingVerticalM }}>
            <Button appearance="subtle" onClick={handleClearFilters}>Clear Filters</Button>
          </div>
        </div>
      </PopoverSurface>
    </Popover>
  );
}
