'use client';

import { useState, useEffect } from 'react';
import { User, BarChart3, FileText, Users, Gem, ArrowLeftRight, BookOpen, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import logo from '/Next/public/logo.png';


export default function Navbar() {
  const router = useRouter();
  const [dataProcessDropdown, setDataProcessDropdown] = useState(false);

  const handleModulesClick = () => {
    router.push('/modules');
  };

  const handleFilterClick = () => {
    // Navigate directly to the main page.tsx file under app directory
    console.log('Filter button clicked - navigating to main page');
    router.push('/');
    // Fallback to ensure navigation works
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }, 100);
  };

  const handleDataProcessClick = () => {
    setDataProcessDropdown(!dataProcessDropdown);
  };

  const handleSubMenuClick = (subMenu: string) => {
    console.log(`Data Process - ${subMenu} clicked`);
    setDataProcessDropdown(false);
    
    // Navigation logic for sub-menus
    switch (subMenu) {
      case 'By Surname':
        router.push('/surname');
        break;
      case 'Data Alteration':
        router.push('/data-alteration');
        break;
      default:
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dataProcessDropdown && !target.closest('[data-dropdown="data-process"]')) {
        setDataProcessDropdown(false);
      }
    };

    if (dataProcessDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dataProcessDropdown]);

  return (
    <div className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <img 
              src="/logo.png" 
              alt="THE BIG OWL Logo" 
              className="w-10 h-10 object-contain flex-shrink-0 transition-transform hover:scale-105" 
            />
          </div>

          {/* Navigation Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer">
              Dashboard
            </button>
            <button 
              onClick={handleFilterClick}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer"
            >
              Filter
            </button>
            <div className="relative" data-dropdown="data-process">
              <button 
                onClick={handleDataProcessClick}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer flex items-center space-x-1"
              >
                <span>Data Process</span>
                <ChevronDown size={16} className={`transition-transform ${dataProcessDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {dataProcessDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => handleSubMenuClick('By Surname')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm"
                  >
                    By Surname
                  </button>
                  <button
                    onClick={() => handleSubMenuClick('Data Alteration')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm"
                  >
                    Data Alteration
                  </button>
                </div>
              )}
            </div>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer">
              Import / Export
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer">
              Maps
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer">
              Cast By Surname
            </button>
            {/* <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Cast Id
            </button> */}
            {/* <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Both Mapping
            </button> */}
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer">
              Report
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 text-gray-600">
              <User size={18} className="text-gray-500" />
              <span className="font-medium text-sm">Ashish Garg</span>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Mobile Menu (Hidden by default) */}
        <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 hidden">
          <div className="grid grid-cols-2 gap-2">
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer">
              Dashboard
            </button>
            <button 
              onClick={handleFilterClick}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer"
            >
              Filter
            </button>
            <div className="relative" data-dropdown="data-process">
              <button 
                onClick={handleDataProcessClick}
                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer flex items-center justify-between w-full"
              >
                <span>Data Process</span>
                <ChevronDown size={14} className={`transition-transform ${dataProcessDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {dataProcessDropdown && (
                <div className="mt-1 ml-4 space-y-1">
                  <button
                    onClick={() => handleSubMenuClick('By Surname')}
                    className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-sm"
                  >
                    By Surname
                  </button>
                  <button
                    onClick={() => handleSubMenuClick('Data Alteration')}
                    className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-sm"
                  >
                    Data Alteration
                  </button>
                </div>
              )}
            </div>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer">
              Import / Export
            </button>
            <button className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium text-sm text-left cursor-pointer">
              Maps
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer">
              Cast By Surname
            </button>
            {/* <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Cast Id
            </button> */}
            {/* <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Both Mapping
            </button> */}
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer">
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 