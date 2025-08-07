'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ChevronDown, Search, Play } from 'lucide-react';

interface MasterFilterProps {
  onMasterFilterChange: (filters: {
    parliament: string;
    assembly: string;
    district: string;
    block: string;
    tehsil: string;
    pincode: string;
  }) => void;
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
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

export default function MasterFilter({ onMasterFilterChange }: MasterFilterProps) {
  const [parliament, setParliament] = useState('');
  const [assembly, setAssembly] = useState('');
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [pincode, setPincode] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // State for dropdown options
  const [parliamentOptions, setParliamentOptions] = useState<string[]>([]);
  const [assemblyOptions, setAssemblyOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [tehsilOptions, setTehsilOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch master filter options from backend
  useEffect(() => {
    const fetchMasterFilterOptions = async () => {
      try {
        setLoading(true);
        const options = await apiService.fetchMasterFilterOptions();
        setParliamentOptions(options.parliamentOptions);
        setAssemblyOptions(options.assemblyOptions);
        setDistrictOptions(options.districtOptions);
        setBlockOptions(options.blockOptions);
        setTehsilOptions(options.tehsilOptions);
      } catch (error) {
        console.error('Error fetching master filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterFilterOptions();
  }, []);

  // Remove the automatic filter application
  // useEffect(() => {
  //   onMasterFilterChange({
  //     parliament,
  //     assembly,
  //     district,
  //     block,
  //     tehsil,
  //     pincode,
  //   });
  // }, [parliament, assembly, district, block, tehsil, pincode]);

  // Function to apply filters when Go button is clicked
  const handleApplyFilters = () => {
    onMasterFilterChange({
      parliament,
      assembly,
      district,
      block,
      tehsil,
      pincode,
    });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setParliament('');
    setAssembly('');
    setDistrict('');
    setBlock('');
    setTehsil('');
    setPincode('');
    // Apply empty filters
    onMasterFilterChange({
      parliament: '',
      assembly: '',
      district: '',
      block: '',
      tehsil: '',
      pincode: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = parliament || assembly || district || block || tehsil || pincode;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start space-x-4">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SearchableSelect
            id="parliament"
            value={parliament}
            onChange={setParliament}
            options={parliamentOptions}
            placeholder="संसदीय क्षेत्र"
            label=""
            disabled={loading}
            activeDropdown={activeDropdown}
            onDropdownToggle={setActiveDropdown}
          />

          <SearchableSelect
            id="assembly"
            value={assembly}
            onChange={setAssembly}
            options={assemblyOptions}
            placeholder="विधानसभा क्षेत्र"
            label=""
            disabled={loading}
            activeDropdown={activeDropdown}
            onDropdownToggle={setActiveDropdown}
          />

          <SearchableSelect
            id="district"
            value={district}
            onChange={setDistrict}
            options={districtOptions}
            placeholder="ज़िला"
            label=""
            disabled={loading}
            activeDropdown={activeDropdown}
            onDropdownToggle={setActiveDropdown}
          />

          <SearchableSelect
            id="block"
            value={block}
            onChange={setBlock}
            options={blockOptions}
            placeholder="Block / खंड"
            label=""
            disabled={loading}
            activeDropdown={activeDropdown}
            onDropdownToggle={setActiveDropdown}
          />

          {/* Dynamic Go Button - Always on the right */}
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleApplyFilters}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm cursor-pointer h-full"
            >
              <Play size={16} />
              <span>Go</span>
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium text-sm"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Status */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Filters ready to apply: {[parliament, assembly, district, block, tehsil, pincode].filter(Boolean).length} selected
            </div>
            <div className="text-xs text-gray-500">
              Click "Go" to apply filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

