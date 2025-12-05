import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * Provides navigation controls for paginated data with tooltips
 *
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 * @param {number} totalRecords - Total number of records
 * @param {number} pageSize - Number of records per page
 */
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize
}) => {
  // Calculate record range for current page
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with 2 pages on each side
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(maxVisiblePages, totalPages);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return (
      <div className="flex justify-center items-center py-3">
        <span className="text-sm text-gray-600">
          Showing {totalRecords} {totalRecords === 1 ? 'record' : 'records'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {/* Page Info */}
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-purple-600">{startRecord}</span> to{' '}
        <span className="font-semibold text-purple-600">{endRecord}</span> of{' '}
        <span className="font-semibold text-purple-600">{totalRecords}</span> records
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page Button */}
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
          }`}
          title="First page"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>

        {/* Previous Page Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
          }`}
          title="Previous page"
          aria-label="Go to previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                }`}
                title={`Go to page ${page}`}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
          }`}
          title="Next page"
          aria-label="Go to next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Last Page Button */}
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
          }`}
          title="Last page"
          aria-label="Go to last page"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
