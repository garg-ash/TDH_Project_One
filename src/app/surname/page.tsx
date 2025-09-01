'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import SurnameDataTable, { SurnameData } from '../../components/SurnameDataTable';
import { apiService } from '../../services/api';
import FilterMessage from '@/components/FilterMessage';
import CommonPagination from '@/components/CommonPagination';
import { useLocalStorage, safeLocalStorage } from '../../hooks/useLocalStorage';


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

  // Dropdown states for surname page form fields
  const [selectedField, setSelectedField] = useState('');
  const [showFieldDropdown, setShowFieldDropdown] = useState(false);

  // State for saved data management
  const [savedDataCount, setSavedDataCount] = useState(0);
  
  // State for import session to control button enable/disable
  const [hasImportSession, setHasImportSession] = useState<boolean>(false);

  // Dropdown state for count filter
  const [countFilter, setCountFilter] = useState('');
  const [countSearchValue, setCountSearchValue] = useState('');
  const [showCountDropdown, setShowCountDropdown] = useState(false);
  const [countDropdownSearch, setCountDropdownSearch] = useState('');
  
  // Field options for dropdown
  const fieldOptions = [
    { value: 'name', label: 'नाम' },
    { value: 'fname', label: 'पिता का नाम' },
    { value: 'mname', label: 'माँ का नाम' }
  ];

  // Count options for dropdown
  const countOptions = [
    { value: 500, label: '>500' },
    { value: 1000, label: '>1000' },
    { value: 2000, label: '>2000' },
    { value: 5000, label: '>5000' },
    { value: 10000, label: '>10000' },
    { value: 15000, label: '>15000' },
    { value: 20000, label: '>20000' },
    { value: 25000, label: '>25000' },
    { value: 30000, label: '>30000' },
    { value: 50000, label: '>50000' }
  ];

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 100,
    totalItems: 0,
    totalPages: 1,
  });

  // Helper: whether any master filter is selected
  const hasMasterSelected = !!(masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block);

  // Load saved data count on component mount (client-side only)
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    try {
      const savedSaves = JSON.parse(safeLocalStorage.getItem('surnameSaves') || '[]');
      setSavedDataCount(savedSaves.length);
    } catch (error) {
      console.error('Error loading saved data count:', error);
    }
  }, []);

  // Check for import session on component mount and when localStorage changes
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const checkImportSession = () => {
      const sessionData = safeLocalStorage.getItem('surnameImportSession');
      setHasImportSession(!!sessionData);
    };
    
    // Check initially
    checkImportSession();
    
    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'surnameImportSession') {
        checkImportSession();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check when window gains focus (for same-tab updates)
    const handleFocus = () => {
      checkImportSession();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.count-dropdown-container')) {
        setShowCountDropdown(false);
        setCountDropdownSearch('');
      }
      if (!target.closest('.field-dropdown-container')) {
        setShowFieldDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch surname data from API with master filters
  const fetchSurnameData = async (filters?: any, page: number = 1, customItemsPerPage?: number) => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Hard guard: do not fetch unless at least one master filter is selected
      if (!hasMasterSelected) {
        console.log('⛔ Skipping fetch - no master filter selected');
        setSurnameData([]);
        setShowTable(false);
        setLoading(false);
        return;
      }

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
        // If no field selected, default to 'name' so data does not go blank
        sources: selectedField || 'name'
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
      setSurnameData([]);
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
    
    // Check if imported data exists for these filters after a short delay
    setTimeout(() => {
      checkForImportedData();
    }, 100);
    
    // Note: Don't call fetchSurnameData here as the useEffect will handle it
  };

  const handleGoClick = () => {
    console.log('Go button clicked - processing surname data');
    console.log('Form data:', formData);
    console.log('Selected field:', selectedField);
    
    if (!hasMasterSelected) {
      console.log('⛔ Go blocked - no master filter selected');
      return;
    }
    
    if (!selectedField) {
      console.log('⛔ Go blocked - no field selected');
      return;
    }
    
    // Show the table first
    setShowTable(true);
    
    // Fetch data based on selected field and form data combined with master filters
    fetchSurnameData({
      name: formData.name,
      fname: formData.fname,
      mname: formData.mname
    });
  };

  const handleClearFilters = async () => {
    setRefreshing(true);
    try {
          setSelectedField('');
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
    console.log(`📊 Selected field: ${selectedField}`);
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
    console.log(`📊 Selected field: ${selectedField}`);
    
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
    console.log('🔄 Processing data in handleProcessData:', {
      receivedDataLength: filteredData?.length || 0,
      firstRow: filteredData?.[0],
      lastRow: filteredData?.[filteredData.length - 1],
      masterFilters
    });
    
    setIsProcessing(true);
    try {
      // Enrich rows with current master filters so AC/PC/District/Block appear in processed table
      const enriched = filteredData.map(item => ({
        ...item,
        assembly: masterFilters.assembly || '',
        parliament: masterFilters.parliament || '',
        district: masterFilters.district || '',
        block: masterFilters.block || ''
      }));
      
      console.log('📊 Enriched data for processing:', {
        enrichedLength: enriched.length,
        sampleEnriched: enriched[0]
      });
      
      // Use API service to process the data
      const result = await apiService.processSurnameData(enriched);
      
      console.log('✅ Processing result:', {
        success: result.success,
        processedDataLength: result.processedData?.length || 0,
        message: result.message,
        totalRecords: result.totalRecords
      });
      
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

  // Handle Import button click - Import CSV or Excel data to backend
  const handleImportClick = async () => {
    console.log('Import button clicked');
    
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,.xlsx,.xls';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (!file) return;
      
      try {
        setLoading(true);
        
        if (!file.name.toLowerCase().endsWith('.csv') && 
            !file.name.toLowerCase().endsWith('.xlsx') && 
            !file.name.toLowerCase().endsWith('.xls')) {
          alert('❌ Please select a CSV or Excel file (.csv, .xlsx, .xls) for import.');
          return;
        }
        
        // Create FormData for backend upload
        const formData = new FormData();
        formData.append('file', file);
        
        // Add master filters if they exist
        if (masterFilters.parliament) formData.append('parliament', masterFilters.parliament);
        if (masterFilters.assembly) formData.append('assembly', masterFilters.assembly);
        if (masterFilters.district) formData.append('district', masterFilters.district);
        if (masterFilters.block) formData.append('block', masterFilters.block);
        
        console.log('📤 Uploading file with master filters:', masterFilters);
        
        console.log('📤 Uploading CSV to backend with filters:', masterFilters);
        
        // Upload to backend
        const response = await fetch('http://localhost:5002/api/import', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${errorText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Import successful:', result);
          
          // Store session info for later use
          const importSession = {
            sessionId: result.sessionId,
            tempTableName: result.tempTableName,
            importedRows: result.importedRows,
            fileName: result.fileName,
            masterFilters: masterFilters // Store the master filters used during import
          };
          
          // Store in localStorage for persistence
          safeLocalStorage.setItem('surnameImportSession', JSON.stringify(importSession));
          
          // Update state to enable View Imported button
          setHasImportSession(true);
          
          // Show success message
          const fileType = result.fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'Excel';
          const filterInfo = Object.keys(masterFilters).length > 0 ? 
            `\nFilters applied: ${JSON.stringify(masterFilters)}` : '';
          alert(`✅ Successfully imported ${result.importedRows} rows from ${fileType} file: ${result.fileName}!${filterInfo}\n\nSession ID: ${result.sessionId}\n\nData is now stored in temporary table and can be viewed/exported.`);
          
          // Optionally, you can load the imported data here
          // For now, we'll just show success and store session info
          
        } else {
          throw new Error(result.message || 'Import failed');
        }
        
      } catch (error) {
        console.error('Import error:', error);
        alert(`❌ Error importing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
        // Clean up
        document.body.removeChild(fileInput);
      }
    };
    
    // Trigger file selection
    document.body.appendChild(fileInput);
    fileInput.click();
  };

  // Handle Count Selection
  const handleCountSelect = (value: string) => {
    setCountFilter(value);
    setCountSearchValue(value === '' ? '' : `>${value}`);
    setShowCountDropdown(false);
    setCountDropdownSearch('');
  };

  // Handle View Imported Data button click
  const handleViewImportedData = async () => {
    try {
      const sessionData = safeLocalStorage.getItem('surnameImportSession');
      if (!sessionData) {
        alert('❌ No import session found. Please import data first.');
        return;
      }
      
      const importSession = JSON.parse(sessionData);
      console.log('🔍 Viewing imported data for session:', importSession);
      
      // Fetch imported data from backend (request all records)
      const response = await fetch(`http://localhost:5002/api/imported-data/${importSession.sessionId}?limit=10000`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch imported data: ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Imported data loaded:', result.data.length, 'rows');
        
        // Log the raw data for debugging
        console.log('📊 Raw imported data sample:', result.data.slice(0, 3));
        
        // Convert imported data to SurnameData format
        const convertedData: SurnameData[] = result.data.map((row: any, index: number) => {
          // Log any suspicious religion values
          if (row.religion && (row.religion.includes(' ') || row.religion.length > 15)) {
            console.log(`⚠️ Row ${index + 1}: Religion value looks suspicious: "${row.religion}"`);
          }
          
          // Log any suspicious caste values
          if (row.caste && (row.caste.includes(' ') || row.caste.length > 20)) {
            console.log(`⚠️ Row ${index + 1}: Caste value looks suspicious: "${row.caste}"`);
          }
          
          // Improved surname extraction logic
          let extractedSurname = '';
          if (row.surname && row.surname.trim()) {
            extractedSurname = row.surname.trim();
          } else if (row.name && row.name.trim()) {
            const nameParts = row.name.trim().split(/\s+/).filter((part: string) => part.trim() !== '');
            if (nameParts.length > 0) {
              // For Hindi names, try to get the last meaningful part
              extractedSurname = nameParts[nameParts.length - 1];
              // If it's too short (like single characters), try the second last
              if (extractedSurname.length <= 1 && nameParts.length > 1) {
                extractedSurname = nameParts[nameParts.length - 2];
              }
            }
          }
          
          // Log surname extraction for debugging
          if (index < 5) { // Log first 5 rows for debugging
            console.log(`Row ${index + 1}: Name="${row.name}", Extracted Surname="${extractedSurname}"`);
          }
          
          return {
            id: index + 1,
            name: row.name || '',
            religion: row.religion || '',
            surname: extractedSurname,
            count: 1, // Set count to 1 for imported data since it's individual records
            castId: row.caste || '',
            castIda: row.caste || '',
            castIdFromOtherTable: '',
            castIdaFromOtherTable: ''
          };
        });
        
        console.log('✅ Converted data sample:', convertedData.slice(0, 3));
        
        // Update the surname data with imported data
        setSurnameData(convertedData);
        setShowTable(true);
        setPagination(prev => ({
          ...prev,
          totalItems: convertedData.length,
          totalPages: Math.ceil(convertedData.length / prev.itemsPerPage)
        }));
        
        const statusInfo = importSession.status === 'saved' ? '\n\n💾 Status: Data has been saved to permanent table' : '\n\n📝 Status: Data is in temporary table (use "Save to DB" button to save permanently)';
        alert(`✅ Loaded ${convertedData.length} imported records!\n\nFile: ${importSession.fileName}\nSession: ${importSession.sessionId}${statusInfo}`);
        
      } else {
        throw new Error(result.error || 'Failed to load imported data');
      }
      
    } catch (error) {
      console.error('Error viewing imported data:', error);
      alert(`❌ Error loading imported data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle Export button click - Export to CSV
  const handleExportClick = () => {
    console.log('Export button clicked');
    if (!surnameData || surnameData.length === 0) {
      alert('No data to export. Please fetch data first.');
      return;
    }
    
    try {
      // Create CSV content
      const headers = ['ID', 'Name', 'Religion', 'Surname', 'Count', 'Cast ID', 'Cast Category', 'Cast Id (Other)', 'Cast IDA (Other)'];
      
      const csvContent = [
        headers.join(','),
        ...surnameData.map(row => [
          row.id,
          `"${row.name || ''}"`,
          `"${row.religion || ''}"`,
          `"${row.surname || ''}"`,
          row.count,
          `"${row.castId || ''}"`,
          `"${row.castIda || ''}"`,
          `"${row.castIdFromOtherTable || ''}"`,
          `"${row.castIdaFromOtherTable || ''}"`
        ].join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `surname_data_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Successfully exported ${surnameData.length} records to CSV!`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Error exporting data. Please try again.');
    }
  };

  // Handle Save button click - Save current data and filters to localStorage and optionally to database
  const handleSaveClick = async () => {
    console.log('Save button clicked');
    if (!surnameData || surnameData.length === 0) {
      alert('No data to save. Please fetch data first.');
      return;
    }
    
    try {
      // Check if this is imported data
      const sessionData = localStorage.getItem('surnameImportSession');
      let isImportedData = false;
      let importSessionInfo = null;
      
      if (sessionData) {
        try {
          const importSession = JSON.parse(sessionData);
          isImportedData = true;
          importSessionInfo = importSession;
        } catch (e) {
          // Not imported data
        }
      }
      
      // If this is imported data, ask user if they want to save to database
      if (isImportedData && importSessionInfo) {
        // Validate that the import session is still valid
        try {
          const sessionCheckResponse = await fetch(`http://localhost:5002/api/imported-data/${importSessionInfo.sessionId}?limit=1`);
          if (!sessionCheckResponse.ok) {
            throw new Error('Import session is no longer valid');
          }
        } catch (sessionError) {
          const errorMessage = sessionError instanceof Error ? sessionError.message : 'Unknown session error';
          alert(`❌ Import session is no longer valid. Please re-import your file.\n\nError: ${errorMessage}`);
          // Fallback to localStorage save
          await saveToLocalStorage();
          return;
        }
        const saveToDatabase = confirm(
          `💾 Save Modified Data to Database\n\n` +
          `File: ${importSessionInfo.fileName}\n` +
          `Records: ${surnameData.length}\n\n` +
          `⚠️ IMPORTANT: This will REPLACE existing data for the current filters!\n` +
          `• Old records matching these filters will be DELETED\n` +
          `• New modified data will be INSERTED\n` +
          `• This ensures your modifications are permanently saved\n\n` +
          `Choose save option:\n` +
          `• Click "OK" to SAVE modified data to database (permanent storage)\n` +
          `• Click "Cancel" to save to localStorage only\n\n` +
          `Which option do you prefer?`
        );
        
        if (saveToDatabase) {
          // Final confirmation for destructive operation
          const finalConfirm = confirm(
            `🚨 FINAL CONFIRMATION REQUIRED!\n\n` +
            `You are about to REPLACE data in the database.\n` +
            `This action will:\n` +
            `• DELETE ${importSessionInfo.importedRows} existing records matching current filters\n` +
            `• INSERT ${importSessionInfo.importedRows} new records from imported file\n` +
            `• This action CANNOT be undone!\n\n` +
            `Are you absolutely sure you want to proceed?`
          );
          
          if (!finalConfirm) {
            alert('❌ Operation cancelled. Data was not saved to database.');
            return;
          }
          
          // Save to database using the correct endpoint
          setLoading(true);
          
          try {
            // Use the working saveImportedDataToDatabase function
            const saveSuccess = await saveImportedDataToDatabase(surnameData, masterFilters, importSessionInfo.fileName);
            
            if (saveSuccess) {
              // Update session status
              importSessionInfo.status = 'saved';
              safeLocalStorage.setItem('surnameImportSession', JSON.stringify(importSessionInfo));
              setHasImportSession(true);
              
              return; // Exit early since we've handled database save
            } else {
              throw new Error('Save operation failed');
            }
            
          } catch (dbError) {
            console.error('Error saving to database:', dbError);
            alert(`❌ Error saving to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}\n\nFalling back to localStorage save only.`);
            
            // Fallback to localStorage save
            await saveToLocalStorage();
          } finally {
            setLoading(false);
          }
          
          return; // Exit early since we've handled database save
        }
      }
      
      // Save to localStorage only (for non-imported data or when user chooses localStorage)
      await saveToLocalStorage();
      
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Error saving data. Please try again.');
    }
  };

  // Working save function using the correct backend endpoint
  const saveImportedDataToDatabase = async (data: SurnameData[], filters: any, fileName: string) => {
    try {
      console.log('🚀 Starting database save process...');
      console.log('📊 Data to save:', data.length, 'records');
      console.log('🔍 Filters:', filters);
      console.log('📁 File name:', fileName);
      
      // Get the import session info
      const importSessionInfo = JSON.parse(localStorage.getItem('surnameImportSession') || '{}');
      console.log('📋 Import session info:', importSessionInfo);
      
      if (!importSessionInfo.sessionId) {
        console.error('❌ No session ID found in import session info');
        throw new Error('No import session found. Please re-import your file.');
      }
      
      console.log('🔄 Using correct endpoint: /api/save-imported-data/:sessionId');
      console.log('📋 Session ID:', importSessionInfo.sessionId);
      
      // Use the correct backend endpoint that actually exists
      const requestBody = {
        targetTable: 'voters', // Save to voters table (this is what the backend expects)
        replaceMode: true // Replace existing data for these filters
      };
      
      console.log('📤 Request body:', requestBody);
      
      const response = await fetch(`http://localhost:5002/api/save-imported-data/${importSessionInfo.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Save request failed:', errorText);
        throw new Error(`Failed to save to database: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('✅ Save response:', result);
      
      if (result.success) {
        const replaceInfo = result.replaceMode && result.deletedCount > 0 ? 
          `\n🗑️ Old records deleted: ${result.deletedCount}` : '';
        
        // Check if there were any errors during the process
        if (result.errors && result.errors.length > 0) {
          console.log('⚠️ Some errors occurred:', result.errors);
          alert(`⚠️ Partially successful operation!\n\n` +
                `Total records processed: ${result.totalRecords}\n` +
                `Records saved: ${result.savedCount}${replaceInfo}\n` +
                `Errors occurred: ${result.errors.length}\n\n` +
                `Some data was saved, but there were issues with some records.`);
        } else {
          alert(`✅ Successfully saved data to database!\n\n` +
                `Total records processed: ${result.totalRecords}\n` +
                `Records saved: ${result.savedCount}${replaceInfo}\n\n` +
                `💡 Next time you apply the same filters, you'll get this modified data from the database!`);
        }
        
        return true;
      } else {
        console.error('❌ Save failed:', result.error);
        throw new Error(result.error || 'Failed to save to database');
      }
      
    } catch (error) {
      console.error('❌ Error saving data to database:', error);
      alert(`❌ Error saving to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  // Helper function to save to localStorage
  const saveToLocalStorage = async () => {
    try {
      // Create a save object with current data and filters
      const saveData = {
        timestamp: new Date().toISOString(),
        data: surnameData,
        filters: {
          masterFilters,
          formData,
          countFilter,
          pagination: {
            currentPage: pagination.currentPage,
            itemsPerPage: pagination.itemsPerPage
          }
        },
        totalRecords: surnameData.length,
        // Add import session info if this is imported data
        importSession: (() => {
          const sessionData = safeLocalStorage.getItem('surnameImportSession');
          if (sessionData) {
            try {
              return JSON.parse(sessionData);
            } catch (e) {
              return null;
            }
          }
          return null;
        })()
      };
      
      // Generate a unique name for this save
      const saveName = `Surname_Data_${new Date().toISOString().split('T')[0]}_${Date.now()}`;
      
      // Save to localStorage
      const existingSaves = JSON.parse(safeLocalStorage.getItem('surnameSaves') || '[]');
      const newSave = {
        id: Date.now().toString(),
        name: saveName,
        ...saveData
      };
      
      existingSaves.push(newSave);
      safeLocalStorage.setItem('surnameSaves', JSON.stringify(existingSaves));
      
      // Also save the current state for quick recovery
      safeLocalStorage.setItem('surnameCurrentState', JSON.stringify(saveData));
      
      alert(`✅ Successfully saved ${surnameData.length} records to localStorage!\n\nSave Name: ${saveName}\n\nYou can recover this data later from the browser's local storage.`);
      
      // Update saved data count
      setSavedDataCount(existingSaves.length);
    } catch (error) {
      console.error('LocalStorage save error:', error);
      alert('❌ Error saving to localStorage. Please try again.');
    }
  };

  // Function to load saved data
  const loadSavedData = () => {
    try {
      const savedSaves = JSON.parse(safeLocalStorage.getItem('surnameSaves') || '[]');
      
      if (savedSaves.length === 0) {
        alert('No saved data found.');
        return;
      }
      
      // Show a simple list of saved data
      const saveNames = savedSaves.map((save: any, index: number) => 
        `${index + 1}. ${save.name} (${save.totalRecords} records)`
      ).join('\n');
      
      const saveIndex = prompt(
        `Select a save to load (1-${savedSaves.length}):\n\n${saveNames}\n\nEnter the number:`
      );
      
      if (saveIndex && !isNaN(parseInt(saveIndex))) {
        const index = parseInt(saveIndex) - 1;
        if (index >= 0 && index < savedSaves.length) {
          const selectedSave = savedSaves[index];
          
          // Load the data
          setSurnameData(selectedSave.data);
          setShowTable(true);
          
          // Load the filters
          setMasterFilters(selectedSave.filters.masterFilters || {});
          setFormData(selectedSave.filters.formData || { name: '', fname: '', mname: '' });
          setCountFilter(selectedSave.filters.countFilter || '');
          
          // Update pagination
          setPagination(prev => ({
            ...prev,
            currentPage: selectedSave.filters.pagination?.currentPage || 1,
            totalItems: selectedSave.data.length,
            totalPages: Math.ceil(selectedSave.data.length / prev.itemsPerPage)
          }));
          
                  // Update selected field based on loaded form data
        if (selectedSave.filters.formData?.name) {
          setSelectedField('name');
        } else if (selectedSave.filters.formData?.fname) {
          setSelectedField('fname');
        } else if (selectedSave.filters.formData?.mname) {
          setSelectedField('mname');
        } else {
          setSelectedField('');
        }
          
          alert(`✅ Successfully loaded saved data: ${selectedSave.name}\n\nRecords: ${selectedSave.totalRecords}\nFilters and data have been restored.`);
          
          // If this was imported data, also restore the import session
          if (selectedSave.importSession) {
            safeLocalStorage.setItem('surnameImportSession', JSON.stringify(selectedSave.importSession));
            console.log('✅ Import session restored:', selectedSave.importSession);
          }
        } else {
          alert('Invalid selection.');
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      alert('❌ Error loading saved data. Please try again.');
    }
  };





  // Function to check if imported data exists for current filters
  const checkForImportedData = async () => {
    try {
      const sessionData = safeLocalStorage.getItem('surnameImportSession');
      if (!sessionData) return;
      
      const importSession = JSON.parse(sessionData);
      
      // Check if the current filters match the filters used during import
      const currentFilters = {
        parliament: masterFilters.parliament || '',
        assembly: masterFilters.assembly || '',
        district: masterFilters.district || '',
        block: masterFilters.block || ''
      };
      
      const importFilters = importSession.masterFilters || {};
      
      // Check if filters match
      const filtersMatch = 
        currentFilters.parliament === importFilters.parliament &&
        currentFilters.assembly === importFilters.assembly &&
        currentFilters.district === importFilters.district &&
        currentFilters.block === importFilters.block;
      
      if (filtersMatch) {
        // Show option to load imported data
        const shouldLoad = confirm(
          `🔍 Found imported data for these filters!\n\n` +
          `File: ${importSession.fileName}\n` +
          `Records: ${importSession.importedRows}\n\n` +
          `Would you like to load this imported data instead of fetching from database?`
        );
        
        if (shouldLoad) {
          await handleViewImportedData();
        }
      }
    } catch (error) {
      console.error('Error checking for imported data:', error);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Back to Modules Button and Master Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
    
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg mx-6 mt-4 p-3 shadow-none">
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
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-8">
            {/* Field Selection Dropdown */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Search Field:</label>
              <div className="relative field-dropdown-container">
                <button
                  onClick={() => setShowFieldDropdown(!showFieldDropdown)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 min-w-40 flex items-center justify-between"
                >
                  <span>{selectedField ? fieldOptions.find(f => f.value === selectedField)?.label : 'Select Field'}</span>
                  <svg className="w-4 h-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Options */}
                {showFieldDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                    <div className="py-1">
                      {fieldOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedField(option.value);
                            setShowFieldDropdown(false);
                            // Clear form data when field changes
                            setFormData({
                              name: '',
                              fname: '',
                              mname: ''
                            });
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            selectedField === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700">Min Count:</label>
              
              {/* Searchable Count Dropdown */}
              <div className="relative count-dropdown-container" style={{ zIndex: 9999 }}>
                <input
                  type="text"
                  placeholder="Search count..."
                  value={countSearchValue}
                  onChange={(e) => setCountSearchValue(e.target.value)}
                  onFocus={() => setShowCountDropdown(true)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 w-40"
                />
                
                {/* Dropdown Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Dropdown Options */}
                {showCountDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {/* Search Input in Dropdown */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
                      <input
                        type="text"
                        placeholder="Type to search..."
                        value={countDropdownSearch}
                        onChange={(e) => setCountDropdownSearch(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                        autoFocus
                      />
                    </div>
                    
                    {/* Options */}
                    <div className="py-1">
                      <button
                        onClick={() => handleCountSelect('')}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                          countFilter === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        All
                      </button>
                      
                      {countOptions
                        .filter(option => 
                          option.label.toLowerCase().includes(countDropdownSearch.toLowerCase()) ||
                          option.value.toString().includes(countDropdownSearch)
                        )
                        .map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleCountSelect(option.value.toString())}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                              countFilter === option.value.toString() ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoClick}
                disabled={!selectedField || !hasMasterSelected}
                className={`px-6 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  selectedField && hasMasterSelected
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
            
            {/* Import, Export & Save Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleImportClick}
                className="px-4 py-2 bg-gray-600 text-black rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
                title="Import Data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Import</span>
              </button>
              
              <button
                onClick={handleViewImportedData}
                disabled={!hasImportSession}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  hasImportSession
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title="View Imported Data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>View Imported</span>
              </button>
              

              

              
              <button
                onClick={handleExportClick}
                disabled={!surnameData || surnameData.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  surnameData && surnameData.length > 0
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title="Export Data"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download</span>
              </button>
              
              <button
                onClick={handleSaveClick}
                disabled={!surnameData || surnameData.length === 0}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer ${
                  surnameData && surnameData.length > 0
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-300 text-black-500 cursor-not-allowed'
                }`}
                title="Save Data (localStorage) or Save to Database (for imported data)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span>Save Data</span>
              </button>
            </div>
            
          </div>       
        </div>
      </div>
      
      {/* Excel-like Data Table Section */}
      {showTable && (
        <div className="bg-white m-0 p-0">
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
        <div className="bg-white px-6 py-8">
          <FilterMessage/>
        </div>
      )}

      
      
    </div>
  );
}
