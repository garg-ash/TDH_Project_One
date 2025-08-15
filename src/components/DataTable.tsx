
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

// Define interfaces for type safety
interface DivisionDataItem {
  DIVISION_ID: string;
  DIVISION_ENG: string;
  DIVISION_CODE: string;
  DISTRICT_ENG: string;
  DISTRICT_CODE: string;
  PC_ENG: string;
  PC_CODE: string;
  AC_ENG: string;
  AC_CODE: string;
  AC_TOTAL_MANDAL: string;
  PC_SEAT: string;
  INC_Party_Zila: string;
  BJP_Party_Zila2: string;
}

interface Voter {
  id: string; // UI display ID (kept as-is)
  row_pk?: number; // DB primary key: id
  division_id?: string; // DB DIVISION_ID
  name: string;
  fname: string;
  mname: string;
  surname: string;
  mobile1: string;
  mobile2: string;
  age: string;
  date_of_birth: string;
  parliament: string;
  assembly: string;
  district: string;
  block: string;
  tehsil: string;
  village: string;
  cast_id: string;
  cast_ida: string;
}

// Excel-like Cell Component
interface ExcelCellProps {
  value: any;
  rowIndex: number;
  columnId: string;
  isSelected: boolean;
  isFocused: boolean;
  isEditing: boolean;
  isInSelectionRange: boolean;
  onCellClick: (rowIndex: number, columnId: string, event: React.MouseEvent) => void;
  onCellDoubleClick: (rowIndex: number, columnId: string) => void;
  onCellKeyDown: (e: React.KeyboardEvent, rowIndex: number, columnId: string) => void;
  onUpdate: (rowIndex: number, columnId: string, value: any) => Promise<void>;
  onUpdateAndNavigate: (rowIndex: number, columnId: string, value: any, navigationKey: string) => Promise<void>;
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
  isInSelectionRange,
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

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        console.log(`ExcelCell: Saving on Enter and navigating down - rowIndex: ${rowIndex}, columnId: ${columnId}, editValue: "${editValue}"`);
        console.log(`ExcelCell: Original value was: "${value}"`);
        try {
          console.log(`ExcelCell: Calling onUpdateAndNavigate with: rowIndex=${rowIndex}, columnId=${columnId}, value="${editValue}"`);
          await onUpdateAndNavigate(rowIndex, columnId, editValue, 'ArrowDown');
          console.log(`ExcelCell: onUpdateAndNavigate completed successfully`);
          onStopEditing();
        } catch (error) {
          console.error('Error saving on Enter:', error);
        }
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

