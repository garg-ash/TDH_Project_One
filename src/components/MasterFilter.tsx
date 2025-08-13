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
          <ChevronDown 
            size={16} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelect(option)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  >
                    {option}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">No options found</div>
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // State for dropdown options
  const [parliamentOptions, setParliamentOptions] = useState<string[]>([]);
  const [assemblyOptions, setAssemblyOptions] = useState<string[]>([]);
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
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
        setBlockOptions(options.blockOptions || []);
      } catch (error) {
        console.error('Error fetching master filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMasterFilterOptions();
  }, []);

  // Function to apply filters when Go button is clicked (for immediate feedback)
  const handleApplyFilters = () => {
    onMasterFilterChange({
      parliament,
      assembly,
      district,
      block,
    });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setParliament('');
    setAssembly('');
    setDistrict('');
    setBlock('');
    onMasterFilterChange({
      parliament: '',
      assembly: '',
      district: '',
      block: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = parliament || assembly || district || block;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-10 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start justify-between">
        {/* Filter Fields Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 pr-4">
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
            placeholder="ब्लॉक"
            label=""
            disabled={loading}
            activeDropdown={activeDropdown}
            onDropdownToggle={setActiveDropdown}
          />
        </div>

        {/* Action Buttons - Positioned at the absolute right edge */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {/* Go Button */}
          <button
            onClick={handleApplyFilters}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm cursor-pointer"
          >
            <Play size={16} />
            <span>Go</span>
          </button>

          {/* Save Button */}
          <button
            onClick={() => console.log('Save clicked')}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save</span>
          </button>
          
          {/* Export Button */}
          <button
            onClick={() => console.log('Export clicked')}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export</span>
          </button>
          
          {/* Lock Button */}
          <button
            onClick={() => console.log('Lock clicked')}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Lock</span>
          </button>

          {/* Clear All Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium text-sm border border-gray-300"
            >
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
}