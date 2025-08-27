'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import ProcessedDataTable from './ProcessedDataTable';

// Interface for surname data
export interface SurnameData {
  id: number;
  name?: string; // Name field to extract surname from (optional)
  religion?: string;
  surname: string;
  count: number;
  castId: string;
  castIda: string;
  castIdFromOtherTable?: string; // Will come from other database table
  castIdaFromOtherTable?: string; // Will come from other database table
}

// Helper function to extract surname from name (last word)
const extractSurname = (name?: string): string => {
  if (!name) return '';
  const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
  // Only show surname if multiple words, otherwise blank
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
};


// Excel-like Cell Component for Surname Table
interface SurnameExcelCellProps {
  value: any;
  rowIndex: number;
  columnId: string;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  onCellClick: (rowIndex: number, columnId: string) => void;
  onCellDoubleClick: (rowIndex: number, columnId: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent, rowIndex: number, columnId: string) => void;
  onUpdate: (rowIndex: number, columnId: string, value: any) => void;
  onUpdateAndNavigate: (rowIndex: number, columnId: string, value: any, navigationKey: string) => void;
  editValue: string;
  setEditValue: (value: string) => void;
  onStopEditing: () => void;
  loading?: boolean;
}

const SurnameExcelCell = memo(function SurnameExcelCell({ 
  value, 
  rowIndex, 
  columnId, 
  isSelected, 
  isFocused, 
  isEditing, 
  onCellClick, 
  onCellDoubleClick, 
  onCellKeyDown,
  onUpdate,
  onUpdateAndNavigate,
  editValue,
  setEditValue,
  onStopEditing,
  loading = false 
}: SurnameExcelCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      setTimeout(() => {
        if (inputRef.current) {
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 0);
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        onUpdateAndNavigate(rowIndex, columnId, editValue, 'ArrowDown');
        onStopEditing();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Escape') {
        onStopEditing();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Tab') {
        onUpdateAndNavigate(rowIndex, columnId, editValue, e.shiftKey ? 'ArrowLeft' : 'ArrowRight');
        onStopEditing();
        e.preventDefault();
        e.stopPropagation();
      }
    } else {
      // Only handle navigation keys in non-editing mode, let the parent handle others
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'F2', 'Delete', 'Backspace'].includes(e.key)) {
        onCellKeyDown(e, rowIndex, columnId);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  const handleBlur = () => {
    if (isEditing) {
      onUpdate(rowIndex, columnId, editValue);
      onStopEditing();
    }
  };

  // Row header (Sr. No.) styling
  if (columnId === 'select') {
    const rowHeaderStyle = isSelected ? {
      border: '2px solid #000000',
      zIndex: 1,
      position: 'relative' as const
    } : {};
    
    return (
      <div 
        className={`
          h-full w-full flex items-center justify-center font-medium text-gray-800 text-sm
          bg-gray-100 border-r border-gray-300 border-b border-gray-300
          select-none cursor-pointer outline-none
          hover:bg-gray-200
        `}
        style={rowHeaderStyle}
        onClick={() => onCellClick(rowIndex, columnId)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        data-cell={`${rowIndex}-${columnId}`}
      >
        {rowIndex + 1}
      </div>
    );
  }

  const cellClasses = `
    h-full w-full flex items-center px-2 text-sm text-gray-900
    border-r border-gray-300 border-b border-gray-300
    cursor-cell select-none outline-none
    ${isEditing ? 'bg-white' : ''}
    ${!isEditing && !isSelected && !isFocused ? 'hover:bg-gray-50' : ''}
    ${loading ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  // Excel-like selection styling with simple black border
  const selectionStyle = isSelected && !isEditing ? {
    border: '2px solid #000000',
    zIndex: 1,
    position: 'relative' as const
  } : {};

  return (
    <div 
      className={cellClasses}
      style={selectionStyle}
      onClick={() => onCellClick(rowIndex, columnId)}
      onDoubleClick={() => onCellDoubleClick(rowIndex, columnId)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-cell={`${rowIndex}-${columnId}`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-white text-sm text-gray-900 font-normal"
          style={{ 
            margin: '-8px -8px -8px -8px', 
            padding: '8px 8px 8px 8px',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            borderRadius: '0',
            backgroundColor: 'white',
            fontFamily: 'inherit'
          }}
        />
      ) : (
        <span className="truncate w-full">
          {value || ''}
        </span>
      )}
    </div>
  );
});

const columns: ColumnDef<SurnameData>[] = [
  {
    id: 'select',
    header: 'Sr.',
    cell: ({ row }) => (
      <div className="flex items-center justify-center bg-gray-100 px-1 py-1 h-full">
        <span className="text-gray-700 font-medium text-xs">{row.index + 1}</span>
      </div>
    ),
    size: 50,
    minSize: 50,
    maxSize: 50,
  },
  {
    id: 'rowCheck',
    header: '',
    size: 40,
    minSize: 40,
    maxSize: 40,
  },
  {
    accessorKey: 'religion',
    header: 'Religion',
    size: 140,
  },
  {
    accessorKey: 'castId',
    header: 'Cast',
    size: 150,
  },
  {
    accessorKey: 'castIda',
    header: 'Cast Category',
    size: 150,
  },
  {
    accessorKey: 'surname',
    header: 'Surname',
    size: 200,
  },
  {
    accessorKey: 'count',
    header: 'Count',
    size: 120,
  },
  {
    accessorKey: 'castIdFromOtherTable',
    header: 'Cast Id',
    size: 150,
  },
  {
    accessorKey: 'castIdaFromOtherTable',
    header: 'Cast IDA',
    size: 150,
  },
];

interface SurnameDataTableProps {
  data: SurnameData[];
  loading: boolean;
  onUpdateSurname: (id: number, surnameData: Partial<SurnameData>) => Promise<void>;
  // Add new props for processing
  onProcessData?: (filteredData: SurnameData[]) => Promise<any>;
  processedData?: any;
  isProcessing?: boolean;
  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number | string;
    itemsPerPage: number;
  };
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showPagination?: boolean;
}

export default function SurnameDataTable({ 
  data, 
  loading, 
  onUpdateSurname,
  onProcessData,
  processedData,
  isProcessing = false,
  pagination,
  onPageChange,
  onItemsPerPageChange,
  showPagination = false
}: SurnameDataTableProps) {
  // Excel-like state management
  const [selectedCell, setSelectedCell] = useState<{row: number, column: string} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<{row: number, column: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  
  // Add state for processed data view
  const [showProcessedData, setShowProcessedData] = useState(false);
  const [processingData, setProcessingData] = useState(false);

  const columnIds = useMemo(() => {
    const ids = columns.map(col => {
      if (col.id) return col.id;
      if ('accessorKey' in col) return col.accessorKey as string;
      return 'unknown';
    });
    console.log(`📋 Surname Generated column IDs:`, ids);
    return ids;
  }, []);

  // Consolidated navigation function to prevent conflicts
  const navigateToCell = useCallback((fromRow: number, fromColumnId: string, toRow: number, toColumnId: string) => {
    console.log(`🎯 Surname Navigation: [${fromRow}, ${fromColumnId}] → [${toRow}, ${toColumnId}]`);
    console.log(`📍 Surname Column IDs:`, columnIds);
    console.log(`📍 Surname From index:`, columnIds.indexOf(fromColumnId), `To index:`, columnIds.indexOf(toColumnId));
    
    // Immediate state updates for instant response
    setSelectedCell({ row: toRow, column: toColumnId });
    setFocusedCell({ row: toRow, column: toColumnId });
  }, [columnIds]);

  const handleUpdateData = useCallback((rowIndex: number, columnId: string, value: any) => {
    try {
      const surnameItem = data && data[rowIndex];
      if (!surnameItem) {
        console.log(`Cannot update row ${rowIndex} - no data available`);
        return;
      }

      console.log(`Saving ${columnId} = "${value}" for surname ${surnameItem.id} at row ${rowIndex}`);
      
      // Call the update function asynchronously
      onUpdateSurname(surnameItem.id, { [columnId]: value }).then(() => {
        console.log(`Successfully updated ${columnId} for surname ${surnameItem.id}`);
      }).catch((error) => {
        console.error('Error updating surname:', error);
      });
      
    } catch (error) {
      console.error('Error updating surname:', error);
    }
  }, [data, onUpdateSurname]);

  // Memoize grid dimensions
  const gridDimensions = useMemo(() => {
    const maxVisibleRows = Math.max(15, data?.length || 15);
    const maxRows = Math.max(maxVisibleRows, data?.length || 0);
    const maxCols = columnIds.length;
    return { maxRows, maxCols };
  }, [data?.length, columnIds.length]);

  const handleUpdateAndNavigate = useCallback((rowIndex: number, columnId: string, value: any, navigationKey: string) => {
    try {
      // First save the data
      handleUpdateData(rowIndex, columnId, value);
      
      // Navigate based on the key
      const currentColumnIndex = columnIds.indexOf(columnId);
      const { maxRows, maxCols } = gridDimensions;
      
      let newRow = rowIndex;
      let newCol = currentColumnIndex;
      
      switch (navigationKey) {
        case 'ArrowDown':
          newRow = Math.min(maxRows - 1, rowIndex + 1);
          break;
        case 'ArrowUp':
          newRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowRight':
          if (currentColumnIndex < maxCols - 1) {
            newCol = currentColumnIndex + 1;
          } else if (rowIndex < maxRows - 1) {
            newCol = 0;
            newRow = rowIndex + 1;
          }
          break;
        case 'ArrowLeft':
          if (currentColumnIndex > 0) {
            newCol = currentColumnIndex - 1;
          } else if (rowIndex > 0) {
            newCol = maxCols - 1;
            newRow = rowIndex - 1;
          }
          break;
      }
      
      if (newRow !== rowIndex || newCol !== currentColumnIndex) {
        const newColumnId = columnIds[newCol];
        console.log(`🔄 Surname UpdateAndNavigate: ${columnId}[${currentColumnIndex}] → ${newColumnId}[${newCol}] | Row: ${rowIndex} → ${newRow}`);
        
        // Validate that the target cell exists
        if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
          navigateToCell(rowIndex, columnId, newRow, newColumnId);
        } else {
          console.error(`❌ Invalid navigation target in Surname UpdateAndNavigate: [${newRow}, ${newCol}] - maxRows: ${maxRows}, maxCols: ${maxCols}`);
        }
      }
    } catch (error) {
      console.error('Error in updateAndNavigate:', error);
    }
  }, [handleUpdateData, columnIds, gridDimensions, navigateToCell]);

  const handleCellClick = useCallback((rowIndex: number, columnId: string) => {
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
    if (editingCell) {
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell]);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnId: string) => {
    if (columnId === 'select') return; // Don't edit row numbers
    
    // Allow editing even for empty cells - get current value or empty string
    const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId as keyof SurnameData] || '') : '';
    setEditValue(String(currentValue));
    setEditingCell({ row: rowIndex, column: columnId });
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
  }, [data]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (editingCell) return;

    const currentColumnIndex = columnIds.indexOf(columnId);
    const { maxRows, maxCols } = gridDimensions;
    
    // Debug logging to identify the issue
    console.log(`🔍 Surname Navigation Debug:`, {
      key: e.key,
      columnId,
      currentColumnIndex,
      columnIds,
      maxCols,
      maxRows
    });
    
    let newRow = rowIndex;
    let newCol = currentColumnIndex;

    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, rowIndex - 1);
        console.log(`🔄 Surname ArrowUp: Moving up from row ${rowIndex} to ${newRow}`);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        console.log(`🔄 Surname ArrowDown: Moving down from row ${rowIndex} to ${newRow}`);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentColumnIndex - 1);
        console.log(`🔄 Surname ArrowLeft: Moving left from column ${currentColumnIndex} to ${newCol}`);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(maxCols - 1, currentColumnIndex + 1);
        console.log(`🔄 Surname ArrowRight: Moving right from column ${currentColumnIndex} to ${newCol}`);
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          if (currentColumnIndex > 0) {
            newCol = currentColumnIndex - 1;
            console.log(`🔄 Surname Shift+Tab: Moving left from column ${currentColumnIndex} to ${newCol}`);
          } else if (rowIndex > 0) {
            newCol = maxCols - 1;
            newRow = rowIndex - 1;
            console.log(`🔄 Surname Shift+Tab: Moving up-left from [${rowIndex}, ${currentColumnIndex}] to [${newRow}, ${newCol}]`);
          }
        } else {
          if (currentColumnIndex < maxCols - 1) {
            newCol = currentColumnIndex + 1;
            console.log(`🔄 Surname Tab: Moving right from column ${currentColumnIndex} to ${newCol}`);
          } else if (rowIndex < maxRows - 1) {
            newCol = 0;
            newRow = rowIndex + 1;
            console.log(`🔄 Surname Tab: Moving down-right from [${rowIndex}, ${currentColumnIndex}] to [${newRow}, ${newCol}]`);
          }
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'Enter':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        console.log(`🔄 Surname Enter: Moving down from row ${rowIndex} to ${newRow}`);
        e.preventDefault();
        break;
      case 'F2':
        if (columnId !== 'select') {
          // Allow editing even for empty cells - get current value or empty string
          const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId as keyof SurnameData] || '') : '';
          setEditValue(String(currentValue));
          setEditingCell({ row: rowIndex, column: columnId });
          setSelectedCell({ row: rowIndex, column: columnId });
          setFocusedCell({ row: rowIndex, column: columnId });
        }
        e.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        if (columnId !== 'select') {
          handleUpdateData(rowIndex, columnId, '');
        }
        e.preventDefault();
        break;
    }

    if (newRow !== rowIndex || newCol !== currentColumnIndex) {
      const newColumnId = columnIds[newCol];
      console.log(`🎯 Surname Navigation Result: ${columnId}[${currentColumnIndex}] → ${newColumnId}[${newCol}] | Row: ${rowIndex} → ${newRow}`);
      
      // Validate that the target cell exists
      if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
        // Use the consolidated navigation function
        navigateToCell(rowIndex, columnId, newRow, newColumnId);
      } else {
        console.error(`❌ Invalid navigation target in Surname handleCellKeyDown: [${newRow}, ${newCol}] - maxRows: ${maxRows}, maxCols: ${maxCols}`);
      }
    } else {
      console.log(`❌ Surname: No navigation occurred - staying at ${columnId}[${currentColumnIndex}]`);
    }
  }, [data, columnIds, editingCell, handleUpdateData, gridDimensions, navigateToCell]);

  const handleStopEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Handle process button click
  const handleProcessData = async () => {
    if (!onProcessData || !data || data.length === 0) return;
    
    setProcessingData(true);
    try {
      const rowsToProcess = (selectedRowIds.size > 0)
        ? data.filter(item => selectedRowIds.has(item.id))
        : data;
      await onProcessData(rowsToProcess);
      setShowProcessedData(true);
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setProcessingData(false);
    }
  };

  // Focus the selected cell
  useEffect(() => {
    if (selectedCell && !editingCell) {
      const cellSelector = `[data-cell="${selectedCell.row}-${selectedCell.column}"]`;
      const cellElement = document.querySelector(cellSelector) as HTMLElement;
      console.log(`🔍 Surname Focus Update: Looking for cell ${cellSelector}, found:`, cellElement);
      if (cellElement && cellElement !== document.activeElement) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          cellElement.focus();
          console.log(`✅ Surname Focused cell: ${selectedCell.row}-${selectedCell.column}`);
        }, 0);
      } else if (!cellElement) {
        console.log(`❌ Surname Cell not found: ${cellSelector}`);
      }
    }
  }, [selectedCell?.row, selectedCell?.column, editingCell]);

  // Initialize first cell selection
  useEffect(() => {
    if (data && data.length > 0 && !selectedCell && !loading && columnIds.length > 0) {
      setSelectedCell({ row: 0, column: columnIds[0] });
      setFocusedCell({ row: 0, column: columnIds[0] });
    }
  }, [data?.length, selectedCell, loading, columnIds[0]]);

  // Global keyboard handler
  const currentCellRef = useRef<{row: number, column: string} | null>(null);
  
  useEffect(() => {
    currentCellRef.current = selectedCell;
  }, [selectedCell]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentCell = currentCellRef.current;
      if (!currentCell || editingCell || !tableRef.current) return;
      
      const activeElement = document.activeElement;
      if (!activeElement || !activeElement.hasAttribute('data-cell')) return;
      
      // Only handle keys that aren't already handled by the cell
      // This prevents double handling and cell skipping
      if (['Tab'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        
        const syntheticEvent = {
          key: e.key,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          preventDefault: () => {},
        } as React.KeyboardEvent;
        
        handleCellKeyDown(syntheticEvent, currentCell.row, currentCell.column);
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, { passive: false });
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [editingCell, handleCellKeyDown]);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Pre-compute the table body
  const tableBody = useMemo(() => {
    // Show all data returned by the API (like DataTable does)
    // This ensures we display exactly what the backend sends, not artificially limit it
    const displayData = data || [];
    const totalRows = loading ? (pagination?.itemsPerPage || 100) : displayData.length;
    
    console.log(`📊 Table Body Debug:`, {
      itemsPerPage: pagination?.itemsPerPage,
      requestedRows: pagination?.itemsPerPage || 100,
      dataLength: displayData.length,
      totalRows,
      paginationState: pagination
    });
    
    // Log if we're getting fewer rows than requested
    if (!loading && pagination?.itemsPerPage && displayData.length < pagination.itemsPerPage) {
      console.log(`⚠️ Warning: Requested ${pagination.itemsPerPage} rows but got ${displayData.length} rows from API`);
    }
    
    return Array.from({ length: totalRows }).map((_, index) => {
      const isDataRow = !loading && displayData && index < displayData.length;
      const rowData = isDataRow ? displayData[index] : null;
      
      return (
        <tr key={isDataRow ? (rowData?.id || index) : `empty-${index}`} style={{ height: '28px' }}>
          {columnIds.map((columnId, cellIndex) => (
            <td
              key={`${index}-${columnId}`}
              className="border-r border-gray-300 border-b border-gray-300 p-0"
              style={{ 
                width: columns[cellIndex]?.size, 
                minWidth: columns[cellIndex]?.size,
                height: '28px'
              }}
            >
              {loading ? (
                <div className={`h-6 animate-pulse ${cellIndex === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}></div>
              ) : (
                columnId === 'rowCheck' ? (
                  isDataRow && rowData ? (
                    <div 
                      className="h-full w-full flex items-center justify-center pointer-events-auto"
                      onMouseDown={(e) => { e.stopPropagation(); }}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <input
                        type="checkbox"
                        className="cursor-pointer"
                        checked={selectedRowIds.has(rowData.id)}
                        onChange={(e) => {
                          setSelectedRowIds(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(rowData.id); else next.delete(rowData.id);
                            return next;
                          });
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : null
                ) : (
                  <SurnameExcelCell
                    value={
                      columnId === 'select' 
                        ? index + 1 
                        : columnId === 'surname' && isDataRow && rowData
                          ? extractSurname(rowData.name || '')
                          : isDataRow && rowData 
                            ? (rowData[columnId as keyof SurnameData] || '') 
                            : ''
                    }
                    rowIndex={index}
                    columnId={columnId}
                    isSelected={selectedCell?.row === index && selectedCell?.column === columnId}
                    isFocused={focusedCell?.row === index && focusedCell?.column === columnId}
                    isEditing={editingCell?.row === index && editingCell?.column === columnId}
                    onCellClick={handleCellClick}
                    onCellDoubleClick={handleCellDoubleClick}
                    onCellKeyDown={handleCellKeyDown}
                    onUpdate={handleUpdateData}
                    onUpdateAndNavigate={handleUpdateAndNavigate}
                    editValue={editValue}
                    setEditValue={setEditValue}
                    onStopEditing={handleStopEditing}
                    loading={loading}
                  />
                )
              )}
            </td>
          ))}
        </tr>
      );
    });
  }, [data, loading, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, columnIds, handleCellClick, handleCellDoubleClick, handleCellKeyDown, handleUpdateData, handleUpdateAndNavigate, setEditValue, handleStopEditing, pagination?.itemsPerPage]);

  // Show processed data table if available
  if (showProcessedData && processedData) {
    return (
      <div className="bg-white h-screen w-full overflow-hidden relative">
        {/* Header with back button */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Processed Results</h2>
          <button
            onClick={() => setShowProcessedData(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← Back to Surname Data
          </button>
        </div>
        
        {/* Processed Data Table will be rendered here */}
        <ProcessedDataTable data={processedData} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading surname data...</div>
        </div>
      </div>
    );
  }

  // Show message when no data is available
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <div className="text-gray-600 text-lg font-medium mb-2">No Filters Selected</div>
          <div className="text-gray-500 mb-4">Please select filters and click "Go" to view surname data</div>
          <div className="text-sm text-gray-400">
            Select one or more filters (Religion, Cast Category, Cast, Surname) and click "Go" to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-screen w-full overflow-hidden relative" style={{ border: '1px solid #d1d5db' }}>
      {/* Add Process Button */}
      {data && data.length > 0 && (
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <div className="text-blue-800">
              <span className="font-medium">{data.length}</span> records filtered
            </div>
            <button
              onClick={handleProcessData}
              disabled={processingData || !onProcessData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
            >
              {processingData ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </span>
              ) : (
                'View Table'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Excel-like DataGrid */}
      <div className="h-full w-full overflow-auto pb-16" ref={tableRef}>
        <table className="border-collapse w-full" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
          {/* Excel-like Header */}
          <thead>
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((header) => (
                <th
                  key={header.id}
                  className="bg-gray-100 border-r border-gray-300 border-b border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wide select-none hover:bg-gray-200"
                  style={{ 
                    width: header.getSize(),
                    minWidth: header.getSize(),
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                  }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Excel-like Body */}
          <tbody>
            {tableBody}
          </tbody>
        </table>
      </div>

      {/* Grid Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 absolute bottom-0 left-0 right-0">
        {showPagination && pagination && onPageChange && onItemsPerPageChange ? (
          <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-2 sm:space-y-0 mr-10">
            <div className="text-center sm:text-left">
              <div className="text-sm">
                <span className="font-medium">Page {pagination.currentPage}</span>
                {typeof pagination.totalItems === 'number' ? (
                  <span> of {pagination.totalPages} • </span>
                ) : (
                  <span> • </span>
                )}
                <span>Showing {data?.length || 0} surname entries</span>
                {typeof pagination.totalItems === 'string' && (
                  <span> (Total: {pagination.totalItems})</span>
                )}
                {pagination?.itemsPerPage && data && data.length < pagination.itemsPerPage && (
                  <span className="text-orange-600 ml-2">⚠️ Expected {pagination.itemsPerPage} rows</span>
                )}
              </div>
            </div>
            
            {/* Centered Pagination */}
            <div className="flex items-center justify-center space-x-1">
              {/* Previous page button */}
              <button 
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1 || loading}
                title="Previous"
              >
                &lt;
              </button>
            
              {/* Page numbers with ellipsis */}
              {(() => {
                const pages = [];
                
                if (pagination.totalPages <= 5) {
                  // If total pages is 5 or less, show all pages
                  for (let i = 1; i <= pagination.totalPages; i++) {
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
                  pages.push(pagination.totalPages);
                }
                
                return pages.map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-2 py-1 text-gray-400 cursor-pointer">......</span>
                    ) : (
                      <button
                        className={`px-3 py-1 rounded transition-colors ${
                          page === pagination.currentPage
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
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages || loading}
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
                  max={pagination.totalPages}
                  defaultValue={pagination.currentPage}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const page = parseInt((e.target as HTMLInputElement).value);
                      if (page >= 1 && page <= pagination.totalPages) {
                        onPageChange(page);
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const page = parseInt((e.target as HTMLInputElement).value);
                    if (page >= 1 && page <= pagination.totalPages) {
                      onPageChange(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <span className="text-xs text-gray-500">of {pagination.totalPages}</span>
              </div>
              
              {/* Items per page dropdown */}
              <div className="flex items-center space-x-1 ml-2">
                <span className="text-xs text-gray-600">Show:</span>
                <select
                  value={pagination.itemsPerPage}
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
        ) : (
          <div className="flex justify-between items-center text-sm text-gray-700">
            <div>
              Showing {data?.length || 0} surname entries
            </div>
            <div className="text-gray-500">
              Total Surnames: {data?.length || 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
