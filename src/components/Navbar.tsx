'use client';

import { User, BarChart3, FileText, Users, Gem, ArrowLeftRight, BookOpen, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import logo from '../assets/logo.png';


export default function Navbar() {
  const router = useRouter();

  const handleModulesClick = () => {
    router.push('/modules');
  };

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
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Dashboard
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Data
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Process
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Volunteer
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Map
            </button>
            <button 
              onClick={handleModulesClick}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg"
            >
              Modules
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Cast By Surname
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Cast Id
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
              Both Mapping
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-lg">
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
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Dashboard
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Data
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Process
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Volunteer
            </button>
            <button className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-all duration-200 font-medium text-sm text-left">
              Map
            </button>
            <button 
              onClick={handleModulesClick}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left"
            >
              Modules
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Cast By Surname
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Cast Id
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Both Mapping
            </button>
            <button className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium text-sm text-left">
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 