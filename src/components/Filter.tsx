'use client';

import { useState, useEffect } from 'react';
import { apiService, FilterOptions, FilterParams } from '../services/api';
import { Filter as FilterIcon, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface FilterProps {
  onFilterChange: (filters: FilterParams) => void;
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

  useEffect(() => {
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
  useEffect(() => {
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
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
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
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
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

export default function Filter({ onFilterChange, loading = false }: FilterProps) {
  const [villageCode, setvillageCode] = useState('');
  const [SectionFilter, setSectionFilter] = useState('');
  const [villageNameFilter, setvillageNameFilter] = useState('');
  const [gramPanchayatFilter, setgramPanchayatFilter] = useState('');
  const [patwarCircleFilter, setpatwarCircleFilter] = useState('');
  const [lrCircleFilter, setlrCircleFilter] = useState('');
  const [dobFilter, setdobFilter] = useState('');
  const [ageFilter, setageFilter] = useState('');
  const [nameFilter, setnameFilter] = useState('');
  const [fnameFilter, setfnameFilter] = useState('');
  const [hnoFilter, sethnoFilter] = useState('');
  const [malefemaleFilter, setmalefemaleFilter] = useState('');
  const [mobileFilter, setmobileFilter] = useState('');
  const [castFilter, setcastFilter] = useState('');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        setLoadingOptions(true);
        const options = await apiService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to fetch filter options:', error);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFilterOptions();
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    const filters: FilterParams = {
      villageCode: villageCode || undefined,
      sectionFilter: SectionFilter || undefined,
      villageNameFilter: villageNameFilter || undefined,
      gramPanchayatFilter: gramPanchayatFilter || undefined,
      patwarCircleFilter: patwarCircleFilter || undefined,
      lrCircleFilter: lrCircleFilter || undefined,
      dobFilter: dobFilter || undefined,
      ageFilter: ageFilter || undefined,
      nameFilter: nameFilter || undefined,
      fnameFilter: fnameFilter || undefined,
      hnoFilter: hnoFilter || undefined,
      malefemaleFilter: malefemaleFilter || undefined,
      mobileFilter: mobileFilter || undefined,
      castFilter: castFilter || undefined,
    };

    onFilterChange(filters);
  }, [
    villageCode, SectionFilter, villageNameFilter, gramPanchayatFilter,
    patwarCircleFilter, lrCircleFilter, dobFilter, ageFilter, nameFilter,
    fnameFilter, hnoFilter, malefemaleFilter, mobileFilter, castFilter,
    onFilterChange
  ]);

  const clearAllFilters = () => {
    setvillageCode('');
    setSectionFilter('');
    setvillageNameFilter('');
    setgramPanchayatFilter('');
    setpatwarCircleFilter('');
    setlrCircleFilter('');
    setdobFilter('');
    setageFilter('');
    setnameFilter('');
    setfnameFilter('');
    sethnoFilter('');
    setmalefemaleFilter('');
    setmobileFilter('');
    setcastFilter('');
  };

  const hasActiveFilters = villageCode || SectionFilter || villageNameFilter || 
    gramPanchayatFilter || patwarCircleFilter || lrCircleFilter || 
    dobFilter || ageFilter || nameFilter || fnameFilter || 
    hnoFilter || malefemaleFilter || mobileFilter || castFilter;

  return (
    <div className="bg-gray-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            {/* <div className="p-2 bg-gray-200 rounded-lg">
              <FilterIcon size={20} className="text-gray-600" />
            </div> */}
            {/* <h2 className="text-xl font-semibold text-gray-800">Data Filters</h2> */}
          </div>
          
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-all duration-200"
                disabled={loading}
              >
                <X size={16} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {(loading || loadingOptions) && (
          <div className="flex items-center justify-center py-4 mb-4">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
            <span className="ml-3 text-sm text-gray-600">
              {loadingOptions ? 'Loading filter options...' : 'Loading data...'}
            </span>
          </div>
        )}

        {/* Filter Grid */}
        <div className="space-y-6">
          {/* Primary Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <SearchableSelect
              id="section"
              value={SectionFilter}
              onChange={setSectionFilter}
              options={filterOptions.sections}
              placeholder="सभी"
              label="अनुभाग"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="villageName"
              value={villageNameFilter}
              onChange={setvillageNameFilter}
              options={filterOptions.villageNames}
              placeholder="सभी"
              label="गाँव का नाम"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="gramPanchayat"
              value={gramPanchayatFilter}
              onChange={setgramPanchayatFilter}
              options={filterOptions.gramPanchayats}
              placeholder="सभी"
              label="ग्राम पंचायत"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="patwarCircle"
              value={patwarCircleFilter}
              onChange={setpatwarCircleFilter}
              options={filterOptions.patwarCircles}
              placeholder="सभी"
              label="पटवार मंडल"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="lrCircle"
              value={lrCircleFilter}
              onChange={setlrCircleFilter}
              options={filterOptions.lrCircles}
              placeholder="सभी"
              label="ILR Circle"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="dob"
              value={dobFilter}
              onChange={setdobFilter}
              options={[]} // Add date options if needed
              placeholder="सभी"
              label="जन्म तिथि"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
            
            <SearchableSelect
              id="age"
              value={ageFilter}
              onChange={setageFilter}
              options={filterOptions.ages}
              placeholder="सभी"
              label="उम्र"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />

            <SearchableSelect
              id="name"
              value={nameFilter}
              onChange={setnameFilter}
              options={filterOptions.names}
              placeholder="सभी"
              label="नाम"
              disabled={loadingOptions}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
          </div>

          {/* Additional Filters (Hidden by default) */}
          {showMoreFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <SearchableSelect
                id="fname"
                value={fnameFilter}
                onChange={setfnameFilter}
                options={filterOptions.fnames}
                placeholder="सभी"
                label="पिता का नाम"
                disabled={loadingOptions}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />

              <SearchableSelect
                id="hno"
                value={hnoFilter}
                onChange={sethnoFilter}
                options={filterOptions.hnos}
                placeholder="सभी"
                label="गृह सं"
                disabled={loadingOptions}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />

              <SearchableSelect
                id="malefemale"
                value={malefemaleFilter}
                onChange={setmalefemaleFilter}
                options={filterOptions.malefemales}
                placeholder="सभी"
                label="पुरुष / महिला"
                disabled={loadingOptions}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  मोबाइल नंबर
                </label>
                <input 
                  type="number" 
                  placeholder="Enter mobile number" 
                  value={mobileFilter} 
                  onChange={(e)=> setmobileFilter(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>

              <SearchableSelect
                id="cast"
                value={castFilter}
                onChange={setcastFilter}
                options={filterOptions.castTypes}
                placeholder="सभी"
                label="जाति"
                disabled={loadingOptions}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
            </div>
          )}
          
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
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
        </div>
      </div>
    </div>
  );
} 