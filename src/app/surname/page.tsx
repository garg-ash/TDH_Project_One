'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
import SurnameDataTable, { SurnameData } from '../../components/SurnameDataTable';
import { apiService } from '../../services/api';

// Sample data for the surname table (fallback)
const sampleSurnameData = [
  { id: 1, surname: 'Sharma', count: 150, castId: 'SC001', castIda: 'SC001A' },
  { id: 2, surname: 'Verma', count: 120, castId: 'SC002', castIda: 'SC002A' },
  { id: 3, surname: 'Patel', count: 95, castId: 'SC003', castIda: 'SC003A' },
  { id: 4, surname: 'Singh', count: 200, castId: 'SC004', castIda: 'SC004A' },
  { id: 5, surname: 'Kumar', count: 180, castId: 'SC005', castIda: 'SC005A' },
  { id: 6, surname: 'Gupta', count: 110, castId: 'SC006', castIda: 'SC006A' },
  { id: 7, surname: 'Yadav', count: 85, castId: 'SC007', castIda: 'SC007A' },
  { id: 8, surname: 'Rajput', count: 75, castId: 'SC008', castIda: 'SC008A' },
];

// Remove local interface since we're importing it from SurnameDataTable

export default function SurnamePage() {
  const [loading, setLoading] = useState(false);
  const [surnameData, setSurnameData] = useState<SurnameData[]>(sampleSurnameData);
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

  // Checkbox states for surname page form fields
  const [nameChecked, setNameChecked] = useState(false);
  const [fnameChecked, setFnameChecked] = useState(false);
  const [mnameChecked, setMnameChecked] = useState(false);

  // Dropdown state for count filter
  const [countFilter, setCountFilter] = useState('');

  // Fetch surname data from API with master filters
  const fetchSurnameData = async (filters?: any) => {
    try {
      setLoading(true);
      
      // Combine master filters with form filters
      const combinedFilters = {
        ...masterFilters,
        ...filters
      };
      
      console.log('Fetching surname data with combined filters:', combinedFilters);
      
      // Check if master filters are applied
      if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
        console.log('Master filters active, filtering data based on:', masterFilters);
        
        // If master filters are active, filter the sample data based on the selected fields
        // In a real implementation, this would be an API call with the master filters
        let filteredData = sampleSurnameData;
        
        // Simulate filtering based on master filters
        if (masterFilters.district) {
          // Filter data based on district (this is just a simulation)
          // In reality, the API would return only data for the selected district
          filteredData = sampleSurnameData.filter(item => {
            // Simulate district-based filtering
            return item.surname.toLowerCase().includes(masterFilters.district!.toLowerCase()) ||
                   item.castId.toLowerCase().includes(masterFilters.district!.toLowerCase());
          });
        }
        
        if (masterFilters.assembly) {
          // Additional filtering based on assembly
          filteredData = filteredData.filter(item => {
            return item.surname.toLowerCase().includes(masterFilters.assembly!.toLowerCase()) ||
                   item.castId.toLowerCase().includes(masterFilters.assembly!.toLowerCase());
          });
        }
        
        if (masterFilters.parliament) {
          // Additional filtering based on parliament
          filteredData = filteredData.filter(item => {
            return item.surname.toLowerCase().includes(masterFilters.parliament!.toLowerCase()) ||
                   item.castId.toLowerCase().includes(masterFilters.parliament!.toLowerCase());
          });
        }
        
        if (masterFilters.block) {
          // Additional filtering based on block
          filteredData = filteredData.filter(item => {
            return item.surname.toLowerCase().includes(masterFilters.block!.toLowerCase()) ||
                   item.castId.toLowerCase().includes(masterFilters.block!.toLowerCase());
          });
        }
        
        setSurnameData(filteredData);
        console.log(`Filtered to ${filteredData.length} surnames based on master filters`);
      } else {
        // No master filters, show all data
        console.log('No master filters active, showing all data');
        setSurnameData(sampleSurnameData);
      }
      
      // Apply additional form filters if any
      if (filters && (filters.name || filters.fname || filters.mname)) {
        let formFilteredData = surnameData;
        
        if (filters.name) {
          formFilteredData = formFilteredData.filter(item => 
            item.surname.toLowerCase().includes(filters.name.toLowerCase())
          );
        }
        
        if (filters.fname) {
          formFilteredData = formFilteredData.filter(item => 
            item.castId.toLowerCase().includes(filters.fname.toLowerCase())
          );
        }
        
        if (filters.mname) {
          formFilteredData = formFilteredData.filter(item => 
            item.castIda.toLowerCase().includes(filters.mname.toLowerCase())
          );
        }
        
        setSurnameData(formFilteredData);
        console.log(`Further filtered to ${formFilteredData.length} surnames based on form filters`);
      }
      
    } catch (error) {
      console.error('Error fetching surname data:', error);
      // Fallback to sample data on error
      setSurnameData(sampleSurnameData);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data when component mounts
  useEffect(() => {
    fetchSurnameData();
  }, []);

  // Effect to refetch data when master filters change
  useEffect(() => {
    if (masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) {
      console.log('Master filters changed, refetching surname data:', masterFilters);
      fetchSurnameData();
    } else {
      // If all master filters are cleared, show all data
      console.log('All master filters cleared, showing all surname data');
      setSurnameData(sampleSurnameData);
    }
  }, [masterFilters]);

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
    // Note: Don't call fetchSurnameData here as the useEffect will handle it
  };

  const handleGoClick = () => {
    console.log('Go button clicked - processing surname data');
    console.log('Form data:', formData);
    
    // Fetch data based on form inputs combined with master filters
    fetchSurnameData({
      name: formData.name,
      fname: formData.fname,
      mname: formData.mname
    });
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

  return (
    <div>
      {/* Back to Modules Button and Master Filter */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl flex items-center space-x-6">
          <button
            onClick={() => window.history.back()}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            title="Back"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="flex-1">
            <MasterFilter onMasterFilterChange={handleMasterFilterChange} />
          </div>
        </div>
      </div>
      
      <Navbar />
      
      {/* Master Filter Status Display */}
              {(masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg mx-6 mt-4 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Active Filters:</strong> {[
                  masterFilters.parliament && `Parliament: ${masterFilters.parliament}`,
                  masterFilters.assembly && `Assembly: ${masterFilters.assembly}`,
                  masterFilters.district && `District: ${masterFilters.district}`,
                  masterFilters.block && `Block: ${masterFilters.block}`
                ].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing surname data filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Form Fields Section */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter name"
                  value={formData.name}
                  onChange={(e) => {
                    handleInputChange('name', e.target.value);
                    if (e.target.value && !nameChecked) {
                      setNameChecked(true);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="checkbox"
                  checked={nameChecked}
                  onChange={(e) => {
                    setNameChecked(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, name: '' }));
                    }
                  }}
                  className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                />
                {/* <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Name</label> */}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter father's name"
                  value={formData.fname}
                  onChange={(e) => {
                    handleInputChange('fname', e.target.value);
                    if (e.target.value && !fnameChecked) {
                      setFnameChecked(true);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="checkbox"
                  checked={fnameChecked}
                  onChange={(e) => {
                    setFnameChecked(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, fname: '' }));
                    }
                  }}
                  className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                />
                {/* <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Fname</label> */}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Enter mother's name"
                  value={formData.mname}
                  onChange={(e) => {
                    handleInputChange('mname', e.target.value);
                    if (e.target.value && !mnameChecked) {
                      setMnameChecked(true);
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
                />
                <input
                  type="checkbox"
                  checked={mnameChecked}
                  onChange={(e) => {
                    setMnameChecked(e.target.checked);
                    if (!e.target.checked) {
                      setFormData(prev => ({ ...prev, mname: '' }));
                    }
                  }}
                  className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
                />
                {/* <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Mname</label> */}
              </div>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={handleGoClick}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
              >
                <span>Go</span>
              </button>
            </div>
            
            <div className="flex items-end">
              <select
                value={countFilter}
                onChange={(e) => setCountFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select Count</option>
                <option value="500">{'>'}500</option>
                <option value="1000">{'>'}1000</option>
                <option value="2000">{'>'}2000</option>
                <option value="5000">{'>'}5000</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Excel-like Data Table Section */}
      <div className="pt-4 pb-4">
        <SurnameDataTable 
          data={surnameData}
          loading={loading}
          onUpdateSurname={handleUpdateSurname}
        />
      </div>
      
    </div>
  );
}
