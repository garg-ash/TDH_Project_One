'use client';

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { ChevronDown, Search, Play, Save, Download, Lock, Unlock, RefreshCw } from 'lucide-react';

interface MasterFilterProps {
  onMasterFilterChange: (filters: {
    parliament: string;
    assembly: string;
    district: string;
    block: string;
  }) => void;
}

// Filter preset interface
interface FilterPreset {
  id: string;
  name: string;
  filters: {
    parliament: string;
    assembly: string;
    district: string;
    block: string;
  };
  createdAt: Date;
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
  const [parliament, setParliament] = useState(''); // stores ID (PC_ID)
  const [assembly, setAssembly] = useState(''); // stores ID (AC_ID)
  const [parliamentLabel, setParliamentLabel] = useState(''); // displays Hindi name
  const [assemblyLabel, setAssemblyLabel] = useState(''); // displays Hindi name
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // New state for button functionality
  const [isLocked, setIsLocked] = useState(false);
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({ parliament: '', assembly: '', district: '', block: '' });
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // State for dropdown options
  const [parliamentOptions, setParliamentOptions] = useState<string[]>([]); // labels (Hindi)
  const [assemblyOptions, setAssemblyOptions] = useState<string[]>([]); // labels (Hindi)
  const [districtOptions, setDistrictOptions] = useState<string[]>([]);
  const [blockOptions, setBlockOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ID lists from backend (used to compute labels)
  const [parliamentIdOptions, setParliamentIdOptions] = useState<string[]>([]);
  const [assemblyIdOptions, setAssemblyIdOptions] = useState<string[]>([]);

  // Mapping tables from div_dist_pc_ac
  const [pcIdToHindi, setPcIdToHindi] = useState<Record<string, string>>({});
  const [acIdToHindi, setAcIdToHindi] = useState<Record<string, string>>({});

  // Load saved presets and locked filters from localStorage on component mount
  useEffect(() => {
    // Load saved presets
    const saved = localStorage.getItem('filterPresets');
    if (saved) {
      try {
        const presets = JSON.parse(saved).map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt)
        }));
        setSavedPresets(presets);
      } catch (error) {
        console.error('Error loading saved presets:', error);
      }
    }

    // Load locked filters state
    const lockedState = localStorage.getItem('filterLockState');
    if (lockedState) {
      try {
        const lockData = JSON.parse(lockedState);
        setIsLocked(lockData.isLocked);
        
        // If filters are locked, restore the locked filter values
        if (lockData.isLocked && lockData.lockedFilters) {
          setParliament(lockData.lockedFilters.parliament || '');
          setAssembly(lockData.lockedFilters.assembly || '');
          setDistrict(lockData.lockedFilters.district || '');
          setBlock(lockData.lockedFilters.block || '');
          
          // Automatically apply the locked filters
          onMasterFilterChange(lockData.lockedFilters);
        }
      } catch (error) {
        console.error('Error loading locked filter state:', error);
      }
    }
  }, [onMasterFilterChange]);

  // Listen to Filter section apply/clear events to toggle buttons
  useEffect(() => {
    const onApplied = () => setAppliedFilters(prev => ({ ...prev, parliament: prev.parliament || 'x' }));
    const onCleared = () => setAppliedFilters({ parliament: '', assembly: '', district: '', block: '' });
    window.addEventListener('filter-section-applied', onApplied as any);
    window.addEventListener('filter-section-cleared', onCleared as any);
    return () => {
      window.removeEventListener('filter-section-applied', onApplied as any);
      window.removeEventListener('filter-section-cleared', onCleared as any);
    };
  }, []);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showExportDropdown && !target.closest('[data-export-dropdown]')) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  // Fetch master filter options from backend with cascading filters (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const fetchMasterFilterOptions = async () => {
        try {
          // Do not flip loading state aggressively to avoid blink; keep controls disabled via loading flag changes only when needed
          setLoading(true);
          
          // Pass current filter values to get cascading options
          const currentFilters = {
            parliament: parliament || undefined,
            assembly: assembly || undefined,
            district: district || undefined,
            block: block || undefined
          };
          
          const options = await apiService.fetchMasterFilterOptions(currentFilters);
          // Save raw ID options
          const idsParl = (options.parliamentOptions || []).map(String);
          const idsAssem = (options.assemblyOptions || []).map(String);
          setParliamentIdOptions(idsParl);
          setAssemblyIdOptions(idsAssem);
          setDistrictOptions(options.districtOptions);
          setBlockOptions(options.blockOptions || []);

          // Fetch mapping table and build Hindi labels (with codes in labels)
          try {
            const res = await fetch('http://localhost:5002/api/div_dist_pc_ac');
            if (res.ok) {
              const rows = await res.json();
              const pcMap: Record<string, string> = {};
              const acMap: Record<string, string> = {};
              rows.forEach((r: any) => {
                if (r.PC_ID != null) pcMap[String(r.PC_ID)] = String(r.PC_MANGAL || r.PC_ENG || '');
                if (r.AC_ID != null) acMap[String(r.AC_ID)] = String(r.AC_MANGAL || r.AC_ENG || '');
              });
              setPcIdToHindi(pcMap);
              setAcIdToHindi(acMap);

              // Convert ID options to Hindi labels including code e.g., "श्री गंगानगर (1)"
              setParliamentOptions(idsParl.map(id => `${pcMap[id] || id} (${id})`));
              setAssemblyOptions(idsAssem.map(id => `${acMap[id] || id} (${id})`));

              // If we already have selected IDs, ensure labels reflect them
              if (parliament) setParliamentLabel(`${pcMap[parliament] || parliament} (${parliament})`);
              if (assembly) setAssemblyLabel(`${acMap[assembly] || assembly} (${assembly})`);
            } else {
              // Fallback: show IDs if mapping not available
              setParliamentOptions(idsParl.map(id => `${id}`));
              setAssemblyOptions(idsAssem.map(id => `${id}`));
            }
          } catch {
            setParliamentOptions(idsParl.map(id => `${id}`));
            setAssemblyOptions(idsAssem.map(id => `${id}`));
          }
        } catch (error) {
          console.error('Error fetching master filter options:', error);
        } finally {
          // Small delay before marking as not loading to smooth UI
          setTimeout(() => setLoading(false), 150);
        }
      };

      fetchMasterFilterOptions();
    }, 250); // slight debounce to avoid flicker

    return () => clearTimeout(timeoutId);
  }, [parliament, assembly, district, block]); // Refetch when any filter changes

  // Function to clear dependent filters when higher-level filter changes
  const clearDependentFilters = (changedFilter: 'parliament' | 'assembly' | 'district' | 'block') => {
    switch (changedFilter) {
      case 'parliament':
        // If parliament changes, clear assembly, district, and block
        setAssembly('');
        setDistrict('');
        setBlock('');
        break;
      case 'assembly':
        // If assembly changes, clear district and block
        setDistrict('');
        setBlock('');
        break;
      case 'district':
        // If district changes, clear block
        setBlock('');
        break;
      // block doesn't clear any other filters
    }
  };

  // Function to apply filters when Go button is clicked (for immediate feedback)
  const handleApplyFilters = () => {
    onMasterFilterChange({
      parliament,
      assembly,
      district,
      block,
    });
    setAppliedFilters({ parliament: parliament || '', assembly: assembly || '', district: district || '', block: block || '' });
  };

  // Function to clear all filters
  const clearAllFilters = () => {
    setParliament('');
    setAssembly('');
    setDistrict('');
    setBlock('');
    // Also clear display labels so UI reflects reset immediately
    setParliamentLabel('');
    setAssemblyLabel('');
    setAppliedFilters({ parliament: '', assembly: '', district: '', block: '' });
    onMasterFilterChange({
      parliament: '',
      assembly: '',
      district: '',
      block: '',
    });
  };

  // Check if any filters are active
  const hasActiveFilters = parliament || assembly || district || block;

  // Toggle lock state
  const toggleLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);
    
    if (newLockState) {
      // Locking filters - save current state to localStorage
      const lockData = {
        isLocked: true,
        lockedFilters: {
          parliament,
          assembly,
          district,
          block
        },
        lockedAt: new Date().toISOString()
      };
      
      localStorage.setItem('filterLockState', JSON.stringify(lockData));
      alert('🔒 Filters locked successfully! Your data is now protected. You can navigate to other pages and return to find the same filters.');
    } else {
      // Unlocking filters - remove from localStorage
      localStorage.removeItem('filterLockState');
      alert('🔓 Filters unlocked. You can now modify them.');
    }
  };

  // Clear lock state (useful for resetting)
  const clearLockState = () => {
    setIsLocked(false);
    localStorage.removeItem('filterLockState');
    alert('🔓 Lock state cleared. All filters are now unlocked.');
  };

  // Handle export functionality
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    if (!(parliament || assembly || district || block)) {
      alert('⚠️ Please select at least one filter before exporting.');
      return;
    }

    setIsExporting(true);
    try {
      const filters = {
        parliament: parliament || undefined,
        assembly: assembly || undefined,
        district: district || undefined,
        block: block || undefined,
        format
      };

      const result = await apiService.exportFilteredData(filters);
      
      if (result.success && result.data) {
        // Create download link
        const url = window.URL.createObjectURL(result.data);
        const link = document.createElement('a');
        link.href = url;
        
        // Set filename based on format
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `filtered_data_${timestamp}.${format}`;
        link.download = filename;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        alert(`✅ Data exported successfully as ${format.toUpperCase()}!`);
      } else {
        alert(`❌ Export failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Keep UI mounted during loading to avoid blink; controls will be disabled when loading is true

  return (
    <div className="w-full space-y-4">
      {/* Single Row with Two Containers */}
      <div className="flex items-center justify-between">
        {/* Left Container: Filter Fields + Go + Refresh */}
        <div className="flex items-center space-x-6">
          {/* Filter Fields Grid - Increased Width */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6 min-w-[800px]">
            <SearchableSelect
              id="parliament"
              value={parliamentLabel || (parliament ? `${pcIdToHindi[parliament] || parliament} (${parliament})` : '')}
              onChange={(label) => {
                setParliamentLabel(label);
                // Resolve label to ID
                const match = label.match(/\((\d+)\)\s*$/);
                const matchedId = match ? match[1] : (Object.keys(pcIdToHindi).find(id => pcIdToHindi[id] === label) || '');
                setParliament(matchedId);
                clearDependentFilters('parliament');
              }}
              options={parliamentOptions}
              placeholder="संसदीय क्षेत्र"
              label=""
              disabled={loading}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />

            <SearchableSelect
              id="assembly"
              value={assemblyLabel || (assembly ? `${acIdToHindi[assembly] || assembly} (${assembly})` : '')}
              onChange={(label) => {
                setAssemblyLabel(label);
                const match = label.match(/\((\d+)\)\s*$/);
                const matchedId = match ? match[1] : (Object.keys(acIdToHindi).find(id => acIdToHindi[id] === label) || '');
                setAssembly(matchedId);
                clearDependentFilters('assembly');
              }}
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
              onChange={(value) => {
                setDistrict(value);
                clearDependentFilters('district');
              }}
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
              onChange={(value) => {
                setBlock(value);
                clearDependentFilters('block');
              }}
              options={blockOptions}
              placeholder="ब्लॉक"
              label=""
              disabled={loading}
              activeDropdown={activeDropdown}
              onDropdownToggle={setActiveDropdown}
            />
          </div>

          {/* Go Button and Refresh Button together */}
          <div className="flex items-center space-x-3">
            {/* Go Button */}
            <button
              onClick={handleApplyFilters}
              className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm cursor-pointer min-w-[80px] h-[40px]"
            >
              <Play size={16} />
              <span>Go</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                // Clear all filters first
                clearAllFilters();
                // Trigger a refresh event that DataTable can listen to
                window.dispatchEvent(new CustomEvent('refreshDataTable'));
              }}
              disabled={isLocked}
              className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] h-[40px]"
              title="Refresh data and clear all filters"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Right Container: Save + Export + Lock */}
        <div className="flex items-center space-x-3">
          {/* Save Button */}
          <button
            onClick={() => console.log('Save clicked')}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] h-[40px]"
            disabled={!(appliedFilters.parliament || appliedFilters.assembly || appliedFilters.district || appliedFilters.block)}
          >
            <Save size={16} />
            <span>Save</span>
          </button>
          
          {/* Export Button with Format Selection */}
          <div className="relative">
            <button
              onClick={() => setShowExportDropdown(!showExportDropdown)}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[90px] h-[40px]"
              disabled={!(appliedFilters.parliament || appliedFilters.assembly || appliedFilters.district || appliedFilters.block) || isExporting}
            >
              <Download size={16} />
              <span className="text-xs">{isExporting ? 'Exporting...' : 'Export'}</span>
              <ChevronDown size={14} className={`transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Export Format Dropdown */}
            {showExportDropdown && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]" data-export-dropdown>
                <div className="p-2 border-b border-gray-100">
                  <div className="text-xs font-medium text-gray-700 mb-2">Choose Format:</div>
                  {(['csv', 'excel', 'pdf'] as const).map((format) => (
                    <button
                      key={format}
                      onClick={() => {
                        setExportFormat(format);
                        setShowExportDropdown(false);
                        handleExport(format);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-gray-50 transition-colors ${
                        exportFormat === format ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{format.toUpperCase()}</span>
                        {exportFormat === format && <span className="text-blue-600">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Lock Button */}
          <button
            onClick={toggleLock}
            className={`px-3 py-2 rounded-lg transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] h-[40px] ${
              isLocked 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            disabled={!(appliedFilters.parliament || appliedFilters.assembly || appliedFilters.district || appliedFilters.block)}
          >
            {isLocked ? <Unlock size={16} /> : <Lock size={16} />}
            <span>{isLocked ? 'Unlock' : 'Lock'}</span>
          </button>
        </div>
      </div>

      {/* Lock Status Indicator */}
      {isLocked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Lock size={16} className="text-yellow-600" />
              <span className="text-yellow-800 text-sm font-medium">
                🔒 Filters are locked! Your data is protected. You can navigate to other pages and return to find the same filters.
              </span>
            </div>
            <button
              onClick={clearLockState}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 border border-yellow-300"
              title="Clear lock state"
            >
              Clear Lock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}