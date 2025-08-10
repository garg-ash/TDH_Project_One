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
  }>({});

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
    if (masterFilters.parliament || masterFilters.assembly || masterFilters.district) {
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
      district: filters.district
    });
    // Note: Don't call fetchVoters here as the useEffect will handle it
  };

  const handleVoterUpdate = async (id: number, voterData: any) => {
    try {
      await updateVoter(id, voterData);
      console.log('Voter updated successfully:', { id, data: voterData });
      
      // Refetch data to show updated information
      if (masterFilters.parliament || masterFilters.assembly || masterFilters.district) {
        fetchVoters(pagination.currentPage, pagination.limit, masterFilters);
      } else {
        fetchVoters(pagination.currentPage, pagination.limit);
      }
    } catch (error) {
      console.error('Error updating voter:', error);
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
      {(masterFilters.parliament || masterFilters.assembly || masterFilters.district) && (
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
                  masterFilters.district && `District: ${masterFilters.district}`
                ].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing voter data filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Table Section */}
      <div className="pt-4 pb-4">
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
      </div>
      
    </div>
  );
}
