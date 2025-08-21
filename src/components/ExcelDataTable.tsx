'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import CommonPagination from './CommonPagination';

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
}

// Main ExcelDataTable props interface
interface ExcelDataTableProps<T extends GenericData> {
  data: T[];
  columns: ExcelColumn[];
  loading?: boolean;
  onUpdateRow?: (rowIndex: number, columnId: string, value: any) => Promise<void>;
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
  
  // Selection range state for Shift + Arrow functionality
  const [selectionRange, setSelectionRange] = useState<{
    start: {row: number, column: string};
    end: {row: number, column: string};
  } | null>(null);
  const [lastShiftArrowTime, setLastShiftArrowTime] = useState(0);

  // Undo/Redo functionality state
  const [cellHistory, setCellHistory] = useState<Array<{
    rowIndex: number;
    columnId: string;
    oldValue: any;
    newValue: any;
    timestamp: number;
  }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistorySize] = useState(100); // Maximum history entries to keep

  // Column resizing state
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});
  const colResizeRef = useRef<{ colId: string; startX: number; startWidth: number } | null>(null);
  
  // Row resizing state
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const rowResizeRef = useRef<{ rowIndex: number; startY: number; startHeight: number } | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  // Initialize columnSizes from static column definitions
  useEffect(() => {
    if (Object.keys(columnSizes).length === 0 && Array.isArray(columns)) {
      const map: Record<string, number> = {};
      columns.forEach(col => {
        const id = (col.id ? col.id : (('accessorKey' in col) ? (col.accessorKey as string) : 'unknown')) as string;
        const size = (col as any).size || 120;
        if (id) map[id] = size;
      });
      setColumnSizes(map);
    }
  }, [columns, columnSizes]);

  // Get column IDs
  const columnIds = useMemo(() => {
    return columns.map(col => {
      if (col.id) return col.id;
      if ('accessorKey' in col) return col.accessorKey as string;
      return 'unknown';
    });
  }, [columns]);

  // Initialize first cell selection
  useEffect(() => {
    if (data && data.length > 0 && !selectedCell && !loading && columnIds.length > 0) {
      setSelectedCell({ row: 0, column: columnIds[0] });
      setFocusedCell({ row: 0, column: columnIds[0] });
    }
  }, [data?.length, selectedCell, loading, columnIds[0]]);

  // Helper functions
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

  const navigateToCell = useCallback((fromRow: number, fromColumnId: string, toRow: number, toColumnId: string) => {
    setSelectedCell({ row: toRow, column: toColumnId });
    setFocusedCell({ row: toRow, column: toColumnId });
  }, []);

  const handleUpdateData = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    if (!onUpdateRow) return;
    
    try {
      const cellKey = `${rowIndex}-${columnId}`;
      setUpdatingCells(prev => new Set(prev).add(cellKey));
      
      // Get old value before updating
      const oldValue = data[rowIndex]?.[columnId] || '';
      
      // Add to history before updating
      const historyEntry = {
        rowIndex,
        columnId,
        oldValue,
        newValue: value,
        timestamp: Date.now()
      };
      
      // Clear any future history when new change is made
      const newHistory = cellHistory.slice(0, historyIndex + 1);
      newHistory.push(historyEntry);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
      }
      
      setCellHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      await onUpdateRow(rowIndex, columnId, value);
    } catch (error) {
      console.error('Error updating data:', error);
    } finally {
      const cellKey = `${rowIndex}-${columnId}`;
      setUpdatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  }, [onUpdateRow, data, cellHistory, historyIndex, maxHistorySize]);

  const handleUpdateAndNavigate = useCallback(async (rowIndex: number, columnId: string, value: any, navigationKey: string) => {
    try {
      await handleUpdateData(rowIndex, columnId, value);
      
      const currentColumnIndex = columnIds.indexOf(columnId);
      const maxRows = data.length;
      const maxCols = columnIds.length;
      
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
        if (newColumnId) {
          navigateToCell(rowIndex, columnId, newRow, newColumnId);
        }
      }
    } catch (error) {
      console.error('Error in updateAndNavigate:', error);
    }
  }, [handleUpdateData, columnIds, data.length, navigateToCell]);

  const handleCellClick = useCallback((rowIndex: number, columnId: string, event: React.MouseEvent) => {
    if (event.shiftKey && selectedCell) {
      const clickedCellKey = `${rowIndex}-${columnId}`;
      setSelectedCells(prev => new Set([...prev, clickedCellKey]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      
      // Set selection range for Shift+Click
      const start = selectionRange ? selectionRange.start : { row: selectedCell.row, column: selectedCell.column };
      const newRange = { start, end: { row: rowIndex, column: columnId } };
      setSelectionRange(newRange);
    } else if (event.ctrlKey || event.metaKey) {
      const clickedCellKey = `${rowIndex}-${columnId}`;
      setSelectedCells(prev => new Set([...prev, clickedCellKey]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      
      // Clear selection range for Ctrl+Click
      setSelectionRange(null);
    } else {
      setSelectedCells(new Set([`${rowIndex}-${columnId}`]));
      setSelectedCell({ row: rowIndex, column: columnId });
      setFocusedCell({ row: rowIndex, column: columnId });
      
      // Clear selection range for normal click
      setSelectionRange(null);
    }
    
    if (editingCell) {
      setEditingCell(null);
      setEditValue('');
    }
  }, [editingCell, selectedCell, selectionRange]);

  const handleCellDoubleClick = useCallback((rowIndex: number, columnId: string) => {
    if (columnId === 'select' || !enableExcelFeatures) return;
    
    const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId] || '') : '';
    setEditValue(String(currentValue));
    setEditingCell({ row: rowIndex, column: columnId });
    setSelectedCell({ row: rowIndex, column: columnId });
    setFocusedCell({ row: rowIndex, column: columnId });
  }, [data, enableExcelFeatures]);

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, columnId: string) => {
    if (editingCell || !enableExcelFeatures) return;

    const currentColumnIndex = columnIds.indexOf(columnId);
    const maxRows = data.length;
    const maxCols = columnIds.length;
    
    let newRow = rowIndex;
    let newCol = currentColumnIndex;

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
          targetRow = Math.min(maxRows - 1, rowIndex + 1);
          break;
        case 'ArrowLeft':
          targetCol = Math.max(0, currentColumnIndex - 1);
          break;
        case 'ArrowRight':
          targetCol = Math.min(maxCols - 1, currentColumnIndex + 1);
          break;
      }
      
      if (targetRow !== rowIndex || targetCol !== currentColumnIndex) {
        const targetColumnId = columnIds[targetCol];
        if (targetColumnId) {
          // Set selection range
          const start = selectionRange ? selectionRange.start : { row: rowIndex, column: columnId };
          const newRange = { start, end: { row: targetRow, column: targetColumnId } };
          setSelectionRange(newRange);
          
          // Update selected cells
          const startRow = Math.min(newRange.start.row, newRange.end.row);
          const endRow = Math.max(newRange.start.row, newRange.end.row);
          const startColIndex = Math.min(columnIds.indexOf(newRange.start.column), columnIds.indexOf(newRange.end.column));
          const endColIndex = Math.max(columnIds.indexOf(newRange.start.column), columnIds.indexOf(newRange.end.column));
          
          const newSelectedCells = new Set<string>();
          for (let r = startRow; r <= endRow; r++) {
            for (let c = startColIndex; c <= endColIndex; c++) {
              const colId = columnIds[c];
              if (colId) newSelectedCells.add(`${r}-${colId}`);
            }
          }
          setSelectedCells(newSelectedCells);
          
          // Update focused cell
          setSelectedCell({ row: targetRow, column: targetColumnId });
          setFocusedCell({ row: targetRow, column: targetColumnId });
        }
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }

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
        e.stopPropagation();
        break;
      case 'Enter':
        newRow = Math.min(maxRows - 1, rowIndex + 1);
        e.preventDefault();
        break;
      case 'F2':
        if (columnId !== 'select') {
          const currentValue = (data && data[rowIndex]) ? (data[rowIndex]?.[columnId] || '') : '';
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
      if (newColumnId) {
        navigateToCell(rowIndex, columnId, newRow, newColumnId);
      }
    }
  }, [data, columnIds, editingCell, handleUpdateData, enableExcelFeatures, navigateToCell, selectionRange, lastShiftArrowTime]);

  const handleStopEditing = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
    // Clear selection range when editing stops
    setSelectionRange(null);
  }, []);

  // Undo/Redo functions
  const canUndo = useCallback(() => {
    return historyIndex >= 0;
  }, [historyIndex]);

  const canRedo = useCallback(() => {
    return historyIndex < cellHistory.length - 1;
  }, [historyIndex, cellHistory.length]);

  const handleUndo = useCallback(async () => {
    if (!canUndo() || !onUpdateRow) return;
    
    const historyEntry = cellHistory[historyIndex];
    if (historyEntry) {
      try {
        // Call external undo callback if provided
        if (onUndo) {
          onUndo(historyEntry);
        }
        
        // Revert to old value
        await onUpdateRow(historyEntry.rowIndex, historyEntry.columnId, historyEntry.oldValue);
        
        // Move history index back
        setHistoryIndex(historyIndex - 1);
        
        console.log(`Undo: ${historyEntry.columnId} reverted from "${historyEntry.newValue}" to "${historyEntry.oldValue}"`);
      } catch (error) {
        console.error('Error during undo:', error);
      }
    }
  }, [canUndo, historyIndex, cellHistory, onUpdateRow, onUndo]);

  const handleRedo = useCallback(async () => {
    if (!canRedo() || !onUpdateRow) return;
    
    const historyEntry = cellHistory[historyIndex + 1];
    if (historyEntry) {
      try {
        // Call external redo callback if provided
        if (onRedo) {
          onRedo(historyEntry);
        }
        
        // Apply the change again
        await onUpdateRow(historyEntry.rowIndex, historyEntry.columnId, historyEntry.newValue);
        
        // Move history index forward
        setHistoryIndex(historyIndex + 1);
        
        console.log(`Redo: ${historyEntry.columnId} changed from "${historyEntry.oldValue}" to "${historyEntry.newValue}"`);
      } catch (error) {
        console.error('Error during redo:', error);
      }
    }
  }, [canRedo, historyIndex, cellHistory, onUpdateRow, onRedo]);

  // Copy and Paste functions
  const copySelectedCellsToClipboard = useCallback(async () => {
    if (selectedCells.size === 0) return;
    
    try {
      // Sort cells by row and column for proper order
      const sortedCells = Array.from(selectedCells).sort((a, b) => {
        const [rowA, colA] = a.split('-');
        const [rowB, colB] = b.split('-');
        const rowDiff = parseInt(rowA) - parseInt(rowB);
        if (rowDiff !== 0) return rowDiff;
        return columnIds.indexOf(colA) - columnIds.indexOf(colB);
      });
      
      // Create tab-separated data
      let csvData = '';
      let currentRow = -1;
      
      sortedCells.forEach(cellKey => {
        const [rowIndex, columnId] = cellKey.split('-');
        const rowIndexNum = parseInt(rowIndex);
        
        // Add newline for new rows
        if (currentRow !== -1 && currentRow !== rowIndexNum) {
          csvData = csvData.slice(0, -1) + '\n'; // Remove last tab and add newline
        }
        
        if (data[rowIndexNum]) {
          csvData += (data[rowIndexNum][columnId] || '') + '\t';
        }
        currentRow = rowIndexNum;
      });
      
      // Remove trailing tab
      csvData = csvData.slice(0, -1);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(csvData);
      triggerCopyBlinkEffect();
      
      console.log('Copied to clipboard:', csvData);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [selectedCells, data, columnIds]);

  const pasteFromClipboard = useCallback(async () => {
    if (selectedCells.size === 0 || !onUpdateRow) return;
    
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) return;
      
      // Parse clipboard data (tab-separated, newline for rows)
      const rows = clipboardText.split('\n');
      const selectedCellsArray = Array.from(selectedCells).sort((a, b) => {
        const [rowA, colA] = a.split('-');
        const [rowB, colB] = b.split('-');
        const rowDiff = parseInt(rowA) - parseInt(rowB);
        if (rowDiff !== 0) return rowDiff;
        return columnIds.indexOf(colA) - columnIds.indexOf(colB);
      });
      
      let cellIndex = 0;
      
      for (let rowIndex = 0; rowIndex < rows.length && cellIndex < selectedCellsArray.length; rowIndex++) {
        const cells = rows[rowIndex].split('\t');
        
        for (let colIndex = 0; colIndex < cells.length && cellIndex < selectedCellsArray.length; colIndex++) {
          const cellKey = selectedCellsArray[cellIndex];
          const [targetRow, targetCol] = cellKey.split('-');
          const targetRowNum = parseInt(targetRow);
          const value = cells[colIndex].trim();
          
          // Skip if it's the row header column
          if (targetCol !== 'select') {
            try {
              await onUpdateRow(targetRowNum, targetCol, value);
            } catch (error) {
              console.error(`Error pasting into cell ${targetRow}-${targetCol}:`, error);
            }
          }
          
          cellIndex++;
        }
      }
      
      console.log('Pasted from clipboard:', clipboardText);
    } catch (error) {
      console.error('Failed to paste from clipboard:', error);
    }
  }, [selectedCells, onUpdateRow, columnIds]);

  // Focus the selected cell
  useEffect(() => {
    if (selectedCell && !editingCell) {
      const cellSelector = `[data-cell="${selectedCell.row}-${selectedCell.column}"]`;
      const cellElement = document.querySelector(cellSelector) as HTMLElement;
      if (cellElement && cellElement !== document.activeElement) {
        setTimeout(() => {
          cellElement.focus();
        }, 0);
      }
    }
  }, [selectedCell?.row, selectedCell?.column, editingCell]);

  // Column resize functionality
  const startColumnResize = useCallback((e: React.MouseEvent, colId: string) => {
    if (!enableColumnResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    const startX = (e as any).clientX as number;
    const startWidth = columnSizes[colId] || 120;
    colResizeRef.current = { colId, startX, startWidth };
    
    const onMove = (ev: MouseEvent) => {
      if (!colResizeRef.current) return;
      const dx = ev.clientX - colResizeRef.current.startX;
      const newWidth = Math.max(60, colResizeRef.current.startWidth + dx);
      setColumnSizes(prev => ({ ...prev, [colResizeRef.current!.colId]: newWidth }));
    };
    
    const onUp = () => {
      colResizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [columnSizes, enableColumnResize]);

  // Row resize functionality
  const startRowResize = useCallback((e: React.MouseEvent, rowIndex: number) => {
    if (!enableRowResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    const startY = (e as any).clientY as number;
    const startHeight = rowHeights[rowIndex] || rowHeight;
    rowResizeRef.current = { rowIndex, startY, startHeight };
    
    const onMove = (ev: MouseEvent) => {
      if (!rowResizeRef.current) return;
      const dy = ev.clientY - rowResizeRef.current.startY;
      const newHeight = Math.max(18, rowResizeRef.current.startHeight + dy);
      setRowHeights(prev => ({ ...prev, [rowResizeRef.current!.rowIndex]: newHeight }));
    };
    
    const onUp = () => {
      rowResizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [rowHeights, rowHeight, enableRowResize]);

  // Function to trigger copy blink effect
  const triggerCopyBlinkEffect = () => {
    setIsCopyBlinking(true);
    setTimeout(() => {
      setIsCopyBlinking(false);
    }, 300);
  };

  // Global keyboard handler for Excel shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!enableExcelFeatures) return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'a':
            // Ctrl+A: Select all cells
            e.preventDefault();
            e.stopPropagation();
            const allCells = new Set<string>();
            for (let row = 0; row < data.length; row++) {
              for (let col = 0; col < columnIds.length; col++) {
                allCells.add(`${row}-${columnIds[col]}`);
              }
            }
            setSelectedCells(allCells);
            // Set selection range for all cells
            if (data.length > 0 && columnIds.length > 0) {
              setSelectionRange({
                start: { row: 0, column: columnIds[0] },
                end: { row: data.length - 1, column: columnIds[columnIds.length - 1] }
              });
            }
            return;
            
          case 'c':
            // Ctrl+C: Copy selected cells
            e.preventDefault();
            e.stopPropagation();
            if (selectedCells.size > 0) {
              copySelectedCellsToClipboard();
            }
            return;
            
          case 'v':
            // Ctrl+V: Paste into selected cells
            e.preventDefault();
            e.stopPropagation();
            if (selectedCells.size > 0) {
              pasteFromClipboard();
            }
            return;
            
          case 'z':
            // Ctrl+Z: Undo
            if (!e.shiftKey) {
              e.preventDefault();
              e.stopPropagation();
              handleUndo();
              return;
            }
            break;
            
          case 'y':
            // Ctrl+Y: Redo
            e.preventDefault();
            e.stopPropagation();
            handleRedo();
            return;
        }
      }
      
      // Handle Shift + Arrow keys for range selection (global)
      if (e.shiftKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const currentCell = selectedCell;
        if (currentCell && !editingCell) {
          const now = Date.now();
          if (now - lastShiftArrowTime < 100) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          setLastShiftArrowTime(now);
          e.preventDefault();
          e.stopPropagation();

          // Build/extend rectangular selection from current/previous anchor
          const start = selectionRange ? selectionRange.start : { row: currentCell.row, column: currentCell.column };
          const currentEndRow = selectionRange ? selectionRange.end.row : currentCell.row;
          const currentEndColId = selectionRange ? selectionRange.end.column : currentCell.column;
          const currentEndColIndex = columnIds.indexOf(currentEndColId);
          let newEndRow = currentEndRow;
          let newEndColIndex = currentEndColIndex;
          
          switch (e.key) {
            case 'ArrowUp':
              newEndRow = Math.max(0, currentEndRow - 1);
              break;
            case 'ArrowDown':
              newEndRow = Math.min((data.length || 1) - 1, currentEndRow + 1);
              break;
            case 'ArrowLeft':
              newEndColIndex = Math.max(0, currentEndColIndex - 1);
              break;
            case 'ArrowRight':
              newEndColIndex = Math.min(columnIds.length - 1, currentEndColIndex + 1);
              break;
          }
          
          const newEndColId = columnIds[newEndColIndex];
          if (newEndColId) {
            const newRange = { start, end: { row: newEndRow, column: newEndColId } };
            setSelectionRange(newRange);
            
            // Update selected cells
            const startRow = Math.min(newRange.start.row, newRange.end.row);
            const endRow = Math.max(newRange.start.row, newRange.end.row);
            const startColIndex = Math.min(columnIds.indexOf(newRange.start.column), columnIds.indexOf(newRange.end.column));
            const endColIndex = Math.max(columnIds.indexOf(newRange.start.column), columnIds.indexOf(newRange.end.column));
            
            const newSelectedCells = new Set<string>();
            for (let r = startRow; r <= endRow; r++) {
              for (let c = startColIndex; c <= endColIndex; c++) {
                const colId = columnIds[c];
                if (colId) newSelectedCells.add(`${r}-${colId}`);
              }
            }
            setSelectedCells(newSelectedCells);
            
            // Update focused cell
            setSelectedCell({ row: newEndRow, column: newEndColId });
            setFocusedCell({ row: newEndRow, column: newEndColId });
          }
          return;
        }
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown, { passive: false });
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enableExcelFeatures, selectedCells, data, columnIds, selectedCell, editingCell, selectionRange, lastShiftArrowTime, handleUndo, handleRedo]);

  // Simple Excel Cell Component
  const ExcelCell = ({ 
    value, 
    rowIndex, 
    columnId, 
    isSelected, 
    isFocused, 
    isEditing, 
    isInSelectionRange,
    isRowHeader = false
  }: {
    value: any;
    rowIndex: number;
    columnId: string;
    isSelected: boolean;
    isFocused: boolean;
    isEditing: boolean;
    isInSelectionRange: boolean;
    isRowHeader?: boolean;
  }) => {
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

    const handleKeyDown = async (e: React.KeyboardEvent) => {
      if (isEditing) {
        if (e.key === 'Enter') {
          try {
            await handleUpdateAndNavigate(rowIndex, columnId, editValue, 'ArrowDown');
            handleStopEditing();
          } catch (error) {
            console.error('Error saving on Enter:', error);
          }
          e.preventDefault();
          e.stopPropagation();
        } else if (e.key === 'Escape') {
          handleStopEditing();
          e.preventDefault();
          e.stopPropagation();
        } else if (e.key === 'Tab') {
          handleUpdateAndNavigate(rowIndex, columnId, editValue, e.shiftKey ? 'ArrowLeft' : 'ArrowRight');
          handleStopEditing();
          e.preventDefault();
          e.stopPropagation();
        } else if (e.ctrlKey || e.metaKey) {
          // Handle Ctrl+C, Ctrl+V, Ctrl+A in edit mode
          switch (e.key.toLowerCase()) {
            case 'c':
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.writeText(editValue);
              break;
            case 'v':
              e.preventDefault();
              e.stopPropagation();
              navigator.clipboard.readText().then(text => {
                setEditValue(text);
              }).catch(err => {
                console.error('Failed to read from clipboard:', err);
              });
              break;
            case 'a':
              e.preventDefault();
              e.stopPropagation();
              if (inputRef.current) {
                inputRef.current.select();
              }
              break;
          }
        }
      } else {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'F2', 'Delete', 'Backspace'].includes(e.key)) {
          handleCellKeyDown(e, rowIndex, columnId);
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    const handleBlur = async () => {
      if (isEditing) {
        try {
          await handleUpdateData(rowIndex, columnId, editValue);
          handleStopEditing();
        } catch (error) {
          console.error('Error saving on blur:', error);
        }
      }
    };

    const handleClick = (e: React.MouseEvent) => {
      if (columnId !== 'select' && !isRowHeader) {
        const currentValue = (value || '').toString();
        setEditValue(currentValue);
        handleCellClick(rowIndex, columnId, e);
        handleCellDoubleClick(rowIndex, columnId);
      } else {
        handleCellClick(rowIndex, columnId, e);
      }
    };

    // Row header styling
    if (isRowHeader) {
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
      ${updatingCells.has(`${rowIndex}-${columnId}`) ? 'opacity-50 cursor-not-allowed' : ''}
    `;

    // Excel-like selection styling
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
        onDoubleClick={() => handleCellDoubleClick(rowIndex, columnId)}
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
  };

  // Pre-compute the table body
  const tableBody = useMemo(() => {
    return data.map((rowData, index) => {
      const currentRowHeight = rowHeights[index] || rowHeight;
      
      return (
        <tr key={`row-${index}`} style={{ height: `${currentRowHeight}px` }}>
          {columnIds.map((columnId, cellIndex) => {
            const column = columns[cellIndex];
            const isRowHeader = column?.isRowHeader || false;
            const currentColumnWidth = columnSizes[columnId] || column?.size || 120;
            
            return (
              <td
                key={`${index}-${columnId}`}
                className="border-r border-gray-300 border-b border-gray-300 p-0"
                style={{ 
                  width: currentColumnWidth,
                  minWidth: currentColumnWidth,
                  height: `${currentRowHeight}px`,
                  ...(cellIndex === 0 ? { position: 'sticky', left: 0, zIndex: 1, background: 'white' } : {})
                }}
              >
                {loading ? (
                  <div className={`h-6 animate-pulse ${cellIndex === 0 ? 'bg-gray-100' : 'bg-gray-50'}`}></div>
                ) : (
                  <ExcelCell
                    value={rowData[columnId] || ''}
                    rowIndex={index}
                    columnId={columnId}
                    isSelected={selectedCell?.row === index && selectedCell?.column === columnId}
                    isFocused={focusedCell?.row === index && focusedCell?.column === columnId}
                    isEditing={editingCell?.row === index && editingCell?.column === columnId}
                    isInSelectionRange={isCellInSelectionRange(index, columnId)}
                    isRowHeader={isRowHeader}
                  />
                )}
              </td>
            );
          })}
        </tr>
      );
    });
  }, [data, loading, columns, columnIds, selectedCell?.row, selectedCell?.column, focusedCell?.row, focusedCell?.column, editingCell?.row, editingCell?.column, editValue, isCellInSelectionRange, rowHeights, rowHeight, columnSizes]);

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

  return (
    <div className={`bg-white w-full overflow-hidden relative ${tableHeight}`} style={{ border: '1px solid #d1d5db' }}>
      {/* Excel-like DataGrid */}
      <div className="h-full w-full overflow-auto pb-16" ref={tableRef}>
        <table className="border-collapse w-full" style={{ borderSpacing: 0, tableLayout: 'fixed' }}>
          {/* Excel-like Header */}
          <thead>
            <tr>
              {columns.map((column, index) => {
                const columnId = column.id || column.accessorKey || `col-${index}`;
                const currentColumnWidth = columnSizes[columnId] || column.size;
                
                return (
                  <th
                    key={columnId}
                    className="bg-gray-100 border-r border-gray-300 border-b border-gray-300 px-3 py-2 text-left text-xs font-semibold text-gray-800 uppercase tracking-wide select-none hover:bg-gray-200 relative"
                    style={{ 
                      width: currentColumnWidth,
                      minWidth: currentColumnWidth,
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                      ...(index === 0 ? { left: 0, zIndex: 20 } : {})
                    }}
                  >
                    {column.header}
                    {/* Column resizer */}
                    {enableColumnResize && (
                      <div
                        onMouseDown={(e) => startColumnResize(e, columnId)}
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          width: '6px',
                          height: '100%',
                          cursor: 'col-resize'
                        }}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          
          {/* Excel-like Body */}
          <tbody>
            {tableBody}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && pagination && onPageChange && onItemsPerPageChange && (
        <div className="absolute bottom-0 left-0 right-0">
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
