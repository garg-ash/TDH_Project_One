'use client';

import { useState } from 'react';
import { ArrowRight, Settings } from 'lucide-react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import Filter from '../components/Filter';
import MasterFilter from '../components/MasterFilter';

export default function HomePage() {
  const [showModules, setShowModules] = useState(true);
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(false);

  const modules = [
    {
      id: 'dataset',
      title: 'Data Set',
      description: 'Manage and view voter data with advanced filtering options',
      icon: '📊'
    },
    {
      id: 'mobilesetup',
      title: 'Mobile Setup',
      description: 'Configure mobile settings and preferences',
      icon: '📱'
    }
  ];

  const handleDataSetClick = () => {
    setSelectedModule('dataset');
    setShowModules(false);
  };

  const handleMobileSetupClick = () => {
    setSelectedModule('mobilesetup');
    setShowModules(false);
  };

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
  };

  const handleFilterChange = (filters: any) => {
    console.log('Filter changed:', filters);
  };

  if (showModules) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Settings size={32} className="text-gray-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Election Management System
            </h1>
            <p className="text-gray-600 text-lg">
              Select a module to get started
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 h-full group cursor-pointer"
                onClick={module.id === 'dataset' ? handleDataSetClick : handleMobileSetupClick}
              >
                <div className="p-6 flex flex-col items-center justify-center h-full">
                  <div className="bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 w-16 h-16 mb-4">
                    <span className="text-3xl">{module.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 text-center">
                    {module.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Data Table Page
  return (
    <div>
      {/* Back to Modules Button and Master Filter */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl flex items-center space-x-6">
          <button
            onClick={() => setShowModules(true)}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            title="Back to Modules"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="flex-1">
            <MasterFilter onMasterFilterChange={handleMasterFilterChange} />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <button
              onClick={() => console.log('Save clicked')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </button>
            
            <button
              onClick={() => console.log('Export clicked')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export</span>
            </button>
            
            <button
              onClick={() => console.log('Lock clicked')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium text-sm flex items-center space-x-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Lock</span>
            </button>
          </div>
        </div>
      </div>
      
      <Navbar />
      
      {/* Filter and Data Table */}
      <Filter onFilterChange={handleFilterChange} loading={loading} />
      <div className="pt-4 pb-4">
        <DataTable />
      </div>
    </div>
  );
}


