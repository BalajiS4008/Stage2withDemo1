import React, { useState, useCallback, useMemo } from 'react';
import { Filter, X, Calendar, Search } from 'lucide-react';

/**
 * Reusable Enhanced Filter Component
 * Supports: Search, Status Filter, Date Range, Custom Filters
 */
const EnhancedFilter = ({
  // Search props
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  searchFields = [], // Array of field names to search in
  
  // Status filter props
  statusOptions = [], // Array of { value, label, count, color }
  statusValue = 'all',
  onStatusChange,
  
  // Date range props
  showDateRange = false,
  dateRangeValue = { startDate: '', endDate: '' },
  onDateRangeChange,
  
  // Custom filters
  customFilters = [], // Array of custom filter components
  
  // Data
  data = [],
  
  // Callbacks
  onFilteredDataChange,
  
  // UI props
  showFilterPanel = false,
  onToggleFilterPanel,
  className = ''
}) => {
  const [localShowPanel, setLocalShowPanel] = useState(showFilterPanel);

  // Handle toggle
  const handleToggle = useCallback(() => {
    const newState = !localShowPanel;
    setLocalShowPanel(newState);
    if (onToggleFilterPanel) {
      onToggleFilterPanel(newState);
    }
  }, [localShowPanel, onToggleFilterPanel]);

  // Clear all filters
  const handleClearAll = useCallback(() => {
    if (onSearchChange) onSearchChange('');
    if (onStatusChange) onStatusChange('all');
    if (onDateRangeChange) onDateRangeChange({ startDate: '', endDate: '' });
  }, [onSearchChange, onStatusChange, onDateRangeChange]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchValue) count++;
    if (statusValue !== 'all') count++;
    if (dateRangeValue.startDate || dateRangeValue.endDate) count++;
    return count;
  }, [searchValue, statusValue, dateRangeValue]);

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (searchValue && searchFields.length > 0) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchLower);
        })
      );
    }

    // Status filter
    if (statusValue !== 'all') {
      filtered = filtered.filter(item => item.status === statusValue);
    }

    // Date range filter
    if (dateRangeValue.startDate || dateRangeValue.endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const start = dateRangeValue.startDate ? new Date(dateRangeValue.startDate) : null;
        const end = dateRangeValue.endDate ? new Date(dateRangeValue.endDate) : null;

        if (start && end) {
          return itemDate >= start && itemDate <= end;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          return itemDate <= end;
        }
        return true;
      });
    }

    return filtered;
  }, [data, searchValue, searchFields, statusValue, dateRangeValue]);

  // Notify parent of filtered data
  React.useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleToggle}
          className={`btn ${localShowPanel ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
        >
          <Filter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Search Bar (always visible) */}
        {onSearchChange && (
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Panel */}
      {localShowPanel && (
        <div className="card bg-gray-50 border-2 border-primary-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5 text-primary-600" />
                Filter Options
              </h3>
              <button
                onClick={handleClearAll}
                className="text-sm text-danger-600 hover:text-danger-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status Filter */}
              {statusOptions.length > 0 && onStatusChange && (
                <div>
                  <label className="label">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onStatusChange(option.value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          statusValue === option.value
                            ? `${option.color || 'bg-primary-600'} text-white`
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {option.label}
                        {option.count !== undefined && ` (${option.count})`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Range Filter */}
              {showDateRange && onDateRangeChange && (
                <div>
                  <label className="label flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRangeValue.startDate}
                      onChange={(e) =>
                        onDateRangeChange({ ...dateRangeValue, startDate: e.target.value })
                      }
                      className="input text-sm"
                      placeholder="Start Date"
                    />
                    <input
                      type="date"
                      value={dateRangeValue.endDate}
                      onChange={(e) =>
                        onDateRangeChange({ ...dateRangeValue, endDate: e.target.value })
                      }
                      className="input text-sm"
                      placeholder="End Date"
                    />
                  </div>
                </div>
              )}

              {/* Custom Filters */}
              {customFilters.map((CustomFilter, index) => (
                <div key={index}>{CustomFilter}</div>
              ))}
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="pt-4 border-t border-gray-300">
                <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchValue && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                      Search: "{searchValue}"
                      <button
                        onClick={() => onSearchChange('')}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {statusValue !== 'all' && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                      Status: {statusOptions.find(o => o.value === statusValue)?.label || statusValue}
                      <button
                        onClick={() => onStatusChange('all')}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {(dateRangeValue.startDate || dateRangeValue.endDate) && (
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2">
                      Date: {dateRangeValue.startDate || '...'} to {dateRangeValue.endDate || '...'}
                      <button
                        onClick={() => onDateRangeChange({ startDate: '', endDate: '' })}
                        className="hover:bg-primary-200 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>
          Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{data.length}</span> results
        </p>
      </div>
    </div>
  );
};

export default EnhancedFilter;

