'use client';

import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Search, Play } from 'lucide-react';

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

function Filter({ masterFilters = {}, onFilterChange, loading = false }: FilterProps) {
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

  // Hardcoded sample data for dropdowns - NO BACKEND DEPENDENCIES
  const filterOptions = {
    villageNames: ['Village 1', 'Village 2', 'Village 3', 'Village 4', 'Village 5', 'Village 6', 'Village 7', 'Village 8'],
    gramPanchayats: ['GP 1', 'GP 2', 'GP 3', 'GP 4', 'GP 5', 'GP 6', 'GP 7', 'GP 8'],
    names: ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Tom', 'Emma', 'Alex', 'Maria'],
    fnames: ['Robert', 'Michael', 'William', 'James', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Charles'],
    malefemales: ['Male', 'Female'],
    castTypes: ['General', 'OBC', 'SC', 'ST', 'Other'],
    motherNames: ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen'],
    surnames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
    religions: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Other'],
    categories: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Other']
  };

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
      mobile1: mobile1Filter || undefined,
      mobile2: mobile2Filter || undefined,
      castId: castIdFilter || undefined,
      castIda: castTypeFilter || undefined,
    };

    // Remove undefined values to avoid sending empty filters
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
    );

    // Add a small delay to prevent rapid successive filter changes
    setTimeout(() => {
      onFilterChange(cleanFilters);
    }, 100);
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
  };

  const hasActiveFilters = villageNameFilter || 
    gramPanchayatFilter || 
    dobFilter || ageFromFilter || ageToFilter || nameFilter || fnameFilter || 
    malefemaleFilter || mobile1Filter || mobile2Filter || 
    castIdFilter || castTypeFilter || motherNameFilter || surnameFilter || 
    religionFilter || categoryFilter;

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
                disabled={false}
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
                disabled={false}
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
                placeholder="Cast Type"
                label=""
                disabled={false}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />

              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter mobile 1"
                  value={mobile1Filter}
                  onChange={(e) => setmobile1Filter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter mobile 2"
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
                    placeholder="From"
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
                    placeholder="To"
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

            {/* Buttons on Right Side */}
            <div className="flex items-center space-x-3 flex-shrink-0">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <SearchableSelect
                id="name"
                value={nameFilter}
                onChange={setnameFilter}
                options={filterOptions.names}
                placeholder="नाम"
                label=""
                disabled={false}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="fname"
                value={fnameFilter}
                onChange={setfnameFilter}
                options={filterOptions.fnames}
                placeholder="पिता का नाम"
                label=""
                disabled={false}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="motherName"
                value={motherNameFilter}
                onChange={setmotherNameFilter}
                options={filterOptions.motherNames}
                placeholder="माता का नाम"
                label=""
                disabled={false}
                activeDropdown={activeDropdown}
                onDropdownToggle={setActiveDropdown}
              />
              
              <SearchableSelect
                id="surname"
                value={surnameFilter}
                onChange={setsurnameFilter}
                options={filterOptions.surnames}
                placeholder="उपनाम"
                label=""
                disabled={false}
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
                disabled={false}
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
                disabled={false}
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
                disabled={false}
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