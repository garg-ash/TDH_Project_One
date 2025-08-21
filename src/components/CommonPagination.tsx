'use client';

import React, { useState, useEffect } from 'react';

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

  // Update input when current page changes
  useEffect(() => {
    setGoToPageInput(currentPage.toString());
  }, [currentPage]);

  const handleGoToPage = () => {
    const page = parseInt(goToPageInput);
    if (page >= 1 && page <= totalPages) {
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

  return (
    <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-2 sm:space-y-0 mr-10">
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
                <span> of {totalPages} • </span>
              ) : (
                <span> • </span>
              )}
              <span>Showing {itemsPerPage} entries</span>
              {typeof totalItems === 'string' && (
                <span> (Total: {totalItems})</span>
              )}
              
              {/* Show active filters */}
              {/* {showFiltersInfo && (
                (Object.keys(masterFilters).some(key => masterFilters[key])) ||
                (Object.keys(detailedFilters).length > 0) ? (
                  <div className="mt-1 text-xs text-blue-600">
                    🔍 Filters active
                    {Object.keys(masterFilters).some(key => masterFilters[key]) && (
                      <span className="ml-1">• Master: {Object.entries(masterFilters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                    )}
                    {Object.keys(detailedFilters).length > 0 && (
                      <span className="ml-1">• Detailed: {Object.entries(detailedFilters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                    )}
                  </div>
                ) : null
              )}
               */}

              {/* Show filter loading indicator */}
              {/* {showFiltersInfo && filterLoading && (
                <div className="mt-1 text-xs text-orange-600">
                  <span className="animate-spin inline-block w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full mr-1"></span>
                  Updating filters...
                </div>
              )} */}
            </div>
          )}
        </div>
        
        {/* Centered Pagination */}
        <div className="flex items-center justify-center space-x-1">
          {/* Refresh Button */}
          {showRefreshButton && onRefresh && (
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh with current filters"
            >
              🔄
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
            
            if (totalPages <= 5) {
              // If total pages is 5 or less, show all pages
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Show first 5 pages
              for (let i = 1; i <= 5; i++) {
                pages.push(i);
              }
              
              // Add ellipsis
              pages.push('...');
              
              // Add total pages
              pages.push(totalPages);
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
            disabled={currentPage >= totalPages || loading}
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
              max={totalPages}
              value={goToPageInput}
              onChange={(e) => setGoToPageInput(e.target.value)}
              onKeyDown={handleGoToPageKeyDown}
              onBlur={handleGoToPageBlur}
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-xs text-gray-500">of {totalPages}</span>
          </div>
          
          {/* Items per page dropdown */}
          <div className="flex items-center space-x-1 ml-2">
            <span className="text-xs text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
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