  const handleBlur = async () => {
    if (isEditing) {
      console.log(`ExcelCell: Saving on Blur - rowIndex: ${rowIndex}, columnId: ${columnId}, editValue: "${editValue}"`);
      console.log(`ExcelCell: Original value was: "${value}"`);
      try {
        console.log(`ExcelCell: Calling onUpdate with: rowIndex=${rowIndex}, columnId=${columnId}, value="${editValue}"`);
        await onUpdate(rowIndex, columnId, editValue);
        console.log(`ExcelCell: onUpdate completed successfully`);
        onStopEditing();
      } catch (error) {
        console.error('Error saving on blur:', error);
        // Keep editing mode on error so user can fix
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    onCellClick(rowIndex, columnId, e);
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
        onClick={handleClick}
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

  // Excel-like selection styling with different colors for different selection states
  let selectionStyle = {};
  if (isSelected && !isEditing) {
    selectionStyle = {
      border: '2px solid #000000',
      zIndex: 1,
      position: 'relative' as const
    };
  } else if (isInSelectionRange && !isEditing) {
    selectionStyle = {
      backgroundColor: '#e3f2fd',
      border: '1px solid #2196f3',
      zIndex: 1,
      position: 'relative' as const
    };
  }

  return (
    <div 
      className={cellClasses}
      style={selectionStyle}
      onClick={handleClick}
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
        <div className="w-full flex items-center justify-between">
          <span className="truncate flex-1">
            {value || ''}
          </span>
          {loading && (
            <div className="ml-2 w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
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
    accessorKey: 'id',
    header: 'Family ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 180,
  },
  {
    accessorKey: 'fname',
    header: 'Father Name',
    size: 150,
  },
  {
    accessorKey: 'mname',
    header: 'Mother Name',
    size: 150,
  },
  {
    accessorKey: 'surname',
    header: 'Surname',
    size: 120,
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
    accessorKey: 'age',
    header: 'Age',
    size: 80,
  },
  {
    accessorKey: 'date_of_birth',
    header: 'DOB',
    size: 120,
  },
  {
    accessorKey: 'parliament',
    header: 'Parliament',
    size: 140,
  },
  {
    accessorKey: 'assembly',
    header: 'Assembly',
    size: 140,
  },
  {
    accessorKey: 'district',
    header: 'District',
    size: 120,
  },
  {
    accessorKey: 'block',
    header: 'Block',
    size: 120,
  },
  {
    accessorKey: 'tehsil',
    header: 'Tehsil',
    size: 120,
  },
  {
    accessorKey: 'village',
    header: 'Village',
    size: 140,
  },
  // {
  //   accessorKey: 'booth',
  //   header: 'Booth',
  //   size: 100,
  // },
  {
    accessorKey: 'cast_id',
    header: 'Cast ID',
    size: 100,
  },
  {
    accessorKey: 'cast_ida',
    header: 'Cast IDA',
    size: 120,
  },
];

function DataTable({ 
  masterFilters, 
  detailedFilters 
}: { 
  masterFilters?: { parliament?: string; assembly?: string; district?: string; block?: string };
  detailedFilters?: any;
}) {
  // Memoize the filters to prevent unnecessary re-renders
  const memoizedMasterFilters = useMemo(() => masterFilters, [JSON.stringify(masterFilters)]);
  const memoizedDetailedFilters = useMemo(() => detailedFilters, [JSON.stringify(detailedFilters)]);
  
  const [data, setData] = useState<Voter[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 500,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REMOVED: Unused states that were causing blinking

  const fetchDivisionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching data from div_dist_pc_ac API...');
      
      const response = await fetch('http://localhost:5002/api/div_dist_pc_ac');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const rawData = await response.text();
      console.log('Raw response data:', rawData);
      
      try {
        const apiData = JSON.parse(rawData);
        console.log('Parsed API data:', apiData);
        
        if (!Array.isArray(apiData)) {
          throw new Error('API data is not an array');
        }
        
        // Map API data to Voter interface (like DivisionDataTable does)
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.DIVISION_ID ?? index + 1),
          row_pk: typeof item.id === 'number' ? item.id : undefined,
          division_id: String(item.DIVISION_ID ?? ''),
          name: item.DIVISION_ENG || '',
            fname: item.DISTRICT_ENG || '',
            mname: item.PC_ENG || '',
            surname: item.AC_ENG || '',
            mobile1: item.PC_CODE || '',
            mobile2: item.AC_CODE || '',
            age: item.AC_TOTAL_MANDAL || '',
            date_of_birth: item.PC_SEAT || '',
            parliament: item.PC_ENG || '',
            assembly: item.AC_ENG || '',
            district: item.DISTRICT_ENG || '',
            block: item.INC_Party_Zila || '',
            tehsil: item.BJP_Party_Zila2 || '',
            village: item.DIVISION_CODE || '',
            cast_id: item.DISTRICT_CODE || '',
            cast_ida: item.AC_TOTAL_MANDAL || ''
          }));
        
        console.log('Mapped data:', mappedData);
        setData(mappedData);
        
        // Update pagination
        setPagination(prev => ({
          ...prev,
          totalItems: mappedData.length,
          totalPages: Math.ceil(mappedData.length / prev.itemsPerPage)
        }));
        
        console.log('Data set successfully, length:', mappedData.length);
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch data: ${errorMessage}`);
      setData([]);
      setLoading(false);
    }
  }, []); // FIXED: Remove dependencies to prevent infinite loops

  // FIXED: Stable memoization to prevent blinking
  const memoizedData = useMemo(() => data || [], [data]); // Depend on data to ensure updates are reflected

  // REMOVED: currentPageData is no longer needed since we show all data

  // Excel-like state management
  const [selectedCell, setSelectedCell] = useState<{row: number, column: string} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<{row: number, column: string} | null>(null);
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());
  
  // Multiple cell selection state
  const [selectionRange, setSelectionRange] = useState<{
    start: {row: number, column: string};
    end: {row: number, column: string};
  } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastShiftArrowTime, setLastShiftArrowTime] = useState(0);
  
  // Track successful updates to refresh data
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const tableRef = useRef<HTMLDivElement>(null);
  const previousMasterFiltersRef = useRef<typeof masterFilters | undefined>(undefined);

  // FIXED: Stable column IDs to prevent blinking
  const columnIds = useMemo(() => {
    const ids = columns.map(col => {
      if (col.id) return col.id;
      if ('accessorKey' in col) return col.accessorKey as string;
      return 'unknown';
    });
    return ids;
  }, []); // Empty dependency array since columns is static

  // Helper function to check if a cell is in selection range
  const isCellInSelectionRange = useCallback((rowIndex: number, columnId: string) => {
    if (!selectionRange) return false;
    
    const { start, end } = selectionRange;
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startColIndex = Math.min(columnIds.indexOf(start.column), columnIds.indexOf(end.column));
    const endColIndex = Math.max(columnIds.indexOf(start.column), columnIds.indexOf(end.column));
    
    return rowIndex >= startRow && rowIndex <= endRow && 
           columnIds.indexOf(columnId) >= startColIndex && columnIds.indexOf(columnId) <= endColIndex;
  }, [selectionRange, columnIds]);

  // Helper function to check if a cell is selected (using selectedCells set)
  const isCellSelected = useCallback((rowIndex: number, columnId: string) => {
    const cellKey = `${rowIndex}-${columnId}`;
    return selectedCells.has(cellKey);
  }, [selectedCells]);

  // Helper function to get selected cells count
  const getSelectedCellsCount = useCallback(() => {
    // Use selectedCells set for accurate count
    return selectedCells.size || 1;
  }, [selectedCells]);

  // Helper function to get sum of selected numeric cells
  const getSelectedCellsSum = useCallback(() => {
    if (selectedCells.size === 0) return null; // No cells selected
    
    let sum = 0;
    let count = 0;
    
    // Iterate through selected cells
    selectedCells.forEach(cellKey => {
      const [rowIndex, columnId] = cellKey.split('-');
      const rowIndexNum = parseInt(rowIndex);
      if (memoizedData[rowIndexNum]) {
        const value = memoizedData[rowIndexNum][columnId as keyof Voter];
        const numValue = parseFloat(String(value));
        if (!isNaN(numValue)) {
          sum += numValue;
          count++;
        }
      }
    });
    
    return count > 0 ? { sum, count, average: sum / count } : null;
  }, [selectedCells, memoizedData]);

  // Pagination handlers
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    // Reset to first cell of new page
    setSelectedCell({ row: 0, column: columnIds[0] });
    setFocusedCell({ row: 0, column: columnIds[0] });
  }, [columnIds]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page
    }));
    // Reset to first cell
    setSelectedCell({ row: 0, column: columnIds[0] });
    setFocusedCell({ row: 0, column: columnIds[0] });
  }, [columnIds]);

  // Effect to fetch data on component mount
  useEffect(() => {
    // Only fetch on mount, don't set previous data for initial load
    const initialFetch = async () => {
      try {
        setLoading(true);
        console.log('Initial data fetch...');
        
        const response = await fetch('http://localhost:5002/api/div_dist_pc_ac');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rawData = await response.text();
        console.log('Raw response data:', rawData);
        
        try {
          const apiData = JSON.parse(rawData);
          console.log('Initial data received:', apiData);
          
          if (!Array.isArray(apiData)) {
            throw new Error('API data is not an array');
          }
          
          // Map API data to Voter interface (like DivisionDataTable does)
          const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
            id: String(item.DIVISION_ID ?? index + 1),
            row_pk: typeof item.id === 'number' ? item.id : undefined,
            division_id: String(item.DIVISION_ID ?? ''),
            name: item.DIVISION_ENG || '',
            fname: item.DISTRICT_ENG || '',
            mname: item.PC_ENG || '',
            surname: item.AC_ENG || '',
            mobile1: item.PC_CODE || '',
            mobile2: item.AC_CODE || '',
            age: item.AC_TOTAL_MANDAL || '',
            date_of_birth: item.PC_SEAT || '',
            parliament: item.PC_ENG || '',
            assembly: item.AC_ENG || '',
            district: item.DISTRICT_ENG || '',
            block: item.INC_Party_Zila || '',
            tehsil: item.BJP_Party_Zila2 || '',
            village: item.DIVISION_CODE || '',
            cast_id: item.DISTRICT_CODE || '',
            cast_ida: item.AC_TOTAL_MANDAL || ''
          }));
          
          console.log('Initial mapped data:', mappedData);
          setData(mappedData);
          
          // Update pagination
          setPagination(prev => ({
            ...prev,
            totalItems: mappedData.length,
            totalPages: Math.ceil(mappedData.length / prev.itemsPerPage)
          }));
          
          console.log('Initial data set successfully, length:', mappedData.length);
        } catch (parseError) {
          console.error('JSON parsing error:', parseError);
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          throw new Error(`Failed to parse API response: ${errorMessage}`);
        }
        
        setLoading(false);
      } catch (error) {
        // console.error('Error fetching initial data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(`Failed to fetch initial data: ${errorMessage}`);
        setData([]);
        setLoading(false);
      }
    };
    
    initialFetch();
  }, []);

  // FIXED: Simplified filter effect to prevent blinking
  useEffect(() => {
    // Only refetch if we already have data and filters actually changed
    if (data.length > 0 && memoizedMasterFilters && Object.keys(memoizedMasterFilters).length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('Filters changed, refetching division data');
        fetchDivisionData();
      }, 500); // Increased delay to prevent rapid calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [memoizedMasterFilters, data.length, fetchDivisionData]);

  // Effect to refresh data after successful updates to ensure backend sync
  // DISABLED: User prefers no automatic refresh, only immediate cell updates
  // useEffect(() => {
  //   if (lastUpdateTime > 0) {
  //     // Add a small delay to allow backend to process the update
  //     const timeoutId = setTimeout(() => {
  //       console.log('🔄 Refreshing data to ensure backend sync...');
  //       setIsRefreshing(true);
  //       fetchDivisionData().finally(() => {
  //         setIsRefreshing(false);
  //       });
  //     }, 1000); // 1 second delay
  //     
  //     return () => clearTimeout(timeoutId);
  //   }
  // }, [lastUpdateTime, fetchDivisionData]);

  const handleUpdateData = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    const cellKey = `${rowIndex}-${columnId}`;
    
    try {
      // Set loading state for this cell
      setUpdatingCells(prev => new Set(prev).add(cellKey));
      
      // Only update if we have actual data for this row
      const voter = memoizedData && memoizedData[rowIndex];
      if (!voter) {
        // console.log(`Cannot update row ${rowIndex} - no data available`);
        return;
      }

      console.log(`Saving ${columnId} = "${value}" for voter ${voter.id} at row ${rowIndex}`);
      
      // Determine primary key for update: prefer DB primary key 'id', fallback to DIVISION_ID
      const recordId = (voter.row_pk != null ? String(voter.row_pk) : (voter.division_id || '')).trim();
      if (!recordId) {
        // console.error('❌ Missing primary key (id or DIVISION_ID) for this row, aborting update', { voter });
        alert('Cannot update this row: missing id/DIVISION_ID from API');
        return;
      }
      
      // Map frontend column IDs to backend column names
      const columnMapping: { [key: string]: string } = {
        'id': 'DIVISION_ID',
        'name': 'DIVISION_ENG',
        'fname': 'DISTRICT_ENG',
        'mname': 'PC_ENG',
        'surname': 'AC_ENG',
        'mobile1': 'PC_CODE',
        'mobile2': 'AC_CODE',
        'age': 'AC_TOTAL_MANDAL',
        'date_of_birth': 'PC_SEAT',
        'parliament': 'PC_ENG',
        'assembly': 'AC_ENG',
        'district': 'DISTRICT_ENG',
        'block': 'INC_Party_Zila',
        'tehsil': 'BJP_Party_Zila2',
        'village': 'DIVISION_CODE',
        'cast_id': 'DISTRICT_CODE',
        'cast_ida': 'AC_TOTAL_MANDAL'
      };
      
      const backendColumnName = columnMapping[columnId];
      if (!backendColumnName) {
        console.error(`No mapping found for column: ${columnId}`);
        return;
      }
      
      // Call the backend API to update the data
      console.log('🔧 Sending update request to backend:', {
        url: `http://localhost:5002/api/div_dist_pc_ac/${recordId}`,
        method: 'PUT',
        body: {
          columnName: backendColumnName,
          value: value
        }
      });
      
      const response = await fetch(`http://localhost:5002/api/div_dist_pc_ac/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnName: backendColumnName,
          value: value
        }),
      });
      
      console.log('🔧 Backend response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Successfully updated ${columnId} for voter ${voter.id}:`, result);
      
      // Update the local state to reflect the change immediately
      console.log('🔄 Updating frontend data...');
      setData(prevData => {
        const newData = prevData.map((item, index) => 
          index === rowIndex 
            ? { ...item, [columnId]: value }
            : item
        );
        console.log('✅ Frontend data updated:', newData[rowIndex]);
        return newData;
      });
      

      

      
    } catch (error) {
      console.error('Error updating voter:', error);
      // Show error to user
      alert(`Error updating data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Remove loading state for this cell
      setUpdatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  }, [memoizedData]);

  // Memoize grid dimensions to avoid recalculation
  const gridDimensions = useMemo(() => {
    // Significantly reduce rows for much better performance
    const maxVisibleRows = Math.max(15, pagination?.itemsPerPage || 15);
    const maxRows = Math.max(maxVisibleRows, memoizedData?.length || 0);
    const maxCols = columnIds.length;
    return { maxRows, maxCols };
  }, [pagination?.itemsPerPage, memoizedData?.length, columnIds.length]);

  // Consolidated navigation function to prevent conflicts
  const navigateToCell = useCallback((fromRow: number, fromColumnId: string, toRow: number, toColumnId: string) => {
    console.log(`🎯 Navigation: [${fromRow}, ${fromColumnId}] → [${toRow}, ${toColumnId}]`);
    console.log(`📍 Column IDs:`, columnIds);
    console.log(`📍 From index:`, columnIds.indexOf(fromColumnId), `To index:`, columnIds.indexOf(toColumnId));
    
    // Immediate state updates for instant response
    setSelectedCell({ row: toRow, column: toColumnId });
    setFocusedCell({ row: toRow, column: toColumnId });
  }, [columnIds]);

  const handleUpdateAndNavigate = useCallback(async (rowIndex: number, columnId: string, value: any, navigationKey: string) => {
    try {
      // First save the data (await the update)
      await handleUpdateData(rowIndex, columnId, value);
      
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
  
  const handleCellClick = useCallback((rowIndex: number, columnId: string, event: React.MouseEvent) => {
    // Clear any pending throttled update
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    // Handle multiple cell selection with Shift key (Excel-like behavior)
    if (event.shiftKey && selectedCell) {
      // Add the clicked cell to selected cells set
      const clickedCellKey = `${rowIndex}-${columnId}`;
      setSelectedCells(prev => new Set([...prev, clickedCellKey]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      console.log(`🔄 Shift+Click: Added cell [${rowIndex}, ${columnId}] to selection`);
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: Add to existing selection (individual cell selection)
      const clickedCellKey = `${rowIndex}-${columnId}`;
      setSelectedCells(prev => new Set([...prev, clickedCellKey]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      console.log(`🔄 Ctrl+Click: Added cell [${rowIndex}, ${columnId}] to selection`);
    } else {
      // Normal click: Clear previous selection and select new cell
      setSelectedCells(new Set([`${rowIndex}-${columnId}`]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      console.log(`🔄 Normal Click: Selected cell [${rowIndex}, ${columnId}]`);
    }
    
    if (editingCell) {
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, selectedCell]);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnId: string) => {
    if (columnId === 'select') return; // Don't edit row numbers
    
    // Allow editing even for empty cells - get current value or empty string
    const currentValue = (memoizedData && memoizedData[rowIndex]) ? (memoizedData[rowIndex]?.[columnId as keyof Voter] || '') : '';
    console.log(`Starting edit via double-click - rowIndex: ${rowIndex}, columnId: ${columnId}, currentValue: "${currentValue}"`);
    setEditValue(String(currentValue));
    setEditingCell({ row: rowIndex, column: columnId });
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
  }, [memoizedData]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (editingCell) return; // Don't handle navigation while editing

    const currentColumnIndex = columnIds.indexOf(columnId);
    const { maxRows, maxCols } = gridDimensions;
    
    // Debug logging to identify the issue
    console.log(`🔍 Navigation Debug:`, {
      key: e.key,
      columnId,
      currentColumnIndex,
      columnIds: columnIds.join(', '),
      maxCols,
      maxRows
    });
    
    // Additional debug for column ID matching
    console.log(`🔍 Column ID Debug:`, {
      columnId,
      columnIdType: typeof columnId,
      columnIdsArray: columnIds,
      foundIndex: currentColumnIndex,
      isValidIndex: currentColumnIndex >= 0
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
          const currentValue = (memoizedData && memoizedData[rowIndex]) ? (memoizedData[rowIndex]?.[columnId as keyof Voter] || '') : '';
          console.log(`Starting edit via F2 key - rowIndex: ${rowIndex}, columnId: ${columnId}, currentValue: "${currentValue}"`);
          setEditValue(String(currentValue));
          setEditingCell({ row: rowIndex, column: columnId });
          setSelectedCell({ row: rowIndex, column: columnId });
          setFocusedCell({ row: rowIndex, column: columnId });
        }
        e.preventDefault();
        break;
      case 'F2':
        if (columnId !== 'select') {
          // Allow editing even for empty cells - get current value or empty string
          const currentValue = (memoizedData && memoizedData[rowIndex]) ? (memoizedData[rowIndex]?.[columnId as keyof Voter] || '') : '';
          console.log(`Starting edit via F2 key - rowIndex: ${rowIndex}, columnId: ${columnId}, currentValue: "${currentValue}"`);
          setEditValue(String(currentValue));
          setEditingCell({ row: rowIndex, column: columnId });
          setSelectedCell({ row: rowIndex, column: columnId });
          setFocusedCell({ row: rowIndex, column: columnId });
        }
        e.preventDefault();
        break;
      case 'Escape':
        // Clear selection range and keep only the current cell selected
        if (selectionRange) {
          setSelectionRange(null);
          console.log(`🔄 Escape: Cleared selection range`);
        }
        e.preventDefault();
        break;
      case 'a':
        // Ctrl+A: Select all cells
        if (e.ctrlKey || e.metaKey) {
          setSelectionRange({
            start: { row: 0, column: columnIds[0] },
            end: { row: Math.max(0, (memoizedData?.length || 1) - 1), column: columnIds[columnIds.length - 1] }
          });
          console.log(`🔄 Ctrl+A: Selected all cells`);
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 'c':
        // Ctrl+C: Copy selected cells
        if (e.ctrlKey || e.metaKey) {
          if (selectionRange) {
            const { start, end } = selectionRange;
            const startRow = Math.min(start.row, end.row);
            const endRow = Math.max(start.row, end.row);
            const startColIndex = Math.min(columnIds.indexOf(start.column), columnIds.indexOf(end.column));
            const endColIndex = Math.max(columnIds.indexOf(start.column), columnIds.indexOf(end.column));
            
            let csvData = '';
            
            // Add headers
            for (let col = startColIndex; col <= endColIndex; col++) {
              const columnId = columnIds[col];
              if (columnId) {
                csvData += (col > startColIndex ? '\t' : '') + columnId;
              }
            }
            csvData += '\n';
            
            // Add data rows
            for (let row = startRow; row <= endRow; row++) {
              for (let col = startColIndex; col <= endColIndex; col++) {
                const columnId = columnIds[col];
                if (columnId && memoizedData[row]) {
                  const value = memoizedData[row][columnId as keyof Voter] || '';
                  csvData += (col > startColIndex ? '\t' : '') + value;
                }
              }
              csvData += '\n';
            }
            
            navigator.clipboard.writeText(csvData).then(() => {
              console.log(`🔄 Ctrl+C: Copied ${getSelectedCellsCount()} cells to clipboard`);
            }).catch(err => {
              console.error('Failed to copy to clipboard:', err);
            });
          }
          e.preventDefault();
          e.stopPropagation();
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (columnId !== 'select') {
          handleUpdateData(rowIndex, columnId, '');
        }
        e.preventDefault();
        break;
      default:
        // Handle Shift + Arrow keys for range selection
        if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          // Add throttling to prevent rapid selection changes
          const now = Date.now();
          if (now - lastShiftArrowTime < 100) { // 100ms throttle
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setLastShiftArrowTime(now);
          
          // Debug: Log the current state
          console.log(`🔍 Shift+Arrow Debug:`, {
            rowIndex,
            columnId,
            currentColumnIndex,
            columnIds: columnIds.join(', '),
            key: e.key
          });
          
          let targetRow = rowIndex;
          let targetCol = currentColumnIndex;
          
          switch (e.key) {
            case 'ArrowUp':
              targetRow = Math.max(0, rowIndex - 1);
              break;
            case 'ArrowDown':
              targetRow = Math.min((memoizedData?.length || 1) - 1, rowIndex + 1);
              break;
            case 'ArrowLeft':
              targetCol = Math.max(0, currentColumnIndex - 1);
              break;
            case 'ArrowRight':
              targetCol = Math.min(columnIds.length - 1, currentColumnIndex + 1);
              break;
          }
          
          console.log(`🎯 Target calculation:`, {
            targetRow,
            targetCol,
            currentColumnIndex,
            columnIdsLength: columnIds.length
          });
          
          if (targetRow !== rowIndex || targetCol !== currentColumnIndex) {
            const targetColumnId = columnIds[targetCol];
            if (targetColumnId) {
              // Add the target cell to selected cells set
              const targetCellKey = `${targetRow}-${targetColumnId}`;
              setSelectedCells(prev => new Set([...prev, targetCellKey]));
              
              // Update the focused cell
              setSelectedCell({ row: targetRow, column: targetColumnId });
              setFocusedCell({ row: targetRow, column: targetColumnId });
              console.log(`🔄 Shift+Arrow: Moving from [${rowIndex}, ${columnId}] to [${targetRow}, ${targetColumnId}]`);
              console.log(`📍 Current column index: ${currentColumnIndex}, Target column index: ${targetCol}`);
              console.log(`📍 Column IDs: ${columnIds.join(', ')}`);
            }
          }
          e.preventDefault();
          e.stopPropagation();
        }
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
  }, [memoizedData, columnIds, editingCell, handleUpdateData, gridDimensions, navigateToCell, selectedCells]);

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
    if (memoizedData && memoizedData.length > 0 && !selectedCell && !loading && columnIds.length > 0) {
      setSelectedCell({ row: 0, column: columnIds[0] });
      setFocusedCell({ row: 0, column: columnIds[0] });
    }
  }, [memoizedData?.length, selectedCell, loading, columnIds[0]]);

  // Optimized keyboard handler with direct cell reference
  const currentCellRef = useRef<{row: number, column: string} | null>(null);
  
  useEffect(() => {
    currentCellRef.current = selectedCell;
  }, [selectedCell]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Handle global shortcuts that work from anywhere in the table
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            // Ctrl+A: Select all cells
            e.preventDefault();
            e.stopPropagation();
            const allCells = new Set<string>();
            for (let row = 0; row < (memoizedData?.length || 0); row++) {
              for (let col = 0; col < columnIds.length; col++) {
                allCells.add(`${row}-${columnIds[col]}`);
              }
            }
            setSelectedCells(allCells);
            console.log(`🔄 Global Ctrl+A: Selected ${allCells.size} cells`);
            return;
            
          case 'c':
            // Ctrl+C: Copy selected cells
            e.preventDefault();
            e.stopPropagation();
            if (selectedCells.size > 0) {
              // Group selected cells by row for proper CSV format
              const rowsMap = new Map<number, Map<string, any>>();
              
              selectedCells.forEach(cellKey => {
                const [rowIndex, columnId] = cellKey.split('-');
                const rowIndexNum = parseInt(rowIndex);
                if (!rowsMap.has(rowIndexNum)) {
                  rowsMap.set(rowIndexNum, new Map());
                }
                if (memoizedData[rowIndexNum]) {
                  rowsMap.get(rowIndexNum)!.set(columnId, memoizedData[rowIndexNum][columnId as keyof Voter] || '');
                }
              });
              
              // Get unique column IDs for headers
              const allColumnIds = new Set<string>();
              selectedCells.forEach(cellKey => {
                const [, columnId] = cellKey.split('-');
                allColumnIds.add(columnId);
              });
              const sortedColumnIds = Array.from(allColumnIds).sort((a, b) => columnIds.indexOf(a) - columnIds.indexOf(b));
              
              let csvData = '';
              
              // Add headers
              sortedColumnIds.forEach((columnId, index) => {
                csvData += (index > 0 ? '\t' : '') + columnId;
              });
              csvData += '\n';
              
              // Add data rows
              const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);
              sortedRows.forEach(rowIndex => {
                const rowData = rowsMap.get(rowIndex)!;
                sortedColumnIds.forEach((columnId, index) => {
                  const value = rowData.get(columnId) || '';
                  csvData += (index > 0 ? '\t' : '') + value;
                });
                csvData += '\n';
              });
              
              navigator.clipboard.writeText(csvData).then(() => {
                console.log(`🔄 Global Ctrl+C: Copied ${getSelectedCellsCount()} cells to clipboard`);
                // Show a brief success message
                alert(`✅ Copied ${getSelectedCellsCount()} cells to clipboard!`);
              }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                alert('❌ Failed to copy to clipboard');
              });
            } else {
              alert('❌ No cells selected. Please select cells first.');
            }
            return;
        }
      }
      
      // Handle Shift + Arrow keys for range selection (global)
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentCell = currentCellRef.current;
        if (currentCell && !editingCell) {
          // Add throttling to prevent rapid selection changes
          const now = Date.now();
          if (now - lastShiftArrowTime < 100) { // 100ms throttle
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setLastShiftArrowTime(now);
          
          e.preventDefault();
          e.stopPropagation();
          
          const currentColumnIndex = columnIds.indexOf(currentCell.column);
          let targetRow = currentCell.row;
          let targetCol = currentColumnIndex;
          
          switch (e.key) {
            case 'ArrowUp':
              targetRow = Math.max(0, currentCell.row - 1);
              break;
            case 'ArrowDown':
              targetRow = Math.min((memoizedData?.length || 1) - 1, currentCell.row + 1);
              break;
            case 'ArrowLeft':
              targetCol = Math.max(0, currentColumnIndex - 1);
              break;
            case 'ArrowRight':
              targetCol = Math.min(columnIds.length - 1, currentColumnIndex + 1);
              break;
          }
          
          if (targetRow !== currentCell.row || targetCol !== currentColumnIndex) {
            const targetColumnId = columnIds[targetCol];
            if (targetColumnId) {
              // Add the target cell to selected cells set
              const targetCellKey = `${targetRow}-${targetColumnId}`;
              setSelectedCells(prev => new Set([...prev, targetCellKey]));
              
              // Update the focused cell
              setSelectedCell({ row: targetRow, column: targetColumnId });
              setFocusedCell({ row: targetRow, column: targetColumnId });
              console.log(`🔄 Global Shift+Arrow: Moving from [${currentCell.row}, ${currentCell.column}] to [${targetRow}, ${targetColumnId}]`);
              console.log(`📍 Current column index: ${currentColumnIndex}, Target column index: ${targetCol}`);
              console.log(`📍 Column IDs: ${columnIds.join(', ')}`);
            }
          }
          return;
        }
      }
      
      // Handle other global keys
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
  }, [editingCell, handleCellKeyDown, selectionRange, columnIds, memoizedData, getSelectedCellsCount]);

  // FIXED: Use stable columns and data to prevent blinking
  const displayColumnsForTable = columns;
  const displayDataForTable = memoizedData;

  const table = useReactTable({
    data: displayDataForTable,
    columns: displayColumnsForTable,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // Pre-compute the table body to ensure all hooks are called consistently
  const tableBody = useMemo(() => {
    // FIXED: Use full data like DivisionDataTable, not paginated data
    const displayData = memoizedData;
    const displayColumns = columns;
    const displayColumnIds = displayColumns.map(col => {
      if (col.id) return col.id;
      if ('accessorKey' in col) return col.accessorKey as string;
      return 'unknown';
    });
    
    // FIXED: Show EXACTLY the number of rows as data length - NO EXTRA ROWS
    const totalRows = displayData?.length || 0;
    
    // Debug logging
    console.log('🔍 Table Body Debug:', {
      loading,
      memoizedDataLength: memoizedData?.length,
      displayDataLength: displayData?.length,
      totalRows,
      displayColumnIds,
      firstRowData: displayData?.[0]
    });
    
    // FIXED: Use simple map like DivisionDataTable - NO DATA REPETITION
    return displayData.map((rowData, index) => {
      return (
        <tr key={`row-${index}`} style={{ height: '28px' }}>
          {displayColumnIds.map((columnId, cellIndex) => (
            <td
              key={`${index}-${columnId}`}
              className="border-r border-gray-300 border-b border-gray-300 p-0"
              style={{ 
                width: displayColumns[cellIndex]?.size, 
                minWidth: displayColumns[cellIndex]?.size,
                height: '28px'
              }}
            >
              {loading ? (
                <div className={`h-6 animate-pulse ${cellIndex === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}></div>
              ) : (
                <ExcelCell
                  value={
                    columnId === 'select' 
                      ? index + 1 // FIXED: Simple sequential numbering like DivisionDataTable
                      : rowData[columnId as keyof Voter] || '' // FIXED: Direct data access, no repetition
                  }
                  rowIndex={index}
                  columnId={columnId}
                  isSelected={selectedCell?.row === index && selectedCell?.column === columnId}
                  isFocused={focusedCell?.row === index && focusedCell?.column === columnId}
                  isEditing={editingCell?.row === index && editingCell?.column === columnId}
                  isInSelectionRange={isCellSelected(index, columnId)}
                  onCellClick={handleCellClick}
                  onCellDoubleClick={handleCellDoubleClick}
                  onCellKeyDown={handleCellKeyDown}
                  onUpdate={handleUpdateData}
                  onUpdateAndNavigate={handleUpdateAndNavigate}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStopEditing={handleStopEditing}
                  loading={updatingCells.has(`${index}-${columnId}`)}
                />
              )}
            </td>
          ))}
        </tr>
      );
    });
  }, [memoizedData, loading, columns, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, columnIds, isCellInSelectionRange, handleCellClick, handleCellDoubleClick, handleCellKeyDown, handleUpdateData, handleUpdateAndNavigate, setEditValue, handleStopEditing]);

  // Function to refresh data
  const fetchDataAgain = () => {
    fetch('http://localhost:5002/api/div_dist_pc_ac')
      .then(res => res.json())
      .then((apiData: any[]) => {
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.DIVISION_ID ?? index + 1),
          division_id: String(item.DIVISION_ID ?? ''),
          name: item.DIVISION_ENG || '',
          fname: item.DISTRICT_ENG || '',
          mname: item.PC_ENG || '',
          surname: item.AC_ENG || '',
          mobile1: item.PC_CODE || '',
          mobile2: item.AC_CODE || '',
          age: item.AC_TOTAL_MANDAL || '',
          date_of_birth: item.PC_SEAT || '',
          parliament: item.PC_ENG || '',
          assembly: item.AC_ENG || '',
          district: item.DISTRICT_ENG || '',
          block: item.INC_Party_Zila || '',
          tehsil: item.BJP_Party_Zila2 || '',
          village: item.DIVISION_CODE || '',
          cast_id: item.DISTRICT_CODE || '',
          cast_ida: item.AC_TOTAL_MANDAL || ''
        }));
        setData(mappedData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  // Handle edit function
  const handleEdit = (rowId: number, fieldName: string, newValue: string) => {
    // Map frontend field names to backend column names
    const columnMapping: { [key: string]: string } = {
      'name': 'DIVISION_ENG',
      'fname': 'DISTRICT_ENG',
      'mname': 'PC_ENG',
      'surname': 'AC_ENG',
      'district': 'DISTRICT_ENG',
      'block': 'INC_Party_Zila'
    };
    
    const backendColumnName = columnMapping[fieldName] || fieldName;
    
    fetch(`http://localhost:5002/api/div_dist_pc_ac/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        columnName: backendColumnName,
        value: newValue 
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      console.log('✅ Data updated successfully');
      fetchDataAgain(); // Refresh data
    })
    .catch(error => {
      console.error('Error updating data:', error);
      alert(`Error updating data: ${error.message}`);
    });
  };

  // Handle error and loading states after all hooks are called
  if (loading && !memoizedData.length) {
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
            {loading ? (
              'Loading...'
            ) : (
              `Showing ${memoizedData.length} entries`
            )}
            <button 
              onClick={fetchDivisionData}
              className="ml-4 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors cursor-pointer"
              disabled={loading}
              title="Refresh data"
            >
              {loading ? '🔄' : '🔄'} Refresh
            </button>
            
            {/* Test Update Button */}
            <button 
              onClick={() => {
                if (memoizedData.length > 0) {
                  console.log('🧪 Testing update with first row...');
                  handleUpdateData(0, 'name', 'TEST UPDATE ' + new Date().toLocaleTimeString());
                }
              }}
              className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors cursor-pointer"
              disabled={loading || memoizedData.length === 0}
              title="Test update"
            >
              🧪 Test Update
            </button>
            
            {/* Copy Selected Cells Button */}
            <button 
              onClick={() => {
                if (selectedCells.size > 0) {
                  // Group selected cells by row for proper CSV format
                  const rowsMap = new Map<number, Map<number, any>>();
                  
                  selectedCells.forEach(cellKey => {
                    const [rowIndex, colIndex] = cellKey.split('-').map(Number);
                    if (!rowsMap.has(rowIndex)) {
                      rowsMap.set(rowIndex, new Map());
                    }
                    const columnId = columnIds[colIndex];
                    if (columnId && memoizedData[rowIndex]) {
                      rowsMap.get(rowIndex)!.set(colIndex, memoizedData[rowIndex][columnId as keyof Voter] || '');
                    }
                  });
                  
                  // Get min and max column indices for headers
                  const allColIndices = Array.from(selectedCells).map(cellKey => parseInt(cellKey.split('-')[1]));
                  const minColIndex = Math.min(...allColIndices);
                  const maxColIndex = Math.max(...allColIndices);
                  
                  let csvData = '';
                  
                  // Add headers
                  for (let col = minColIndex; col <= maxColIndex; col++) {
                    const columnId = columnIds[col];
                    if (columnId) {
                      csvData += (col > minColIndex ? '\t' : '') + columnId;
                    }
                  }
                  csvData += '\n';
                  
                  // Add data rows
                  const sortedRows = Array.from(rowsMap.keys()).sort((a, b) => a - b);
                  sortedRows.forEach(rowIndex => {
                    const rowData = rowsMap.get(rowIndex)!;
                    for (let col = minColIndex; col <= maxColIndex; col++) {
                      const value = rowData.get(col) || '';
                      csvData += (col > minColIndex ? '\t' : '') + value;
                    }
                    csvData += '\n';
                  });
                  
                  navigator.clipboard.writeText(csvData).then(() => {
                    console.log(`🔄 Copy Button: Copied ${getSelectedCellsCount()} cells to clipboard`);
                    alert(`✅ Copied ${getSelectedCellsCount()} cells to clipboard!`);
                  }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    alert('❌ Failed to copy to clipboard');
                  });
                } else {
                  alert('❌ No cells selected. Please select cells first.');
                }
              }}
              className="ml-2 px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors cursor-pointer"
              disabled={selectedCells.size === 0}
              title="Copy selected cells (Ctrl+C)"
            >
              📋 Copy Selected
            </button>
            
            {/* Manual Sync Button - More prominent since auto-sync is disabled */}
            <button 
              onClick={() => {
                setIsRefreshing(true);
                fetchDivisionData().finally(() => {
                  setIsRefreshing(false);
                });
              }}
              className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors cursor-pointer font-medium"
              disabled={isRefreshing}
              title="Manual sync with backend (auto-sync disabled)"
            >
              {isRefreshing ? '🔄 Syncing...' : '🔄 Sync Data'}
            </button>
          </div>
          
          {/* Centered Pagination */}
          <div className="flex items-center justify-center space-x-1">
            {/* Removed refetching indicator to prevent blinking */}
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
          
                        {/* Next page icon > */}
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700"
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination || pagination.currentPage >= pagination.totalPages || loading}
              title="Next page"
            >
              &gt;
            </button>
            
            {/* Items per page dropdown */}
            <div className="flex items-center space-x-1 ml-2">
              <span className="text-xs text-gray-600">Show:</span>
              <select
                value={pagination.itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
                <option value={1000}>1000</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Excel-like Selection Info Bar */}
        <div className="mt-2 text-center text-xs text-gray-600">
          {selectedCells.size > 0 ? (
            <span>
              Selected: {getSelectedCellsCount()} cells
              {(() => {
                const sumData = getSelectedCellsSum();
                return sumData ? ` | Sum: ${sumData.sum.toFixed(2)} | Avg: ${sumData.average.toFixed(2)}` : '';
              })()}
            </span>
          ) : selectedCell ? (
            <span>Selected: 1 cell | Row {selectedCell.row + 1} | Col {columnIds.indexOf(selectedCell.column) + 1}</span>
          ) : (
            <span>No cells selected</span>
          )}
          
          {/* Data Sync Status */}
          {isRefreshing && (
            <span className="ml-4 text-blue-600">
              🔄 Syncing with backend...
            </span>
          )}
        </div>
        
        {/* Keyboard Shortcuts Help */}
        <div className="mt-1 text-center text-xs text-gray-500">
          <span className="mr-4">⌨️ <strong>Shift + Arrow Keys</strong>: Extend selection</span>
          <span className="mr-4">⌨️ <strong>Ctrl + A</strong>: Select all</span>
          <span className="mr-4">⌨️ <strong>Ctrl + C</strong>: Copy selected</span>
          <span>⌨️ <strong>Escape</strong>: Clear selection</span>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DataTable);