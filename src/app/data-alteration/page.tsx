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
    
    // Clear previous values for this column and all subsequent columns
    setSelectedOldValues(prev => ({ ...prev, [index]: '' }));
    setNewValues(prev => ({ ...prev, [index]: '' }));
    
    // Clear values for all subsequent columns when first column changes
    if (index === 0) {
      for (let i = 1; i < 5; i++) {
        setColumnValues(prev => ({ ...prev, [i]: [] }));
        setSelectedOldValues(prev => ({ ...prev, [i]: '' }));
        setNewValues(prev => ({ ...prev, [i]: '' }));
      }
    }
    
    // Fetch column values based on dependency rules
    if (columnName) {
      if (index === 0) {
        // First column depends on master filters
        if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
          await fetchColumnValues(columnName, index);
        }
      } else {
        // Other columns depend on first column selection
        if (selectedColumns[0] && selectedOldValues[0]) {
          await fetchDependentColumnValues(columnName, index, selectedColumns[0], selectedOldValues[0]);
        }
      }
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

  // Fetch dependent column values (for columns 2-5 - depends on first column selection)
  const fetchDependentColumnValues = async (columnName: string, index: number, firstColumn: string, firstColumnValue: string) => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      // Include master filters
      if (masterFilters.parliament) queryParams.append('parliament', masterFilters.parliament);
      if (masterFilters.assembly) queryParams.append('assembly', masterFilters.assembly);
      if (masterFilters.district) queryParams.append('district', masterFilters.district);
      if (masterFilters.block) queryParams.append('block', masterFilters.block);
      // Include first column filter
      queryParams.append('filter_column', firstColumn);
      queryParams.append('filter_value', firstColumnValue);
      
      // Use the correct backend URL
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api';
      const fullUrl = `${API_BASE_URL}/dependent-column-values/${columnName}?${queryParams}`;
      
      console.log(`🔍 Fetching dependent column values from: ${fullUrl}`);
      console.log('Dependent filters:', { firstColumn, firstColumnValue, masterFilters });
      
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
        console.log(`✅ Fetched ${result.data.length} dependent values for ${columnName}:`, result.data.slice(0, 3));
      } else {
        throw new Error(result.error || 'Failed to fetch dependent column values');
      }
    } catch (err: any) {
      console.error('Error fetching dependent column values:', err);
      setError(`Failed to fetch dependent values for ${columnName}: ${err.message}`);
      setColumnValues(prev => ({
        ...prev,
        [index]: []
      }));
    } finally {
      setLoading(false);
    }
  };

  // Handle old value selection
  const handleOldValueChange = async (index: number, value: string) => {
    setSelectedOldValues(prev => ({
      ...prev,
      [index]: value
    }));
    
    // If first column value changes, refresh dependent columns
    if (index === 0 && value) {
      // Clear all subsequent columns
      for (let i = 1; i < 5; i++) {
        setColumnValues(prev => ({ ...prev, [i]: [] }));
        setSelectedOldValues(prev => ({ ...prev, [i]: '' }));
        setNewValues(prev => ({ ...prev, [i]: '' }));
      }
      
      // Refresh dependent columns that already have column names selected
      for (let i = 1; i < 5; i++) {
        if (selectedColumns[i]) {
          await fetchDependentColumnValues(selectedColumns[i], i, selectedColumns[0], value);
        }
      }
    }
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
      {/* {(masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) && (
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
      )} */}
      
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
            
            
            {/* Excel-like Table Format */}
            <div className="bg-white rounded-md border-2 border-gray-300 overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-400">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Current Column
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Current Value
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-r border-gray-300">
                      New Value
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 uppercase border-l border-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }, (_, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300">
                        <select
                          value={selectedColumns[index] || ''}
                          onChange={(e) => handleColumnChange(index, e.target.value)}
                          className={`w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            index > 0 && (!selectedColumns[0] || !selectedOldValues[0]) 
                              ? 'bg-gray-100 cursor-not-allowed' 
                              : 'bg-white'
                          }`}
                          disabled={index > 0 && (!selectedColumns[0] || !selectedOldValues[0])}
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
                        {index > 0 && (!selectedColumns[0] || !selectedOldValues[0]) && (
                          <div className="text-xs text-gray-500 mt-1">
                            Complete first column first
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300">
                        {selectedColumns[index] && columnValues[index] ? (
                          <select
                            value={selectedOldValues[index] || ''}
                            onChange={(e) => handleOldValueChange(index, e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                          <div className="text-sm text-gray-500 px-3 py-2 bg-gray-50 rounded border border-gray-200">
                            {loading ? (
                              <div className="flex items-center">
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </div>
                            ) : index === 0 ? (
                              'Select column first'
                            ) : index === 1 ? (
                              'Select first column value first'
                            ) : (
                              'Complete previous columns first'
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
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          disabled={!selectedOldValues[index]}
                        />
                      </td>
                      <td className="px-4 py-3 text-center border-l border-gray-300">
                        <button
                          onClick={() => handleRowUpdate(index)}
                          disabled={!isRowComplete(index) || !!rowUpdating[index]}
                          className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                            isRowComplete(index) && !rowUpdating[index]
                              ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {rowUpdating[index] ? (
                            <span className="inline-flex items-center">
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Updating
                            </span>
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
            
            {/* Go Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleGoClick}
                disabled={!hasCompleteRows() || updating}
                className={`px-8 py-3 rounded-md font-medium text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  hasCompleteRows() && !updating
                    ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {updating ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  'Execute All Updates'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Data Fill Option Display */}
        {alterationType === 'Data Fill' && (
          <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Data Fill</h3>
            
            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Use Data Fill to populate empty fields or standardize data across multiple records. 
                Select master filters above to limit the scope of the operation.
              </p>
              {!masterFilters.parliament && !masterFilters.assembly && !masterFilters.district && !masterFilters.block && (
                <p className="text-sm text-orange-700 mt-2">
                  ⚠️ <strong>Note:</strong> Please select at least one master filter (Parliament, Assembly, District, or Block) to enable data fill operations.
                </p>
              )}
            </div>

            {/* Data Fill Form */}
            <div className="bg-white rounded-md border-2 border-gray-300 overflow-hidden shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-400">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Row
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Target Column
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-wider border-r border-gray-300">
                      Fill Method
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800 uppercase tracking-r border-gray-300">
                      Fill Value/Condition
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-800 uppercase border-l border-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 3 }, (_, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-300 text-center">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-300">
                        <select
                          value={selectedColumns[index] || ''}
                          onChange={(e) => handleColumnChange(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                      <td className="px-4 py-3 border-r border-gray-300">
                        <select
                          value={selectedOldValues[index] || ''}
                          onChange={(e) => handleOldValueChange(index, e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          disabled={!selectedColumns[index]}
                        >
                          <option value="">Select method</option>
                          <option value="fill_empty">Fill Empty Fields</option>
                          <option value="fill_pattern">Pattern Based Fill</option>
                          <option value="standardize">Standardize Format</option>
                          <option value="conditional">Conditional Fill</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={newValues[index] || ''}
                          onChange={(e) => handleNewValueChange(index, e.target.value)}
                          placeholder="Enter fill value or condition"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          disabled={!selectedOldValues[index]}
                        />
                      </td>
                      <td className="px-4 py-3 text-center border-l border-gray-300">
                        <button
                          onClick={() => handleRowUpdate(index)}
                          disabled={!isRowComplete(index) || !!rowUpdating[index]}
                          className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
                            isRowComplete(index) && !rowUpdating[index]
                              ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {rowUpdating[index] ? (
                            <span className="inline-flex items-center">
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Filling...
                            </span>
                          ) : (
                            'Fill Data'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Data Fill Examples */}
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Examples:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Fill Empty:</strong> Target: "caste_category", Method: "Fill Empty Fields", Value: "General"</p>
                <p><strong>Pattern Based:</strong> Target: "mobile_number", Method: "Pattern Based Fill", Value: "0000000000"</p>
                <p><strong>Standardize:</strong> Target: "caste", Method: "Standardize Format", Value: "Title Case"</p>
                <p><strong>Conditional:</strong> Target: "voter_type", Method: "Conditional Fill", Value: "age &gt; 18 ? 'Adult' : 'Minor'"</p>
              </div>
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

            {/* Execute All Button */}
            <div className="pt-4 flex justify-center">
              <button
                onClick={handleGoClick}
                disabled={!hasCompleteRows() || updating}
                className={`px-8 py-3 rounded-md font-medium text-base focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
                  hasCompleteRows() && !updating
                    ? 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 shadow-md hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {updating ? (
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Filling Data...
                  </div>
                ) : (
                  'Execute All Data Fills'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
