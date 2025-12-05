import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * Works with both Tailwind and Bootstrap themes
 *
 * @param {number} currentPage - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} pageSize - Number of items per page
 * @param {number} totalItems - Total number of items
 * @param {function} onPageChange - Callback when page changes
 * @param {function} onPageSizeChange - Callback when page size changes
 * @param {array} pageSizeOptions - Available page size options (default: [10, 25, 50, 100])
 */
const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100]
}) => {
  // Calculate the range of items being displayed
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page, last page, current page, and surrounding pages
      if (currentPage <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border-t-2 border-indigo-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items info and page size selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-sm font-medium text-gray-700">
            Showing <span className="font-bold text-indigo-600">{startItem}</span> to{' '}
            <span className="font-bold text-indigo-600">{endItem}</span> of{' '}
            <span className="font-bold text-indigo-600">{totalItems}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm font-medium text-gray-700">
              Rows per page:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 bg-white border-2 border-indigo-200 rounded-lg text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:border-indigo-300 transition-colors shadow-sm"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          {/* First page button */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all duration-200 ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                : 'text-indigo-600 hover:bg-indigo-100 hover:scale-110 shadow-sm'
            }`}
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous page button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all duration-200 ${
              currentPage === 1
                ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                : 'text-indigo-600 hover:bg-indigo-100 hover:scale-110 shadow-sm'
            }`}
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-400 font-bold">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[36px] px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm ${
                    currentPage === page
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-110 shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 hover:scale-105 border border-gray-200'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Next page button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all duration-200 ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                : 'text-indigo-600 hover:bg-indigo-100 hover:scale-110 shadow-sm'
            }`}
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last page button */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all duration-200 ${
              currentPage === totalPages
                ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                : 'text-indigo-600 hover:bg-indigo-100 hover:scale-110 shadow-sm'
            }`}
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
