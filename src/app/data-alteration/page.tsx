'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import DataTable from '../../components/DataTable';
import { useVoters } from '../../hooks/useVoters';

export default function DataAlterationPage() {
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});

  // New state for column alteration
  const [alterationType, setAlterationType] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [columnValues, setColumnValues] = useState<{ [key: string]: string }>({});

  // Use the useVoters hook with master filters
  const {
    data: voters,
    loading,
    error,
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
      fetchVoters(1, pagination.limit, masterFilters);
    } else {
      // If all master filters are cleared, show all data
      console.log('All master filters cleared, showing all voter data');
      fetchVoters(1, pagination.limit);
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
    // Note: Don't call fetchVoters here as the useEffect will handle it
  };

  const handleVoterUpdate = async (id: number, voterData: any) => {
    try {
      await updateVoter(id, voterData);
      console.log('Voter updated successfully:', { id, data: voterData });
      
      // Refetch data to show updated information
          if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
      fetchVoters(pagination.currentPage, pagination.limit, masterFilters);
    } else {
        fetchVoters(pagination.currentPage, pagination.limit);
      }
    } catch (error) {
      console.error('Error updating voter:', error);
    }
  };

  // Handle alteration type change
  const handleAlterationTypeChange = (type: string) => {
    setAlterationType(type);
    if (type === 'Replace') {
      // Initialize with 5 empty columns for Replace
      const initialColumns = Array.from({ length: 5 }, (_, i) => `Column ${i + 1}`);
      setSelectedColumns(initialColumns);
      setColumnValues({});
    } else {
      setSelectedColumns([]);
      setColumnValues({});
    }
  };

  // Handle column selection change
  const handleColumnChange = (index: number, value: string) => {
    const newColumns = [...selectedColumns];
    newColumns[index] = value;
    setSelectedColumns(newColumns);
  };

  // Handle column value change
  const handleColumnValueChange = (index: number, value: string) => {
    setColumnValues(prev => ({
      ...prev,
      [index]: value
    }));
  };

  // Handle Go button click
  const handleGoClick = () => {
    if (alterationType === 'Replace') {
      console.log('Executing Replace operation with columns:', selectedColumns);
      console.log('Column values:', columnValues);
      // Add your replace logic here
    } else if (alterationType === 'Data Fill') {
      console.log('Executing Data Fill operation');
      // Add your data fill logic here
    }
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
      <div className="mx-6 mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Alteration</h2>
        
        {/* Alteration Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Alteration Type
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

        {/* Conditional Column Selection for Replace */}
        {alterationType === 'Replace' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">Select Columns for Replacement</h3>
            
            {/* Five Column Selection Fields */}
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Column {index + 1}
                  </label>
                  <select
                    value={selectedColumns[index] || ''}
                    onChange={(e) => handleColumnChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  >
                    <option value="">Select column</option>
                    <option value="name">Name</option>
                    <option value="age">Age</option>
                    <option value="gender">Gender</option>
                    <option value="address">Address</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="voter_id">Voter ID</option>
                    <option value="constituency">Constituency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Value
                  </label>
                  <input
                    type="text"
                    value={columnValues[index] || ''}
                    onChange={(e) => handleColumnValueChange(index, e.target.value)}
                    placeholder="Enter new value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 bg-white"
                  />
                </div>
              </div>
            ))}
            
            {/* Go Button */}
            <div className="pt-4">
              <button
                onClick={handleGoClick}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* Data Fill Option Display */}
        {alterationType === 'Data Fill' && (
          <div className="p-4 bg-white rounded-md border border-gray-200">
            <p className="text-gray-600">Data Fill functionality will be implemented here.</p>
          </div>
        )}
      </div>
      
      {/* Data Table Section */}
      {/* <div className="pt-4 pb-4">
        <DataTable 
          data={voters}
          loading={loading}
          error={error}
          pagination={pagination}
          onUpdateVoter={handleVoterUpdate}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          masterFilters={masterFilters}
        />
      </div> */}
      
    </div>
  );
}
