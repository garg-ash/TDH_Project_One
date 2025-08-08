'use client';

import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import Navbar from '../../components/Navbar';
import MasterFilter from '../../components/MasterFilter';
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

// Interface for surname data
interface SurnameData {
  id: number;
  surname: string;
  count: number;
  castId: string;
  castIda: string;
}

export default function SurnamePage() {
  const [loading, setLoading] = useState(false);
  const [surnameData, setSurnameData] = useState<SurnameData[]>(sampleSurnameData);
  const [editingCell, setEditingCell] = useState<{ rowId: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    fname: '',
    mname: ''
  });

  // Checkbox states for surname page form fields
  const [nameChecked, setNameChecked] = useState(false);
  const [fnameChecked, setFnameChecked] = useState(false);
  const [mnameChecked, setMnameChecked] = useState(false);

  // Dropdown state for count filter
  const [countFilter, setCountFilter] = useState('');

  // Fetch surname data from API
  const fetchSurnameData = async (filters?: any) => {
    try {
      setLoading(true);
      
      // 🔧 TODO: Replace this with your actual API endpoint
      // 
      // Option 1: Add to existing apiService
      // In frontend/src/services/api.ts, add:
      // async getSurnameData(filters: any): Promise<SurnameData[]> {
      //   return this.request('/surname-data', { method: 'GET', params: filters });
      // }
      //
      // Option 2: Direct API call
      // const response = await fetch('http://localhost:3001/api/surname-data', {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(filters)
      // });
      // const data = await response.json();
      // setSurnameData(data);
      
      // For now, using sample data
      console.log('Fetching surname data with filters:', filters);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // You can modify this to use real API data
      setSurnameData(sampleSurnameData);
      
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

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    // Refetch data with new master filters
    fetchSurnameData(filters);
  };

  const handleGoClick = () => {
    console.log('Go button clicked - processing surname data');
    console.log('Form data:', formData);
    
    // Fetch data based on form inputs
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

  const handleCellDoubleClick = (rowId: number, field: string, currentValue: string) => {
    setEditingCell({ rowId, field });
    setEditValue(currentValue);
  };

  const handleCellSave = async () => {
    if (editingCell) {
      try {
        // Update local state immediately for better UX
        setSurnameData(prevData => 
          prevData.map(row => 
            row.id === editingCell.rowId 
              ? { ...row, [editingCell.field]: editValue }
              : row
          )
        );
        
        // TODO: Send update to API
        // Example API call:
        // await apiService.updateSurnameData(editingCell.rowId, {
        //   [editingCell.field]: editValue
        // });
        
        console.log('Saving cell update:', {
          rowId: editingCell.rowId,
          field: editingCell.field,
          value: editValue
        });
        
        setEditingCell(null);
        setEditValue('');
      } catch (error) {
        console.error('Error saving cell update:', error);
        // Revert local state on error
        setSurnameData(prevData => 
          prevData.map(row => 
            row.id === editingCell.rowId 
              ? { ...row, [editingCell.field]: editValue }
              : row
          )
        );
      }
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
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
       
       {/* Data Table Section */}
       <div className="max-w-7xl mx-auto px-6 py-6">
         <div className="bg-white shadow-lg overflow-hidden">
           
                       <div className="overflow-x-auto">
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-2 text-gray-600">Loading surname data...</span>
                </div>
              )}
              <table className="w-full border-collapse">
               <thead className="bg-gray-200 border-b border-gray-300">
                 <tr>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider border-r border-gray-300 bg-gray-200">
                     S.No.
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider border-r border-gray-300 bg-gray-200">
                     Surname
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider border-r border-gray-300 bg-gray-200">
                     Count
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider border-r border-gray-300 bg-gray-200">
                     Cast ID
                   </th>
                   <th className="px-4 py-3 text-left text-xs font-medium text-gray-800 uppercase tracking-wider bg-gray-200">
                     Cast IDA
                   </th>
                 </tr>
               </thead>
                               <tbody className="bg-white">
                  {surnameData.map((row, index) => (
                    <tr key={row.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300 bg-gray-200">
                        <span className="text-gray-800 font-medium">{index + 1}</span>
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300 cursor-pointer hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                        onDoubleClick={() => handleCellDoubleClick(row.id, 'surname', row.surname)}
                        tabIndex={0}
                      >
                        {editingCell?.rowId === row.id && editingCell?.field === 'surname' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleCellSave}
                              className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title="Save (Enter)"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              title="Cancel (Esc)"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="block w-full h-full">{row.surname}</span>
                        )}
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300 cursor-pointer hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                        onDoubleClick={() => handleCellDoubleClick(row.id, 'count', row.count.toString())}
                        tabIndex={0}
                      >
                        {editingCell?.rowId === row.id && editingCell?.field === 'count' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleCellSave}
                              className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title="Save (Enter)"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              title="Cancel (Esc)"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="block w-full h-full">{row.count}</span>
                        )}
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300 cursor-pointer hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                        onDoubleClick={() => handleCellDoubleClick(row.id, 'castId', row.castId)}
                        tabIndex={0}
                      >
                        {editingCell?.rowId === row.id && editingCell?.field === 'castId' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleCellSave}
                              className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title="Save (Enter)"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              title="Cancel (Esc)"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="block w-full h-full">{row.castId}</span>
                        )}
                      </td>
                      <td 
                        className="px-4 py-3 text-sm text-gray-900 cursor-pointer hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
                        onDoubleClick={() => handleCellDoubleClick(row.id, 'castIda', row.castIda)}
                        tabIndex={0}
                      >
                        {editingCell?.rowId === row.id && editingCell?.field === 'castIda' ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleCellSave}
                              className="flex-1 px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={handleCellSave}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              title="Save (Enter)"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleCellCancel}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              title="Cancel (Esc)"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span className="block w-full h-full">{row.castIda}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
           
           {/* Table Footer */}
           <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
             <div className="flex justify-between items-center text-sm text-gray-700">
               <div>
                 Showing {surnameData.length} of {surnameData.length} entries
               </div>
               <div className="text-gray-500">
                 Total Surnames: {surnameData.length}
               </div>
             </div>
           </div>
         </div>
       </div>
       
     </div>
   );
 }
