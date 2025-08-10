'use client';

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

// Interface for surname data
export interface SurnameData {
  id: number;
  surname: string;
  count: number;
  castId: string;
  castIda: string;
}

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
      } else if (e.key === 'Escape') {
        onStopEditing();
        e.preventDefault();
      } else if (e.key === 'Tab') {
        onUpdateAndNavigate(rowIndex, columnId, editValue, e.shiftKey ? 'ArrowLeft' : 'ArrowRight');
        onStopEditing();
        e.preventDefault();
      }
    } else {
      onCellKeyDown(e, rowIndex, columnId);
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
    header: 'Sr. No.',
    cell: ({ row }) => (
      <div className="flex items-center space-x-2 bg-gray-200 px-2 py-1">
        <span className="text-gray-800 font-medium">{row.index + 1}</span>
      </div>
    ),
    size: 80,
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
    accessorKey: 'castId',
    header: 'Cast ID',
    size: 150,
  },
  {
    accessorKey: 'castIda',
    header: 'Cast IDA',
    size: 150,
  },
];

interface SurnameDataTableProps {
  data: SurnameData[];
  loading: boolean;
  onUpdateSurname: (id: number, surnameData: Partial<SurnameData>) => Promise<void>;
}

export default function SurnameDataTable({ data, loading, onUpdateSurname }: SurnameDataTableProps) {
  // Excel-like state management
  const [selectedCell, setSelectedCell] = useState<{row: number, column: string} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<{row: number, column: string} | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const columnIds = useMemo(() => columns.map(col => {
    if (col.id) return col.id;
    if ('accessorKey' in col) return col.accessorKey as string;
    return 'unknown';
  }), []);

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
        setSelectedCell({ row: newRow, column: newColumnId });
        setFocusedCell({ row: newRow, column: newColumnId });
      }
    } catch (error) {
      console.error('Error in updateAndNavigate:', error);
    }
  }, [handleUpdateData, columnIds, gridDimensions]);

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
        e.preventDefault();
        break;
      case 'ArrowDown':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, currentColumnIndex - 1);
        e.preventDefault();
        break;
      case 'ArrowRight':
        newCol = Math.min(maxCols - 1, currentColumnIndex + 1);
        e.preventDefault();
        break;
      case 'Tab':
        if (e.shiftKey) {
          if (currentColumnIndex > 0) {
            newCol = currentColumnIndex - 1;
          } else if (rowIndex > 0) {
            newCol = maxCols - 1;
            newRow = rowIndex - 1;
          }
        } else {
          if (currentColumnIndex < maxCols - 1) {
            newCol = currentColumnIndex + 1;
          } else if (rowIndex < maxRows - 1) {
            newCol = 0;
            newRow = rowIndex + 1;
          }
        }
        e.preventDefault();
        break;
      case 'Enter':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
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
      
      setSelectedCell({ row: newRow, column: newColumnId });
      setFocusedCell({ row: newRow, column: newColumnId });
    } else {
      console.log(`❌ Surname: No navigation occurred - staying at ${columnId}[${currentColumnIndex}]`);
    }
  }, [data, columnIds, editingCell, handleUpdateData, gridDimensions]);

  const handleStopEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // Focus the selected cell
  useEffect(() => {
    if (selectedCell && !editingCell) {
      const cellElement = document.querySelector(`[data-cell="${selectedCell.row}-${selectedCell.column}"]`) as HTMLElement;
      if (cellElement && cellElement !== document.activeElement) {
        cellElement.focus();
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
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'F2'].includes(e.key)) {
        e.preventDefault();
        
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
    const maxVisibleRows = Math.max(15, data?.length || 15);
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
                <SurnameExcelCell
                  value={
                    columnId === 'select' 
                      ? index + 1 
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
              )}
            </td>
          ))}
        </tr>
      );
    });
  }, [data, loading, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, columnIds, handleCellClick, handleCellDoubleClick, handleCellKeyDown, handleUpdateData, handleUpdateAndNavigate, setEditValue, handleStopEditing]);

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
        <div className="flex justify-between items-center text-sm text-gray-700">
          <div>
            Showing {data?.length || 0} surname entries
          </div>
          <div className="text-gray-500">
            Total Surnames: {data?.length || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
