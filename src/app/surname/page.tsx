'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import SurnameDataTable, { SurnameData } from '../../components/SurnameDataTable';
import { apiService } from '../../services/api';

// Sample data for the surname table (fallback)
const sampleSurnameData = [
  { id: 1, surname: 'Sharma', count: 150, castId: 'SC001', castIda: 'SC001A' },
  { id: 2, surname: 'Verma', count: 120, castId: 'SC002', castIda: 'SC002A' },
  { id: 3, surname: 'Patel', count: 95, castId: 'SC003', castIda: 'SC003A' },
  { id: 4, surname: 'Singh', count: 200, castId: 'SC004', castIda: 'SC004A' },
  { id: 5, surname: 'Kumar', count: 180, castId: 'SC005', castIda: 'SC005A' },
  { id: 6, surname: 'Gupta', count: 110, castId: 'SC006', castIda: 'SC006A' },
  { id: 7, surname: 'Yadav', count: 85, castId: 'SC007', castIda: 'SC007A' },
  { id: 8, surname: 'Rajput', count: 75, castId: 'SC008', castIda: 'SC008A' },
];

// Remove local interface since we're importing it from SurnameDataTable

export default function SurnamePage() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [surnameData, setSurnameData] = useState<SurnameData[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    fname: '',
    mname: ''
  });
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});

  // Checkbox states for surname page form fields
  const [nameChecked, setNameChecked] = useState(false);
  const [fnameChecked, setFnameChecked] = useState(false);
  const [mnameChecked, setMnameChecked] = useState(false);

  // Dropdown state for count filter
  const [countFilter, setCountFilter] = useState('');

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 100,
    totalItems: 0,
    totalPages: 1,
  });

  // Fetch surname data from API with master filters
  const fetchSurnameData = async (filters?: any, page: number = 1, customItemsPerPage?: number) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Combine master filters with form filters
      const combinedFilters = {
        ...masterFilters,
        ...filters
      };
      
      console.log(`🔍 Fetching surname data for page ${page} with combined filters:`, combinedFilters);
      
      // Build query parameters for the API
      const queryParams = new URLSearchParams();
      
      if (combinedFilters.name) {
        queryParams.append('name', combinedFilters.name);
      }
      if (combinedFilters.fname) {
        queryParams.append('fname', combinedFilters.fname);
      }
      if (combinedFilters.mname) {
        queryParams.append('mname', combinedFilters.mname);
      }
      if (combinedFilters.parliament) {
        queryParams.append('parliament', combinedFilters.parliament);
      }
      if (combinedFilters.assembly) {
        queryParams.append('assembly', combinedFilters.assembly);
      }
      if (combinedFilters.district) {
        queryParams.append('district', combinedFilters.district);
      }
      if (combinedFilters.block) {
        queryParams.append('block', combinedFilters.block);
      }
      if (countFilter) {
        queryParams.append('count', countFilter);
      }
      
      // Use custom items per page if provided, otherwise use current pagination state
      const itemsPerPage = customItemsPerPage || pagination.itemsPerPage;
      
      // Add pagination parameters
      queryParams.append('page', page.toString());
      queryParams.append('limit', itemsPerPage.toString());
      
      console.log(`📊 Pagination params - Page: ${page}, Limit: ${itemsPerPage}, Custom: ${customItemsPerPage ? 'Yes' : 'No'}`);
      
      // Call the real API with pagination
      console.log(`🔍 Sending API request with count filter: ${countFilter}`);
      const response = await apiService.getSurnameData({
        name: combinedFilters.name,
        fname: combinedFilters.fname,
        mname: combinedFilters.mname,
        parliament: combinedFilters.parliament,
        assembly: combinedFilters.assembly,
        district: combinedFilters.district,
        block: combinedFilters.block,
        count: countFilter,
        page: page,
        limit: itemsPerPage,
        // If no checkboxes selected, default to 'name' so data does not go blank
        sources: [
          nameChecked ? 'name' : null,
          fnameChecked ? 'fname' : null,
          mnameChecked ? 'mname' : null,
        ].filter(Boolean).join(',') || 'name'
      });
      
      console.log('🔍 API Response:', response);
      
      // Handle new paginated response format
      let data: SurnameData[], paginationInfo: any;
      
      if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
        // New paginated format
        data = (response as any).data;
        paginationInfo = (response as any).pagination;
        console.log('✅ Using new paginated response format');
      } else {
        // Fallback to old format (array)
        data = response as SurnameData[];
        paginationInfo = {
          currentPage: page,
          itemsPerPage: pagination.itemsPerPage,
          totalItems: data?.length || 0,
          totalPages: Math.ceil((data?.length || 0) / pagination.itemsPerPage)
        };
        console.log('⚠️ Using fallback pagination format');
      }
      
      // Count filter is already applied by the backend, no need to filter again
      let filteredData = data;
      
      // Update pagination state with backend info
      const newPaginationState = {
        ...pagination,
        currentPage: paginationInfo.currentPage || page,
        itemsPerPage: customItemsPerPage || pagination.itemsPerPage, // Preserve custom items per page
        totalItems: paginationInfo.totalItems || filteredData.length,
        totalPages: Math.max(1, paginationInfo.totalPages || Math.ceil(filteredData.length / (customItemsPerPage || pagination.itemsPerPage)))
      };
      
      console.log(`🔄 Updating pagination state:`, {
        old: pagination,
        new: newPaginationState,
        dataLength: filteredData.length,
        customItemsPerPage,
        calculatedTotalPages: Math.ceil(filteredData.length / (customItemsPerPage || pagination.itemsPerPage))
      });
      
      setPagination(newPaginationState);
      setSurnameData(filteredData);
      console.log(`✅ Fetched ${filteredData.length} surnames for page ${page} from API`);
      console.log(`📊 Pagination: Page ${page}/${paginationInfo.totalPages || 1}, Total: ${paginationInfo.totalItems || filteredData.length}`);
      
    } catch (error) {
      console.error('Error fetching surname data:', error);
      setError('Failed to fetch surname data. Please try again later.');
      // Fallback to sample data on error
      setSurnameData(sampleSurnameData);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when component mounts
  // useEffect(() => {
  //   fetchSurnameData();
  // }, []);

  // Effect to refetch data when master filters change
  useEffect(() => {
    if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
      console.log('Master filters changed, refetching surname data:', masterFilters);
      // Only fetch if table is already shown
      if (!showTable) {
        setShowTable(true);
      }
      fetchSurnameData();
    } else {
      // If all master filters are cleared, clear data if table is shown
      if (showTable) {
        console.log('All master filters cleared, clearing surname data');
        setSurnameData([]);
      }
    }
  }, [masterFilters, showTable]);

  // Effect to refetch data when count filter changes
  useEffect(() => {
    if (showTable && countFilter !== undefined) {
      console.log('Count filter changed, refetching surname data:', countFilter);
      // Fetch data with current form filters and new count filter
      const currentFilters = {
        name: formData.name,
        fname: formData.fname,
        mname: formData.mname
      };
      fetchSurnameData(currentFilters);
    }
  }, [countFilter, showTable]);

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
    // Note: Don't call fetchSurnameData here as the useEffect will handle it
  };

  const handleGoClick = () => {
    console.log('Go button clicked - processing surname data');
    console.log('Form data:', formData);
    
    // Show the table first
    setShowTable(true);
    
    // Fetch data based on form inputs combined with master filters
    fetchSurnameData({
      name: formData.name,
      fname: formData.fname,
      mname: formData.mname
    });
  };

  const handleClearFilters = async () => {
    setRefreshing(true);
    try {
      setNameChecked(false);
      setFnameChecked(false);
      setMnameChecked(false);
      setFormData({
        name: '',
        fname: '',
        mname: ''
      });
      setCountFilter('');
      
      // Hide the table when clearing filters
      setShowTable(false);
      setSurnameData([]);
      
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
    
    console.log(`🔄 Changing to page ${page} from current page ${pagination.currentPage}`);
    
    setPagination(prev => ({ ...prev, currentPage: page }));
    
    // Fetch data for the new page
    const filters = {
      name: formData.name,
      fname: formData.fname,
      mname: formData.mname
    };
    
    console.log(`📊 Fetching data for page ${page} with filters:`, filters);
    fetchSurnameData(filters, page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    console.log(`🔄 Changing items per page from ${pagination.itemsPerPage} to ${newItemsPerPage}`);
    
    // Update pagination state first
    const newPaginationState = {
      ...pagination,
      itemsPerPage: newItemsPerPage,
      currentPage: 1 // Reset to first page
    };
    
    console.log(`📊 New pagination state:`, newPaginationState);
    
    // Update state immediately
    setPagination(newPaginationState);
    
    // Fetch data with new page size
    const filters = {
      name: formData.name,
      fname: formData.fname,
      mname: formData.mname
    };
    
    console.log(`📊 Fetching data with new page size ${newItemsPerPage} for page 1`);
    console.log(`📊 Using pagination state:`, newPaginationState);
    
    // Fetch data with new page size - pass the new itemsPerPage
    fetchSurnameData(filters, 1, newItemsPerPage);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update surname data function for Excel table
  const handleUpdateSurname = async (id: number, surnameData: Partial<SurnameData>) => {
    try {
      // Update local state immediately for better UX
      setSurnameData(prevData => 
        prevData.map(row => 
          row.id === id 
            ? { ...row, ...surnameData }
            : row
        )
      );
      
      // TODO: Send update to API
      // Example API call:
      // await apiService.updateSurnameData(id, surnameData);
      
      console.log('Saving surname update:', {
        id,
        data: surnameData
      });
      
    } catch (error) {
      console.error('Error saving surname update:', error);
      // Revert local state on error if needed
    }
  };

  // Handle data processing
  const handleProcessData = async (filteredData: SurnameData[]) => {
    setIsProcessing(true);
    try {
      // Use API service to process the data
      const result = await apiService.processSurnameData(filteredData);
      
      if (result.success) {
        setProcessedData(result.processedData);
        console.log('Data processed successfully:', result.message);
      } else {
        throw new Error(result.message || 'Failed to process data');
      }
      
    } catch (error) {
      console.error('Error processing data:', error);
      setError(error instanceof Error ? error.message : 'Failed to process data');
    } finally {
      setIsProcessing(false);
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
              hasData={surnameData && surnameData.length > 0}
            />
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
                Showing surname data filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )}
      
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
      
      {/* Loading Indicator */}
      {/* {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg mx-6 mt-4 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Loading...</strong> Fetching surname data from database
              </p>
            </div>
          </div>
        </div>
      )} */}
      
      {/* Form Fields Section */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-center">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={nameChecked}
                onChange={(e) => {
                  setNameChecked(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, name: '' }));
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                नाम
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={fnameChecked}
                onChange={(e) => {
                  setFnameChecked(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, fname: '' }));
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                पिता का नाम
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={mnameChecked}
                onChange={(e) => {
                  setMnameChecked(e.target.checked);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, mname: '' }));
                  }
                }}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label className="text-sm font-medium text-gray-700 cursor-pointer">
                माँ का नाम
              </label>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoClick}
                disabled={!nameChecked && !fnameChecked && !mnameChecked}
                className={`px-6 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  nameChecked || fnameChecked || mnameChecked
                    ? 'bg-gray-600 text-white hover:bg-gray-900'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>Go</span>
              </button>
              
              <button
                onClick={handleClearFilters}
                disabled={refreshing}
                className={`p-2 rounded-full transition-colors duration-200 border cursor-pointer ${
                  refreshing 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-300'
                }`}
                title={refreshing ? "Refreshing..." : "Refresh Data"}
              >
                {refreshing ? (
                  <svg 
                    className="w-5 h-5 animate-spin" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                ) : (
                  <svg 
                    className="w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                    />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Min Count:</label>
              <select
                value={countFilter}
                onChange={(e) => setCountFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              >
                <option value="">All</option>
                <option value="500">{'>'}500</option>
                <option value="1000">{'>'}1000</option>
                <option value="2000">{'>'}2000</option>
                <option value="5000">{'>'}5000</option>
              </select>
            </div>
          </div>       
        </div>
      </div>
      
      {/* Excel-like Data Table Section */}
      {showTable && (
        <div className="pt-4 pb-4">
          <SurnameDataTable 
            data={surnameData}
            loading={loading}
            onUpdateSurname={handleUpdateSurname}
            onProcessData={handleProcessData}
            processedData={processedData}
            isProcessing={isProcessing}
            pagination={pagination}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            showPagination={true}
          />
        </div>
      )}
      
      {/* No Data Message */}
      {!showTable && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Selected</h3>
            <p className="text-gray-500 mb-4">Select one or more filters and click "Go" to view surname data</p>
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <span>✓</span>
              <span>Check the filters you want to apply</span>
              <span>→</span>
              <span>Click "Go" button</span>
              <span>→</span>
              <span>View results in table</span>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
