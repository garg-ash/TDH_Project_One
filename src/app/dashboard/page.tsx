'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  TrendingUp, 
  Calendar, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  FileText,
  Database,
  Settings
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userInfoStr = localStorage.getItem('userInfo');
    
    if (token && userInfoStr) {
      try {
        const user = JSON.parse(userInfoStr);
        setUserInfo(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user info:', error);
      }
    }
  }, []);

  // Mock data for dashboard - replace with actual API calls
  const dashboardData = {
    totalVoters: 5123456,
    totalConstituencies: 200,
    totalDistricts: 33,
    totalBlocks: 295,
    recentElections: [
      { year: 2023, type: 'Vidhan Sabha', status: 'Completed', turnout: '75.45%' },
      { year: 2019, type: 'Lok Sabha', status: 'Completed', turnout: '68.03%' },
      { year: 2018, type: 'Vidhan Sabha', status: 'Completed', turnout: '74.71%' }
    ],
    partyPerformance: [
      { party: 'BJP', seats: 115, change: '+54', color: 'bg-orange-500' },
      { party: 'INC', seats: 70, change: '-48', color: 'bg-green-500' },
      { party: 'RLP', seats: 3, change: '+3', color: 'bg-blue-500' },
      { party: 'BSP', seats: 2, change: '-4', color: 'bg-red-500' },
      { party: 'IND', seats: 8, change: '-5', color: 'bg-gray-500' }
    ],
    voterDemographics: {
      male: 52.8,
      female: 47.2,
      urban: 24.9,
      rural: 75.1
    },
    rajasthanStats: {
      totalPopulation: '68.5M',
      literacyRate: '66.1%',
      area: '342,239 sq km',
      majorCities: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer']
    }
  };

  const quickActions = [
    {
      title: 'View Voter Data',
      description: 'Access comprehensive voter information',
      icon: <Database className="w-6 h-6" />,
      link: '/',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Data Alteration',
      description: 'Modify and update voter records',
      icon: <Settings className="w-6 h-6" />,
      link: '/data-alteration',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'User Management',
      description: 'Manage system users and permissions',
      icon: <Users className="w-6 h-6" />,
      link: '/usermanagement',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'System Setup',
      description: 'Configure system parameters',
      icon: <Settings className="w-6 h-6" />,
      link: '/setup',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const recentActivities = [
    { action: 'Voter data updated', time: '2 hours ago', type: 'update' },
    { action: 'New user registered', time: '4 hours ago', type: 'create' },
    { action: 'System backup completed', time: '6 hours ago', type: 'system' },
    { action: 'Data export generated', time: '1 day ago', type: 'export' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Rajasthan Dashboard</h1>
              <span className="text-sm text-gray-500">Election Management System</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                 {/* Welcome Section */}
         <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 mb-6 text-white">
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-2xl font-bold mb-2">Rajasthan Election Dashboard</h2>
               <p className="text-slate-200">Monitor Rajasthan election data, track voter statistics, and manage system operations</p>
               <div className="mt-3 flex items-center space-x-4 text-sm">
                 <span className="flex items-center">
                   <MapPin className="w-4 h-4 mr-1 text-slate-300" />
                   {dashboardData.rajasthanStats.area}
                 </span>
                 <span className="flex items-center">
                   <Users className="w-4 h-4 mr-1 text-slate-300" />
                   {dashboardData.rajasthanStats.totalPopulation}
                 </span>
                 <span className="flex items-center">
                   <FileText className="w-4 h-4 mr-1 text-slate-300" />
                   {dashboardData.rajasthanStats.literacyRate} Literacy
                 </span>
               </div>
             </div>
             <div className="hidden md:block">
               <Calendar className="w-16 h-16 text-slate-400" />
             </div>
           </div>
         </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Voters</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalVoters.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">+2.5%</span>
              <span className="text-gray-500 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Constituencies</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalConstituencies}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Active constituencies</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Districts</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalDistricts}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Coverage areas</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Blocks</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalBlocks}</p>
              </div>
              <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-slate-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Administrative units</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <Link
                    key={index}
                    href={action.link}
                    className="block p-4 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center space-x-3">
                      {action.icon}
                      <div>
                        <p className="font-medium">{action.title}</p>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Party Performance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Election Results</h3>
              <div className="space-y-4">
                {dashboardData.partyPerformance.map((party, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        party.party === 'BJP' ? 'bg-slate-600' :
                        party.party === 'INC' ? 'bg-slate-400' :
                        party.party === 'RLP' ? 'bg-slate-500' :
                        party.party === 'BSP' ? 'bg-slate-700' : 'bg-slate-300'
                      }`}></div>
                      <span className="font-medium text-gray-900">{party.party}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold text-gray-900">{party.seats} seats</span>
                      <span className={`text-sm font-medium ${
                        party.change.startsWith('+') ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {party.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Elections and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Recent Elections */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Elections</h3>
            <div className="space-y-4">
              {dashboardData.recentElections.map((election, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{election.year} {election.type}</p>
                    <p className="text-sm text-gray-500">{election.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-600">{election.turnout}</p>
                    <p className="text-sm text-gray-500">Voter Turnout</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.type === 'update' ? 'bg-slate-500' :
                    activity.type === 'create' ? 'bg-slate-400' :
                    activity.type === 'system' ? 'bg-slate-600' : 'bg-slate-300'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

                 {/* Voter Demographics Chart */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Voter Demographics</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <h4 className="text-md font-medium text-gray-700 mb-3">Gender Distribution</h4>
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">Male</span>
                   <div className="flex items-center space-x-2">
                     <div className="w-32 bg-gray-200 rounded-full h-2">
                       <div className="bg-slate-600 h-2 rounded-full" style={{ width: `${dashboardData.voterDemographics.male}%` }}></div>
                     </div>
                     <span className="text-sm font-medium text-gray-900">{dashboardData.voterDemographics.male}%</span>
                   </div>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">Female</span>
                   <div className="flex items-center space-x-2">
                     <div className="w-32 bg-gray-200 rounded-full h-2">
                       <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${dashboardData.voterDemographics.female}%` }}></div>
                     </div>
                     <span className="text-sm font-medium text-gray-900">{dashboardData.voterDemographics.female}%</span>
                   </div>
                 </div>
               </div>
             </div>
             <div>
               <h4 className="text-md font-medium text-gray-700 mb-3">Geographic Distribution</h4>
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">Urban</span>
                   <div className="flex items-center space-x-2">
                     <div className="w-32 bg-gray-200 rounded-full h-2">
                       <div className="bg-slate-500 h-2 rounded-full" style={{ width: `${dashboardData.voterDemographics.urban}%` }}></div>
                     </div>
                     <span className="text-sm font-medium text-gray-900">{dashboardData.voterDemographics.urban}%</span>
                   </div>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-gray-600">Rural</span>
                   <div className="flex items-center space-x-2">
                     <div className="w-32 bg-gray-200 rounded-full h-2">
                       <div className="bg-slate-700 h-2 rounded-full" style={{ width: `${dashboardData.voterDemographics.rural}%` }}></div>
                     </div>
                     <span className="text-sm font-medium text-gray-900">{dashboardData.voterDemographics.rural}%</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>

         {/* Rajasthan Regional Information */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
           <h3 className="text-lg font-semibold text-gray-900 mb-4">Rajasthan Regional Information</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <h4 className="text-md font-medium text-gray-700 mb-3">Major Cities</h4>
               <div className="grid grid-cols-2 gap-3">
                 {dashboardData.rajasthanStats.majorCities.map((city, index) => (
                   <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                     <MapPin className="w-4 h-4 text-slate-500" />
                     <span className="text-sm font-medium text-gray-900">{city}</span>
                   </div>
                 ))}
               </div>
             </div>
             <div>
               <h4 className="text-md font-medium text-gray-700 mb-3">State Overview</h4>
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                   <span className="text-sm text-gray-600">Total Area</span>
                   <span className="text-sm font-medium text-gray-900">{dashboardData.rajasthanStats.area}</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                   <span className="text-sm text-gray-600">Population</span>
                   <span className="text-sm font-medium text-gray-900">{dashboardData.rajasthanStats.totalPopulation}</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                   <span className="text-sm text-gray-600">Literacy Rate</span>
                   <span className="text-sm font-medium text-gray-900">{dashboardData.rajasthanStats.literacyRate}</span>
                 </div>
                 <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                   <span className="text-sm text-gray-600">Assembly Seats</span>
                   <span className="text-sm font-medium text-gray-900">{dashboardData.totalConstituencies}</span>
                 </div>
               </div>
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
