'use client';

import { useState } from 'react';
import { Database, Smartphone, ArrowRight, Users, BarChart3, MapPin, FileText, Settings } from 'lucide-react';
import Navbar from "@/components/Navbar";
import MasterFilter from "@/components/MasterFilter";
import Filter from "@/components/Filter";
import DataTable from "@/components/DataTable";
import { FilterParams } from "@/services/api";

export default function Home() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [masterFilters, setMasterFilters] = useState({
    parliament: '',
    assembly: '',
    district: '',
    block: '',
    tehsil: '',
    pincode: '',
  });
  const [loading, setLoading] = useState(false);
  const [showModules, setShowModules] = useState(true);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
  };

  const handleMasterFilterChange = (newMasterFilters: {
    parliament: string;
    assembly: string;
    district: string;
    block: string;
    tehsil: string;
    pincode: string;
  }) => {
    setMasterFilters(newMasterFilters);
  };

  const handleDataSetClick = () => {
    setShowModules(false);
  };

  const handleMobileSetupClick = () => {
    alert('Mobile Setup functionality will be implemented soon!');
  };

  const modules = [
    {
      id: 'dataset',
      title: 'Data Set',
      description: 'Access and manage voter data, view statistics, and export information',
      icon: Database,
      onClick: handleDataSetClick
    },
    {
      id: 'mobilesetup',
      title: 'Mobile Setup',
      description: 'Configure mobile devices, sync data, and manage offline capabilities',
      icon: Smartphone,
      onClick: handleMobileSetupClick
    },
    
  ];

  return (
    <div>
      {/* Header */}
      {showModules && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Election Management System
                </h1>
              </div>
              
              <div className="flex space-x-4">
                <a
                  href="/login"
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Login
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Master Filter */}
      
      {!showModules && (
        <>
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
        </>
      )}
      
      {showModules ? (
        // Modules Page
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-600 rounded-full mb-6">
                <Settings size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Election Management System
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Choose a module to access comprehensive election management tools and features
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {modules.map((module) => {
                const IconComponent = module.icon;
                const isHovered = hoveredModule === module.id;
                
                return (
                  <div
                    key={module.id}
                    className={`group cursor-pointer transform transition-all duration-300 ${
                      isHovered ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onMouseEnter={() => setHoveredModule(module.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    onClick={module.onClick}
                  >
                    {/* Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 h-full">
                      {/* Icon Header */}
                      <div className="p-6 pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-300">
                            <IconComponent size={24} className="text-gray-600" />
                          </div>
                          <ArrowRight 
                            size={20} 
                            className={`text-gray-400 transition-all duration-300 ${
                              isHovered ? 'translate-x-1 text-gray-600' : ''
                            }`}
                          />
                        </div>
                        
                        {/* Title */}
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                          {module.title}
                        </h3>
                        
                        {/* Description */}
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {module.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="px-6 pb-6">
                        <div className="w-full py-2.5 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg font-medium text-sm transition-colors duration-300 text-center border border-gray-200 hover:border-gray-300">
                          Access Module
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center mt-12 pt-8 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Select any module above to access its features and functionality
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Data Table Page
        <>
          <Filter onFilterChange={handleFilterChange} loading={loading} />
          <div className="pt-4 pb-4">
            <DataTable />
          </div>
        </>
      )}
    </div>
  );
}


