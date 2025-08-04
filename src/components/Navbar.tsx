'use client';

import { User, BarChart3, FileText, Users, Gem, ArrowLeftRight, BookOpen, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  const handleModulesClick = () => {
    router.push('/modules');
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">Rajasthan Election</h1>
          </div>

          {/* Navigation Menu */}
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <FileText size={20} /> */}
              <span>Dashboard</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <Users size={20} /> */}
              <span>Data</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              <span>Process</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <Gem size={20} /> */}
              <span>volenteer</span>
            </button>
            <button className="flex items-center space-x-2 text-blue-600 font-medium">
              {/* <Gem size={20} /> */}
              <span>Map</span>
            </button>
            <button 
              onClick={handleModulesClick}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
            >
              <span>Modules</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <BarChart3 size={20} /> */}
              <span>Cast By Surname</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <ArrowLeftRight size={20} /> */}
              <span>Cast Id</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <BookOpen size={20} /> */}
              <span>Both Mapping</span>
            </button>
            <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600">
              {/* <BookOpen size={20} /> */}
              <span>Report</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            {/* <User size={20} /> */}
            <span className="font-medium">Ashish Garg</span>
            {/* <ChevronDown size={16} /> */}
          </div>
        </div>
      </div>
    </div>
  );
} 