'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import CommonPagination from './CommonPagination';
import FilterMessage from './FilterMessage';
import ExcelDataTable from './ExcelDataTable';

// Define interfaces for type safety
interface DivisionDataItem {
  DIVISION_ID: string;
  DIVISION_ENG: string;
  DIVISION_CODE: string;
  DISTRICT_ENG: string;
  DISTRICT_CODE: string;
  PC_ENG: string;
  PC_CODE: string;
  AC_ENG: string;
  AC_CODE: string;
  AC_TOTAL_MANDAL: string;
  PC_SEAT: string;
  INC_Party_Zila: string;
  BJP_Party_Zila2: string;
}

interface Voter {
  id: string; // UI display ID (kept as-is)
  row_pk?: number; // DB primary key: id
  division_id?: string; // DB DIVISION_ID
  family_id: string; // DB FAMILY_ID
  cast_name: string;
  name: string;
  fname: string;
  mname: string;
  surname: string;
  mobile1: string;
  mobile2: string;
  age: string;
  date_of_birth: string;
  parliament: string;
  assembly: string;
  district: string;
  block: string;
  tehsil: string;
  village: string;
  gender: string;
  address: string;
  verify: string;
  family_view: string;
  caste_category: string;
  religion: string;
  cast_id: string;
  cast_ida: string;
  name_gender_age_display?: { name: string; gender: string; age: string }; // Combined display field
}

// ExcelDataTable will handle all Excel functionality

const columns = [
  {
    accessorKey: 'family_id',
    header: 'Family ID',
    size: 180,
  },
     {
     id: 'name_gender_age_display',
     header: 'Name | M/F | Age',
     size: 280,
     cell: ({ row }: any) => {
       const voter = row.original;
       const displayData = voter.name_gender_age_display;
       
       if (!displayData) return <span className="text-gray-400">No data</span>;
       
       return (
         <div className="flex items-center justify-between w-full h-full px-2">
           {/* Name - Left aligned, takes most space with click functionality */}
           <div className="flex-1 text-left pr-2">
             <span 
               className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
               onClick={() => {
                 if (voter.family_id) {
                   // We'll handle this through a custom event since we can't access openFamilyModal directly
                   const event = new CustomEvent('openFamilyModal', { 
                     detail: { familyId: voter.family_id } 
                   });
                   window.dispatchEvent(event);
                 }
               }}
               title="Click to view family members"
             >
               {displayData.name || ''}
             </span>
           </div>
           
           {/* Gender - Right aligned, no background */}
           <div className="text-right pr-2">
             <span className="text-sm text-gray-600">{displayData.gender || ''}</span>
           </div>
           
           {/* Age - Right aligned */}
           <div className="text-right">
             <span className="text-sm text-gray-600 font-mono">{displayData.age || ''}</span>
           </div>
         </div>
       );
     }
   },
  {
    accessorKey: 'surname',
    header: 'Surname',
    size: 120,
  },
  {
    accessorKey: 'mobile1',
    header: 'Mobile 1',
    size: 120,
  },
  {
    accessorKey: 'mobile2',
    header: 'Mobile 2',
    size: 120,
  },
  {
    accessorKey: 'date_of_birth',
    header: 'DOB',
    size: 120,
  },
  {
    accessorKey: 'district',
    header: 'District',
    size: 120,
  },
  {
    accessorKey: 'block',
    header: 'Block',
    size: 120,
  },
  {
    accessorKey: 'tehsil',
    header: 'GP',
    size: 120,
  },
  {
    accessorKey: 'village',
    header: 'GRAM',
    size: 140,
  },
  {
    accessorKey: 'address',
    header: 'Address',
    size: 300,
    cell: ({ row }: any) => {
      const voter = row.original;
      return <div className="text-sm text-gray-600">{voter.address || ''}</div>;
    }
  },
  {
    accessorKey: 'verify',
    header: 'Status',
    size: 100,
  },
  {
    accessorKey: 'religion',
    header: 'Religion',
    size: 120,
  },
  {
    accessorKey: 'caste_category',
    header: 'Cast Category',
    size: 140,
  },
  {
    accessorKey: 'cast_name',
    header: 'Cast',
    size: 140,
  },
  {
    accessorKey: 'cast_id',
    header: 'Cast Id',
    size: 100,
  },
  {
    accessorKey: 'cast_ida',
    header: 'Cast IDA',
    size: 120,
  },
];

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): string => {
  if (!dateOfBirth) return '';
  
  try {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return '';
    
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age.toString();
  } catch (error) {
    return '';
  }
};

