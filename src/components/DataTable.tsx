
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';

// Add CSS for copy blink effect
const copyBlinkCSS = `
  .copy-blink-effect {
    animation: copyBlink 0.3s ease-in-out;
    background-color: #dbeafe !important;
    border: 2px solid #3b82f6 !important;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
    z-index: 1000 !important;
  }
  
  @keyframes copyBlink {
    0% { 
      opacity: 1; 
      transform: scale(1); 
      background-color: #dbeafe !important;
      border: 2px solid #3b82f6 !important;
    }
    50% { 
      opacity: 0.7; 
      transform: scale(1.02); 
      background-color: #93c5fd !important;
      border: 2px solid #1d4ed8 !important;
    }
    100% { 
      opacity: 1; 
      transform: scale(1); 
      background-color: #dbeafe !important;
      border: 2px solid #3b82f6 !important;
    }
  }
`;

// Inject CSS with better error handling
if (typeof document !== 'undefined') {
  try {
    // Check if style already exists
    let existingStyle = document.getElementById('copy-blink-css');
    if (!existingStyle) {
      const style = document.createElement('style');
      style.id = 'copy-blink-css';
      style.textContent = copyBlinkCSS;
      document.head.appendChild(style);
      console.log('✅ Copy blink CSS injected successfully');
    }
  } catch (error) {
    console.error('❌ Failed to inject copy blink CSS:', error);
  }
}
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
  isCopyBlinking?: boolean;
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
  loading = false,
  isCopyBlinking = false
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
        try {
          await onUpdateAndNavigate(rowIndex, columnId, editValue, 'ArrowDown');
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
      try {
        await onUpdate(rowIndex, columnId, editValue);
        onStopEditing();
      } catch (error) {
        console.error('Error saving on blur:', error);
        // Keep editing mode on error so user can fix
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    // Direct editing: Click to edit immediately (like Excel)
    if (columnId !== 'select') {
      const currentValue = (value || '').toString();
      setEditValue(currentValue);
      onCellClick(rowIndex, columnId, e);
      // Start editing immediately
      onCellDoubleClick(rowIndex, columnId);
    } else {
      onCellClick(rowIndex, columnId, e);
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
    ${isCopyBlinking && (isSelected || isInSelectionRange) ? 'copy-blink-effect' : ''}
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
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData('text');
            setEditValue(pastedText);
          }}
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
    accessorKey: 'division_id',
    header: 'Family ID',
    size: 120,
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

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): string => {
  if (!dateOfBirth) return '';
  
  try {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return '';
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age.toString();
  } catch (error) {
    return '';
  }
};

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
  const [pagination, setPagination] = useState<{
    currentPage: number;
    itemsPerPage: number;
    totalItems: number | string;
    totalPages: number;
  }>({
    currentPage: 1,
    itemsPerPage: 1000, // Show 1000 rows per page as requested
    totalItems: 0,
    totalPages: 0,
  });
  const [goToPageInput, setGoToPageInput] = useState<string>('1');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // REMOVED: Unused states that were causing blinking

  const fetchDivisionData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use pagination for better performance
      const page = pagination.currentPage;
      const limit = pagination.itemsPerPage;
      
      // Build API URL with filters
      let apiUrl = `http://localhost:5002/api/area_mapping?page=${page}&limit=${limit}`;
      
      // Add master filters to API call
      if (memoizedMasterFilters) {
        if (memoizedMasterFilters.parliament) {
          apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
        }
        if (memoizedMasterFilters.assembly) {
          apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
        }
        if (memoizedMasterFilters.district) {
          apiUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
        }
        if (memoizedMasterFilters.block) {
          apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
        }
      }
      
      // Add detailed filters to API call
      if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
        Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
          if (value && value !== '') {
            apiUrl += `&${key}=${encodeURIComponent(String(value))}`;
          }
        });
      }
      
      console.log('🔍 Fetching data with filters:', { masterFilters: memoizedMasterFilters, detailedFilters: memoizedDetailedFilters, apiUrl });
      
      // Log the actual request being made
      console.log('🌐 Making API request to:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const rawData = await response.text();
      
      try {
        const apiData = JSON.parse(rawData);
        
        if (!Array.isArray(apiData)) {
          console.error('❌ API data is not an array:', apiData);
          throw new Error('API data is not an array');
        }
        
        // Map API data to Voter interface (correct mapping for area_mapping API)
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.id ?? index + 1),
          row_pk: typeof item.id === 'number' ? item.id : undefined,
          division_id: String(item.temp_family_Id || item.temp_family_id || ''),
          name: item.name || '',
          fname: item.father_name || '',
          mname: item.mother_name || '',
          surname: (() => {
            const name = item.name || '';
            const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
            return nameParts.length > 1 ? nameParts.pop() : '';  // ✅ Only show surname if multiple words
          })(),
          mobile1: item.mobile_number ? String(item.mobile_number) : '',
          mobile2: '',
          age: '', // Calculate age from date_of_birth if needed
          date_of_birth: item.date_of_birth || '',
          parliament: '', // Not available in area_mapping
          assembly: '', // Not available in area_mapping
          district: item.district || '',
          block: item.block || '',
          tehsil: '',
          village: item.village || '',
          cast_id: item.caste || '',
          cast_ida: item.caste_category || ''
        }));
        
        setData(mappedData);
        
        // Try to get total count from API response headers or check if we have more data
        let totalCount: number | string = mappedData.length;
        let totalPages = 1;
        
        // If we got exactly the limit, there might be more data
        if (mappedData.length === limit) {
          // Try to fetch one more record to see if there's more data
          try {
            const nextPageResponse = await fetch(`${apiUrl}&page=${page + 1}&limit=1`);
            if (nextPageResponse.ok) {
              const nextPageData = await nextPageResponse.json();
              if (Array.isArray(nextPageData) && nextPageData.length > 0) {
                // There's more data, estimate total
                totalCount = '10000+'; // Show approximate total
                totalPages = Math.ceil(10000 / limit);
              } else {
                // No more data, this is the last page
                totalCount = (page - 1) * limit + mappedData.length;
                totalPages = page;
              }
            }
          } catch (error) {
            // If we can't check next page, assume there's more data
            totalCount = '10000+';
            totalPages = Math.ceil(10000 / limit);
          }
        } else {
          // We got less than the limit, so this is the last page
          totalCount = (page - 1) * limit + mappedData.length;
          totalPages = page;
        }
        
        setPagination(prev => ({
          ...prev,
          totalItems: totalCount,
          totalPages: totalPages
        }));
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch data: ${errorMessage}`);
      setData([]);
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage]); // FIXED: Add pagination dependencies

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
  
  // Copy blink effect state
  const [isCopyBlinking, setIsCopyBlinking] = useState(false);
  
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

  // Pagination handlers - handlePageChange function
  const handlePageChange = useCallback(async (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    // Update pagination state
    setPagination(prev => ({ ...prev, currentPage: page }));
    
    // Reset to first cell of new page
    setSelectedCell({ row: 0, column: columnIds[0] });
    setFocusedCell({ row: 0, column: columnIds[0] });
    
    // Fetch data for the new page
    try {
      setLoading(true);
      const limit = pagination.itemsPerPage;
      
      // Build API URL with filters
      let apiUrl = `http://localhost:5002/api/area_mapping?page=${page}&limit=${limit}`;
      
      // Add master filters to API call
      if (memoizedMasterFilters) {
        if (memoizedMasterFilters.parliament) {
          apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
        }
        if (memoizedMasterFilters.assembly) {
          apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
        }
        if (memoizedMasterFilters.district) {
          apiUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
        }
        if (memoizedMasterFilters.block) {
          apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
        }
      }
      
      // Add detailed filters to API call
      if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
        Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
          if (value && value !== '') {
            apiUrl += `&${key}=${encodeURIComponent(String(value))}`;
          }
        });
      }
      
      console.log('🔍 Fetching page data with filters:', { page, masterFilters: memoizedMasterFilters, detailedFilters: memoizedDetailedFilters, apiUrl });
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const rawData = await response.text();
      
      try {
        const apiData = JSON.parse(rawData);
        
        if (!Array.isArray(apiData)) {
          console.error('❌ API data is not an array:', apiData);
          throw new Error('API data is not an array');
        }
        
        // Map API data to Voter interface
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.id ?? index + 1),
          row_pk: typeof item.id === 'number' ? item.id : undefined,
          division_id: String(item.temp_family_Id ?? item.id ?? ''),
          name: item.name || '',
          fname: item.father_name || '',
          mname: item.mother_name || '',
          surname: (() => {
            const name = item.name || '';
            const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
            return nameParts.length > 1 ? nameParts.pop() : '';  // ✅ Only show surname if multiple words
          })(),
          mobile1: item.mobile_number ? String(item.mobile_number) : '',
          mobile2: '',
          age: '', // Calculate age from date_of_birth if needed
          date_of_birth: item.date_of_birth || '',
          parliament: '', // Not available in area_mapping
          assembly: '', // Not available in area_mapping
          district: item.district || '',
          block: item.block || '',
          tehsil: '',
          village: item.village || '',
          cast_id: item.caste || '',
          cast_ida: item.caste_category || ''
        }));
        
        setData(mappedData);
        
        // Update pagination info
        let totalCount: number | string = mappedData.length;
        let totalPages = 1;
        
        // If we got exactly the limit, there might be more data
        if (mappedData.length === limit) {
          // Try to fetch one more record to see if there's more data
          try {
            const nextPageResponse = await fetch(`${apiUrl}&page=${page + 1}&limit=1`);
            if (nextPageResponse.ok) {
              const nextPageData = await nextPageResponse.json();
              if (Array.isArray(nextPageData) && nextPageData.length > 0) {
                // There's more data, estimate total
                totalCount = '10000+'; // Show approximate total
                totalPages = Math.ceil(10000 / limit);
              } else {
                // No more data, this is the last page
                totalCount = (page - 1) * limit + mappedData.length;
                totalPages = page;
              }
            }
          } catch (error) {
            // If we can't check next page, assume there's more data
            totalCount = '10000+';
            totalPages = Math.ceil(10000 / limit);
          }
        } else {
          // We got less than the limit, so this is the last page
          totalCount = (page - 1) * limit + mappedData.length;
          totalPages = page;
        }
        
        setPagination(prev => ({
          ...prev,
          totalItems: totalCount,
          totalPages: totalPages
        }));
        
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data for page:', page, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch data for page ${page}: ${errorMessage}`);
      setLoading(false);
    }
  }, [columnIds, pagination.totalPages, pagination.itemsPerPage]);

  const handleItemsPerPageChange = useCallback(async (newItemsPerPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page
    }));
    
    // Reset to first cell
    setSelectedCell({ row: 0, column: columnIds[0] });
    setFocusedCell({ row: 0, column: columnIds[0] });
    
    // Fetch data with new page size
    try {
      setLoading(true);
      
      // Build API URL with filters
      let apiUrl = `http://localhost:5002/api/area_mapping?page=1&limit=${newItemsPerPage}`;
      
      // Add master filters to API call
      if (memoizedMasterFilters) {
        if (memoizedMasterFilters.parliament) {
          apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
        }
        if (memoizedMasterFilters.assembly) {
          apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
        }
        if (memoizedMasterFilters.block) {
          apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
        }
      }
      
      // Add detailed filters to API call
      if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
        Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
          if (value && value !== '') {
            apiUrl += `&${key}=${encodeURIComponent(String(value))}`;
          }
        });
      }
      
      console.log('🔍 Fetching data with new page size and filters:', { newItemsPerPage, masterFilters: memoizedMasterFilters, detailedFilters: memoizedDetailedFilters, apiUrl });
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const rawData = await response.text();
      
      try {
        const apiData = JSON.parse(rawData);
        
        if (!Array.isArray(apiData)) {
          console.error('❌ API data is not an array:', apiData);
          throw new Error('API data is not an array');
        }
        
        // Map API data to Voter interface
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.id ?? index + 1),
          row_pk: typeof item.id === 'number' ? item.id : undefined,
          division_id: String(item.temp_family_Id ?? item.id ?? ''),
          name: item.name || '',
          fname: item.father_name || '',
          mname: item.mother_name || '',
          surname: (() => {
            const name = item.name || '';
            const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
            return nameParts.length > 1 ? nameParts.pop() : '';  // ✅ Only show surname if multiple words
          })(),
          mobile1: item.mobile_number ? String(item.mobile_number) : '',
          mobile2: '',
          age: '', // Calculate age from date_of_birth if needed
          date_of_birth: item.date_of_birth || '',
          parliament: '', // Not available in area_mapping
          assembly: '', // Not available in area_mapping
          district: item.district || '',
          block: item.block || '',
          tehsil: '',
          village: item.village || '',
          cast_id: item.caste || '',
          cast_ida: item.caste_category || ''
        }));
        
        setData(mappedData);
        
        // Update pagination info
        let totalCount: number | string = mappedData.length;
        let totalPages = 1;
        
        // If we got exactly the limit, there might be more data
        if (mappedData.length === newItemsPerPage) {
          // Try to fetch one more record to see if there's more data
          try {
            const nextPageResponse = await fetch(`http://localhost:5002/api/area_mapping?page=2&limit=1`);
            if (nextPageResponse.ok) {
              const nextPageData = await nextPageResponse.json();
              if (Array.isArray(nextPageData) && nextPageData.length > 0) {
                // There's more data, estimate total
                totalCount = '10000+'; // Show approximate total
                totalPages = Math.ceil(10000 / newItemsPerPage);
              } else {
                // No more data, this is the last page
                totalCount = mappedData.length;
                totalPages = 1;
              }
            }
          } catch (error) {
            // If we can't check next page, assume there's more data
            totalCount = '10000+';
            totalPages = Math.ceil(10000 / newItemsPerPage);
          }
        } else {
          // We got less than the limit, so this is the last page
          totalCount = mappedData.length;
          totalPages = 1;
        }
        
        setPagination(prev => ({
          ...prev,
          totalItems: totalCount,
          totalPages: totalPages
        }));
        
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data with new page size:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch data with new page size: ${errorMessage}`);
      setLoading(false);
    }
  }, [columnIds]);

  // Effect to fetch data on component mount
  useEffect(() => {
    // Only fetch on mount, don't set previous data for initial load
    const initialFetch = async () => {
      try {
        setLoading(true);
        
        // Use pagination for better performance
        const page = 1;
        const limit = pagination.itemsPerPage;
        
        // Build API URL with filters
        let apiUrl = `http://localhost:5002/api/area_mapping?page=${page}&limit=${limit}`;
        
        // Add master filters to API call
        if (memoizedMasterFilters) {
          if (memoizedMasterFilters.parliament) {
            apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
          }
          if (memoizedMasterFilters.assembly) {
            apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
          }
          if (memoizedMasterFilters.district) {
            apiUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
          }
          if (memoizedMasterFilters.block) {
            apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
          }
        }
        
        // Add detailed filters to API call
        if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
          Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
            if (value && value !== '') {
              apiUrl += `&${key}=${encodeURIComponent(String(value))}`;
            }
          });
        }
        
        console.log('🔍 Initial fetch with filters:', { masterFilters: memoizedMasterFilters, detailedFilters: memoizedDetailedFilters, apiUrl });
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Initial fetch HTTP Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const rawData = await response.text();
        
        try {
          const apiData = JSON.parse(rawData);
          
          if (!Array.isArray(apiData)) {
            throw new Error('API data is not an array');
          }
          
                  // Map API data to Voter interface (correct mapping for area_mapping API) - FIRST INSTANCE
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.id ?? index + 1),
          row_pk: typeof item.id === 'number' ? item.id : undefined,
          division_id: String(item.temp_family_Id || item.temp_family_id || ''),
            name: item.name || '',
            fname: item.father_name || '',
            mname: item.mother_name || '',
            surname: (() => {
              const name = item.name || '';
              const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
              return nameParts.length > 1 ? nameParts.pop() : '';  // ✅ Only show surname if multiple words
            })(),
            mobile1: item.mobile_number ? String(item.mobile_number) : '',
            mobile2: '',
            age: calculateAge(item.date_of_birth),
            date_of_birth: item.date_of_birth || '',
            parliament: '', // Not available in area_mapping
            assembly: '', // Not available in area_mapping
            district: item.district || '',
            block: item.block || '',
            tehsil: item.gp || '',
            village: item.village || '',
            cast_id: item.caste || '',
            cast_ida: item.caste_category || ''
          }));
          
          setData(mappedData);
          
          // Try to get total count from API response headers or check if we have more data
          let totalCount: number | string = mappedData.length;
          let totalPages = 1;
          
          // If we got exactly the limit, there might be more data
          if (mappedData.length === pagination.itemsPerPage) {
            // Try to fetch one more record to see if there's more data
            try {
              const nextPageResponse = await fetch(`http://localhost:5002/api/area_mapping?page=2&limit=1`);
              if (nextPageResponse.ok) {
                const nextPageData = await nextPageResponse.json();
                if (Array.isArray(nextPageData) && nextPageData.length > 0) {
                  // There's more data, estimate total
                  totalCount = '10000+'; // Show approximate total
                  totalPages = Math.ceil(10000 / pagination.itemsPerPage);
                } else {
                  // No more data, this is the last page
                  totalCount = mappedData.length;
                  totalPages = 1;
                }
              }
            } catch (error) {
              // If we can't check next page, assume there's more data
              totalCount = '10000+';
              totalPages = Math.ceil(10000 / pagination.itemsPerPage);
            }
          } else {
            // We got less than the limit, so this is the last page
            totalCount = mappedData.length;
            totalPages = 1;
          }
          
          setPagination(prev => ({
            ...prev,
            totalItems: totalCount,
            totalPages: totalPages
          }));
          
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
  }, [pagination.itemsPerPage, memoizedMasterFilters, memoizedDetailedFilters]);

  // FIXED: Simplified filter effect to prevent blinking
  useEffect(() => {
    // Only refetch if we already have data and filters actually changed
    if (data.length > 0 && memoizedMasterFilters && Object.keys(memoizedMasterFilters).length > 0) {
      const timeoutId = setTimeout(() => {
        // Reset to first page when filters change
        handlePageChange(1);
      }, 500); // Increased delay to prevent rapid calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [memoizedMasterFilters, data.length, handlePageChange]);

  // Effect to refetch data when detailed filters change
  useEffect(() => {
    // Only refetch if we already have data and detailed filters actually changed
    if (data.length > 0 && memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('🔍 Detailed filters changed, refetching data:', memoizedDetailedFilters);
        // Reset to first page when detailed filters change
        handlePageChange(1);
      }, 500); // Increased delay to prevent rapid calls
      
      return () => clearTimeout(timeoutId);
    }
  }, [memoizedDetailedFilters, data.length, handlePageChange]);

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
      
      // Determine primary key for update: prefer DB primary key 'id', fallback to DIVISION_ID
      const recordId = (voter.row_pk != null ? String(voter.row_pk) : (voter.division_id || '')).trim();
      if (!recordId) {
        // console.error('❌ Missing primary key (id or DIVISION_ID) for this row, aborting update', { voter });
        alert('Cannot update this row: missing id/DIVISION_ID from API');
        return;
      }
      
      // Map frontend column IDs to backend column names for area_mapping API
      const columnMapping: { [key: string]: string } = {
        'id': 'id',
        'name': 'name',
        'fname': 'father_name',
        'mname': 'mother_name',
        'surname': 'caste',
        'mobile1': 'mobile_number',
        'mobile2': 'mobile_number',
        'age': 'date_of_birth', // Age is calculated from date_of_birth
        'date_of_birth': 'date_of_birth',
        'parliament': 'district', // Map to available field
        'assembly': 'block', // Map to available field
        'district': 'district',
        'block': 'block',
        'tehsil': 'gp',
        'village': 'village',
        'cast_id': 'caste',
        'cast_ida': 'caste_category'
      };
      
      const backendColumnName = columnMapping[columnId];
      if (!backendColumnName) {
        console.error(`No mapping found for column: ${columnId}`);
        return;
      }
      
      // Call the backend API to update the data
      const response = await fetch(`http://localhost:5002/api/area_mapping/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          columnName: backendColumnName,
          value: value
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const result = await response.json();
      
      // Update the local state to reflect the change immediately
      setData(prevData => {
        const newData = prevData.map((item, index) => {
          if (index === rowIndex) {
            const updatedItem = { ...item, [columnId]: value };
            
            // Special handling: If we're updating the name, also update the surname column
            if (columnId === 'name') {
              const nameParts = value.split(' ').filter((part: string) => part.trim() !== '');
              updatedItem.surname = nameParts.length > 1 ? nameParts.pop() : '';
            }
            
            return updatedItem;
          }
          return item;
        });
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
    // Immediate state updates for instant response
    setSelectedCell({ row: toRow, column: toColumnId });
    setFocusedCell({ row: toRow, column: toColumnId });
  }, []);

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
        
        // Validate that the target cell exists
        if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
          navigateToCell(rowIndex, columnId, newRow, newColumnId);
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
    } else if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Click: Add to existing selection (individual cell selection)
      const clickedCellKey = `${rowIndex}-${columnId}`;
      setSelectedCells(prev => new Set([...prev, clickedCellKey]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
    } else {
      // Normal click: Clear previous selection and select new cell
      setSelectedCells(new Set([`${rowIndex}-${columnId}`]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
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
    setEditValue(String(currentValue));
    setEditingCell({ row: rowIndex, column: columnId });
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
  }, [memoizedData]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (editingCell) return; // Don't handle navigation while editing

    const currentColumnIndex = columnIds.indexOf(columnId);
    const { maxRows, maxCols } = gridDimensions;
    
    
    
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
          // Shift+Tab: Move to previous cell
          if (currentColumnIndex > 0) {
            newCol = currentColumnIndex - 1;
          } else if (rowIndex > 0) {
            newCol = maxCols - 1;
            newRow = rowIndex - 1;
          }
        } else {
          // Tab: Move to next cell
          if (currentColumnIndex < maxCols - 1) {
            newCol = currentColumnIndex + 1;
          } else if (rowIndex < maxRows - 1) {
            newCol = 0;
            newRow = rowIndex + 1;
          }
        }
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'Enter':
        // SIMPLE: Enter key ONLY moves down, never edits
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        e.preventDefault();
        e.stopPropagation();
        break;
      case 'F2':
        if (columnId !== 'select') {
          // Allow editing even for empty cells - get current value or empty string
          const currentValue = (memoizedData && memoizedData[rowIndex]) ? (memoizedData[rowIndex]?.[columnId as keyof Voter] || '') : '';
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
            
            // Add data rows ONLY (no headers)
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
            
            navigator.clipboard.writeText(csvData).catch(err => {
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
        // Direct typing: Any printable character starts editing immediately
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && columnId !== 'select') {
          setEditValue(e.key);
          setEditingCell({ row: rowIndex, column: columnId });
          setSelectedCell({ row: rowIndex, column: columnId });
          setFocusedCell({ row: rowIndex, column: columnId });
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        
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
          

          
          if (targetRow !== rowIndex || targetCol !== currentColumnIndex) {
            const targetColumnId = columnIds[targetCol];
            if (targetColumnId) {
              // Add the target cell to selected cells set
              const targetCellKey = `${targetRow}-${targetColumnId}`;
              setSelectedCells(prev => new Set([...prev, targetCellKey]));
              
              // Update the focused cell
              setSelectedCell({ row: targetRow, column: targetColumnId });
              setFocusedCell({ row: targetRow, column: targetColumnId });
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
      
      // Validate that the target cell exists
      if (newColumnId && newRow >= 0 && newRow < maxRows && newCol >= 0 && newCol < maxCols) {
        // Use the consolidated navigation function
        navigateToCell(rowIndex, columnId, newRow, newColumnId);
      }
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
      if (cellElement && cellElement !== document.activeElement) {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          cellElement.focus();
        }, 0);
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

  // Effect to update goToPageInput when current page changes
  useEffect(() => {
    setGoToPageInput(pagination.currentPage.toString());
  }, [pagination.currentPage]);

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
              return;
              
            case 'v':
              // Ctrl+V: Paste into selected cell
              e.preventDefault();
              e.stopPropagation();
              if (selectedCell && selectedCell.column !== 'select') {
                navigator.clipboard.readText().then((text) => {
                  setEditValue(text);
                  setEditingCell({ row: selectedCell.row, column: selectedCell.column });
                  setSelectedCell({ row: selectedCell.row, column: selectedCell.column });
                  setFocusedCell({ row: selectedCell.row, column: selectedCell.column });
                }).catch(err => {
                  console.error('Failed to read clipboard:', err);
                });
              }
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
              
              // Add data rows ONLY (no headers)
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
                // Trigger blinking effect instead of popup
                triggerCopyBlinkEffect();
              }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                // Trigger blinking effect for error too
                triggerCopyBlinkEffect();
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
                  isInSelectionRange={isCellInSelectionRange(index, columnId)}
                  onCellClick={handleCellClick}
                  onCellDoubleClick={handleCellDoubleClick}
                  onCellKeyDown={handleCellKeyDown}
                  onUpdate={handleUpdateData}
                  onUpdateAndNavigate={handleUpdateAndNavigate}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onStopEditing={handleStopEditing}
                  loading={updatingCells.has(`${index}-${columnId}`)}
                  isCopyBlinking={isCopyBlinking}
                />
              )}
            </td>
          ))}
        </tr>
      );
    });
  }, [memoizedData, loading, columns, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, columnIds, isCellInSelectionRange, handleCellClick, handleCellDoubleClick, handleCellKeyDown, handleUpdateData, handleUpdateAndNavigate, setEditValue, handleStopEditing]);

  // Function to trigger copy blink effect (Excel-like behavior)
  const triggerCopyBlinkEffect = () => {
    setIsCopyBlinking(true);
    setTimeout(() => {
      setIsCopyBlinking(false);
    }, 300); // Blink for 300ms
  };

  // Function to refresh data with current filters
  const refreshDataWithFilters = () => {
    console.log('🔄 Manually refreshing data with current filters');
    handlePageChange(1); // Go to first page and refetch
  };

  // Function to refresh data
  const fetchDataAgain = () => {
    const page = pagination.currentPage;
    const limit = pagination.itemsPerPage;
    
    // Build API URL with filters
    let apiUrl = `http://localhost:5002/api/area_mapping?page=${page}&limit=${limit}`;
    
    // Add master filters to API call
    if (memoizedMasterFilters) {
      if (memoizedMasterFilters.parliament) {
        apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
      }
      if (memoizedMasterFilters.assembly) {
        apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
      }
      if (memoizedMasterFilters.district) {
        apiUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
      }
      if (memoizedMasterFilters.block) {
        apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
      }
    }
    
    // Add detailed filters to API call
    if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
      Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          apiUrl += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }
    
    console.log('🔍 Refreshing data with filters:', { apiUrl });
    
    fetch(apiUrl)
      .then(res => res.json())
      .then((apiData: any[]) => {
        const mappedData: Voter[] = apiData.map((item: any, index: number) => ({
          id: String(item.id ?? index + 1),
          division_id: String(item.temp_family_Id || item.temp_family_id || ''),
          name: item.name || '',
          fname: item.father_name || '',
          mname: item.mother_name || '',
          surname: (() => {
            const name = item.name || '';
            const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
            return nameParts.length > 1 ? nameParts.pop() : '';  // ✅ Only show surname if multiple words
          })(),
          mobile1: item.mobile_number ? String(item.mobile_number) : '',
          mobile2: '',
          age: calculateAge(item.date_of_birth),
          date_of_birth: item.date_of_birth || '',
          parliament: '', // Not available in area_mapping
          assembly: '', // Not available in area_mapping
          district: item.district || '',
          block: item.block || '',
          tehsil: item.gp || '',
          village: item.village || '',
          cast_id: item.caste || '',
          cast_ida: item.caste_category || ''
        }));
        setData(mappedData);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
      });
  };

  // Handle edit function
  const handleEdit = (rowId: number, fieldName: string, newValue: string) => {
    // Map frontend field names to backend column names for area_mapping API
    const columnMapping: { [key: string]: string } = {
      'name': 'name',
      'fname': 'father_name',
      'mname': 'mother_name',
      'surname': 'name',  // ✅ CORRECT: Surname updates the name field
      'district': 'district',
      'block': 'block',
      'tehsil': 'gp',
      'village': 'village',
      'cast_id': 'caste',
      'cast_ida': 'caste_category'
    };
    
    let backendColumnName = columnMapping[fieldName] || fieldName;
    let updateValue = newValue;
    
    // Special handling for surname: update the name field by replacing last word
    if (fieldName === 'surname') {
      backendColumnName = 'name';
      // Get current name and replace last word with new surname
      const currentVoter = memoizedData.find(v => v.id === String(rowId));
      if (currentVoter && currentVoter.name) {
        const nameParts = currentVoter.name.split(' ').filter((part: string) => part.trim() !== '');
        if (nameParts.length > 1) {
          nameParts.pop(); // Remove last word (old surname)
          nameParts.push(newValue); // Add new surname
          updateValue = nameParts.join(' ');
        } else {
          // If only one word, append the new surname
          updateValue = `${currentVoter.name} ${newValue}`;
        }
      }
    }
    
    fetch(`http://localhost:5002/api/area_mapping/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        columnName: backendColumnName,
        value: updateValue 
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
              // Update local state immediately for immediate UI update
      setData(prevData => {
        const newData = prevData.map((item, index) => {
          if (item.id === String(rowId)) {
            const updatedItem = { ...item };
            
            if (fieldName === 'surname') {
              // Update both name and surname
              updatedItem.name = updateValue;
              updatedItem.surname = newValue;
            } else {
              // Update the specific field (using any for dynamic field access)
              (updatedItem as any)[fieldName] = newValue;
            }
            
            return updatedItem;
          }
          return item;
        });
        return newData;
      });
      
      // fetchDataAgain(); // Commented out since we're updating locally
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
          <div className="text-gray-600">Loading data from area_mapping API...</div>
          <div className="text-sm text-gray-500 mt-2">This may take a few moments for large datasets</div>
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
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchDivisionData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-2"
            >
              Retry
            </button>
            <button
                            onClick={() => {
                fetch('http://localhost:5002/api/health')
                  .then(res => res.json())
                  .then(data => {
                    alert('Health check successful! Check console for details.');
                  })
                  .catch(err => {
                    console.error('❌ Health check failed:', err);
                    alert('Health check failed! Check console for details.');
                  });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Test API Connection
            </button>
            <button
                            onClick={() => {
                fetch('http://localhost:5002/api/area_mapping/debug')
                  .then(res => res.json())
                  .then(data => {
                    alert('Debug endpoint successful! Check console for details.');
                  })
                  .catch(err => {
                    console.error('❌ Debug endpoint failed:', err);
                    alert('Debug endpoint failed! Check console for details.');
                  });
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Test Area Mapping API
            </button>
          </div>
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
        <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700 space-y-2 sm:space-y-0 mr-10">
          <div className="text-center sm:text-left">
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading data...
              </div>
            ) : (
              <div className="text-sm">
                <span className="font-medium">Page {pagination.currentPage}</span>
                {typeof pagination.totalItems === 'number' ? (
                  <span> of {pagination.totalPages} • </span>
                ) : (
                  <span> • </span>
                )}
                <span>Showing {memoizedData.length} entries</span>
                {typeof pagination.totalItems === 'string' && (
                  <span> (Total: {pagination.totalItems})</span>
                )}
                
                {/* Show active filters */}
                {(memoizedMasterFilters && Object.keys(memoizedMasterFilters).some(key => memoizedMasterFilters[key as keyof typeof memoizedMasterFilters])) ||
                 (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) ? (
                  <div className="mt-1 text-xs text-blue-600">
                    🔍 Filters active
                    {memoizedMasterFilters && Object.keys(memoizedMasterFilters).some(key => memoizedMasterFilters[key as keyof typeof memoizedMasterFilters]) && (
                      <span className="ml-1">• Master: {Object.entries(memoizedMasterFilters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                    )}
                    {memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0 && (
                      <span className="ml-1">• Detailed: {Object.entries(memoizedDetailedFilters).filter(([_, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
          
          {/* Centered Pagination */}
          <div className="flex items-center justify-center space-x-1">
            {/* Refresh Button */}
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
              onClick={refreshDataWithFilters}
              disabled={loading}
              title="Refresh with current filters"
            >
              🔄
            </button>
            
            {/* Previous page button */}
            <button 
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 cursor-pointer"
              onClick={() => {
                console.log(`🔄 Previous page clicked: ${pagination.currentPage - 1}`);
                handlePageChange(pagination.currentPage - 1);
              }}
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
                  <span className="px-2 py-1 text-gray-400 cursor-pointer">......</span>
                ) : (
                  <button
                    className={`px-3 py-1 rounded transition-colors ${
                      page === currentPage
                        ? 'bg-gray-600 text-white cursor-pointer'
                        : 'border border-gray-300 hover:bg-gray-100 text-gray-700 cursor-pointer '
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => {
                      console.log(`🔄 Clicked on page ${page}`);
                      handlePageChange(page as number);
                    }}
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
              onClick={() => {
                console.log(`🔄 Next page clicked: ${pagination.currentPage + 1}`);
                handlePageChange(pagination.currentPage + 1);
              }}
              disabled={!pagination || pagination.currentPage >= pagination.totalPages || loading}
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
                value={goToPageInput}
                onChange={(e) => setGoToPageInput((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const page = parseInt((e.target as HTMLInputElement).value);
                    console.log(`🔄 Go to page input: ${page}, total pages: ${pagination.totalPages}`);
                    if (page >= 1 && page <= pagination.totalPages) {
                      handlePageChange(page);
                      setGoToPageInput(page.toString());
                    } else {
                      console.log(`❌ Invalid page number: ${page}`);
                    }
                  }
                }}
                onBlur={() => {
                  const page = parseInt(goToPageInput);
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page);
                    setGoToPageInput(page.toString());
                  } else {
                    setGoToPageInput(pagination.currentPage.toString());
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
                onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                disabled={loading}
              >
                <option value={500}>500</option>
                <option value={1000}>1000</option>
                <option value={2000}>2000</option>
                <option value={5000}>5000</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(DataTable);