'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import MasterFilter from '../../components/MasterFilter';
import Navbar from '../../components/Navbar';

export default function DataAlterationPage() {
  const [loading, setLoading] = useState(false);
  const [selectedColumnField, setSelectedColumnField] = useState('');

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    // Handle master filter changes here
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

            {/* Navbar */}
            <Navbar />
      {/* Column Field Selection */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Select Column Field:
            </label>
            <select
              value={selectedColumnField}
              onChange={(e) => setSelectedColumnField(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all duration-200 min-w-[200px]"
            >
              <option value="">Select an option</option>
              <option value="replace">Replace</option>
              <option value="data-fill">Data Fill</option>
            </select>
          </div>
        </div>
      </div>

    </div>    
  );
}
