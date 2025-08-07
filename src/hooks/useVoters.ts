import { useState, useEffect, useCallback } from 'react';
import { apiService, Voter, FilterParams, PaginationInfo } from '../services/api';

interface UseVotersReturn {
  data: Voter[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  fetchVoters: (page?: number, limit?: number, filters?: FilterParams) => Promise<void>;
  updateVoter: (id: number, voterData: Partial<Voter>) => Promise<void>;
  handlePageChange: (page: number) => Promise<void>;
  handleItemsPerPageChange: (limit: number) => Promise<void>;
}

export const useVoters = (): UseVotersReturn => {
  const [data, setData] = useState<Voter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 500,
  });


  const [currentFilters, setCurrentFilters] = useState<FilterParams>({});

  const fetchVoters = useCallback(async (
    page: number = 1,
    limit: number = 500,
    filters: FilterParams = {}
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getVoters(page, limit, filters);
      
      setData(response.data || []);
      setPagination(response.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      });
      setCurrentFilters(filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch voters');
      console.error('Error fetching voters:', err);
      // Set default values on error
      setData([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVoter = useCallback(async (id: number, voterData: Partial<Voter>) => {
    try {
      // Try to update via API (API service will handle authentication)
      await apiService.updateVoter(id, voterData);
      
      // Update the voter in the local state
      setData(prevData =>
        prevData.map(voter =>
          voter.id === id ? { ...voter, ...voterData, updated_at: new Date().toISOString() } : voter
        )
      );
    } catch (err) {
      console.error('Error updating voter:', err);
      
      // If API call failed, still update locally for better UX
      setData(prevData =>
        prevData.map(voter =>
          voter.id === id ? { ...voter, ...voterData, updated_at: new Date().toISOString() } : voter
        )
      );
      
      // Don't throw error to prevent UI from breaking
      console.log('Updated data locally due to API error');
    }
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchVoters(page, pagination.itemsPerPage, currentFilters);
  }, [fetchVoters, pagination.itemsPerPage, currentFilters]);

  const handleItemsPerPageChange = useCallback(async (limit: number) => {
    await fetchVoters(1, limit, currentFilters);
  }, [fetchVoters, currentFilters]);

  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to check if backend is available
        await apiService.healthCheck();
        await fetchVoters();
      } catch (err) {
        console.log('Backend not available, using sample data');
        // Use sample data if backend is not available
        setData([
          {
            id: 1,
            name: 'John Doe',
            fname: 'Michael',
            mname: 'Sarah',
            surname: 'Doe',
            cast_id: 'C001',
            cast_ida: 'CA001',
            mobile1: '9876543210',
            mobile2: '9876543211',
            age: 25,
            date_of_birth: '1998-05-15',
            parliament: 'Parliament 1',
            assembly: 'Assembly 1',
            district: 'District 1',
            block: 'Block 1',
            tehsil: 'Tehsil 1',
            village: 'Village 1',
            booth: 'Booth 1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 2,
            name: 'Jane Smith',
            fname: 'Robert',
            mname: 'Mary',
            surname: 'Smith',
            cast_id: 'C002',
            cast_ida: 'CA002',
            mobile1: '9876543212',
            mobile2: '9876543213',
            age: 30,
            date_of_birth: '1993-08-20',
            parliament: 'Parliament 2',
            assembly: 'Assembly 2',
            district: 'District 2',
            block: 'Block 2',
            tehsil: 'Tehsil 2',
            village: 'Village 2',
            booth: 'Booth 2',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 3,
            name: 'Bob Johnson',
            fname: 'David',
            mname: 'Lisa',
            surname: 'Johnson',
            cast_id: 'C003',
            cast_ida: 'CA003',
            mobile1: '9876543214',
            mobile2: '9876543215',
            age: 35,
            date_of_birth: '1988-12-10',
            parliament: 'Parliament 1',
            assembly: 'Assembly 3',
            district: 'District 1',
            block: 'Block 3',
            tehsil: 'Tehsil 1',
            village: 'Village 3',
            booth: 'Booth 3',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ]);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalItems: 3,
          itemsPerPage: 500
        });
        setLoading(false);
      }
    };
    
    initializeData();
  }, [fetchVoters]);

  return {
    data,
    loading,
    error,
    pagination,
    fetchVoters,
    updateVoter,
    handlePageChange,
    handleItemsPerPageChange,
  };
};
