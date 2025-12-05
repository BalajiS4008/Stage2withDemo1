import React from 'react';
import { ListFilter } from 'lucide-react';

/**
 * Page Size Selector Component
 * Allows users to select how many records to display per page
 *
 * @param {number} pageSize - Current page size
 * @param {function} onPageSizeChange - Callback when page size changes
 * @param {number} totalRecords - Total number of records available
 */
const PageSizeSelector = ({ pageSize, onPageSizeChange, totalRecords }) => {
  const options = [
    { value: 10, label: '10 per page' },
    { value: 25, label: '25 per page' },
    { value: 50, label: '50 per page' },
    { value: 100, label: '100 per page' },
    { value: -1, label: 'Show All' }
  ];

  // Filter out "Show All" option if there are too many records
  const filteredOptions = totalRecords > 1000
    ? options.filter(opt => opt.value !== -1)
    : options;

  const handleChange = (e) => {
    const newSize = parseInt(e.target.value, 10);
    onPageSizeChange(newSize);
  };

  return (
    <div className="flex items-center gap-2">
      <ListFilter className="w-4 h-4 text-gray-500" />
      <select
        value={pageSize}
        onChange={handleChange}
        className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white text-gray-700 font-medium hover:border-purple-300"
        aria-label="Select page size"
      >
        {filteredOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.value === -1 && ` (${totalRecords})`}
          </option>
        ))}
      </select>
    </div>
  );
};

export default PageSizeSelector;
