'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Search, Play, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';

/**
 * Filter Component
 * 
 * This component now provides real-time notifications to MasterFilter about detailed filter changes.
 * This ensures that the Save, Export, and Lock buttons in MasterFilter work properly when
 * detailed filters are applied, even without master filters.
 * 
 * Key improvements:
 * - Real-time filter change notifications
 * - Enhanced debugging and logging
 * - Better integration with MasterFilter component
 */

interface FilterProps {
  masterFilters?: {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  };
  onFilterChange: (filters: any) => void;
  loading?: boolean;
}

// Searchable Select Component
interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | number)[];
  placeholder: string;
  label: string;
  disabled?: boolean;
  id: string;
  activeDropdown: string | null;
  onDropdownToggle: (id: string | null) => void;
}

function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label, 
  disabled, 
  id, 
  activeDropdown, 
  onDropdownToggle 
}: SearchableSelectProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<(string | number)[]>([]);

  const isOpen = activeDropdown === id;

  React.useEffect(() => {
    const filtered = options.filter(option => 
      option.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  const handleSelect = (option: string | number) => {
    onChange(option.toString());
    onDropdownToggle(null);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      if (isOpen) {
        onDropdownToggle(null);
        setSearchTerm('');
      } else {
        onDropdownToggle(id);
        setSearchTerm('');
      }
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isOpen && !target.closest(`[data-dropdown-id="${id}"]`)) {
        onDropdownToggle(null);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, id, onDropdownToggle]);

  return (
    <div className="relative" data-dropdown-id={id}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 text-left flex items-center justify-between"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No options found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Filter({ masterFilters = {}, onFilterChange, loading = false }: FilterProps) {
  console.log('🚀 Filter component rendered with masterFilters:', masterFilters);
  
  const [villageNameFilter, setvillageNameFilter] = useState('');
  const [gramPanchayatFilter, setgramPanchayatFilter] = useState('');
  const [dobFilter, setdobFilter] = useState('');
  const [ageFromFilter, setageFromFilter] = useState('');
  const [ageToFilter, setageToFilter] = useState('');
  const [nameFilter, setnameFilter] = useState('');
  const [fnameFilter, setfnameFilter] = useState('');
  const [malefemaleFilter, setmalefemaleFilter] = useState('');
  const [mobile1Filter, setmobile1Filter] = useState('');
  const [mobile2Filter, setmobile2Filter] = useState('');
  const [castIdFilter, setcastIdFilter] = useState('');
  const [castTypeFilter, setcastTypeFilter] = useState('');
  const [motherNameFilter, setmotherNameFilter] = useState('');
  const [surnameFilter, setsurnameFilter] = useState('');
  const [religionFilter, setreligionFilter] = useState('');
  const [categoryFilter, setcategoryFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Dynamic filter options state
  const [filterOptions, setFilterOptions] = useState<{
    villageNames: string[];
    gramPanchayats: string[];
    names: string[];
    fnames: string[];
    malefemales: string[];
    castTypes: string[];
    motherNames: string[];
    surnames: string[];
    religions: string[];
    categories: string[];
  }>({
    villageNames: [],
    gramPanchayats: [],
    names: [],
    fnames: [],
    malefemales: [],
    castTypes: [],
    motherNames: [],
    surnames: [],
    religions: [],
    categories: []
  });

  // Fetch filter options when master filters OR detailed filters change
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        console.log('🔍 Fetching filter options...');
        console.log('🔍 Master filters:', masterFilters);
        
        // Combine master filters with current detailed filters for dependent filtering
        const allCurrentFilters = {
          ...masterFilters,
          village: villageNameFilter,
          tehsil: gramPanchayatFilter,
          name: nameFilter,
          fname: fnameFilter,
          mname: motherNameFilter,
          surname: surnameFilter,
          castId: castIdFilter,
          castIda: castTypeFilter,
          mobile1: mobile1Filter,
          mobile2: mobile2Filter,
          dateOfBirth: dobFilter,
          ageMin: ageFromFilter ? parseInt(ageFromFilter) : undefined,
          ageMax: ageToFilter ? parseInt(ageToFilter) : undefined,
          malefemale: malefemaleFilter,
          religion: religionFilter,
          category: categoryFilter
        };
        
        // Remove empty/undefined values
        const cleanFilters = Object.fromEntries(
          Object.entries(allCurrentFilters).filter(([_, value]) => value !== undefined && value !== '')
        );
        
        if (Object.keys(cleanFilters).length > 0) {
          console.log('🔍 Fetching dependent filter options with filters:', cleanFilters);
          const options = await apiService.fetchDependentFilterOptions(cleanFilters);
          console.log('✅ Dependent filter options received:', options);
          setFilterOptions({
            villageNames: options.villageNames || [],
            gramPanchayats: options.gramPanchayats || [],
            names: options.names || [],
            fnames: options.fnames || [],
            malefemales: options.malefemales || [],
            castTypes: options.castTypes || [],
            motherNames: options.motherNames || [],
            surnames: options.surnames || [],
            religions: options.religions || [],
            categories: options.categories || []
          });
        } else {
          console.log('🔍 Fetching all filter options...');
          const options = await apiService.fetchFilterOptions();
          console.log('✅ All filter options received:', options);
          setFilterOptions({
            villageNames: options.villageNames || [],
            gramPanchayats: options.gramPanchayats || [],
            names: options.names || [],
            fnames: options.fnames || [],
            malefemales: options.malefemales || [],
            castTypes: options.castTypes || [],
            motherNames: options.motherNames || [],
            surnames: options.surnames || [],
            religions: options.religions || [],
            categories: options.categories || []
          });
        }
        
        console.log('🔍 Filter options state updated:', filterOptions);
      } catch (error) {
        console.error('❌ Error fetching filter options:', error);
        // Keep existing options on error
      }
    };

    fetchFilterOptions();
  }, [masterFilters, villageNameFilter, gramPanchayatFilter, nameFilter, fnameFilter, motherNameFilter, surnameFilter, castIdFilter, castTypeFilter, mobile1Filter, mobile2Filter, dobFilter, ageFromFilter, ageToFilter, malefemaleFilter, religionFilter, categoryFilter]);

  // Notify MasterFilter about detailed filter changes in real-time
  useEffect(() => {
    const currentFilters = {
      village: villageNameFilter,
      tehsil: gramPanchayatFilter,
      name: nameFilter,
      fname: fnameFilter,
      mname: motherNameFilter,
      surname: surnameFilter,
      castId: castIdFilter,
      castIda: castTypeFilter,
      mobile1: mobile1Filter,
      mobile2: mobile2Filter,
      dateOfBirth: dobFilter,
      ageMin: ageFromFilter ? parseInt(ageFromFilter) : undefined,
      ageMax: ageToFilter ? parseInt(ageToFilter) : undefined,
      malefemale: malefemaleFilter,
      religion: religionFilter,
      category: categoryFilter
    };
    
    // Remove empty/undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(currentFilters).filter(([_, value]) => value !== undefined && value !== '')
    );
    
    console.log('📤 Real-time filter change notification:', cleanFilters);
    
    // Notify MasterFilter about detailed filter changes in real-time
    window.dispatchEvent(new CustomEvent('detailed-filter-changed', { detail: cleanFilters }));
  }, [villageNameFilter, gramPanchayatFilter, nameFilter, fnameFilter, motherNameFilter, surnameFilter, castIdFilter, castTypeFilter, mobile1Filter, mobile2Filter, dobFilter, ageFromFilter, ageToFilter, malefemaleFilter, religionFilter, categoryFilter]);

  // Also fetch on component mount
  useEffect(() => {
    console.log('🚀 Component mounted, fetching initial filter options...');
    const fetchInitialOptions = async () => {
      try {
        const options = await apiService.fetchFilterOptions();
        console.log('✅ Initial filter options received:', options);
        setFilterOptions({
          villageNames: options.villageNames || [],
          gramPanchayats: options.gramPanchayats || [],
          names: options.names || [],
          fnames: options.fnames || [],
          malefemales: options.malefemales || [],
          castTypes: options.castTypes || [],
          motherNames: options.motherNames || [],
          surnames: options.surnames || [],
          religions: options.religions || [],
          categories: options.categories || []
        });
      } catch (error) {
        console.error('❌ Error fetching initial filter options:', error);
      }
    };
    
    fetchInitialOptions();
  }, []); // Empty dependency array means this runs only on mount

  // Function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Handle DOB change and automatically calculate age
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    setdobFilter(dobValue);
    
    if (dobValue) {
      const calculatedAge = calculateAge(dobValue);
      setageFromFilter(calculatedAge.toString());
      setageToFilter(calculatedAge.toString());
    } else {
      setageFromFilter('');
      setageToFilter('');
    }
  };

  // Function to refresh filter options based on current selections
  const refreshFilterOptions = async () => {
    try {
      console.log('🔄 Refreshing filter options based on current selections...');
      
      // Combine master filters with current detailed filters for dependent filtering
      const allCurrentFilters = {
        ...masterFilters,
        village: villageNameFilter,
        tehsil: gramPanchayatFilter,
        name: nameFilter,
        fname: fnameFilter,
        mname: motherNameFilter,
        surname: surnameFilter,
        castId: castIdFilter,
        castIda: castTypeFilter,
        mobile1: mobile1Filter,
        mobile2: mobile2Filter,
        dateOfBirth: dobFilter,
        ageMin: ageFromFilter ? parseInt(ageFromFilter) : undefined,
        ageMax: ageToFilter ? parseInt(ageToFilter) : undefined,
        malefemale: malefemaleFilter,
        religion: religionFilter,
        category: categoryFilter
      };
      
      // Remove empty/undefined values
      const cleanFilters = Object.fromEntries(
        Object.entries(allCurrentFilters).filter(([_, value]) => value !== undefined && value !== '')
      );
      
      if (Object.keys(cleanFilters).length > 0) {
        console.log('🔍 Fetching dependent filter options with filters:', cleanFilters);
        const options = await apiService.fetchDependentFilterOptions(cleanFilters);
        console.log('✅ Dependent filter options received:', options);
        setFilterOptions({
          villageNames: options.villageNames || [],
          gramPanchayats: options.gramPanchayats || [],
          names: options.names || [],
          fnames: options.fnames || [],
          malefemales: options.malefemales || [],
          castTypes: options.castTypes || [],
          motherNames: options.motherNames || [],
          surnames: options.surnames || [],
          religions: options.religions || [],
          categories: options.categories || []
        });
      } else {
        console.log('🔍 Fetching all filter options...');
        const options = await apiService.fetchFilterOptions();
        console.log('✅ All filter options received:', options);
        setFilterOptions({
          villageNames: options.villageNames || [],
          gramPanchayats: options.gramPanchayats || [],
          names: options.names || [],
          fnames: options.fnames || [],
          malefemales: options.malefemales || [],
          castTypes: options.castTypes || [],
          motherNames: options.motherNames || [],
          surnames: options.surnames || [],
          religions: options.religions || [],
          categories: options.categories || []
        });
      }
    } catch (error) {
      console.error('❌ Error refreshing filter options:', error);
    }
  };

  // Function to apply filters when Go button is clicked
  const handleApplyFilters = () => {
    const filters = {
      village: villageNameFilter || undefined,
      tehsil: gramPanchayatFilter || undefined,
      dateOfBirth: dobFilter || undefined,
      ageMin: ageFromFilter ? parseInt(ageFromFilter) : undefined,
      ageMax: ageToFilter ? parseInt(ageToFilter) : undefined,
      name: nameFilter || undefined,
      fname: fnameFilter || undefined,
      mname: motherNameFilter || undefined,
      surname: surnameFilter || undefined,
      mobile1: mobile1Filter || undefined,
      mobile2: mobile2Filter || undefined,
      castId: castIdFilter || undefined,
      castIda: castTypeFilter || undefined,
      malefemale: malefemaleFilter || undefined,
      religion: religionFilter || undefined,
      category: categoryFilter || undefined,
    };

    // Remove undefined values to avoid sending empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    );

    console.log('🚀 Go button clicked! Applying filters:', cleanFilters);
    console.log('📤 Sending filters to parent component:', cleanFilters);

    // Apply filters only when Go button is clicked
    onFilterChange(cleanFilters);
    // Notify master filter that filter section applied
    window.dispatchEvent(new CustomEvent('filter-section-applied'));
    
    // Notify MasterFilter about detailed filter changes
    console.log('📤 Dispatching detailed-filter-changed event with:', cleanFilters);
    window.dispatchEvent(new CustomEvent('detailed-filter-changed', { detail: cleanFilters }));
  };

  const clearAllFilters = () => {
    setvillageNameFilter('');
    setgramPanchayatFilter(''); 
    setdobFilter('');
    setageFromFilter('');
    setageToFilter('');
    setnameFilter('');
    setfnameFilter('');
    setmalefemaleFilter('');
    setmobile1Filter('');
    setmobile2Filter('');
    setcastIdFilter('');
    setcastTypeFilter('');
    setmotherNameFilter('');
    setsurnameFilter('');
    setreligionFilter('');
    setcategoryFilter('');
    
    // Apply empty filters
    onFilterChange({});
    
    // Notify MasterFilter that detailed filters are cleared
    console.log('📤 Dispatching detailed-filter-changed event (cleared) with:', {});
    window.dispatchEvent(new CustomEvent('detailed-filter-changed', { detail: {} }));
    window.dispatchEvent(new CustomEvent('filter-section-cleared'));
  };

  const hasActiveFilters = villageNameFilter || 
    gramPanchayatFilter || 
    dobFilter || ageFromFilter || ageToFilter || nameFilter || fnameFilter || 
    malefemaleFilter || mobile1Filter || mobile2Filter || 
    castIdFilter || castTypeFilter || motherNameFilter || surnameFilter || 
    religionFilter || categoryFilter;
    
  // Debug logging for filter state
  useEffect(() => {
    console.log('🔍 Filter component filter state:', {
      villageNameFilter,
      gramPanchayatFilter,
      dobFilter,
      ageFromFilter,
      ageToFilter,
      nameFilter,
      fnameFilter,
      malefemaleFilter,
      mobile1Filter,
      mobile2Filter,
      castIdFilter,
      castTypeFilter,
      motherNameFilter,
      surnameFilter,
      religionFilter,
      categoryFilter,
      hasActiveFilters
    });
  }, [villageNameFilter, gramPanchayatFilter, dobFilter, ageFromFilter, ageToFilter, nameFilter, fnameFilter, malefemaleFilter, mobile1Filter, mobile2Filter, castIdFilter, castTypeFilter, motherNameFilter, surnameFilter, religionFilter, categoryFilter, hasActiveFilters]);

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="w-full px-3 py-3">
        {/* Filter Grid */}
        <div className="space-y-4">
          {/* First Row - Primary Filters with Buttons on Right */}
          <div className="flex items-start space-x-4">
            {/* Filter Fields Grid */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                            <SearchableSelect
                 id="gram"
                 value={villageNameFilter}
                 onChange={setvillageNameFilter}
                 options={filterOptions.villageNames}
                 placeholder="ग्राम"
                 label=""
                 disabled={loading}
                 activeDropdown={activeDropdown}
                 onDropdownToggle={setActiveDropdown}
               />
               
               <SearchableSelect
                id="gramPanchayat"
                value={gramPanchayatFilter}
                onChange={setgramPanchayatFilter}
                options={filterOptions.gramPanchayats}
                placeholder="ग्राम पंचायत (GP)"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter Cast Id"
                  value={castIdFilter}
                  onChange={(e) => setcastIdFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <SearchableSelect
                id="castIDE"
                value={castTypeFilter}
                onChange={setcastTypeFilter}
                options={filterOptions.castTypes}
                placeholder="जाति"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />

              <div className="relative">
                <input
                  type="text"
                  placeholder="मोबाइल नं. 1"
                  value={mobile1Filter}
                  onChange={(e) => setmobile1Filter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="मोबाइल नं. 2"
                  value={mobile2Filter}
                  onChange={(e) => setmobile2Filter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="कहां से"
                    value={ageFromFilter}
                    onChange={(e) => setageFromFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    min="0"
                    max="150"
                  />
                  <span className="flex items-center text-gray-500 text-sm">to</span>
                  <input
                    type="number"
                    placeholder="कहां तक"
                    value={ageToFilter}
                    onChange={(e) => setageToFilter(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                    disabled={loading}
                    min="0"
                    max="150"
                  />
                </div>
              </div>
            </div>

            {/* Buttons on Right Side (tight spacing like MasterFilter) */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              

              {/* Show More/Less Button */}
              <button
                onClick={() => setShowMoreFilters(!showMoreFilters)}
                className="flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
                disabled={loading}
              >
                {showMoreFilters ? (
                  <>
                    <ChevronUp size={16} />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    <span>Show More</span>
                  </>
                )}
              </button>

              {/* Go Button */}
              <button
                onClick={handleApplyFilters}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm cursor-pointer"
                disabled={loading}
              >
                <Play size={16} />
                <span>Go</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  // Clear all filters
                  setvillageNameFilter('');
                  setgramPanchayatFilter('');
                  setnameFilter('');
                  setfnameFilter('');
                  setmotherNameFilter('');
                  setsurnameFilter('');
                  setcastIdFilter('');
                  setcastTypeFilter('');
                  setmobile1Filter('');
                  setmobile2Filter('');
                  setdobFilter('');
                  setageFromFilter('');
                  setageToFilter('');
                  setmalefemaleFilter('');
                  setreligionFilter('');
                  setcategoryFilter('');
                  
                  // Clear applied filters
                  onFilterChange({});
                  
                  // Notify MasterFilter that detailed filters are cleared
                  console.log('📤 Dispatching detailed-filter-changed event (cleared) with:', {});
                  window.dispatchEvent(new CustomEvent('detailed-filter-changed', { detail: {} }));
                  window.dispatchEvent(new CustomEvent('filter-section-cleared'));
                  
                  // Refresh filter options
                  refreshFilterOptions();
                  
                  // Trigger DataTable refresh event
                  window.dispatchEvent(new CustomEvent('refreshDataTable'));
                }}
                className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
                disabled={loading}
                title="Refresh filters"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>

          {/* Second Row - Additional Filters */}
          {showMoreFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-3 border-t border-gray-200">
              <div className="relative">
                <input
                  type="date"
                  placeholder="Select date"
                  value={dobFilter}
                  onChange={handleDobChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="नाम"
                  value={nameFilter}
                  onChange={(e) => setnameFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="पिता का नाम"
                  value={fnameFilter}
                  onChange={(e) => setfnameFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="माता का नाम"
                  value={motherNameFilter}
                  onChange={(e) => setmotherNameFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <SearchableSelect
                id="surname"
                value={surnameFilter}
                onChange={setsurnameFilter}
                options={filterOptions.surnames}
                placeholder="उपनाम"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="gender"
                value={malefemaleFilter}
                onChange={setmalefemaleFilter}
                options={filterOptions.malefemales}
                placeholder="लिंग"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="religion"
                value={religionFilter}
                onChange={setreligionFilter}
                options={filterOptions.religions}
                placeholder="धर्म"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="category"
                value={categoryFilter}
                onChange={setcategoryFilter}
                options={filterOptions.categories}
                placeholder="श्रेणी"
                label=""
                disabled={loading}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
            </div>

)}
           

         </div>
       </div>
     </div>
   );
 }

export default React.memo(Filter);