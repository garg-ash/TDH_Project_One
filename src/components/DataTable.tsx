
'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Voter } from '../services/api';
import { useVoters } from '../hooks/useVoters';

// Editable Cell Component
interface EditableCellProps {
  value: any;
  row: any;
  column: any;
  onUpdate: (rowIndex: number, columnId: string, value: any) => void;
  loading?: boolean;
}

function EditableCell({ value: initialValue, row, column, onUpdate, loading = false }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onUpdate(row.index, column.id, value);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  const onDoubleClick = () => {
    if (!loading) {
      setIsEditing(true);
    }
  };

  // Don't make the first column (Sr. No.) editable
  if (column.id === 'select') {
    return (
      <div className="flex items-center space-x-2">
        <span>{row.index + 1}</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    );
  }

  const cellContent = column.id === 'dob' || column.id === 'cast' || column.id === 'pc' 
    ? `${Number(value).toFixed(2)} Gms`
    : column.id === 'district'
    ? new Date(value).toLocaleDateString()
    : value;

  return (
    <div 
      onDoubleClick={onDoubleClick} 
      className={`cursor-pointer px-2 py-1 rounded transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'
      }`}
    >
      {cellContent}
    </div>
  );
}

const columns: ColumnDef<Voter>[] = [
  {
    id: 'select',
    header: 'Sr. No.',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        <span>{row.index + 1}</span>
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: 'familyId',
    header: 'Family Id',
    size: 150,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
  },
  {
    accessorKey: 'mobile1',
    header: 'Mobile 1',
    size: 120,
  },
  {
    accessorKey: 'mobile2',
    header: 'Mobile 2',
    size: 120,
  },
  {
    accessorKey: 'dob',
    header: 'DOB',
    size: 120,
  },
  {
    accessorKey: 'ps',
    header: 'PS',
    size: 100,
  },
  {
    accessorKey: 'gp',
    header: 'GP',
    size: 140,
  },
  {
    accessorKey: 'gram',
    header: 'Gram',
    size: 140,
  },
  {
    accessorKey: 'castIda',
    header: 'Cast IDA',
    size: 140,
  },
  {
    accessorKey: 'cast',
    header: 'Cast',
    size: 120,
  },
  {
    accessorKey: 'pc',
    header: 'PC',
    size: 120,
  },
  {
    accessorKey: 'ac',
    header: 'AC',
    size: 100,
  },
  {
    accessorKey: 'district',
    header: 'District',
    size: 120,
  },
];

export default function DataTable() {
  const {
    voters: data,
    pagination,
    loading,
    error,
    setPage,
    setItemsPerPage,
    updateVoter
  } = useVoters();

  const handleUpdateData = async (rowIndex: number, columnId: string, value: any) => {
    try {
      const voter = data[rowIndex];
      if (!voter) return;

      await updateVoter(voter._id, { [columnId]: value });
    } catch (error) {
      console.error('Error updating voter:', error);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // if (error) {
  //   return (
  //     <div className="bg-white rounded-lg shadow-lg p-8">
  //       <div className="text-center">
  //         <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
  //         <div className="text-gray-600 mb-4">{error}</div>
  //         <button
  //           onClick={() => window.location.reload()}
  //           className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
  //         >
  //           Retry
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">

      {/* Excel-like DataGrid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-100"
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center justify-between">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {/* <div className="flex flex-col">
                        <ChevronDown size={12} className="text-gray-400" />
                        <ChevronDown size={12} className="text-gray-400 rotate-180" />
                      </div> */}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  {Array.from({ length: columns.length }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty grid rows
              Array.from({ length: pagination.itemsPerPage }).map((_, index) => (
                <tr key={`empty-${index}`} className="border-b border-gray-100">
                  {Array.from({ length: columns.length }).map((_, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3 text-sm text-gray-400 border-r border-gray-100 last:border-r-0">
                      <div className="h-4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-gray-900 border-r border-gray-100 last:border-r-0"
                      style={{ width: cell.column.getSize() }}
                    >
                      <EditableCell
                        value={cell.getValue()}
                        row={row}
                        column={cell.column}
                        onUpdate={handleUpdateData}
                        loading={loading}
                      />
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Grid Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left">
            Showing {loading ? '...' : `${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of ${pagination.totalItems} entries`}
          </div>
          
          {/* Centered Pagination */}
          <div className="flex items-center justify-center space-x-1">
            <button 
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* Page numbers with ellipsis */}
            {(() => {
              const totalPages = pagination.totalPages;
              const currentPage = pagination.currentPage;
              const pages = [];
              
              // Always show first page
              pages.push(1);
              
              if (totalPages <= 7) {
                // Show all pages if total is 7 or less
                for (let i = 2; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Show pages around current page
                if (currentPage <= 4) {
                  // Near the beginning
                  for (let i = 2; i <= 5; i++) {
                    pages.push(i);
                  }
                  pages.push('...');
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 3) {
                  // Near the end
                  pages.push('...');
                  for (let i = totalPages - 4; i <= totalPages; i++) {
                    if (i > 1) pages.push(i);
                  }
                } else {
                  // In the middle
                  pages.push('...');
                  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                  }
                  pages.push('...');
                  pages.push(totalPages);
                }
              }
              
              return pages.map((page, index) => (
                <div key={index}>
                  {page === '...' ? (
                    <span className="px-2 py-1 text-gray-400">...</span>
                  ) : (
                    <button
                      className={`px-3 py-1 rounded transition-colors ${
                        page === currentPage
                          ? 'bg-gray-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      onClick={() => handlePageChange(page as number)}
                      disabled={loading}
                    >
                      {page}
                    </button>
                  )}
                </div>
              ));
            })()}
            
            <button 
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
