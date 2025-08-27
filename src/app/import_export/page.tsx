'use client';

import MasterFilter from "@/components/MasterFilter";
import Navbar from "@/components/Navbar";
import React, { useEffect, useState } from "react";
import { ArrowRight } from 'lucide-react';
import ImportData from "@/components/ImportData";
import ExportData from "@/components/ExportData";

interface ActivityLog {
  id: number;
  user_id: number;
  username: string;
  action_type: string;
  action_details: string;
  filters_applied: string | object;
  data_count: number | string;
  file_name: string;
  created_at: string;
  ip_address: string;
}

export default function ImportExportPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dataCount, setDataCount] = useState<number>(0);
  
  // Master filter state
  const [masterFilters, setMasterFilters] = useState<{
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  }>({});

  useEffect(() => {
    fetchLogs();
    fetchDataCount();
  }, [filterType, dateRange, masterFilters]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Build query parameters including master filters
      const params = new URLSearchParams();
      params.append('type', filterType);
      params.append('date', dateRange);
      params.append('search', searchTerm);
      
      // Add master filters if they exist
      if (masterFilters.parliament) params.append('parliament', masterFilters.parliament);
      if (masterFilters.assembly) params.append('assembly', masterFilters.assembly);
      if (masterFilters.district) params.append('district', masterFilters.district);
      if (masterFilters.block) params.append('block', masterFilters.block);
      
      const response = await fetch(`http://localhost:5002/api/logs?${params.toString()}`);
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch real data count
  const fetchDataCount = async () => {
    try {
      // Build query parameters for data count
      const params = new URLSearchParams();
      params.append('count', 'true');
      
      // Add master filters if they exist
      if (masterFilters.parliament) params.append('parliament', masterFilters.parliament);
      if (masterFilters.assembly) params.append('assembly', masterFilters.assembly);
      if (masterFilters.district) params.append('district', masterFilters.district);
      if (masterFilters.block) params.append('block', masterFilters.block);
      
      const response = await fetch(`http://localhost:5002/api/area_mapping?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // If API returns count directly, use it; otherwise use array length
        const count = data.count || data.total || (Array.isArray(data) ? data.length : 0);
        setDataCount(Number(count) || 0);
      } else {
        setDataCount(0);
      }
    } catch (error) {
      console.error('Error fetching data count:', error);
      setDataCount(0);
    }
  };

  const handleMasterFilterChange = (filters: any) => {
    console.log('Master filter changed:', filters);
    setMasterFilters({
      parliament: filters.parliament,
      assembly: filters.assembly,
      district: filters.district,
      block: filters.block
    });
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'download':
        return '📥';
      case 'save':
        return '💾';
      case 'filter':
        return '🔍';
      case 'import':
        return '📤';
      case 'export':
        return '📤';
      case 'process':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'download':
        return 'bg-blue-100 text-blue-800';
      case 'save':
        return 'bg-green-100 text-green-800';
      case 'filter':
        return 'bg-purple-100 text-purple-800';
      case 'import':
        return 'bg-orange-100 text-orange-800';
      case 'export':
        return 'bg-indigo-100 text-indigo-800';
      case 'process':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFilters = (filters: string | object) => {
    if (!filters) return 'No filters';
    try {
      const parsed = typeof filters === 'string' ? JSON.parse(filters) : filters;
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return String(filters);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back to Modules Button and Master Filter */}
      <div className="bg-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl flex items-center space-x-6">
          <button
            onClick={() => window.history.back()}
            className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
            title="Back"
          >
            <ArrowRight className="rotate-180" size={20} />
          </button>
          <div className="flex-1">
            <MasterFilter onMasterFilterChange={handleMasterFilterChange} />
          </div>
        </div>
      </div>
      
      <Navbar />
      
      {/* Master Filter Status Display */}
      {(masterFilters.parliament || masterFilters.assembly || masterFilters.district || masterFilters.block) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg mx-6 mt-4 p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                <strong>Active Filters:</strong> {[
                  masterFilters.parliament && `Parliament: ${masterFilters.parliament}`,
                  masterFilters.assembly && `Assembly: ${masterFilters.assembly}`,
                  masterFilters.district && `District: ${masterFilters.district}`,
                  masterFilters.block && `Block: ${masterFilters.block}`
                ].filter(Boolean).join(', ')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing activity logs filtered by the selected master fields
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto">
        {/* Import/Export Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ImportData masterFilters={masterFilters} />
          <ExportData 
            masterFilters={masterFilters} 
            detailedFilters={{}}
            dataCount={dataCount}
          />
        </div>

        {/* Activity Monitoring Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">User Activity Monitoring</h1>
          
          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              <option value="download">Downloads</option>
              <option value="save">Saves</option>
              <option value="filter">Filters</option>
              <option value="import">Imports</option>
              <option value="export">Exports</option>
              <option value="process">Data Processing</option>
            </select>

            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <input
              type="text"
              placeholder="Search by username or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
            />

            <button
              onClick={fetchLogs}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
            >
              🔍 Search
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{logs.filter(l => l.action_type === 'download').length}</div>
              <div className="text-blue-800">Downloads</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{logs.filter(l => l.action_type === 'save').length}</div>
              <div className="text-green-800">Saves</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{logs.filter(l => l.action_type === 'filter').length}</div>
              <div className="text-blue-800">Filters Applied</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{logs.filter(l => l.action_type === 'import' || l.action_type === 'export').length}</div>
              <div className="text-orange-800">Import/Export</div>
            </div>
          </div>

          {/* Activity Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left">User</th>
                  <th className="border px-3 py-2 text-left">Action</th>
                  <th className="border px-3 py-2 text-left">Details</th>
                  <th className="border px-3 py-2 text-left">Filters Applied</th>
                  <th className="border px-3 py-2 text-left">Data Count</th>
                  <th className="border px-3 py-2 text-left">File</th>
                  <th className="border px-3 py-2 text-left">Date & Time</th>
                  <th className="border px-3 py-2 text-left">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading activities...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length > 0 ? (
                  logs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border px-3 py-2">
                        <div className="font-medium text-gray-800">{log.username}</div>
                        <div className="text-xs text-gray-500">ID: {log.user_id}</div>
                      </td>
                      <td className="border px-3 py-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                          {getActionIcon(log.action_type)} {log.action_type}
                        </span>
                      </td>
                      <td className="border px-3 py-2">
                        <div className="max-w-xs truncate" title={log.action_details}>
                          {log.action_details}
                        </div>
                      </td>
                      <td className="border px-3 py-2">
                        <div className="max-w-xs text-xs">
                          {formatFilters(log.filters_applied)}
                        </div>
                      </td>
                      <td className="border px-3 py-2 text-center">
                        {log.data_count ? (
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {typeof log.data_count === 'number' ? log.data_count.toLocaleString() : String(log.data_count)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border px-3 py-2">
                        {log.file_name ? (
                          <div className="text-xs">
                            <span className="text-blue-600">📄 {log.file_name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="border px-3 py-2">
                        <div className="text-xs">
                          <div className="font-medium">{new Date(log.created_at).toLocaleDateString()}</div>
                          <div className="text-gray-500">{new Date(log.created_at).toLocaleTimeString()}</div>
                        </div>
                      </td>
                      <td className="border px-3 py-2">
                        <div className="text-xs text-gray-500 font-mono">
                          {log.ip_address || '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-gray-500">
                      No activity logs found for the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Export Button */}
          {logs.length > 0 && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8," + 
                    "User,Action,Details,Filters,Data Count,File,Date,IP\n" +
                    logs.map(log => 
                      `${log.username},${log.action_type},${log.action_details},${formatFilters(log.filters_applied)},${String(log.data_count || '')},${log.file_name || ''},${new Date(log.created_at).toLocaleString()},${log.ip_address || ''}`
                    ).join("\n");
                  
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                📊 Export to CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

