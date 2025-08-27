'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Calendar, 
  FileText,
  Database,
  Settings,
  TrendingUp,
  Activity,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import Navbar from '../../components/Navbar';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardData {
  totalVoters: number;
  totalConstituencies: number;
  totalDistricts: number;
  totalBlocks: number;
  voterDemographics: {
    male: number;
    female: number;
    urban: number;
    rural: number;
  };
  districtData: Array<{
    district: string;
    voters: number;
    constituencies: number;
  }>;
  partyData: Array<{
    party: string;
    seats: number;
    votes: number;
    color: string;
  }>;
  recentActivity: Array<{
    action: string;
    timestamp: string;
    user: string;
    type: 'import' | 'export' | 'update' | 'create';
  }>;
  monthlyStats: Array<{
    month: string;
    voters: number;
    activities: number;
  }>;
  // New demographic data
  ageData: Array<{ age: string; count: number }>;
  educationData: Array<{ education: string; count: number }>;
  occupationData: Array<{ occupation: string; count: number }>;
  casteData: Array<{ caste: string; count: number }>;
}

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real dashboard data from backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [summaryRes, districtRes, partyRes, monthlyRes, demographicsRes] = await Promise.all([
          fetch('http://localhost:5002/api/dashboard/summary'),
          fetch('http://localhost:5002/api/dashboard/districts'),
          fetch('http://localhost:5002/api/dashboard/party-performance'),
          fetch('http://localhost:5002/api/dashboard/monthly-activity'),
          fetch('http://localhost:5002/api/dashboard/voter-demographics')
        ]);

        if (!summaryRes.ok) throw new Error('Failed to load summary');

        const summaryJson = await summaryRes.json();
        const districtsJson = districtRes.ok ? await districtRes.json() : { data: [] };
        const partyJson = partyRes.ok ? await partyRes.json() : { data: [] };
        const monthlyJson = monthlyRes.ok ? await monthlyRes.json() : { data: [] };
        const demoJson = demographicsRes.ok ? await demographicsRes.json() : { data: { male: 0, female: 0 } };

        // Fetch additional demographic data
        const [ageRes, educationRes, occupationRes, casteRes, recentRes] = await Promise.all([
          fetch('http://localhost:5002/api/dashboard/demographics/age'),
          fetch('http://localhost:5002/api/dashboard/demographics/education'),
          fetch('http://localhost:5002/api/dashboard/demographics/occupation'),
          fetch('http://localhost:5002/api/dashboard/demographics/caste'),
          fetch('http://localhost:5002/api/dashboard/recent-activity?limit=20')
        ]);

        const ageData = ageRes.ok ? await ageRes.json() : { data: [] };
        const educationData = educationRes.ok ? await educationRes.json() : { data: [] };
        const occupationData = occupationRes.ok ? await occupationRes.json() : { data: [] };
        const casteData = casteRes.ok ? await casteRes.json() : { data: [] };
        const recentJson = recentRes.ok ? await recentRes.json() : { data: [] };

        const recentActivityProcessed = (recentJson.data || []).map((item: any) => ({
          action: item.action || item.details || 'Activity',
          timestamp: item.created_at ? new Date(item.created_at).toLocaleString() : new Date().toLocaleString(),
          user: item.username || 'System',
          type: (item.action_type || 'update') as 'import' | 'export' | 'update' | 'create'
        }));

        const processed: DashboardData = {
          totalVoters: summaryJson.data.totalVoters || 0,
          totalConstituencies: summaryJson.data.totalConstituencies || 0,
          totalDistricts: summaryJson.data.totalDistricts || 0,
          totalBlocks: summaryJson.data.totalBlocks || 0,
          voterDemographics: {
            male: demoJson.data.male || 0,
            female: demoJson.data.female || 0,
            urban: 0,
            rural: 0
          },
          districtData: districtsJson.data || [],
          partyData: partyJson.data || [],
          recentActivity: recentActivityProcessed,
          monthlyStats: monthlyJson.data || [],
          // New demographic data
          ageData: ageData.data || [],
          educationData: educationData.data || [],
          occupationData: occupationData.data || [],
          casteData: casteData.data || []
        };

        console.log('Processed dashboard data:', processed);
        console.log('Gender data:', demoJson.data);
        console.log('Age data:', ageData.data);

        setDashboardData(processed);
        setError(null);
      } catch (e: any) {
        console.error(e);
        setError('Backend se data load nahi ho paya. Please try again.');
        // Use fallback data if everything fails
        setDashboardData({
          totalVoters: 1250,
          totalConstituencies: 200,
          totalDistricts: 33,
          totalBlocks: 295,
          voterDemographics: {
            male: 660,
            female: 590,
            urban: 312,
            rural: 938,
          },
          districtData: [
            { district: 'Jaipur', voters: 150, constituencies: 8 },
            { district: 'Jodhpur', voters: 120, constituencies: 6 },
            { district: 'Kota', voters: 100, constituencies: 5 },
            { district: 'Bikaner', voters: 90, constituencies: 4 },
            { district: 'Ajmer', voters: 85, constituencies: 4 }
          ],
          partyData: generatePartyData(),
          recentActivity: [
            { action: 'System initialized', timestamp: new Date().toLocaleDateString(), user: 'System', type: 'create' },
            { action: 'Dashboard loaded', timestamp: new Date().toLocaleDateString(), user: 'System', type: 'update' }
          ],
          monthlyStats: generateMonthlyStats(),
          // New demographic fallback data
          ageData: [],
          educationData: [],
          occupationData: [],
          casteData: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const processDistrictData = (rows: any[]) => {
    if (!rows || rows.length === 0) {
      // Return fallback district data
      return [
        { district: 'Jaipur', voters: 150, constituencies: 8 },
        { district: 'Jodhpur', voters: 120, constituencies: 6 },
        { district: 'Kota', voters: 100, constituencies: 5 },
        { district: 'Bikaner', voters: 90, constituencies: 4 },
        { district: 'Ajmer', voters: 85, constituencies: 4 }
      ];
    }
    
    const districtMap = new Map();
    
    rows.forEach((row: any) => {
      if (row.district) {
        if (!districtMap.has(row.district)) {
          districtMap.set(row.district, { district: row.district, voters: 0, constituencies: new Set() });
        }
        const district = districtMap.get(row.district);
        district.voters++;
        if (row.assembly) {
          district.constituencies.add(row.assembly);
        }
      }
    });
    
    const result = Array.from(districtMap.values()).map(d => ({
      ...d,
      constituencies: d.constituencies.size
    })).slice(0, 10); // Top 10 districts
    
    // If we have no real data, return fallback
    if (result.length === 0) {
      return [
        { district: 'Jaipur', voters: 150, constituencies: 8 },
        { district: 'Jodhpur', voters: 120, constituencies: 6 },
        { district: 'Kota', voters: 100, constituencies: 5 },
        { district: 'Bikaner', voters: 90, constituencies: 4 },
        { district: 'Ajmer', voters: 85, constituencies: 4 }
      ];
    }
    
    return result;
  };

  const generatePartyData = () => {
    return [
      { party: 'BJP', seats: 115, votes: 45.2, color: '#FF6B35' },
      { party: 'INC', seats: 70, votes: 39.8, color: '#4ECDC4' },
      { party: 'RLP', seats: 3, votes: 5.1, color: '#45B7D1' },
      { party: 'BSP', seats: 2, votes: 3.2, color: '#96CEB4' },
      { party: 'IND', seats: 8, votes: 6.7, color: '#FFEAA7' }
    ];
  };

  const processActivityData = (activities: any[]) => {
    if (!activities || activities.length === 0) {
      return [
        { action: 'System initialized', timestamp: new Date().toLocaleDateString(), user: 'System', type: 'create' },
        { action: 'Dashboard loaded', timestamp: new Date().toLocaleDateString(), user: 'System', type: 'update' },
        { action: 'Data refresh completed', timestamp: new Date().toLocaleDateString(), user: 'System', type: 'update' }
      ];
    }
    
    return activities.map(activity => ({
      action: activity.action_details || 'Unknown action',
      timestamp: new Date(activity.created_at || Date.now()).toLocaleDateString(),
      user: activity.username || 'Unknown user',
      type: activity.action_type || 'update'
    }));
  };

  const generateMonthlyStats = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map(month => ({
      month,
      voters: Math.floor(Math.random() * 10000) + 5000,
      activities: Math.floor(Math.random() * 100) + 20
    }));
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
      title: 'Import Data',
      description: 'Upload and import voter data',
      icon: <Upload className="w-6 h-6" />,
      link: '/import_export',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Export Data',
      description: 'Download voter data reports',
      icon: <Download className="w-6 h-6" />,
      link: '/import_export',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Data Alteration',
      description: 'Modify and update voter records',
      icon: <Settings className="w-6 h-6" />,
      link: '/data-alteration',
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-600">No data available</div>
        </div>
      </div>
    );
  }

  // Calculate percentages for demographics
  const totalVoters = dashboardData.voterDemographics.male + dashboardData.voterDemographics.female;
  const malePercentage = totalVoters > 0 ? (dashboardData.voterDemographics.male / totalVoters * 100).toFixed(1) : 0;
  const femalePercentage = totalVoters > 0 ? (dashboardData.voterDemographics.female / totalVoters * 100).toFixed(1) : 0;

  // Ensure gender data is always available for the chart
  const genderData = [
    { name: 'Male', value: dashboardData.voterDemographics.male || 0, color: '#3B82F6' },
    { name: 'Female', value: dashboardData.voterDemographics.female || 0, color: '#EC4899' }
  ].filter(item => item.value > 0); // Only show categories with data

  // If no gender data, show a message
  if (genderData.length === 0) {
    genderData.push({ name: 'No Data', value: 1, color: '#9CA3AF' });
  }

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
            {hasRole(['admin', 'super_admin']) && (
              <div className="flex items-center space-x-2">
                <Link
                  href="/usermanagement"
                  className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">User Management</span>
                </Link>
                <Link
                  href="/usermanagement"
                  className="md:hidden p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                  title="User Management"
                >
                  <Users className="w-6 h-6" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                 {/* Welcome Section */}
         <div className="bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl p-6 mb-6 text-white">
           <div className="flex items-center justify-between">
             <div>
               <h2 className="text-2xl font-bold mb-2">Rajasthan Election Dashboard</h2>
               <p className="text-slate-200">Real-time voter statistics and election data management</p>
               <div className="mt-3 flex items-center space-x-4 text-sm">
                 <span className="flex items-center">
                   <MapPin className="w-4 h-4 mr-1 text-slate-300" />
                   342,239 sq km
                 </span>
                 <span className="flex items-center">
                   <Users className="w-4 h-4 mr-1 text-slate-300" />
                   {dashboardData.totalVoters.toLocaleString()} Voters
                 </span>
                 <span className="flex items-center">
                   <FileText className="w-4 h-4 mr-1 text-slate-300" />
                   {dashboardData.totalConstituencies} Constituencies
                 </span>
               </div>
               <div className="mt-2 text-xs text-slate-300">
                 📊 Charts show real data from database when available, fallback data otherwise
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
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-emerald-600">Live Data</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Constituencies</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.totalConstituencies}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-green-600" />
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
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-orange-600" />
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
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-gray-500">Administrative units</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Gender Distribution Pie Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Voter Gender Distribution (18+ years)</h3>
            {genderData.length > 0 && genderData[0].name !== 'No Data' ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{malePercentage}%</div>
                    <div className="text-sm text-gray-600">Male Voters</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-pink-600">{femalePercentage}%</div>
                    <div className="text-sm text-gray-600">Female Voters</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-lg mb-2">No gender data available</div>
                  <div className="text-sm">Check if backend is running and database has voter records</div>
                </div>
              </div>
            )}
          </div>

          {/* District-wise Voter Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Districts by Voter Count</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.districtData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="district" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="voters" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Party Performance and Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Party Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Caste/Community Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dashboardData.casteData.map((d: any) => ({
                  ...d,
                  label: d.caste_community ?? d.caste ?? 'Unknown'
                }))}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="label" width={140} interval={0} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}`, 'Count']} />
                <Bar dataKey="count" fill="#3B82F6">
                  {dashboardData.casteData.map((_: any, index: number) => (
                    <Cell key={`caste-bar-${index}`} fill={`hsl(${(index * 47) % 360}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

                     {/* Monthly Activity Trends */}
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
             <ResponsiveContainer width="100%" height={300}>
               <AreaChart data={dashboardData.monthlyStats}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis dataKey="month" />
                 <YAxis />
                 <Tooltip />
                 <Legend />
                 <Area type="monotone" dataKey="activities" stackId="1" stroke="#8884d8" fill="#8884d8" name="Total Activities" />
                 <Area type="monotone" dataKey="imports" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Imports" />
                 <Area type="monotone" dataKey="exports" stackId="3" stroke="#ffc658" fill="#ffc658" name="Exports" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Quick Actions and Recent Activity */}
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

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activities</h3>
              <div className="space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`h-2 w-2 rounded-full ${
                        activity.type === 'import' ? 'bg-green-500' :
                        activity.type === 'export' ? 'bg-blue-500' :
                        activity.type === 'update' ? 'bg-orange-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-500">by {activity.user}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{activity.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Urban vs Rural Distribution</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Urban</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">25%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rural</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">75%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">District Coverage</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Districts</span>
                  <span className="text-sm font-medium text-gray-900">{dashboardData.totalDistricts}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Blocks</span>
                  <span className="text-sm font-medium text-gray-900">{dashboardData.totalBlocks}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Total Constituencies</span>
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
