  import { useState, useEffect, useCallback } from 'react';
  import { apiService, Voter, FilterParams, VotersResponse, FilterOptions } from '../services/api';

  export interface UseVotersReturn {
    // Data
    voters: Voter[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    
    // Loading states
    loading: boolean;
    loadingOptions: boolean;
    
    // Error states
    error: string | null;
    optionsError: string | null;
    
    // Filter options
    filterOptions: FilterOptions;
    
    // Actions
    refetch: () => Promise<void>;
    refetchOptions: () => Promise<void>;
    setFilters: (filters: FilterParams) => void;
    setPage: (page: number) => void;
    setItemsPerPage: (limit: number) => void;
    setSearch: (search: string) => void;
    
    // CRUD operations
    createVoter: (voterData: Partial<Voter>) => Promise<Voter>;
    updateVoter: (id: string, voterData: Partial<Voter>) => Promise<Voter>;
    deleteVoter: (id: string) => Promise<void>;
  }

  export function useVoters(initialFilters: FilterParams = {}): UseVotersReturn {
    // State for voters data
    const [voters, setVoters] = useState<Voter[]>([]);
    const [pagination, setPagination] = useState({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10
    });
    
    // State for filter options
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
      villageCodes: [],
      sections: [],
      villageNames: [],
      gramPanchayats: [],
      patwarCircles: [],
      lrCircles: [],
      ages: [],
      names: [],
      fnames: [],
      hnos: [],
      malefemales: [],
      castTypes: []
    });
    
    // Loading states
    const [loading, setLoading] = useState(true);
    const [loadingOptions, setLoadingOptions] = useState(true);
    
    // Error states
    const [error, setError] = useState<string | null>(null);
    const [optionsError, setOptionsError] = useState<string | null>(null);
    
    // Filters state
    const [filters, setFiltersState] = useState<FilterParams>(initialFilters);
    const [search, setSearchState] = useState('');
    const [page, setPageState] = useState(1);
    const [itemsPerPage, setItemsPerPageState] = useState(10);

    // Fetch voters data
    const fetchVoters = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response: VotersResponse = await apiService.getVoters({
          ...filters,
          page,
          limit: itemsPerPage,
          search: search || undefined
        });
        
        setVoters(response.voters);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch voters');
        console.error('Error fetching voters:', err);
      } finally {
        setLoading(false);
      }
    }, [filters, page, itemsPerPage, search]);

    // Fetch filter options
    const fetchFilterOptions = useCallback(async () => {
      try {
        setLoadingOptions(true);
        setOptionsError(null);
        
        const options = await apiService.getFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        setOptionsError(err instanceof Error ? err.message : 'Failed to fetch filter options');
        console.error('Error fetching filter options:', err);
      } finally {
        setLoadingOptions(false);
      }
    }, []);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
      fetchVoters();
    }, [fetchVoters]);

    // Fetch filter options on mount
    useEffect(() => {
      fetchFilterOptions();
    }, [fetchFilterOptions]);

    // CRUD operations
    const createVoter = async (voterData: Partial<Voter>): Promise<Voter> => {
      try {
        const newVoter = await apiService.createVoter(voterData);
        // Refetch data to include the new voter
        await fetchVoters();
        return newVoter;
      } catch (err) {
        throw err;
      }
    };

    const updateVoter = async (id: string, voterData: Partial<Voter>): Promise<Voter> => {
      try {
        const updatedVoter = await apiService.updateVoter(id, voterData);
        // Update the voter in the local state
        setVoters(prev => prev.map(voter => 
          voter._id === id ? updatedVoter : voter
        ));
        return updatedVoter;
      } catch (err) {
        throw err;
      }
    };

    const deleteVoter = async (id: string): Promise<void> => {
      try {
        await apiService.deleteVoter(id);
        // Remove the voter from local state
        setVoters(prev => prev.filter(voter => voter._id !== id));
      } catch (err) {
        throw err;
      }
    };

    // Action functions
    const refetch = useCallback(() => fetchVoters(), [fetchVoters]);
    const refetchOptions = useCallback(() => fetchFilterOptions(), [fetchFilterOptions]);

    const setFilters = useCallback((newFilters: FilterParams) => {
      setFiltersState(newFilters);
      setPageState(1); // Reset to first page when filters change
    }, []);

    const setPage = useCallback((newPage: number) => {
      setPageState(newPage);
    }, []);

    const setItemsPerPage = useCallback((newLimit: number) => {
      setItemsPerPageState(newLimit);
      setPageState(1); // Reset to first page when items per page changes
    }, []);

    const setSearch = useCallback((newSearch: string) => {
      setSearchState(newSearch);
      setPageState(1); // Reset to first page when search changes
    }, []);

    return {
      // Data
      voters,
      pagination,
      
      // Loading states
      loading,
      loadingOptions,
      
      // Error states
      error,
      optionsError,
      
      // Filter options
      filterOptions,
      
      // Actions
      refetch,
      refetchOptions,
      setFilters,
      setPage,
      setItemsPerPage,
      setSearch,
      
      // CRUD operations
      createVoter,
      updateVoter,
      deleteVoter
    };
  } 