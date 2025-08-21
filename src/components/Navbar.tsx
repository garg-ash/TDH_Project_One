'use client';

import { useState, useEffect } from 'react';
import { User, BarChart3, FileText, Users, Gem, ArrowLeftRight, BookOpen, ChevronDown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import logo from '/Next/public/logo.png';


export default function Navbar() {
  const router = useRouter();
  const [dataProcessDropdown, setDataProcessDropdown] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const { user, logout, loading } = useAuth();
  
  // Track current pathname for active menu indication
  useEffect(() => {
    const updateCurrentPath = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Set initial path
    updateCurrentPath();
    
    // Listen for route changes
    window.addEventListener('popstate', updateCurrentPath);
    
    return () => {
      window.removeEventListener('popstate', updateCurrentPath);
    };
  }, []);

  // Debug router object
  useEffect(() => {
    console.log('Navbar component mounted');
    console.log('Router object:', router);
    console.log('Current pathname:', window.location.pathname);
    console.log('Current active path:', currentPath);
  }, [router, currentPath]);

  // Helper function to check if a menu item is active
  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/' || currentPath === '/filter';
    }
    return currentPath === path;
  };

  // Helper function to get button classes based on active state
  const getButtonClasses = (path: string) => {
    const baseClasses = "px-4 py-2 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer";
    if (isActive(path)) {
      return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-md`;
    }
    return `${baseClasses} text-gray-600 hover:text-gray-900 hover:bg-gray-100`;
  };

  // Helper function to get mobile button classes based on active state
  const getMobileButtonClasses = (path: string) => {
    const baseClasses = "px-3 py-2 rounded-lg transition-all duration-200 font-medium text-sm text-left cursor-pointer";
    if (isActive(path)) {
      return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-md`;
    }
    return `${baseClasses} text-gray-600 hover:text-gray-900 hover:bg-gray-100`;
  };

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
    console.log('Current pathname:', window.location.pathname);
    console.log('Router object:', router);
    setDataProcessDropdown(false);
    
    // Navigation logic for sub-menus
    switch (subMenu) {
      case 'By Surname':
        console.log('Navigating to /surname');
        try {
          // First try using router.push
          router.push('/surname');
          console.log('Router.push called successfully');
          
          // Fallback navigation if router.push fails
          setTimeout(() => {
            console.log('Checking navigation result...');
            console.log('Current pathname after navigation:', window.location.pathname);
            if (window.location.pathname !== '/surname') {
              console.log('Router navigation failed, using fallback');
              window.location.href = '/surname';
            } else {
              console.log('Navigation successful via router.push');
            }
          }, 200);
        } catch (error) {
          console.error('Navigation error:', error);
          console.log('Using fallback navigation');
          window.location.href = '/surname';
        }
        break;
      case 'Data Alteration':
        console.log('Navigating to /data-alteration');
        try {
          // First try using router.push
          router.push('/data-alteration');
          console.log('Router.push called successfully');
          
          // Fallback navigation if router.push fails
          setTimeout(() => {
            console.log('Checking navigation result...');
            console.log('Current pathname after navigation:', window.location.pathname);
            if (window.location.pathname !== '/data-alteration') {
              console.log('Router navigation failed, using fallback');
              window.location.href = '/data-alteration';
            } else {
              console.log('Navigation successful via router.push');
            }
          }, 200);
        } catch (error) {
          console.error('Navigation error:', error);
          console.log('Using fallback navigation');
          window.location.href = '/data-alteration';
        }
        break;
      default:
        console.log('Unknown submenu:', subMenu);
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
            <button 
              onClick={() => router.push('/dashboard')}
              className={getButtonClasses('/dashboard')}
            >
              Dashboard
            </button>
            <button 
              onClick={handleFilterClick}
              className={getButtonClasses('/')}
            >
              Filter
            </button>
           
            <div className="relative" data-dropdown="data-process">
              <button 
                onClick={handleDataProcessClick}
                className={`px-4 py-2 rounded-lg transition-all duration-200 font-medium text-lg cursor-pointer flex items-center space-x-1 ${
                  dataProcessDropdown || isActive('/surname') || isActive('/data-alteration')
                    ? 'bg-gray-200 text-gray-900 shadow-md' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                <span>Data Process</span>
                <ChevronDown size={16} className={`transition-transform ${dataProcessDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {dataProcessDropdown && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('By Surname button clicked');
                      console.log('Event:', e);
                      handleSubMenuClick('By Surname');
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 transition-colors duration-200 text-sm"
                  >
                    By Surname
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Data Alteration button clicked');
                      console.log('Event:', e);
                      handleSubMenuClick('Data Alteration');
                    }}
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

          {/* User Profile (Right Side) */}
          <div className="flex items-center space-x-3">
            {loading ? null : user ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {(user.username || user.email).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium text-gray-900">{user.username || user.email}</span>
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                </div>
                <button
                  onClick={logout}
                  className="hidden sm:inline-flex items-center px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                  title="Logout"
                >
                  <LogOut size={14} className="mr-1" /> Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu (Hidden by default) */}
        <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 hidden">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => router.push('/dashboard')}
              className={getMobileButtonClasses('/dashboard')}
            >
              Dashboard
            </button>
            <button 
              onClick={handleFilterClick}
              className={getMobileButtonClasses('/')}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Mobile By Surname button clicked');
                      console.log('Event:', e);
                      handleSubMenuClick('By Surname');
                    }}
                    className="w-full px-3 py-2 text-left text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 text-sm"
                  >
                    By Surname
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Mobile Data Alteration button clicked');
                      console.log('Event:', e);
                      handleSubMenuClick('Data Alteration');
                    }}
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