// Format ISO date (YYYY-MM-DD) to backend expected format (DD-MMM-YYYY)
const formatDateForBackend = (isoDate: string): string => {
  if (!isoDate) return '';
  try {
    // If already looks like DD-MMM-YYYY, return as-is
    if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(isoDate)) return isoDate;
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    const day = String(d.getDate()).padStart(2, '0');
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mon = monthNames[d.getMonth()];
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  } catch {
    return isoDate;
  }
};

// Create a stable string for shallow filter objects (sorted keys)
const stableStringify = (obj: Record<string, any>): string => {
  const keys = Object.keys(obj).sort();
  const normalized: Record<string, any> = {};
  for (const k of keys) normalized[k] = obj[k];
  return JSON.stringify(normalized);
};

function DataTable({ 
  masterFilters, 
  detailedFilters 
}: { 
  masterFilters?: { parliament?: string; assembly?: string; district?: string; block?: string };
  detailedFilters?: any;
}) {
  // Use filters directly to prevent unnecessary memoization issues
  const memoizedMasterFilters = masterFilters;
  const memoizedDetailedFilters = detailedFilters;
  
  // Hoisted helper to check if any filters are active (safe for deps)
  function hasActiveFilters(): boolean {
    const master = memoizedMasterFilters || {} as any;
    const detailed = memoizedDetailedFilters || {} as any;
    const hasMaster = Object.values(master).some((val: any) => val && val !== '');
    const hasDetailed = Object.values(detailed).some((val: any) => val && val !== '');
    return hasMaster || hasDetailed;
  }

  const [data, setData] = useState<Voter[]>([]);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    itemsPerPage: number;
    totalItems: number | string;
    totalPages: number;
  }>({
    currentPage: 1,
    itemsPerPage: 100, // Show 100 rows per page for faster loading
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // Separate loading state for filters
  const [error, setError] = useState<string | null>(null);

  // Family View modal state
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [familyModalFamilyId, setFamilyModalFamilyId] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<Voter[]>([]);
  const [familyLoading, setFamilyLoading] = useState<boolean>(false);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Data fetching function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Do not fetch until user selects at least one filter
      if (!hasActiveFilters()) {
        setData([]);
        setPagination(prev => ({ ...prev, totalItems: 0, totalPages: 0 }));
        setLoading(false);
        return;
      }
      
      const page = pagination.currentPage;
      const limit = pagination.itemsPerPage;
      
      // Build API URL with filters
      let apiUrl = `http://localhost:5002/api/area_mapping?page=${page}&limit=${limit}`;
      
      // Add master filters to API call
      if (memoizedMasterFilters) {
        if (memoizedMasterFilters.parliament) {
          apiUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
        }
        if (memoizedMasterFilters.assembly) {
          apiUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
        }
        if (memoizedMasterFilters.district) {
          apiUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
        }
        if (memoizedMasterFilters.block) {
          apiUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
        }
      }
      
      // Add detailed filters to API call (map UI keys to backend keys)
      if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
        const keyMap: Record<string, string> = {
          tehsil: 'gp',
          mobile1: 'mobile_number',
          mobile2: 'mobile_number',
          castId: 'caste',
          castIda: 'caste_category',
          malefemale: 'gender',
          religion: 'minority_religion',
          dateOfBirth: 'date_of_birth',
          fname: 'father_name',
          mname: 'mother_name'
        };
        Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            const backendKey = keyMap[key] || key;
            const val = key === 'dateOfBirth' ? formatDateForBackend(String(value)) : String(value);
            apiUrl += `&${backendKey}=${encodeURIComponent(val)}`;
          }
        });
      }
      
      console.log('🔍 Fetching data with filters:', { masterFilters: memoizedMasterFilters, detailedFilters: memoizedDetailedFilters, apiUrl });
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const rawData = await response.text();
      
      try {
        const parsed = JSON.parse(rawData);
        // Support both array and { data: [] } shapes
        const apiData: any[] = Array.isArray(parsed)
          ? parsed
          : (Array.isArray((parsed as any)?.data) ? (parsed as any).data : []);
        
        if (!Array.isArray(apiData)) {
          console.error('❌ API data is not an array-like:', parsed);
          throw new Error('API did not return a list');
        }
        
                 // Map API data to Voter interface
         const pageOffsetBase = (page - 1) * limit;
         let mappedData: Voter[] = apiData.map((item: any, index: number) => {
           const name = item.name || '';
           const gender = item.gender || '';
           const age = calculateAge(item.date_of_birth);
           
           // Format gender display
           let genderDisplay = '';
           if (gender) {
             if (gender.toLowerCase() === 'male' || gender === 'पुरुष') {
               genderDisplay = 'M';
             } else if (gender.toLowerCase() === 'female' || gender === 'महिला') {
               genderDisplay = 'F';
             } else {
               genderDisplay = gender;
             }
           }
           
                       // Create combined display text with proper formatting
            const nameGenderAgeDisplay = {
              name: name,
              gender: genderDisplay,
              age: age
            };
           
           return {
             id: String(item.id ?? index + 1),
             row_pk: typeof item.id === 'number' ? item.id : undefined,
             __pageOffset: pageOffsetBase,
             __rowIndex: index,
             division_id: String(item.temp_family_Id || item.temp_family_id || ''),
             family_id: item.family_id || '',
             cast_name: item.caste || '',
             name: item.name || '',
             fname: item.father_name || '',
             mname: item.mother_name || '',
             surname: (() => {
               const name = item.name || '';
               const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
               return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
             })(),
             mobile1: item.mobile_number ? String(item.mobile_number) : '',
             mobile2: '',
             age: age,
             date_of_birth: item.date_of_birth || '',
             parliament: item.parliament || '',
             assembly: item.assembly || '',
             district: item.district || '',
             block: item.block || '',
             tehsil: item.gp || '',
             village: item.village || '',
             gender: item.gender || '',
             address: item.address || '',
             verify: item.verify || '',
             family_view: item.family_view || '',
             caste_category: item.caste_category || '',
             religion: item.religion || item.minority_religion || '',
             cast_id: item.caste || '',
             cast_ida: item.caste_category || '',
             // Add the combined display field
             name_gender_age_display: nameGenderAgeDisplay
           };
         });
         
         // First, get the exact total count of filtered data (not approximate)
         let exactTotalCount = 0;
         try {

           // Build count URL with same filters but no pagination
           let countUrl = `http://localhost:5002/api/area_mapping?page=1&limit=10000`;
           
           // Add master filters to count API call
           if (memoizedMasterFilters) {
             if (memoizedMasterFilters.parliament) {
               countUrl += `&parliament=${encodeURIComponent(memoizedMasterFilters.parliament)}`;
             }
             if (memoizedMasterFilters.assembly) {
               countUrl += `&assembly=${encodeURIComponent(memoizedMasterFilters.assembly)}`;
             }
             if (memoizedMasterFilters.district) {
               countUrl += `&district=${encodeURIComponent(memoizedMasterFilters.district)}`;
             }
             if (memoizedMasterFilters.block) {
               countUrl += `&block=${encodeURIComponent(memoizedMasterFilters.block)}`;
             }
           }
           
           // Add detailed filters to count API call
           if (memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0) {
             const keyMap: Record<string, string> = {
               tehsil: 'gp',
               mobile1: 'mobile_number',
               mobile2: 'mobile_number',
               castId: 'caste',
               castIda: 'caste_category',
               malefemale: 'gender',
               religion: 'minority_religion',
               dateOfBirth: 'date_of_birth',
               fname: 'father_name',
               mname: 'mother_name'
             };
             Object.entries(memoizedDetailedFilters).forEach(([key, value]) => {
               if (value !== undefined && value !== '') {
                 const backendKey = keyMap[key] || key;
                 const val = key === 'dateOfBirth' ? formatDateForBackend(String(value)) : String(value);
                 countUrl += `&${backendKey}=${encodeURIComponent(val)}`;
               }
             });
           }
           
           // Add cache-busting parameter to ensure fresh data
           countUrl += `&_t=${Date.now()}`;
           console.log('🔍 Fetching exact count from:', countUrl);
           
           const countResponse = await fetch(countUrl, {
             method: 'GET',
             headers: {
               'Cache-Control': 'no-cache',
               'Pragma': 'no-cache'
             }
           });
           
           if (countResponse.ok) {
             const countData = await countResponse.json();
             if (Array.isArray(countData)) {
               // Get exact count of all filtered data
               exactTotalCount = countData.length;
               console.log('✅ Exact total count:', exactTotalCount);
             }
           } else {
             console.warn('❌ Count API failed:', countResponse.status, countResponse.statusText);
           }
         } catch (error) {
           console.warn('❌ Could not get exact count, will use approximate:', error);
         }
         
         // Use exact count if available, otherwise fall back to pagination logic
         if (exactTotalCount > 0) {
           // We have the exact count, use it for proper pagination (like SurnameDataTable)
           setData(mappedData);
           setPagination(prev => ({
             ...prev,
             totalItems: exactTotalCount,
             totalPages: Math.max(1, Math.ceil(exactTotalCount / limit))
           }));
         } else {
           // Fallback to original pagination logic if exact count failed
           if (mappedData.length <= limit) {
             setData(mappedData);
             
             // Update pagination info
             let totalCount: number | string = mappedData.length;
             let totalPages = 1;
             
             // If we got exactly the limit, there might be more data
             if (mappedData.length === limit) {
               // Try to fetch one more record to see if there's more data
               try {
                 const nextPageResponse = await fetch(`${apiUrl}&page=${page + 1}&limit=1`);
                 if (nextPageResponse.ok) {
                   const nextPageData = await nextPageResponse.json();
                   if (Array.isArray(nextPageData) && nextPageData.length > 0) {
                     // There's at least one more page. Do not inflate totals; just expose next page.
                     totalCount = `${(page + 1) * limit}+`;
                     totalPages = page + 1;
                   } else {
                     // No more data, this is the last page
                     totalCount = (page - 1) * limit + mappedData.length;
                     totalPages = page;
                   }
                 }
               } catch (error) {
                 // If we can't check next page, do not guess wildly; keep current page as last known
                 totalCount = `${page * limit}+`;
                 totalPages = page;
               }
             } else {
               // We got less than the limit, so this is the last page
               totalCount = (page - 1) * limit + mappedData.length;
               totalPages = page;
             }
             
             setPagination(prev => ({
               ...prev,
               totalItems: totalCount,
               totalPages: totalPages
             }));
           } else {
             // Backend returned all filtered rows ignoring limit; paginate on client
             const total = mappedData.length;
             const start = (page - 1) * limit;
             const end = start + limit;
             setData(mappedData.slice(start, end));
             setPagination(prev => ({
               ...prev,
               totalItems: total,
               totalPages: Math.max(1, Math.ceil(total / limit))
             }));
           }
         }
        
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError);
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        throw new Error(`Failed to parse API response: ${errorMessage}`);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch data: ${errorMessage}`);
      setData([]);
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, memoizedMasterFilters, memoizedDetailedFilters]);

  // Calculate rows per page based on screen height
  const calculateRowsPerPage = () => {
    const screenHeight = window.innerHeight;
    const headerHeight = 200; // Approximate height for headers, filters, etc.
    const rowHeight = 28; // Height of each row
    const paginationHeight = 80; // Height for pagination controls
    const availableHeight = screenHeight - headerHeight - paginationHeight;
    const calculatedRows = Math.floor(availableHeight / rowHeight);
    
    // Ensure minimum and maximum rows
    const minRows = 10;
    const maxRows = 200;
    return Math.max(minRows, Math.min(maxRows, calculatedRows));
  };

  // Effect to recalculate rows per page when screen size changes
  useEffect(() => {
    const handleResize = () => {
      const newRowsPerPage = calculateRowsPerPage();
      if (newRowsPerPage !== pagination.itemsPerPage) {
        setPagination(prev => ({
          ...prev,
          itemsPerPage: newRowsPerPage,
          currentPage: 1 // Reset to first page when changing page size
        }));
      }
    };

    // Initial calculation
    handleResize();

    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [pagination.itemsPerPage]);

  // Effect to fetch data on component mount and filter changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

     // Effect to listen for refresh events
   useEffect(() => {
     const handleRefreshEvent = () => {
       console.log('🔄 Refresh event received');
       // Reset to first page on refresh so new results start from page 1
       setPagination(prev => ({ ...prev, currentPage: 1 }));
     };

     const handleDataAlterationUpdate = (event: CustomEvent) => {
       console.log('🔄 Data alteration update event received:', event.detail);
       fetchData();
     };

     window.addEventListener('refreshDataTable', handleRefreshEvent);
     window.addEventListener('dataAlterationUpdate', handleDataAlterationUpdate as EventListener);
     
     return () => {
       window.removeEventListener('refreshDataTable', handleRefreshEvent);
       window.removeEventListener('dataAlterationUpdate', handleDataAlterationUpdate as EventListener);
     };
   }, [fetchData]);

  // Reset to first page whenever filters change (master or detailed)
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [stableStringify(memoizedMasterFilters || {}), stableStringify(memoizedDetailedFilters || {})]);

  const openFamilyModal = useCallback(async (familyId: string) => {
    if (!familyId) {
      alert('Family ID missing for this row');
      return;
    }
    setIsFamilyModalOpen(true);
    setFamilyModalFamilyId(familyId);
    setFamilyLoading(true);
    setFamilyError(null);
    try {
      // Fetch all members with this family_id
      const url = `http://localhost:5002/api/area_mapping?family_id=${encodeURIComponent(familyId)}&limit=1000`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt}`);
      }
      const apiData = await res.json();
      if (!Array.isArray(apiData)) {
        throw new Error('Unexpected API response');
      }
      const members: Voter[] = apiData.map((item: any, index: number) => ({
        id: String(item.id ?? index + 1),
        row_pk: typeof item.id === 'number' ? item.id : undefined,
        division_id: String(item.temp_family_Id || item.temp_family_id || ''),
        family_id: item.family_id || '',
        cast_name: item.caste || '',
        name: item.name || '',
        fname: item.father_name || '',
        mname: item.mother_name || '',
        surname: (() => {
          const name = item.name || '';
          const nameParts = name.split(' ').filter((part: string) => part.trim() !== '');
          return nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
        })(),
        mobile1: item.mobile_number ? String(item.mobile_number) : '',
        mobile2: '',
        age: '',
        date_of_birth: item.date_of_birth || '',
        parliament: item.parliament || '',
        assembly: item.assembly || '',
        district: item.district || '',
        block: item.block || '',
        tehsil: item.gp || '',
        village: item.village || '',
        gender: item.gender || '',
        address: item.address || '',
        verify: item.verify || '',
        family_view: item.family_view || '',
        caste_category: item.caste_category || '',
        religion: item.religion || item.minority_religion || '',
        cast_id: item.caste || '',
        cast_ida: item.caste_category || ''
      }));
      setFamilyMembers(members);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setFamilyError(msg);
    } finally {
      setFamilyLoading(false);
    }
  }, []);

     const closeFamilyModal = useCallback(() => {
     setIsFamilyModalOpen(false);
     setFamilyModalFamilyId('');
     setFamilyMembers([]);
     setFamilyError(null);
     setFamilyLoading(false);
   }, []);

       // Effect to listen for family modal events
    useEffect(() => {
      const handleOpenFamilyModal = (event: CustomEvent) => {
        console.log('👨‍👩‍👧‍👦 Opening family modal for family ID:', event.detail.familyId);
        openFamilyModal(event.detail.familyId);
      };

      window.addEventListener('openFamilyModal', handleOpenFamilyModal as EventListener);
      
      return () => {
        window.removeEventListener('openFamilyModal', handleOpenFamilyModal as EventListener);
      };
    }, [openFamilyModal]);

    // Effect to handle ESC key for closing family modal
    useEffect(() => {
      const handleEscKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && isFamilyModalOpen) {
          console.log('⌨️ ESC key pressed, closing family modal');
          closeFamilyModal();
        }
      };

      if (isFamilyModalOpen) {
        document.addEventListener('keydown', handleEscKey);
        
        return () => {
          document.removeEventListener('keydown', handleEscKey);
        };
      }
    }, [isFamilyModalOpen, closeFamilyModal]);

  // Function to refresh data with current filters
  const refreshDataWithFilters = () => {
    console.log('🔄 Manually refreshing data with current filters');
    fetchData();
  };

  // Handle edit function
  const handleEdit = (rowId: number, fieldName: string, newValue: string) => {
    // Map frontend field names to backend column names for area_mapping API
    const columnMapping: { [key: string]: string } = {
      'name': 'name',
      'fname': 'father_name',
      'mname': 'mother_name',
      'surname': 'name',  // ✅ CORRECT: Surname updates the name field
      'district': 'district',
      'block': 'block',
      'tehsil': 'gp',
      'village': 'village',
      'gender': 'gender',
      'family_id': 'family_id',
      'address': 'address',
      'verify': 'verify',
      'family_view': 'family_view',
      'caste_category': 'caste_category',
      'religion': 'minority_religion',
      'cast_id': 'caste',
      'cast_ida': 'caste_category'
    };
    
    let backendColumnName = columnMapping[fieldName] || fieldName;
    let updateValue = newValue;
    
    // Special handling for surname: update the name field by replacing last word
    if (fieldName === 'surname') {
      backendColumnName = 'name';
      // Get current name and replace last word with new surname
      const currentVoter = data.find(v => v.id === String(rowId));
      if (currentVoter && currentVoter.name) {
        const nameParts = currentVoter.name.split(' ').filter((part: string) => part.trim() !== '');
        if (nameParts.length > 1) {
          nameParts.pop(); // Remove last word (old surname)
          nameParts.push(newValue); // Add new surname
          updateValue = nameParts.join(' ');
        } else {
          // If only one word, append the new surname
          updateValue = `${currentVoter.name} ${newValue}`;
        }
      }
    }
    
    fetch(`http://localhost:5002/api/area_mapping/${rowId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        columnName: backendColumnName,
        value: updateValue 
      })
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res.json();
    })
    .then(() => {
      // Update local state immediately for immediate UI update
      setData(prevData => {
        const newData = prevData.map((item, index) => {
          if (item.id === String(rowId)) {
            const updatedItem = { ...item };
            
            if (fieldName === 'surname') {
              // Update both name and surname
              updatedItem.name = updateValue;
              updatedItem.surname = newValue;
            } else {
              // Update the specific field (using any for dynamic field access)
              (updatedItem as any)[fieldName] = newValue;
            }
            
            return updatedItem;
          }
          return item;
        });
        return newData;
      });
    })
    .catch(error => {
      console.error('Error updating data:', error);
      alert(`Error updating data: ${error.message}`);
    });
  };

  // Handle error and loading states after all hooks are called
  if (loading && !data.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading filtered data...</div>
          <div className="text-sm text-gray-500 mt-2">Fetching data based on your selected filters</div>
        </div>
      </div>
    );
  }

  // Show message when no filters are selected
  if (!data.length && !loading && !error) {
    const hasMasterFilters = memoizedMasterFilters && Object.values(memoizedMasterFilters).some(val => val && val !== '');
    const hasDetailedFilters = memoizedDetailedFilters && Object.keys(memoizedDetailedFilters).length > 0 && Object.values(memoizedDetailedFilters).some(val => val && val !== '');
    
    if (!hasMasterFilters && !hasDetailedFilters) {
      return <FilterMessage />;
    }
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Data</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="space-y-2">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchData();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors mr-2"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-screen w-full overflow-auto relative" style={{ border: '1px solid #d1d5db' }}>
      {/* Family Members Modal */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-[1px] backdrop-brightness-90">
          <div className="bg-white rounded shadow-lg w-[90vw] max-w-5xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="text-sm font-semibold text-gray-800">Family Members • Family ID: {familyModalFamilyId}</div>
              <button onClick={closeFamilyModal} className="px-2 py-1 text-sm border rounded hover:bg-gray-100">Close</button>
            </div>
            <div className="p-4">
              {familyLoading ? (
                <div className="flex items-center text-sm text-gray-600"><span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></span>Loading...</div>
              ) : familyError ? (
                <div className="text-sm text-red-600">{familyError}</div>
              ) : familyMembers.length === 0 ? (
                <div className="text-sm text-gray-600">No members found for this Family ID.</div>
              ) : (
                <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="bg-gray-100 text-xs text-gray-700">
                      <th className="border px-2 py-1 text-left">Sr.</th>
                      <th className="border px-2 py-1 text-left">Name</th>
                      <th className="border px-2 py-1 text-left">Father</th>
                      <th className="border px-2 py-1 text-left">Mother</th>
                      <th className="border px-2 py-1 text-left">Gender</th>
                      <th className="border px-2 py-1 text-left">Mobile</th>
                      <th className="border px-2 py-1 text-left">Village</th>
                      <th className="border px-2 py-1 text-left">GP</th>
                      <th className="border px-2 py-1 text-left">District</th>
                      <th className="border px-2 py-1 text-left">Assembly</th>
                      <th className="border px-2 py-1 text-left">Parliament</th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyMembers.map((m, i) => (
                      <tr key={`fm-${i}`} className="text-xs">
                        <td className="border px-2 py-1">{i + 1}</td>
                        <td className="border px-2 py-1">{m.name}</td>
                        <td className="border px-2 py-1">{m.fname}</td>
                        <td className="border px-2 py-1">{m.mname}</td>
                        <td className="border px-2 py-1">
                          {m.gender ? (
                            m.gender.toLowerCase() === 'male' ? 'M' : 
                            m.gender.toLowerCase() === 'female' ? 'F' :
                            m.gender === 'पुरुष' ? 'M' :
                            m.gender === 'महिला' ? 'F' :
                            m.gender
                          ) : ''}
                        </td>
                        <td className="border px-2 py-1">{m.mobile1}</td>
                        <td className="border px-2 py-1">{m.village}</td>
                        <td className="border px-2 py-1">{m.tehsil}</td>
                        <td className="border px-2 py-1">{m.district}</td>
                        <td className="border px-2 py-1">{m.assembly}</td>
                        <td className="border px-2 py-1">{m.parliament}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ExcelDataTable Component with Latest Features */}
      <ExcelDataTable
        data={data}
        columns={columns}
        loading={loading}
        onUpdateRow={async (rowIndex: number, columnId: string, value: any) => {
          // Handle row updates
          const voter = data[rowIndex];
          if (voter) {
            const recordId = (voter.row_pk != null ? String(voter.row_pk) : (voter.division_id || '')).trim();
            if (recordId) {
              // Map frontend column IDs to backend column names
              const columnMapping: { [key: string]: string } = {
                'name': 'name',
                'fname': 'father_name',
                'mname': 'mother_name',
                'mobile1': 'mobile_number',
                'mobile2': 'mobile_number',
                'district': 'district',
                'block': 'block',
                'tehsil': 'gp',
                'village': 'village',
                'gender': 'gender',
                'address': 'address',
                'verify': 'verify',
                'religion': 'minority_religion',
                'cast_id': 'caste',
                'cast_ida': 'caste_category'
              };
              
              const backendColumnName = columnMapping[columnId] || columnId;
              
              try {
                const response = await fetch(`http://localhost:5002/api/area_mapping/${recordId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    columnName: backendColumnName,
                    value: value
                  }),
                });
                
                if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Update local state
                setData(prevData => {
                  const newData = [...prevData];
                  newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
                  return newData;
                });
              } catch (error) {
                console.error('Error updating data:', error);
                throw error;
              }
            }
          }
        }}
        pagination={pagination}
        onPageChange={(page: number) => {
          setPagination(prev => ({ ...prev, currentPage: page }));
          // Fetch data for new page
          fetchData();
        }}
        onItemsPerPageChange={(itemsPerPage: number) => {
          setPagination(prev => ({ ...prev, itemsPerPage, currentPage: 1 }));
          // Fetch data with new page size
          fetchData();
        }}
        showPagination={true}
        enableExcelFeatures={true}
        showRefreshButton={true}
        onRefresh={refreshDataWithFilters}
        showFiltersInfo={true}
        masterFilters={memoizedMasterFilters}
        detailedFilters={memoizedDetailedFilters}
        filterLoading={filterLoading}
        tableHeight="h-[calc(100vh-400px)]"
        rowHeight={28}
        enableColumnResize={true}
        enableRowResize={true}
      />
    </div>
  );
}

export default React.memo(DataTable);
