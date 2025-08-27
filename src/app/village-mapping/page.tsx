'use client';

import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, MapPin, Search, RefreshCw } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import CommonPagination from '../../components/CommonPagination';
import { apiService, VillageMappingData, DivisionData } from '../../services/api';
import ExcelDataTable from '../../components/ExcelDataTable';

export default function VillageMappingPage() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [villageData, setVillageData] = useState<VillageMappingData[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [formData, setFormData] = useState({
    villageName: '',
    gp: '',
  });
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});

  // Division/District reference data for mapping District name -> DISTRICT_CODE
  const [divisionData, setDivisionData] = useState<DivisionData[]>([]);

  // Checkbox states for village mapping form fields
  const [villageNameChecked, setVillageNameChecked] = useState(false);
  const [gpChecked, setGpChecked] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 100,
    totalItems: 0,
    totalPages: 1,
  });

  // Fetch village mapping data from API with master filters
  const fetchVillageMappingData = async (filters?: any, page: number = 1) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Combine master filters with form filters
      const combinedFilters = {
        ...masterFilters,
        ...filters
      };
      
      console.log('🔍 Fetching village mapping data with combined filters:', combinedFilters);
      console.log('🔍 API URL:', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002/api'}/village-mapping`);
      
      // Call the actual API
      const response = await apiService.getVillageMappingData({
        villageName: combinedFilters.villageName,
        district: combinedFilters.district,
        block: combinedFilters.block,
        gp: combinedFilters.gp,
        assembly: combinedFilters.assembly,
        parliament: combinedFilters.parliament,
      });
      
      console.log('✅ API Response received:', response);
      
      // Update pagination state
      const totalItems = response.length;
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems,
        totalPages: Math.max(1, totalPages)
      }));
      
      setVillageData(response);
      console.log(`✅ Fetched ${response.length} villages from API with filters:`, combinedFilters);
      
    } catch (error: any) {
      console.error('❌ Error fetching village mapping data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let errorMessage = 'Failed to fetch village mapping data. Please try again later.';
      
      if (error.message?.includes('fetch')) {
        errorMessage = 'Network error: Please check if the backend server is running.';
      } else if (error.message?.includes('500')) {
        errorMessage = 'Server error: Please try again later.';
      } else if (error.message?.includes('404')) {
        errorMessage = 'API endpoint not found. Please check the backend configuration.';
      }
      
      setError(errorMessage);
      // Set empty data on error
      setVillageData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reference division/district data once
  useEffect(() => {
    (async () => {
      try {
        const refData = await apiService.getDivisionData();
        setDivisionData(refData || []);
      } catch (e) {
        console.warn('Failed to load division reference data');
      }
    })();
  }, []);

  // Effect to refetch data when master filters change
  useEffect(() => {
    if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
      console.log('Master filters changed, refetching village mapping data:', masterFilters);
      // Only fetch if table is already shown
      if (!showTable) {
        setShowTable(true);
      }
      fetchVillageMappingData();
    } else {
      // If all master filters are cleared, clear data if table is shown
      if (showTable) {
        console.log('All master filters cleared, clearing village mapping data');
        setVillageData([]);
      }
    }
  }, [masterFilters, showTable]);

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
    // Note: Don't call fetchVillageMappingData here as the useEffect will handle it
  };

  const handleGoClick = () => {
    console.log('Go button clicked - processing village mapping data');
    console.log('Form data:', formData);
    
    // Show the table first
    setShowTable(true);
    
    // Fetch data based on form inputs combined with master filters
    fetchVillageMappingData({
      villageName: formData.villageName,
      district: masterFilters.district,
      block: masterFilters.block,
      gp: formData.gp,
      assembly: masterFilters.assembly,
      parliament: masterFilters.parliament
    });
  };

  const handleClearFilters = async () => {
    setRefreshing(true);
    try {
      setVillageNameChecked(false);
      setGpChecked(false);
      setFormData({
        villageName: '',
        gp: '',
      });
      
      // Hide the table when clearing filters
      setShowTable(false);
      setVillageData([]);
      
      // Reset pagination
      setPagination(prev => ({
        ...prev,
        currentPage: 1,
        totalItems: 0,
        totalPages: 1
      }));
    } finally {
      setRefreshing(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    
    setPagination(prev => ({ ...prev, currentPage: page }));
    
    // Fetch data for the new page
    const filters = {
      villageName: formData.villageName,
      district: masterFilters.district,
      block: masterFilters.block,
      gp: formData.gp,
      assembly: masterFilters.assembly,
      parliament: masterFilters.parliament
    };
    
    fetchVillageMappingData(filters, page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setPagination(prev => ({ 
      ...prev, 
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page
    }));
    
    // Fetch data with new page size
    const filters = {
      villageName: formData.villageName,
      district: masterFilters.district,
      block: masterFilters.block,
      gp: formData.gp,
      assembly: masterFilters.assembly,
      parliament: masterFilters.parliament
    };
    
    fetchVillageMappingData(filters, 1);
  };

  // Decide which columns to show based on selected checkboxes
  const allColumns = [
    { key: 'district', label: 'District no' },
    { key: 'block', label: 'Block' },
    { key: 'gp', label: 'GP' },
    { key: 'assembly', label: 'AC' },
    { key: 'parliament', label: 'PC' },
    { key: 'villageName', label: 'Village' },
  ] as const;

  const showAllColumns = villageNameChecked; // If village selected, show all
  const columnsToShow = showAllColumns ? allColumns : allColumns.slice(0, 4); // If GP selected, show first 4

  const getCellValue = (colKey: typeof allColumns[number]['key'], row: VillageMappingData) => {
    switch (colKey) {
      case 'district':
        {
          // Try to map district name to DISTRICT_CODE from reference table
          const targetName = (row.district || '').toString().trim().toLowerCase();
          const match = divisionData.find(d => (d.DISTRICT_ENG || '').toString().trim().toLowerCase() === targetName);
          return match ? String(match.DISTRICT_ID) : row.district;
        }
      case 'block':
        return row.block;
      case 'gp':
        return row.gp;
      case 'assembly':
        return row.assembly;
      case 'parliament':
        return row.parliament;
      case 'villageName':
        return row.villageName;
      default:
        return '';
    }
  };

  // ExcelDataTable column definitions (with row header)
  const excelColumns = [
    { id: 'select', header: '#', size: 60, isRowHeader: true },
    ...columnsToShow.map(col => ({ id: col.key, accessorKey: col.key, header: col.label, size: 160 }))
  ];

  // Transform data for display: replace district name with its DISTRICT_ID (if found)
  const displayVillageData = useMemo(() => {
    if (!Array.isArray(villageData) || villageData.length === 0) return villageData as any;
    return villageData.map(row => {
      const targetName = (row.district || '').toString().trim().toLowerCase();
      const match = divisionData.find(d => (d.DISTRICT_ENG || '').toString().trim().toLowerCase() === targetName);
      return match ? { ...row, district: String(match.DISTRICT_ID) } : row;
    });
  }, [villageData, divisionData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update village mapping data function
  const handleUpdateVillageMapping = async (id: number, villageData: Partial<VillageMappingData>) => {
    try {
      // Update local state immediately for better UX
      setVillageData(prevData => 
        prevData.map(row => 
          row.id === id 
            ? { ...row, ...villageData }
            : row
        )
      );
      
      // Send update to API
      const result = await apiService.updateVillageMapping(id, villageData);
      
      if (result.success) {
        console.log('✅ Village mapping updated successfully:', result);
        // Optionally refresh data to get the latest from server
        // fetchVillageMappingData();
      } else {
        console.error('❌ Failed to update village mapping:', result);
        // Revert local state on error
        setVillageData(prevData => 
          prevData.map(row => 
            row.id === id 
              ? { ...row, ...villageData }
              : row
          )
        );
      }
      
    } catch (error) {
      console.error('Error saving village mapping update:', error);
      // Revert local state on error
      setVillageData(prevData => 
        prevData.map(row => 
          row.id === id 
            ? { ...row, ...villageData }
            : row
        )
      );
      setError('Failed to update village mapping data. Please try again.');
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
            <MasterFilter 
              onMasterFilterChange={handleMasterFilterChange} 
              hasData={villageData && villageData.length > 0}
            />
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
                Showing village mapping data filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg mx-6 mt-4 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-red-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Fields Section */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-center">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-4 gap-6 mb-6">
            {/* गाँव का नाम */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={villageNameChecked}
                onChange={(e) => {
                  setVillageNameChecked(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, villageName: '' }));
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                गाँव का नाम
              </label>
            </div>
            
            {/* ग्राम पंचायत */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={gpChecked}
                onChange={(e) => {
                  setGpChecked(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, gp: '' }));
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                ग्राम पंचायत
              </label>
            </div>
            
            {/* Search Button */}
            <div className="flex items-center">
              <button
                onClick={handleGoClick}
                disabled={!villageNameChecked && !gpChecked}
                className={`px-6 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  villageNameChecked || gpChecked
                    ? 'bg-gray-600 text-white hover:bg-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Search size={16} />
                <span>Search</span>
              </button>
            </div>
            
            {/* Clear Filters Button */}
            <div className="flex items-center">
              <button
                onClick={handleClearFilters}
                disabled={refreshing}
                className={`p-2 rounded-full transition-colors duration-200 border cursor-pointer ${
                  refreshing 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                }`}
                title={refreshing ? "Refreshing..." : "Clear Filters"}
              >
                {refreshing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Village Mapping Data Table Section */}
      {showTable && (
        <div className="pt-4 pb-4">
          <div className="mx-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Village Mapping Data
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {loading ? 'Loading...' : `Showing ${villageData.length} villages`}
                </p>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading village mapping data...</span>
                  </div>
                </div>
              )}
              
              {/* Data Table (Excel-like) */}
              {!loading && (
                <div className="overflow-x-auto">
                  {displayVillageData.length > 0 ? (
                    <ExcelDataTable
                      data={displayVillageData as unknown as Record<string, any>[]}
                      columns={excelColumns as any}
                      loading={loading}
                      onUpdateRow={async (rowIndex, columnId, value) => {
                        // Ignore row header updates
                        if (columnId === 'select') return;
                        const row = displayVillageData[rowIndex];
                        if (!row) return;
                        const update: Partial<VillageMappingData> = {} as any;
                        // Only allow updates for known keys
                        if (['district','block','gp','assembly','parliament','villageName'].includes(columnId)) {
                          (update as any)[columnId] = value;
                          await handleUpdateVillageMapping(row.id, update);
                        }
                      }}
                      showPagination={pagination.totalPages > 1}
                      pagination={pagination}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      showRefreshButton={true}
                      onRefresh={() => fetchVillageMappingData({
                        villageName: formData.villageName,
                        district: masterFilters.district,
                        block: masterFilters.block,
                        gp: formData.gp,
                        assembly: masterFilters.assembly,
                        parliament: masterFilters.parliament
                      }, pagination.currentPage)}
                      tableHeight="h-[70vh]"
                    />
                  ) : (
                    <div className="px-6 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <MapPin className="w-8 h-8 text-gray-300 mb-2" />
                        <p>No village mapping data found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Pagination */}
              {!loading && pagination.totalPages > 1 && (
                <CommonPagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  itemsPerPage={pagination.itemsPerPage}
                  totalItems={pagination.totalItems}
                />
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* No Data Message */}
      {!showTable && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <MapPin className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Village Mapping Data Selected</h3>
            <p className="text-gray-500 mb-4">Select one or more filters and click "Search" to view village mapping data</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <span>✓</span>
              <span>Check the filters you want to apply</span>
              <span>→</span>
              <span>Click "Search" button</span>
              <span>→</span>
              <span>View results in table</span>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
