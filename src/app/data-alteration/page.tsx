'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import { useVoters } from '../../hooks/useVoters';

interface ColumnValue {
  value: string;
  count: number;
}

interface Replacement {
  columnName: string;
  oldValue: string;
  newValue: string;
}

export default function DataAlterationPage() {
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});

  // Column alteration state
  const [alterationType, setAlterationType] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<{ [key: string]: ColumnValue[] }>({});
  const [selectedOldValues, setSelectedOldValues] = useState<{ [key: string]: string }>({});
  const [newValues, setNewValues] = useState<{ [key: string]: string }>({});
  
  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [rowUpdating, setRowUpdating] = useState<{ [key: number]: boolean }>({});
  
  // Use the useVoters hook with master filters
  const {
    data: voters,
    loading: votersLoading,
    error: votersError,
    pagination,
    fetchVoters,
    updateVoter,
    handlePageChange,
    handleItemsPerPageChange
  } = useVoters();

  // Effect to refetch data when master filters change
  useEffect(() => {
    if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
      console.log('Master filters changed, refetching voter data:', masterFilters);
      fetchVoters(1, pagination.itemsPerPage, masterFilters);
    } else {
      console.log('All master filters cleared, showing all voter data');
      fetchVoters(1, pagination.itemsPerPage);
    }
  }, [masterFilters]);

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
    
    // Clear previous column values when filters change
    setColumnValues({});
    setSelectedOldValues({});
    setNewValues({});
    setUpdateResult(null);
    setError('');
  };

  // Handle alteration type change
  const handleAlterationTypeChange = (type: string) => {
    setAlterationType(type);
    if (type === 'Replace') {
      // Initialize with 5 empty columns for Replace
      const initialColumns = Array.from({ length: 5 }, (_, i) => `Column ${i + 1}`);
      setSelectedColumns(initialColumns);
      setColumnValues({});
      setSelectedOldValues({});
      setNewValues({});
    } else {
      setSelectedColumns([]);
      setColumnValues({});
      setSelectedOldValues({});
      setNewValues({});
    }
    setUpdateResult(null);
    setError('');
  };

  // Handle column selection change
  const handleColumnChange = async (index: number, columnName: string) => {
    const newColumns = [...selectedColumns];
    newColumns[index] = columnName;
    setSelectedColumns(newColumns);
    
    // Clear previous values for this column
    setSelectedOldValues(prev => ({ ...prev, [index]: '' }));
    setNewValues(prev => ({ ...prev, [index]: '' }));
    
    // Fetch column values if column is selected and master filters are set
    if (columnName && (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block)) {
      await fetchColumnValues(columnName, index);
    }
  };

  // Fetch column values from API
  const fetchColumnValues = async (columnName: string, index: number) => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      if (masterFilters.parliament) queryParams.append('parliament', masterFilters.parliament);
      if (masterFilters.assembly) queryParams.append('assembly', masterFilters.assembly);
      if (masterFilters.district) queryParams.append('district', masterFilters.district);
      if (masterFilters.block) queryParams.append('block', masterFilters.block);
      
      // Use the correct backend URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
      const fullUrl = `${API_BASE_URL}/column-values/${columnName}?${queryParams}`;
      
      console.log(`🔍 Fetching column values from: ${fullUrl}`);
      console.log('Master filters:', masterFilters);
      
      const response = await fetch(fullUrl);
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check if backend is running.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setColumnValues(prev => ({
          ...prev,
          [index]: result.data
        }));
        console.log(`✅ Fetched ${result.data.length} values for ${columnName}:`, result.data.slice(0, 3));
      } else {
        throw new Error(result.error || 'Failed to fetch column values');
      }
    } catch (err: any) {
      console.error('Error fetching column values:', err);
      setError(`Failed to fetch values for ${columnName}: ${err.message}`);
      setColumnValues(prev => ({
        ...prev,
        [index]: []
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle old value selection
  const handleOldValueChange = (index: number, value: string) => {
    setSelectedOldValues(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Handle new value change
  const handleNewValueChange = (index: number, value: string) => {
    setNewValues(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Handle Go button click
  const handleGoClick = async () => {
    try {
      setUpdating(true);
      setError('');
      setUpdateResult(null);
      
      // Prepare replacements data
      const replacements: Replacement[] = [];
      for (let i = 0; i < 5; i++) {
        const columnName = selectedColumns[i];
        const oldValue = selectedOldValues[i];
        const newValue = newValues[i];
        
        if (columnName && oldValue && newValue) {
          replacements.push({
            columnName,
            oldValue,
            newValue
          });
        }
      }
      
      if (replacements.length === 0) {
        setError('Please select at least one column and provide old and new values');
        return;
      }
      
      // Call update API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${API_BASE_URL}/update-voters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parliament: masterFilters.parliament,
          assembly: masterFilters.assembly,
          district: masterFilters.district,
          block: masterFilters.block,
          replacements
        }),
      });
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check content type to ensure we're getting JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check if backend is running.');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setUpdateResult(result);
        console.log('✅ Voters updated successfully:', result);
        
        // Trigger refresh event for DataTable to sync data
        window.dispatchEvent(new CustomEvent('dataAlterationUpdate', {
          detail: {
            success: true,
            message: result.message,
            totalUpdated: result.totalUpdated,
            updateResults: result.updateResults
          }
        }));
        
        // Refresh voter data to show updated information
        if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
          fetchVoters(pagination.currentPage, pagination.itemsPerPage, masterFilters);
        } else {
          fetchVoters(pagination.currentPage, pagination.itemsPerPage);
        }
      } else {
        throw new Error(result.error || 'Failed to update voters');
      }
    } catch (err: any) {
      console.error('Error updating voters:', err);
      setError(`Failed to update voters: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Handle per-row Update click
  const handleRowUpdate = async (index: number) => {
    try {
      // Validate row completeness
      const columnName = selectedColumns[index];
      const oldValue = selectedOldValues[index];
      const newValue = newValues[index];
      if (!columnName || !oldValue || !newValue) return;

      // Set row loading
      setRowUpdating(prev => ({ ...prev, [index]: true }));
      setError('');

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${API_BASE_URL}/update-voters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parliament: masterFilters.parliament,
          assembly: masterFilters.assembly,
          district: masterFilters.district,
          block: masterFilters.block,
          replacements: [{ columnName, oldValue, newValue }]
        })
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(`HTTP ${response.status}: ${txt}`);
      }

      const result = await response.json();

      // Dispatch event so DataTable refreshes
      window.dispatchEvent(new CustomEvent('dataAlterationUpdate', {
        detail: {
          success: result.success,
          message: result.message,
          totalUpdated: result.totalUpdated,
          updateResults: result.updateResults
        }
      }));

      // Refresh local voter data if needed
      if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
        fetchVoters(pagination.currentPage, pagination.itemsPerPage, masterFilters);
      } else {
        fetchVoters(pagination.currentPage, pagination.itemsPerPage);
      }
    } catch (err: any) {
      console.error('Row update failed:', err);
      setError(err.message || 'Row update failed');
    } finally {
      setRowUpdating(prev => ({ ...prev, [index]: false }));
    }
  };

  // Check if all required fields are filled for a row
  const isRowComplete = (index: number) => {
    return selectedColumns[index] && selectedOldValues[index] && newValues[index];
  };

  // Check if any row is complete
  const hasCompleteRows = () => {
    return Array.from({ length: 5 }, (_, i) => isRowComplete(i)).some(Boolean);
  };

  return (
    <div>
      {/* Back to Modules Button and Master Filter */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl flex items-center space-x-6">
          <button
            onClick={() => window.history.back()}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            title="Back"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="flex-1">
            <MasterFilter onMasterFilterChange={handleMasterFilterChange} />
          </div>
        </div>
      </div>
      
      <Navbar />
      
      {/* Master Filter Status Display */}
      {(masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg mx-6 mt-4 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Active Filters:</strong> {[
                  masterFilters.parliament && `Parliament: ${masterFilters.parliament}`,
                  masterFilters.assembly && `Assembly: ${masterFilters.assembly}`,
                  masterFilters.district && `District: ${masterFilters.district}`,
                  masterFilters.block && `Block: ${masterFilters.block}`
                ].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing voter data filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Column Alteration Section */}
      <div className="mx-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Alteration</h2>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left Side - Only Alteration Type Selection */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Select Alteration Type</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alteration Type
              </label>
              <select
                value={alterationType}
                onChange={(e) => handleAlterationTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
              >
                <option value="">Select an option</option>
                <option value="Replace">Replace</option>
                <option value="Data Fill">Data Fill</option>
              </select>
            </div>
          </div>

          {/* Right Side - Blank Space */}
          <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            {/* Blank space for future use */}
          </div>
        </div>

        {/* Full Width Replacement Table Below */}
        {alterationType === 'Replace' && (
          <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Column Replacement Table</h3>
            
            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Select master filters above, then choose columns and values for replacement. 
                The system will update all matching records based on your master filter selection.
              </p>
              {!masterFilters.parliament && !masterFilters.assembly && !masterFilters.district && !masterFilters.block && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ <strong>Note:</strong> Please select at least one master filter (Parliament, Assembly, District, or Block) to enable column value fetching.
                </p>
              )}
            </div>
            
            {/* Proper Table Format */}
            <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Current Column
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Current Value
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      New Value
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <select
                          value={selectedColumns[index] || ''}
                          onChange={(e) => handleColumnChange(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                        >
                          <option value="">Select column</option>
                          <option value="name">Name</option>
                          <option value="father_name">Father's Name</option>
                          <option value="mother_name">Mother's Name</option>
                          <option value="surname">Surname</option>
                          <option value="caste">Caste</option>
                          <option value="caste_category">Caste Category</option>
                          <option value="mobile_number">Mobile Number</option>
                          <option value="date_of_birth">Date of Birth</option>
                          <option value="age">Age</option>
                          <option value="district">District</option>
                          <option value="block">Block</option>
                          <option value="gp">GP (Tehsil)</option>
                          <option value="village">Village</option>
                          <option value="parliament">Parliament</option>
                          <option value="assembly">Assembly</option>
                          <option value="temp_family_Id">Family ID</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        {selectedColumns[index] && columnValues[index] ? (
                          <select
                            value={selectedOldValues[index] || ''}
                            onChange={(e) => handleOldValueChange(index, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                            disabled={loading}
                          >
                            <option value="">Select current value</option>
                            {columnValues[index].map((item, idx) => (
                              <option key={idx} value={item.value}>
                                {item.value} ({item.count} records)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {loading ? (
                              <div className="flex items-center">
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </div>
                            ) : (
                              'Select column first'
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={newValues[index] || ''}
                          onChange={(e) => handleNewValueChange(index, e.target.value)}
                          placeholder="Enter new value"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500"
                          disabled={!selectedOldValues[index]}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleRowUpdate(index)}
                          disabled={!isRowComplete(index) || !!rowUpdating[index]}
                          className={`px-3 py-1 text-xs rounded ${
                            isRowComplete(index) && !rowUpdating[index]
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {rowUpdating[index] ? (
                            <span className="inline-flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Updating</span>
                          ) : (
                            'Update'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
            
            {/* Update Result Display */}
            {/* {updateResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Update Successful!</span>
                  </div>
                  <button
                    onClick={() => {
                      // Trigger refresh event for DataTable
                      window.dispatchEvent(new CustomEvent('dataAlterationUpdate', {
                        detail: {
                          success: true,
                          message: 'Manual refresh triggered',
                          totalUpdated: updateResult.totalUpdated,
                          updateResults: updateResult.updateResults
                        }
                      }));
                    }}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    Refresh DataTable
                  </button>
                </div>
                <p className="text-sm text-green-700 mb-2">{updateResult.message}</p>
                <div className="text-xs text-green-600">
                  <p>Total records updated: {updateResult.totalUpdated}</p>
                  {updateResult.updateResults.map((result: any, idx: number) => (
                    <p key={idx}>
                      {result.columnName}: {result.oldValue} → {result.newValue} ({result.affectedRows} records)
                    </p>
                  ))}
                </div>
                <div className="mt-3 text-xs text-green-600">
                  <p>💡 <strong>Tip:</strong> The DataTable should automatically refresh to show updated data. If not, use the "Refresh DataTable" button above.</p>
                </div>
              </div>
            )} */}
            
            {/* Go Button */}
            <div className="pt-4">
              <button
                onClick={handleGoClick}
                disabled={!hasCompleteRows() || updating}
                className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                  hasCompleteRows() && !updating
                    ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {updating ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  'Go'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Data Fill Option Display */}
        {alterationType === 'Data Fill' && (
          <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Data Fill</h3>
            <div className="p-4 bg-white rounded-md border border-gray-200">
              <p className="text-gray-600">Data Fill functionality will be implemented here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
