'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import ExcelDataTable from './ExcelDataTable';
import CommonPagination from './CommonPagination';
import ProcessedDataTable from './ProcessedDataTable';
import FilterMessage from './FilterMessage';

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

// Helper: extract last word from name (only if there are at least 2 words)
const extractSurname = (name?: string): string => {
  if (!name) return '';
  const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
  return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
};

// Column definitions for ExcelDataTable
const columns = [
  {
    accessorKey: 'checkbox',
    header: 'Select',
    size: 50,
    isRowHeader: true,
    readOnly: true,
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
    type: 'numeric'
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
  {
    accessorKey: 'processStatus',
    header: 'Process Status',
    size: 120,
    readOnly: true,
  },
  {
    accessorKey: 'lastProcessed',
    header: 'Last Processed',
    size: 150,
    readOnly: true,
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
  
  // Add state for processed data view
  const [showProcessedData, setShowProcessedData] = useState(false);
  const [processingData, setProcessingData] = useState(false);
  
  // Add state for row selection
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Add state for process tracking
  const [processHistory, setProcessHistory] = useState<Map<number, {
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'needs_review';
    lastProcessed: string;
    notes: string;
    processedBy: string;
  }>>(new Map());

  // Compute surname strictly from name's last word, then filter out blanks
  // Use backend-provided surname; only drop rows with truly blank surnames
  const filteredData = useMemo(() => {
    // For imported data, be less strict about filtering
    // Show all rows but mark those without surnames
    const processedData = (data || []).map((item, index) => {
      const processInfo = processHistory.get(index) || {
        status: 'pending',
        lastProcessed: '',
        notes: '',
        processedBy: ''
      };
      
      return {
        ...item,
        checkbox: selectedRows.has(index), // Add checkbox state
        surname: item.surname || item.name?.split(' ').pop() || 'Unknown',
        processStatus: processInfo.status,
        lastProcessed: processInfo.lastProcessed
      };
    });
    
    // Log data processing for debugging
    console.log(`📊 SurnameDataTable: Processing ${data?.length || 0} rows, filtered to ${processedData.length} rows`);
    if (data && data.length > 0) {
      console.log('📊 Sample data:', data.slice(0, 3));
      console.log('📊 Sample filtered data:', processedData.slice(0, 3));
    }
    
    return processedData;
  }, [data, selectedRows, processHistory]);

  // Handle row updates
  const handleUpdateRow = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    try {
      const surnameItem = filteredData[rowIndex];
      if (!surnameItem) {
        console.log(`Cannot update row ${rowIndex} - no data available`);
        return;
      }

      console.log(`Saving ${columnId} = "${value}" for surname ${surnameItem.id} at row ${rowIndex}`);
      
      // Call the update function asynchronously
      await onUpdateSurname(surnameItem.id, { [columnId]: value });
      console.log(`Successfully updated ${columnId} for surname ${surnameItem.id}`);
      
    } catch (error) {
      console.error('Error updating surname:', error);
    }
  }, [filteredData, onUpdateSurname]);

  // Handle bulk updates
  const handleBulkUpdate = useCallback(async (updates: Array<{rowIndex: number, columnId: string, value: any}>) => {
    try {
      console.log(`Processing ${updates.length} bulk updates`);
      
      for (const update of updates) {
        const surnameItem = filteredData[update.rowIndex];
        if (surnameItem) {
          await onUpdateSurname(surnameItem.id, { [update.columnId]: update.value });
        }
      }
      
      console.log(`Successfully processed ${updates.length} bulk updates`);
    } catch (error) {
      console.error('Error in bulk update:', error);
    }
  }, [filteredData, onUpdateSurname]);

  // Handle checkbox selection
  const handleCheckboxChange = useCallback((rowIndex: number, checked: boolean) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (checked) {
        newSelected.add(rowIndex);
      } else {
        newSelected.delete(rowIndex);
      }
      return newSelected;
    });
  }, []);

  // Handle select all checkbox
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIndices = new Set(Array.from({ length: data.length }, (_, i) => i));
      setSelectedRows(allIndices);
      setSelectAll(true);
    } else {
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  }, [data.length]);

  // Show process history for a specific row
  const showRowProcessHistory = useCallback((rowIndex: number) => {
    setSelectedRowForHistory(rowIndex);
    setShowProcessHistoryModal(true);
  }, []);

  // Listen for checkbox changes from ExcelDataTable
  useEffect(() => {
    const handleCheckboxChange = (event: CustomEvent) => {
      const { rowIndex, checked } = event.detail;
      setSelectedRows(prev => {
        const newSelected = new Set(prev);
        if (checked) {
          newSelected.add(rowIndex);
        } else {
          newSelected.delete(rowIndex);
        }
        return newSelected;
      });
    };

    const handleShowProcessHistory = (event: CustomEvent) => {
      const { rowIndex } = event.detail;
      showRowProcessHistory(rowIndex);
    };

    window.addEventListener('checkboxChange', handleCheckboxChange as EventListener);
    window.addEventListener('showProcessHistory', handleShowProcessHistory as EventListener);
    
    return () => {
      window.removeEventListener('checkboxChange', handleCheckboxChange as EventListener);
      window.removeEventListener('showProcessHistory', handleShowProcessHistory as EventListener);
    };
  }, [showRowProcessHistory]);

  // Update select all checkbox state when individual selections change
  useEffect(() => {
    if (selectedRows.size === 0) {
      setSelectAll(false);
    } else if (selectedRows.size === data.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedRows.size, data.length]);

  // Process individual row
  const processRow = useCallback(async (rowIndex: number) => {
    try {
      // Mark as processing
      setProcessHistory(prev => new Map(prev).set(rowIndex, {
        status: 'processing',
        lastProcessed: new Date().toISOString(),
        notes: 'Processing started...',
        processedBy: 'System'
      }));

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process the data (clean, validate, enrich)
      const rowData = data[rowIndex];
      const processedData = {
        ...rowData,
        surname: (rowData.surname || '').trim().replace(/\s+/g, ' '),
        religion: (rowData.religion || '').trim().replace(/\b\w/g, l => l.toUpperCase()),
        castId: rowData.castId || 'General',
        castIda: rowData.castIda || 'General'
      };

      // Mark as completed
      setProcessHistory(prev => new Map(prev).set(rowIndex, {
        status: 'completed',
        lastProcessed: new Date().toISOString(),
        notes: 'Data cleaned and validated successfully',
        processedBy: 'System'
      }));

      console.log(`✅ Row ${rowIndex} processed successfully:`, processedData);
      
    } catch (error) {
      console.error(`❌ Error processing row ${rowIndex}:`, error);
      
      // Mark as failed
      setProcessHistory(prev => new Map(prev).set(rowIndex, {
        status: 'failed',
        lastProcessed: new Date().toISOString(),
        notes: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processedBy: 'System'
      }));
    }
  }, [data]);

  // Process selected rows
  const processSelectedRows = useCallback(async () => {
    if (selectedRows.size === 0) {
      alert('Please select rows to process');
      return;
    }

    setProcessingData(true);
    try {
      const promises = Array.from(selectedRows).map(rowIndex => processRow(rowIndex));
      await Promise.all(promises);
      
      alert(`✅ Successfully processed ${selectedRows.size} rows!`);
      setSelectedRows(new Set()); // Clear selection after processing
      
    } catch (error) {
      console.error('Error processing selected rows:', error);
      alert('❌ Error processing some rows. Check console for details.');
    } finally {
      setProcessingData(false);
    }
  }, [selectedRows, processRow]);

  // Process history modal state
  const [showProcessHistoryModal, setShowProcessHistoryModal] = useState(false);
  const [selectedRowForHistory, setSelectedRowForHistory] = useState<number | null>(null);

  // Process all rows
  const processAllRows = useCallback(async () => {
    if (data.length === 0) {
      alert('No data to process');
      return;
    }

    const shouldProcess = confirm(`Process all ${data.length} rows? This may take some time.`);
    if (!shouldProcess) return;

    setProcessingData(true);
    try {
      const promises = Array.from({ length: data.length }, (_, i) => processRow(i));
      await Promise.all(promises);
      
      alert(`✅ Successfully processed all ${data.length} rows!`);
      
    } catch (error) {
      console.error('Error processing all rows:', error);
      alert('❌ Error processing some rows. Check console for details.');
    } finally {
      setProcessingData(false);
    }
  }, [data, processRow]);

  // Handle process button click
  const handleProcessData = async () => {
    if (!onProcessData || !data || data.length === 0) return;
    
    console.log('🔍 SurnameDataTable handleProcessData called with:', {
      dataLength: data?.length || 0,
      filteredDataLength: filteredData?.length || 0,
      firstDataRow: data?.[0],
      firstFilteredRow: filteredData?.[0],
      onProcessData: !!onProcessData
    });
    
    setProcessingData(true);
    try {
      // Pass the full data array instead of filteredData to show all records
      await onProcessData(data);
      setShowProcessedData(true);
    } catch (error) {
      console.error('Error processing data:', error);
    } finally {
      setProcessingData(false);
    }
  };

  // Show processed data table if available
  if (showProcessedData && processedData) {
    return (
      <div className="bg-white h-screen w-full overflow-hidden relative">
        {/* Header with back button - Higher z-index to ensure visibility */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center relative z-50">
          <h2 className="text-lg font-semibold text-gray-800">Processed Results</h2>
          <button
            onClick={() => setShowProcessedData(false)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors font-medium"
          >
            ← Back to Surname Data
          </button>
        </div>
        
        {/* Processed Data Table will be rendered here */}
        <div className="relative z-10">
          <ProcessedDataTable data={processedData} />
        </div>
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
  if (!filteredData || filteredData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4">
        <FilterMessage 
          message="डेटा देखने के लिए क्षेत्र का चयन करें"
          subMessage="कृपया Religion, Cast Category, Cast, Surname में से एक या अधिक फ़िल्टर चुनें और 'Go' दबाएँ"
          icon="🔍"
        />
      </div>
    );
  }

  return (
    <div className="bg-white w-full overflow-visible relative m-0 p-0" style={{ border: '1px solid #d1d5db', minHeight: '600px', margin: '0', padding: '0' }}>
      {/* Add Process Button */}
      {/* {filteredData && filteredData.length > 0 && (
        <div className="bg-blue-50 px-6 py-3 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <div className="text-blue-800">
              <span className="font-medium">{data?.length || 0}</span> total records • 
              <span className="font-medium text-green-700 ml-2">
                {filteredData.length}
              </span> with surnames
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
      )} */}

      {/* Excel-like DataGrid using ExcelDataTable */}
      <div className="w-full overflow-auto m-0 p-0" style={{ height: 'auto', minHeight: '400px', margin: '0', padding: '0' }}>
        {/* Select All Header */}
        <div className="bg-gray-50 px-6 py-2 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span>Select All ({selectedRows.size} selected)</span>
            </label>
          </div>
          <div className="flex items-center space-x-3">
            {/* Process Buttons */}
            <button
              onClick={processAllRows}
              disabled={processingData || data.length === 0}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Process all rows"
            >
              {processingData ? 'Processing...' : 'Process All'}
            </button>
            
            {selectedRows.size > 0 && (
              <>
                <button
                  onClick={processSelectedRows}
                  disabled={processingData}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  title="Process selected rows"
                >
                  {processingData ? 'Processing...' : `Process ${selectedRows.size} Selected`}
                </button>
                <button
                  onClick={() => setSelectedRows(new Set())}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Clear Selection
                </button>
              </>
            )}
            
            {/* Selection Count */}
            {selectedRows.size > 0 && (
              <div className="text-sm text-blue-600 font-medium">
                {selectedRows.size} row(s) selected
              </div>
            )}
          </div>
        </div>
        
        {/* Process Status Summary */}
        <div className="bg-blue-50 px-6 py-2 border-b border-blue-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-blue-800">
                <span className="font-medium">Total Rows:</span> {data.length}
              </span>
              <span className="text-green-700">
                <span className="font-medium">Completed:</span> {Array.from(processHistory.values()).filter(p => p.status === 'completed').length}
              </span>
              <span className="text-yellow-600">
                <span className="font-medium">Pending:</span> {Array.from(processHistory.values()).filter(p => p.status === 'pending').length}
              </span>
              <span className="text-red-600">
                <span className="font-medium">Failed:</span> {Array.from(processHistory.values()).filter(p => p.status === 'failed').length}
              </span>
            </div>
            <div className="text-blue-600">
              {processingData && (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                  Processing...
                </span>
              )}
            </div>
          </div>
        </div>
        
        <ExcelDataTable
          data={filteredData}
          columns={columns}
          loading={loading}
          onUpdateRow={handleUpdateRow}
          onBulkUpdate={handleBulkUpdate}
          pagination={pagination}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
          showPagination={false}
          enableExcelFeatures={true}
          showRefreshButton={false}
          tableHeight="h-full"
          rowHeight={28}
          enableColumnResize={true}
          enableRowResize={true}
        />
      </div>
      
      {/* Debug info - show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-white p-0 text-xs text-gray-600 border-t">
          Debug: Showing {filteredData?.length || 0} rows out of {data?.length || 0} total records
        </div>
      )}

      {/* Grid Footer (show only when we have filtered data) */}
      {filteredData && filteredData.length > 0 && (
        <div className="bg-white px-0 border-t border-gray-200 absolute bottom-0 left-0 right-0">
          {showPagination && pagination && onPageChange && onItemsPerPageChange ? (
            <CommonPagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={pagination.itemsPerPage}
              onPageChange={onPageChange}
              onItemsPerPageChange={onItemsPerPageChange}
              loading={loading}
              showRefreshButton={false}
            />
          ) : (
            <div className="flex justify-between items-center text-sm text-gray-700">
              <div>
                Showing {filteredData?.length || 0} surname entries
              </div>
              <div className="text-gray-500">
                Total Records: {data?.length || 0} • With Surnames: {filteredData?.length || 0}
              </div>
            </div>
          )}
        </div>
            )}
      
      {/* Process History Modal */}
      {showProcessHistoryModal && selectedRowForHistory !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Process History - Row {selectedRowForHistory + 1}
              </h3>
              <button
                onClick={() => setShowProcessHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {(() => {
                const processInfo = processHistory.get(selectedRowForHistory);
                if (!processInfo) {
                  return (
                    <div className="text-gray-500 text-center py-4">
                      No process history available for this row.
                    </div>
                  );
                }
                
                return (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className={`px-3 py-2 rounded text-sm font-medium ${
                          processInfo.status === 'completed' ? 'bg-green-100 text-green-800' :
                          processInfo.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                          processInfo.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {processInfo.status.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Processed By</label>
                        <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                          {processInfo.processedBy || 'System'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Processed</label>
                      <div className="px-3 py-2 bg-gray-100 rounded text-sm">
                        {processInfo.lastProcessed ? 
                          new Date(processInfo.lastProcessed).toLocaleString('en-IN') : 
                          'Never'
                        }
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <div className="px-3 py-2 bg-gray-100 rounded text-sm min-h-20">
                        {processInfo.notes || 'No notes available'}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowProcessHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      
    </div>
  );
}
