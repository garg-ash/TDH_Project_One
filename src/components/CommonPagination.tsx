'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number | string;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  loading?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  showFiltersInfo?: boolean;
  masterFilters?: Record<string, any>;
  detailedFilters?: Record<string, any>;
  filterLoading?: boolean;
}

export default function CommonPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  loading = false,
  showRefreshButton = true,
  onRefresh,
  showFiltersInfo = false,
  masterFilters = {},
  detailedFilters = {},
  filterLoading = false
}: PaginationProps) {
  const [goToPageInput, setGoToPageInput] = useState<string>(currentPage.toString());
  
  // Compute total pages dynamically from totalItems when available (supports numeric strings)
  const numericTotalItems = typeof totalItems === 'number'
    ? totalItems
    : (() => {
        if (typeof totalItems === 'string') {
          // Only accept pure digit strings; ignore approximate strings like "10000+"
          const isPureDigits = /^\d+$/.test(totalItems);
          return isPureDigits ? parseInt(totalItems, 10) : undefined;
        }
        return undefined;
      })();
  const computedTotalPages = typeof numericTotalItems === 'number'
    ? Math.max(1, Math.ceil(numericTotalItems / itemsPerPage))
    : totalPages;

  // Display at least 5 pages when total is unknown/approximate
  const displayTotalPages = typeof numericTotalItems === 'number'
    ? computedTotalPages
    : Math.max(computedTotalPages, 5);

  // Update input when current page changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  const handleGoToPage = () => {
    const page = parseInt(goToPageInput);
    const maxPage = displayTotalPages;
    if (page >= 1 && page <= maxPage) {
      onPageChange(page);
      setGoToPageInput(page.toString());
    } else {
      setGoToPageInput(currentPage.toString());
    }
  };

  const handleGoToPageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  const handleGoToPageBlur = () => {
    handleGoToPage();
  };

  const handleItemsPerPageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = parseInt(e.target.value, 10);
    if (!Number.isNaN(newVal)) {
      onItemsPerPageChange(newVal);
      if (currentPage !== 1) {
        setGoToPageInput('1');
      }
    }
  };

  return (
    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 relative z-50">
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-1 sm:space-y-0 mr-10">
        <div className="text-center sm:text-left">
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading data...
            </div>
          ) : (
            <div className="text-sm">
              <span className="font-medium">Page {currentPage}</span>
              {typeof totalItems === 'number' ? (
                <span> of {computedTotalPages} • </span>
              ) : (
                <span> • </span>
              )}
              <span>Showing {itemsPerPage} entries</span>
              <span> (Total: {totalItems})</span>
            </div>
          )}
        </div>
        
        {/* Centered Pagination */}
        <div className="flex items-center justify-center space-x-1">
          {/* Refresh Button */}
          {showRefreshButton && onRefresh && (
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-black cursor-pointer"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh with current filters"
            >
              <RefreshCw size={16} />
            </button>
          )}
          
          {/* Previous page button */}
          <button 
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            title="Previous"
          >
            &lt;
          </button>
        
          {/* Page numbers with ellipsis */}
          {(() => {
            const pages = [];
            
            if (displayTotalPages <= 5) {
              // If total pages is 5 or less, show all pages
              for (let i = 1; i <= displayTotalPages; i++) {
                pages.push(i);
              }
            } else {
              // Dynamic window around current page with first/last and ellipses
              const windowSize = 5;
              const half = Math.floor(windowSize / 2);
              let start = Math.max(1, currentPage - half);
              let end = Math.min(displayTotalPages, start + windowSize - 1);
              start = Math.max(1, Math.min(start, end - windowSize + 1));

              // Always include first page
              pages.push(1);

              // Left ellipsis
              if (start > 2) pages.push('...');

              // Middle window
              for (let i = Math.max(2, start); i <= Math.min(displayTotalPages - 1, end); i++) {
                pages.push(i);
              }

              // Right ellipsis
              if (end < displayTotalPages - 1) pages.push('...');

              // Always include last page
              if (displayTotalPages > 1) pages.push(displayTotalPages);
            }
            
            return pages.map((page, index) => (
              <div key={index}>
                {page === '...' ? (
                  <span className="px-2 py-1 text-gray-400 cursor-pointer">......</span>
                ) : (
                  <button
                    className={`px-3 py-1 rounded transition-colors ${
                      page === currentPage
                        ? 'bg-gray-600 text-white cursor-pointer'
                        : 'border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer '
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => onPageChange(page as number)}
                    disabled={loading}
                  >
                    {page}
                  </button>
                )}
              </div>
            ));
          })()}
          
          {/* Next page icon > */}
          <button 
            className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= displayTotalPages || loading}
            title="Next page"
          >
            &gt;
          </button>
          
          {/* Go to Page input */}
          <div className="flex items-center space-x-1 ml-2 cursor-pointer">
            <span className="text-xs text-gray-600">Go to:</span>
            <input
              type="number"
              min="1"
              max={displayTotalPages}
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onKeyDown={handleGoToPageKeyDown}
              onBlur={handleGoToPageBlur}
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-xs text-gray-500">of {computedTotalPages}</span>
          </div>
          
          {/* Items per page dropdown */}
          <div className="flex items-center space-x-1 ml-2">
            <span className="text-xs text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={handleItemsPerPageSelect}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              disabled={loading}
            >
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={500}>500</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
