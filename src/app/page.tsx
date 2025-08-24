'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Settings } from 'lucide-react';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import Filter from '../components/Filter';
import MasterFilter from '../components/MasterFilter';

interface UserInfo {
  id: number;
  email: string;
  role: string;
  name?: string;
}

function HomePage() {
  const [showModules, setShowModules] = useState(true);
  const [selectedModule, setSelectedModule] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});
  const [detailedFilters, setDetailedFilters] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr);
        setUserInfo(user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
      }
    }
  }, []);

  const modules = [
    {
      id: 'dataset',
      title: 'Data Set',
      description: 'Manage and view voter data with advanced filtering options',
      icon: '📋'
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
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
  };

  const handleFilterChange = (filters: any) => {
    setDetailedFilters(filters);
  };

  if (showModules) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Settings size={32} className="text-gray-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Election Management System
            </h1>
            <p className="text-gray-600 text-lg">
              Welcome back, {userInfo?.name || userInfo?.email}! Select a module to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 h-full group cursor-pointer"
                onClick={
                  module.id === 'dataset' ? handleDataSetClick : 
                  handleMobileSetupClick
                }
              >
                <div className="p-6 flex flex-col items-center justify-center h-full">
                  <div className="bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 w-16 h-16 mb-4">
                    <span className="text-3xl">{module.icon}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 text-center">
                    {module.title}
                  </h3>
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {module.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
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
        </div>
      </div>
      
      <Navbar />
      
      <Filter 
        masterFilters={masterFilters}
        onFilterChange={handleFilterChange} 
        loading={loading} 
      />
      <div className="pt-4 pb-4">
        <DataTable masterFilters={masterFilters} detailedFilters={detailedFilters} />
      </div>
    </div>
  );
}

export default React.memo(HomePage);
