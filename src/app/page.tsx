'use client';

import { useState } from 'react';
import { Database, Smartphone, ArrowRight } from 'lucide-react';
import Navbar from "@/components/Navbar";
import Filter from "@/components/Filter";
import DataTable from "@/components/DataTable";
import { FilterParams } from "@/services/api";

export default function Home() {
  const [filters, setFilters] = useState<FilterParams>({});
  const [loading, setLoading] = useState(false);
  const [showModules, setShowModules] = useState(true);
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const handleFilterChange = (newFilters: FilterParams) => {
    setFilters(newFilters);
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
      color: 'bg-blue-500',
      hoverColor: 'bg-blue-600',
      onClick: handleDataSetClick
    },
    {
      id: 'mobilesetup',
      title: 'Mobile Setup',
      description: 'Configure mobile devices, sync data, and manage offline capabilities',
      icon: Smartphone,
      color: 'bg-green-500',
      hoverColor: 'bg-green-600',
      onClick: handleMobileSetupClick
    }
  ];

  return (
    <div>
      <Navbar />
      
      {showModules ? (
        // Modules Page
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Election Management System
              </h1>
              <p className="text-xl text-gray-600">
                Choose a module to get started
              </p>
            </div>

            {/* Modules Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {modules.map((module) => {
                const IconComponent = module.icon;
                const isHovered = hoveredModule === module.id;
                
                return (
                  <div
                    key={module.id}
                    className={`relative group cursor-pointer transform transition-all duration-300 ${
                      isHovered ? 'scale-105' : 'hover:scale-102'
                    }`}
                    onMouseEnter={() => setHoveredModule(module.id)}
                    onMouseLeave={() => setHoveredModule(null)}
                    onClick={module.onClick}
                  >
                    {/* Card */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                      {/* Header */}
                      <div className={`${module.color} p-6 text-white`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <IconComponent size={32} />
                            <h2 className="text-2xl font-bold">{module.title}</h2>
                          </div>
                          <ArrowRight 
                            size={24} 
                            className={`transition-transform duration-300 ${
                              isHovered ? 'translate-x-2' : ''
                            }`}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <p className="text-gray-600 text-lg leading-relaxed">
                          {module.description}
                        </p>
                        
                        {/* Action Button */}
                        <div className="mt-6">
                          <button
                            className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors duration-300 ${
                              isHovered ? module.hoverColor : module.color
                            } hover:shadow-md`}
                          >
                            Access {module.title}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className={`absolute inset-0 rounded-xl border-2 border-transparent transition-all duration-300 ${
                      isHovered ? 'border-blue-300 shadow-lg' : ''
                    }`} />
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="text-center mt-12">
              <p className="text-gray-500">
                Select a module above to access its features and functionality
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Data Table Page
        <>
          <div className="p-4">
            <button
              onClick={() => setShowModules(true)}
              className="mb-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <ArrowRight className="rotate-180" size={16} />
              <span>Back to Modules</span>
            </button>
          </div>
          <Filter onFilterChange={handleFilterChange} loading={loading} />
          <div className="p-4">
            <DataTable />
          </div>
        </>
      )}
    </div>
  );
}


