'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import CommonPagination from './CommonPagination';
import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';
import { apiService } from '../services/api';

// Register all Handsontable modules
registerAllModules();

// Generic interface for any data type
interface GenericData {
  [key: string]: any;
}

// Column definition interface
interface ExcelColumn {
  id?: string;
  accessorKey?: string;
  header: string;
  size: number;
  cell?: (props: any) => React.ReactNode;
  isRowHeader?: boolean;
  readOnly?: boolean;
  type?: string;
  validator?: (value: any, callback: (valid: boolean) => void) => void;
}

// Main ExcelDataTable props interface
interface ExcelDataTableProps<T extends GenericData> {
  data: T[];
  columns: ExcelColumn[];
  loading?: boolean;
  onUpdateRow?: (rowIndex: number, columnId: string, value: any) => Promise<void>;
  onBulkUpdate?: (updates: Array<{rowIndex: number, columnId: string, value: any}>) => Promise<void>;
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
  // Excel features
  enableExcelFeatures?: boolean;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
  showFiltersInfo?: boolean;
  masterFilters?: Record<string, any>;
  detailedFilters?: Record<string, any>;
  filterLoading?: boolean;
  // Undo/Redo callbacks
  onUndo?: (historyEntry: { rowIndex: number; columnId: string; oldValue: any; newValue: any }) => void;
  onRedo?: (historyEntry: { rowIndex: number; columnId: string; oldValue: any; newValue: any }) => void;
  // Custom styling
  tableHeight?: string;
  rowHeight?: number;
  enableColumnResize?: boolean;
  enableRowResize?: boolean;
}

