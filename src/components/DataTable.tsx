
'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
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

// Excel-like Cell Component
interface ExcelCellProps {
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

const ExcelCell = memo(function ExcelCell({ 
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
}: ExcelCellProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      // Don't select all text - just position cursor at end for character-by-character editing
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
        console.log(`ExcelCell: Saving on Enter and navigating down - rowIndex: ${rowIndex}, columnId: ${columnId}, editValue: "${editValue}"`);
        onUpdateAndNavigate(rowIndex, columnId, editValue, 'ArrowDown');
        onStopEditing();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Escape') {
        console.log(`ExcelCell: Canceling edit on Escape`);
        onStopEditing();
        e.preventDefault();
        e.stopPropagation();
      } else if (e.key === 'Tab') {
        console.log(`ExcelCell: Saving on Tab and navigating right - rowIndex: ${rowIndex}, columnId: ${columnId}, editValue: "${editValue}"`);
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
      console.log(`ExcelCell: Saving on Blur - rowIndex: ${rowIndex}, columnId: ${columnId}, editValue: "${editValue}"`);
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

const columns: ColumnDef<Voter>[] = [
  {
    id: 'select',
    header: 'Sr. No.',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 bg-gray-200 px-2 py-1">
        <span className="text-gray-800 font-medium">{row.index + 1}</span>
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

export default function DataTable({ masterFilters }: { masterFilters?: { parliament?: string; assembly?: string; district?: string } }) {
  const {
    data,
    pagination,
    loading,
    error,
    handlePageChange,
    handleItemsPerPageChange,
    updateVoter,
    fetchVoters
  } = useVoters();

  // Excel-like state management
  const [selectedCell, setSelectedCell] = useState<{row: number, column: string} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<{row: number, column: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const previousMasterFiltersRef = useRef<typeof masterFilters | undefined>(undefined);

  const columnIds = useMemo(() => {
    const ids = columns.map(col => {
      if (col.id) return col.id;
      if ('accessorKey' in col) return col.accessorKey as string;
      return 'unknown';
    });
    console.log(`📋 Generated column IDs:`, ids);
    return ids;
  }, []);

  // Effect to refetch data when master filters change
  useEffect(() => {
    // Only refetch if masterFilters actually changed
    const currentFilters = JSON.stringify(masterFilters);
    const previousFilters = JSON.stringify(previousMasterFiltersRef.current);
    
    if (currentFilters !== previousFilters) {
      previousMasterFiltersRef.current = masterFilters;
      
      // Add a small delay to prevent rapid successive API calls
      const timeoutId = setTimeout(() => {
        if (masterFilters && (masterFilters.parliament || masterFilters.assembly || masterFilters.district)) {
          console.log('Master filters changed, refetching data with filters:', masterFilters);
          fetchVoters(1, pagination?.itemsPerPage || 500, masterFilters);
        } else if (masterFilters && !masterFilters.parliament && !masterFilters.assembly && !masterFilters.district) {
          // If all master filters are cleared, fetch all data
          console.log('All master filters cleared, fetching all data');
          fetchVoters(1, pagination?.itemsPerPage || 500, {});
        }
      }, 300); // 300ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [masterFilters, fetchVoters, pagination?.itemsPerPage]);

  const handleUpdateData = useCallback((rowIndex: number, columnId: string, value: any) => {
    try {
      // Only update if we have actual data for this row
      const voter = data && data[rowIndex];
      if (!voter) {
        console.log(`Cannot update row ${rowIndex} - no data available`);
        return;
      }

      console.log(`Saving ${columnId} = "${value}" for voter ${voter.id} at row ${rowIndex}`);
      
      // Call the updateVoter function asynchronously (non-blocking)
      updateVoter(voter.id, { [columnId]: value }).then(() => {
        console.log(`Successfully updated ${columnId} for voter ${voter.id}`);
      }).catch((error) => {
        console.error('Error updating voter:', error);
      });
      
    } catch (error) {
      console.error('Error updating voter:', error);
    }
  }, [data, updateVoter]);

  // Memoize grid dimensions to avoid recalculation
  const gridDimensions = useMemo(() => {
    // Significantly reduce rows for much better performance
    const maxVisibleRows = Math.max(15, pagination?.itemsPerPage || 15);
    const maxRows = Math.max(maxVisibleRows, data?.length || 0);
    const maxCols = columnIds.length;
    return { maxRows, maxCols };
  }, [pagination?.itemsPerPage, data?.length, columnIds.length]);

  // Consolidated navigation function to prevent conflicts
  const navigateToCell = useCallback((fromRow: number, fromColumnId: string, toRow: number, toColumnId: string) => {
    console.log(`🎯 Navigation: [${fromRow}, ${fromColumnId}] → [${toRow}, ${toColumnId}]`);
    console.log(`📍 Column IDs:`, columnIds);
    console.log(`📍 From index:`, columnIds.indexOf(fromColumnId), `To index:`, columnIds.indexOf(toColumnId));
    
    // Immediate state updates for instant response
    setSelectedCell({ row: toRow, column: toColumnId });
    setFocusedCell({ row: toRow, column: toColumnId });
  }, [columnIds]);

  const handleUpdateAndNavigate = useCallback((rowIndex: number, columnId: string, value: any, navigationKey: string) => {
    try {
      // First save the data (non-blocking)
      handleUpdateData(rowIndex, columnId, value);
      
      // Use the consolidated navigation function
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
        console.log(`🔄 UpdateAndNavigate: ${columnId}[${currentColumnIndex}] → ${newColumnId}[${newCol}] | Row: ${rowIndex} → ${newRow}`);
        
        // Validate that the target cell exists
        if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
          navigateToCell(rowIndex, columnId, newRow, newColumnId);
        } else {
          console.error(`❌ Invalid navigation target in UpdateAndNavigate: [${newRow}, ${newCol}] - maxRows: ${maxRows}, maxCols: ${maxCols}`);
        }
      }
    } catch (error) {
      console.error('Error in updateAndNavigate:', error);
    }
  }, [handleUpdateData, columnIds, gridDimensions, navigateToCell]);

  // Throttle cell selection updates
  const throttleTimeoutRef = useRef<number | null>(null);
  
  const handleCellClick = useCallback((rowIndex: number, columnId: string) => {
    // Clear any pending throttled update
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
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
    const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId as keyof Voter] || '') : '';
    console.log(`Starting edit via double-click - rowIndex: ${rowIndex}, columnId: ${columnId}, currentValue: "${currentValue}"`);
    setEditValue(String(currentValue));
    setEditingCell({ row: rowIndex, column: columnId });
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
  }, [data]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (editingCell) return; // Don't handle navigation while editing

    const currentColumnIndex = columnIds.indexOf(columnId);
    const { maxRows, maxCols } = gridDimensions;
    
    // Debug logging to identify the issue
    console.log(`🔍 Navigation Debug:`, {
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
        console.log(`🔄 ArrowUp: Moving up from row ${rowIndex} to ${newRow}`);
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        console.log(`🔄 ArrowDown: Moving down from row ${rowIndex} to ${newRow}`);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentColumnIndex - 1);
        console.log(`🔄 ArrowLeft: Moving left from column ${currentColumnIndex} to ${newCol}`);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(maxCols - 1, currentColumnIndex + 1);
        console.log(`🔄 ArrowRight: Moving right from column ${currentColumnIndex} to ${newCol}`);
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          // Shift+Tab: Move to previous cell
          if (currentColumnIndex > 0) {
            newCol = currentColumnIndex - 1;
            console.log(`🔄 Shift+Tab: Moving left from column ${currentColumnIndex} to ${newCol}`);
          } else if (rowIndex > 0) {
            newCol = maxCols - 1;
            newRow = rowIndex - 1;
            console.log(`🔄 Shift+Tab: Moving up-left from [${rowIndex}, ${currentColumnIndex}] to [${newRow}, ${newCol}]`);
          }
        } else {
          // Tab: Move to next cell
          if (currentColumnIndex < maxCols - 1) {
            newCol = currentColumnIndex + 1;
            console.log(`🔄 Tab: Moving right from column ${currentColumnIndex} to ${newCol}`);
          } else if (rowIndex < maxRows - 1) {
            newCol = 0;
            newRow = rowIndex + 1;
            console.log(`🔄 Tab: Moving down-right from [${rowIndex}, ${currentColumnIndex}] to [${newRow}, ${newCol}]`);
          }
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'Enter':
        // SIMPLE: Enter key ONLY moves down, never edits
        console.log(`✅ ENTER KEY: Moving down from row ${rowIndex} to row ${Math.min(maxRows - 1, rowIndex + 1)}`);
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'F2':
        if (columnId !== 'select') {
          // Allow editing even for empty cells - get current value or empty string
          const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId as keyof Voter] || '') : '';
          console.log(`Starting edit via F2 key - rowIndex: ${rowIndex}, columnId: ${columnId}, currentValue: "${currentValue}"`);
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
      default:
        // REMOVED: No more "type to edit" - only F2 and double-click should edit
        break;
    }

    if (newRow !== rowIndex || newCol !== currentColumnIndex) {
      const newColumnId = columnIds[newCol];
      console.log(`🎯 Navigation Result: ${columnId}[${currentColumnIndex}] → ${newColumnId}[${newCol}] | Row: ${rowIndex} → ${newRow}`);
      
      // Validate that the target cell exists
      if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
        // Use the consolidated navigation function
        navigateToCell(rowIndex, columnId, newRow, newColumnId);
      } else {
        console.error(`❌ Invalid navigation target: [${newRow}, ${newCol}] - maxRows: ${maxRows}, maxCols: ${maxCols}`);
      }
    } else {
      console.log(`❌ No navigation occurred - staying at ${columnId}[${currentColumnIndex}]`);
    }
  }, [data, columnIds, editingCell, handleUpdateData, gridDimensions, navigateToCell]);

  const handleStopEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Optimized effect to focus the selected cell (immediate for better responsiveness)
  useEffect(() => {
    if (selectedCell && !editingCell) {
      const cellSelector = `[data-cell="${selectedCell.row}-${selectedCell.column}"]`;
      const cellElement = document.querySelector(cellSelector) as HTMLElement;
      console.log(`🔍 Focus Update: Looking for cell ${cellSelector}, found:`, cellElement);
      if (cellElement && cellElement !== document.activeElement) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          cellElement.focus();
          console.log(`✅ Focused cell: ${selectedCell.row}-${selectedCell.column}`);
        }, 0);
      } else if (!cellElement) {
        console.log(`❌ Cell not found: ${cellSelector}`);
      }
    }
  }, [selectedCell?.row, selectedCell?.column, editingCell]);

  // Effect to initialize first cell selection (only once)
  useEffect(() => {
    if (data && data.length > 0 && !selectedCell && !loading && columnIds.length > 0) {
      setSelectedCell({ row: 0, column: columnIds[0] });
      setFocusedCell({ row: 0, column: columnIds[0] });
    }
  }, [data?.length, selectedCell, loading, columnIds[0]]);

  // Optimized keyboard handler with direct cell reference
  const currentCellRef = useRef<{row: number, column: string} | null>(null);
  
  useEffect(() => {
    currentCellRef.current = selectedCell;
  }, [selectedCell]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const currentCell = currentCellRef.current;
      if (!currentCell || editingCell || !tableRef.current) return;
      
      // Quick check if focus is in table without expensive DOM query
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

  // Pre-compute the table body to ensure all hooks are called consistently
  const tableBody = useMemo(() => {
    // Calculate how many rows we need to fill the screen (Excel-like) - reduced for performance
    const maxVisibleRows = Math.max(15, pagination?.itemsPerPage || 15);
    const totalRows = loading ? maxVisibleRows : Math.max(maxVisibleRows, data?.length || 0);
    
    return Array.from({ length: totalRows }).map((_, index) => {
      const isDataRow = !loading && data && index < data.length;
      const rowData = isDataRow ? data[index] : null;
      
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
                <ExcelCell
                  value={
                    columnId === 'select' 
                      ? index + 1 
                      : isDataRow && rowData 
                        ? (rowData[columnId as keyof Voter] || '') 
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
              )}
            </td>
          ))}
        </tr>
      );
    });
  }, [data, loading, pagination?.itemsPerPage, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, columnIds, handleCellClick, handleCellDoubleClick, handleCellKeyDown, handleUpdateData, handleUpdateAndNavigate, setEditValue, handleStopEditing]);

  // Handle error and loading states after all hooks are called
  if (loading && !data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white h-screen w-full overflow-hidden relative" style={{ border: '1px solid #d1d5db' }}>
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
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-2 sm:space-y-0">
          <div className="text-center sm:text-left">
            Showing {loading || !pagination ? '...' : `${((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to ${Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of ${pagination.totalItems} entries`}
          </div>
          
          {/* Centered Pagination */}
          <div className="flex items-center justify-center space-x-1">
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination || pagination.currentPage <= 1 || loading}
              title="Previous"
            >
              &lt;
            </button>
            
            {/* Page numbers with ellipsis */}
            {(() => {
              if (!pagination) return null;
              const totalPages = pagination.totalPages;
              const currentPage = pagination.currentPage;
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
                    <span className="px-2 py-1 text-gray-400">......</span>
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
            
            {/* Items per page button */}
            <button 
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1 ml-4"
              onClick={() => console.log('Items per page clicked')}
              title="Items per page"
            >
              <span>{pagination.itemsPerPage}</span>
              <span>^</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 
