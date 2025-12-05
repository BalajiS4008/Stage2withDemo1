import { useState, useMemo } from 'react';

/**
 * Custom hook for managing pagination state and logic
 * 
 * @param {array} data - The array of data to paginate
 * @param {number} initialPageSize - Initial page size (default: 10)
 * @returns {object} Pagination state and methods
 */
const usePagination = (data, initialPageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate total pages
  const totalPages = Math.ceil(data.length / pageSize);

  // Get current page data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    // Reset to first page when page size changes
    setCurrentPage(1);
  };

  // Reset pagination (useful when data changes)
  const resetPagination = () => {
    setCurrentPage(1);
  };

  return {
    currentPage,
    pageSize,
    totalPages,
    totalItems: data.length,
    paginatedData,
    handlePageChange,
    handlePageSizeChange,
    resetPagination
  };
};

export default usePagination;