export default function ExcelDataTable<T extends GenericData>({
  data,
  columns,
  loading = false,
  onUpdateRow,
  onBulkUpdate,
  pagination,
  onPageChange,
  onItemsPerPageChange,
  showPagination = false,
  enableExcelFeatures = true,
  showRefreshButton = true,
  onRefresh,
  showFiltersInfo = false,
  masterFilters = {},
  detailedFilters = {},
  filterLoading = false,
  onUndo,
  onRedo,
  tableHeight = "h-screen",
  rowHeight = 28,
  enableColumnResize = true,
  enableRowResize = true
}: ExcelDataTableProps<T>) {
  
  // Excel-like state management
  const [selectedCell, setSelectedCell] = useState<{row: number, column: string} | null>(null);
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [focusedCell, setFocusedCell] = useState<{row: number, column: string} | null>(null);
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());
  
  // Multiple cell selection state
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isCopyBlinking, setIsCopyBlinking] = useState(false);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Selection range state for Shift + Arrow functionality
  const [selectionRange, setSelectionRange] = useState<{
    start: {row: number, column: string};
    end: {row: number, column: string};
  } | null>(null);
  const [lastShiftArrowTime, setLastShiftArrowTime] = useState(0);

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState<{row: number, column: string} | null>(null);
  const [dragEndCell, setDragEndCell] = useState<{row: number, column: string} | null>(null);
  
  // Bulk editing state
  const [bulkEditValue, setBulkEditValue] = useState('');
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditColumn, setBulkEditColumn] = useState<string>('');

  // HotTable ref
  const hotTableRef = useRef<any>(null);
  const isMountedRef = useRef(false);

  // Convert columns to Handsontable format
  const hotColumns = useMemo(() => {
    // Custom renderer for checkbox column
    const checkboxRenderer = (
      instance: any,
      td: HTMLElement,
      row: number,
      col: number,
      prop: any,
      value: any
    ) => {
      td.innerHTML = '';
      td.style.padding = '0';
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = value || false;
      checkbox.className = 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2';
      checkbox.style.margin = '0';
      
      // Add change event listener
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        // Dispatch custom event for checkbox change
        const event = new CustomEvent('checkboxChange', { 
          detail: { rowIndex: row, checked: target.checked } 
        });
        window.dispatchEvent(event);
      });
      
      td.appendChild(checkbox);
      return td;
    };

    // Custom renderer for process status column
    const processStatusRenderer = (
      instance: any,
      td: HTMLElement,
      row: number,
      col: number,
      prop: any,
      value: any
    ) => {
      td.innerHTML = '';
      td.style.padding = '4px 8px';
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      td.style.borderRadius = '4px';
      td.style.fontSize = '12px';
      td.style.fontWeight = '500';
      td.style.cursor = 'pointer';
      
      const status = value || 'pending';
      let backgroundColor, color, text;
      
      switch (status) {
        case 'completed':
          backgroundColor = '#dcfce7';
          color = '#166534';
          text = '✓ Completed';
          break;
        case 'processing':
          backgroundColor = '#fef3c7';
          color = '#92400e';
          text = '⏳ Processing';
          break;
        case 'failed':
          backgroundColor = '#fee2e2';
          color = '#dc2626';
          text = '✗ Failed';
          break;
        case 'needs_review':
          backgroundColor = '#fef3c7';
          color = '#92400e';
          text = '⚠ Review';
          break;
        default:
          backgroundColor = '#f3f4f6';
          color = '#6b7280';
          text = '⏸ Pending';
      }
      
      td.style.backgroundColor = backgroundColor;
      td.style.color = color;
      td.textContent = text;
      
      // Add click event to show process history
      td.addEventListener('click', () => {
        const event = new CustomEvent('showProcessHistory', { 
          detail: { rowIndex: row } 
        });
        window.dispatchEvent(event);
      });
      
      // Add hover effect
      td.addEventListener('mouseenter', () => {
        td.style.opacity = '0.8';
        td.style.transform = 'scale(1.05)';
        td.style.transition = 'all 0.2s ease';
      });
      
      td.addEventListener('mouseleave', () => {
        td.style.opacity = '1';
        td.style.transform = 'scale(1)';
      });
      
      return td;
    };

    // Custom renderer for last processed column
    const lastProcessedRenderer = (
      instance: any,
      td: HTMLElement,
      row: number,
      col: number,
      prop: any,
      value: any
    ) => {
      td.innerHTML = '';
      td.style.padding = '4px 8px';
      td.style.textAlign = 'center';
      td.style.verticalAlign = 'middle';
      td.style.fontSize = '11px';
      td.style.color = '#6b7280';
      
      if (value) {
        const date = new Date(value);
        const formattedDate = date.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        td.textContent = formattedDate;
      } else {
        td.textContent = 'Never';
      }
      
      return td;
    };

    // Custom renderer for Name | M/F | Age column with clickable names
    const nameGenderAgeRenderer = (
      instance: any,
      td: HTMLElement,
      row: number,
      col: number,
      prop: any,
      value: any
    ) => {
      const text = (value ?? '').toString();
      // Split safely on '|'
      const parts = text.split('|');
      const name = (parts[0] || '').trim();
      const gender = (parts[1] || '').trim();
      const age = (parts[2] || '').trim();

      td.innerHTML = '';
      td.style.padding = '0';
      td.style.overflow = 'hidden';
      td.classList.add('htNoWrap');
      
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.width = '100%';
      wrapper.style.minWidth = '100%';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.gap = '6px';
      wrapper.style.padding = '0 6px';

      // Name section - clickable
      const left = document.createElement('div');
      left.style.flex = '1 1 auto';
      left.style.textAlign = 'left';
      left.style.cursor = 'pointer';
      left.style.fontWeight = '500';
      left.style.color = '#111827';
      left.textContent = name;
      
      // Add hover effects
      left.addEventListener('mouseenter', () => {
        left.style.color = '#2563eb';
        left.style.textDecoration = 'underline';
      });
      
      left.addEventListener('mouseleave', () => {
        left.style.color = '#111827';
        left.style.textDecoration = 'none';
      });
      
      // Add click functionality to open family modal
      left.addEventListener('click', (event) => {
        // Prevent Handsontable's default behavior
        event.preventDefault();
        event.stopPropagation();
        
        // Get the original data row to access family_id
        const originalRow = data[row];
        if (originalRow && originalRow.family_id) {
          // Dispatch custom event to open family modal
          const event = new CustomEvent('openFamilyModal', { 
            detail: { familyId: originalRow.family_id } 
          });
          window.dispatchEvent(event);
        }
      });

      // Gender section
      const middle = document.createElement('div');
      middle.style.flex = '0 0 38px';
      middle.style.textAlign = 'center';
      middle.style.fontSize = '12px';
      middle.style.color = '#6b7280';
      middle.textContent = gender;

      // Age section
      const right = document.createElement('div');
      right.style.flex = '0 0 44px';
      right.style.textAlign = 'right';
      right.style.overflow = 'hidden';
      right.style.fontSize = '12px';
      right.style.color = '#6b7280';
      right.style.fontFamily = 'monospace';
      right.textContent = age;

      wrapper.appendChild(left);
      wrapper.appendChild(middle);
      wrapper.appendChild(right);
      td.appendChild(wrapper);
      return td;
    };

    return columns.map(col => {
      const key = col.accessorKey || col.id;
      const base: any = {
        data: key,
        title: col.header,
        width: col.size,
        readOnly: col.readOnly || false,
        type: col.type || 'text',
        validator: col.validator
      };
      if (key === 'checkbox') {
        base.renderer = checkboxRenderer;
      } else if (key === 'processStatus') {
        base.renderer = processStatusRenderer;
      } else if (key === 'lastProcessed') {
        base.renderer = lastProcessedRenderer;
      } else if (key === 'name_gender_age_display') {
        base.renderer = nameGenderAgeRenderer;
      }
      return base;
    });
  }, [columns, data]);

  // Convert data to Handsontable format
  const hotData = useMemo(() => {
    return data.map((row, index) => {
      const hotRow: any = {};
      columns.forEach(col => {
        const key = col.accessorKey || col.id;
        if (key) {
          // Special render for composite display objects
          if (
            key === 'name_gender_age_display' &&
            row[key] && typeof row[key] === 'object'
          ) {
            const v = row[key] as any;
            const name = v.name ?? '';
            const gender = v.gender ?? '';
            const age = v.age ?? '';
            hotRow[key] = `${name}${name ? ' ' : ''}| ${gender} | ${age}`.trim();
          } else if (row[key] && typeof row[key] === 'object') {
            // Fallback: stringify unexpected objects to a readable form
            hotRow[key] = String(row[key]);
          } else {
            hotRow[key] = row[key];
          }
        }
      });
      return hotRow;
    });
  }, [data, columns]);

  // Handle cell selection
  const handleSelection = useCallback((r: number, c: number, r2: number, c2: number) => {
    // Prevent infinite loop by checking if component is mounted and selection changed
    if (!isMountedRef.current) return;
    
    const selectedRange = [];
    const startRow = Math.min(r, r2);
    const endRow = Math.max(r, r2);
    const startCol = Math.min(c, c2);
    const endCol = Math.max(c, c2);

    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        const columnKey = columns[col]?.accessorKey || columns[col]?.id;
        if (columnKey) {
          selectedRange.push(`${row}-${columnKey}`);
        }
      }
    }
    
    const newSelection = new Set(selectedRange);
    
    // Only update if selection actually changed
    if (JSON.stringify(Array.from(newSelection).sort()) !== JSON.stringify(Array.from(selectedCells).sort())) {
      setSelectedCells(newSelection);
    }
  }, [columns, selectedCells]);

  // Handle cell value changes
  const handleAfterChange = useCallback((changes: any[] | null, source: string) => {
    if (source === 'loadData' || !changes) return;
    
    changes.forEach(([row, prop, oldValue, newValue]) => {
      if (oldValue !== newValue && onUpdateRow) {
        onUpdateRow(row, prop, newValue);
      }
    });
  }, [onUpdateRow]);

  // Bulk edit functionality
  const handleBulkEdit = useCallback(async () => {
    if (!bulkEditValue || !bulkEditColumn || selectedCells.size === 0) return;

    const updates: Array<{rowIndex: number, columnId: string, value: any}> = [];
    
    selectedCells.forEach(cellKey => {
      const [rowIndex, columnId] = cellKey.split('-');
      if (columnId === bulkEditColumn) {
        updates.push({
          rowIndex: parseInt(rowIndex),
          columnId,
          value: bulkEditValue
        });
      }
    });

    if (updates.length > 0) {
      try {
        // Use API service for bulk update
        const result = await apiService.bulkUpdateCells(updates);
        
        if (result.success) {
          console.log(`✅ Bulk update successful: ${result.totalUpdated} cells updated`);
          
          // Call onBulkUpdate callback if provided
          if (onBulkUpdate) {
            await onBulkUpdate(updates);
          }
          
          setShowBulkEditModal(false);
          setBulkEditValue('');
          setBulkEditColumn('');
          setSelectedCells(new Set());
          
          // Show success message
          alert(`Successfully updated ${result.totalUpdated} cells!`);
        } else {
          console.error('Bulk update failed:', result.message);
          alert(`Bulk update failed: ${result.message}`);
        }
      } catch (error) {
        console.error('Bulk update failed:', error);
        alert('Bulk update failed. Please try again.');
      }
    }
  }, [bulkEditValue, bulkEditColumn, selectedCells, onBulkUpdate]);

  // Copy selected cells
  const handleCopy = useCallback(() => {
    if (selectedCells.size === 0) return;
    
    const copyData: any[] = [];
    const selectedRows = new Set<number>();
    const selectedCols = new Set<string>();
    
    selectedCells.forEach(cellKey => {
        const [rowIndex, columnId] = cellKey.split('-');
      selectedRows.add(parseInt(rowIndex));
      selectedCols.add(columnId);
    });

    // Create copy data structure
    Array.from(selectedRows).sort((a, b) => a - b).forEach(rowIndex => {
      const rowData: any = {};
      Array.from(selectedCols).forEach(colId => {
        if (data[rowIndex] && data[rowIndex][colId] !== undefined) {
          rowData[colId] = data[rowIndex][colId];
        }
      });
      copyData.push(rowData);
    });

    // Store in clipboard
    localStorage.setItem('excelCopyData', JSON.stringify(copyData));
    
    // Visual feedback
    setIsCopyBlinking(true);
    setTimeout(() => setIsCopyBlinking(false), 500);
  }, [selectedCells, data]);

  // Paste functionality
  const handlePaste = useCallback(() => {
    const copyData = localStorage.getItem('excelCopyData');
    if (!copyData || selectedCells.size === 0) return;

    try {
      const pasteData = JSON.parse(copyData);
      // Implementation for paste functionality
      console.log('Paste data:', pasteData);
            } catch (error) {
      console.error('Paste failed:', error);
    }
  }, [selectedCells]);

  // Set mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Force Handsontable to refresh when data changes
  useEffect(() => {
    if (hotTableRef.current && data.length > 0) {
      console.log(`🔄 ExcelDataTable: Data changed, forcing refresh for ${data.length} rows`);
      // Force Handsontable to recalculate dimensions
      setTimeout(() => {
        if (hotTableRef.current) {
          hotTableRef.current.render();
        }
      }, 100);
    }
  }, [data.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            e.preventDefault();
            handleCopy();
              break;
            case 'v':
              e.preventDefault();
            handlePaste();
              break;
            case 'a':
              e.preventDefault();
            // Select all
            const allCells = new Set<string>();
            data.forEach((_, rowIndex) => {
              columns.forEach(col => {
                const key = col.accessorKey || col.id;
                if (key) {
                  allCells.add(`${rowIndex}-${key}`);
                }
              });
            });
            setSelectedCells(allCells);
              break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, data, columns]);

  // Handsontable settings - memoized to prevent re-renders
  const hotSettings = useMemo(() => {
    // Calculate total height needed for all rows
    const totalRowHeight = data.length * rowHeight;
    const headerHeight = 40; // Approximate header height
    const minHeight = Math.max(totalRowHeight + headerHeight, 400); // Minimum height of 400px
    
    console.log(`🔍 ExcelDataTable: Data length: ${data.length}, Row height: ${rowHeight}, Total height: ${totalRowHeight}, Final height: ${minHeight}`);
    
    return {
      data: hotData,
      // Use provided column headers instead of default A, B, C...
      colHeaders: columns.map(col => col.header),
      // Map data keys to columns so Handsontable knows which field each column represents
      columns: hotColumns as any,
      rowHeaders: (index: number) => {
        // Calculate continuous Sr. No. across pages
        if (pagination) {
          const pageBase = (pagination.currentPage - 1) * pagination.itemsPerPage;
          return String(pageBase + index + 1);
        }
        return String(index + 1);
      },
      height: minHeight, // Set explicit height to accommodate all rows
      width: '100%',
      // Force Handsontable to render all rows
      renderAllRows: true,
      licenseKey: 'non-commercial-and-evaluation',
      stretchH: 'all' as const,
      autoWrapRow: true,
      contextMenu: true,
      manualRowResize: enableRowResize,
      manualColumnResize: enableColumnResize,
      rowHeights: rowHeight,
      minSpareRows: 0,
      minSpareCols: 0,
      fillHandle: true,
      copyPaste: true,
      search: true,
      filters: false,
      dropdownMenu: false,
      // Disable virtualization to show all rows
      viewportRowRenderingOffset: 0,
      viewportColumnRenderingOffset: 0,
      // Remove any internal spacing
      cellPadding: 0,
      rowHeaderWidth: 50, // Show Sr. No. column with 50px width
      colHeaderHeight: 0,
      afterSelection: handleSelection,
      afterChange: handleAfterChange,
      beforeKeyDown: (event: any) => {
        // Handle special keys
        if (event.keyCode === 9) { // Tab
          event.stopImmediatePropagation();
        }
      }
    };
  }, [hotData, enableRowResize, enableColumnResize, rowHeight, handleSelection, handleAfterChange, pagination, data.length]);

  if (loading) {
      return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

  return (
    <div className="w-full flex flex-col h-full m-0 p-0">

      {/* Handsontable Container - Single scrollable area */}
      <div className="flex-1 min-h-0 overflow-auto m-0 p-0">
        <div 
          className={`${tableHeight} overflow-visible relative z-0 m-0 p-0`} 
          style={{ 
            height: 'auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible' // Allow content to expand
          }}
        >
          <HotTable
            ref={hotTableRef}
            settings={hotSettings}
            className="htCenter relative z-0 w-full m-0 p-0"
            style={{ 
              height: 'auto', 
              width: '100%',
              flex: '1 1 auto',
              overflow: 'visible',
              margin: '0',
              padding: '0',
              border: 'none',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Bulk Edit Selected Cells</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Column to Edit
              </label>
              <select
                value={bulkEditColumn}
                onChange={(e) => setBulkEditColumn(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select Column</option>
                {columns.map((col, index) => (
                  <option key={index} value={col.accessorKey || col.id}>
                    {col.header}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Value
              </label>
          <input
                type="text"
                value={bulkEditValue}
                onChange={(e) => setBulkEditValue(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Enter new value"
              />
          </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkEdit}
                disabled={!bulkEditValue || !bulkEditColumn}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
              >
                Apply to {selectedCells.size} cells
              </button>
                    </div>
        </div>
        </div>
      )}
      
      {/* Pagination - Always at bottom */}
      {showPagination && pagination && onPageChange && onItemsPerPageChange && (
        <div className="flex-shrink-0">
          <CommonPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
            loading={loading}
            showRefreshButton={showRefreshButton}
            onRefresh={onRefresh}
            showFiltersInfo={showFiltersInfo}
            masterFilters={masterFilters}
            detailedFilters={detailedFilters}
            filterLoading={filterLoading}
          />
        </div>
      )}
    </div>
  );
}
