'use client';

import React, { useState, useEffect } from 'react';
import { Search, Eye, Download, Trash2, RefreshCw, Info } from 'lucide-react';
import { useActivityLogger } from './ActivityLogger';

interface ImportedDataViewerProps {
  sessionId: string;
  onDataLoaded?: (data: any[]) => void;
}

interface ImportedData {
  id: number;
  name: string;
  father_name: string;
  mother_name: string;
  gender: string;
  date_of_birth: string;
  mobile_number: string;
  district: string;
  block: string;
  gp: string;
  village: string;
  address: string;
  caste: string;
  religion: string;
  parliament: string;
  assembly: string;
  import_session_id: string;
  created_at: string;
}

interface SessionInfo {
  sessionId: string;
  fileName: string;
  rowCount: number;
  masterFilters: any;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  limit: number;
}

export default function ImportedDataViewer({ sessionId, onDataLoaded }: ImportedDataViewerProps) {
  const { logActivity } = useActivityLogger();
  const [data, setData] = useState<ImportedData[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [error, setError] = useState<string | null>(null);

  // Load data when component mounts or sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId, currentPage, searchTerm]);

  const loadData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm
      });
      
      const response = await fetch(`/api/imported-data/${sessionId}?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
        setSessionInfo(result.session);
        setPagination(result.pagination);
        
        // Notify parent component
        if (onDataLoaded) {
          onDataLoaded(result.data);
        }
        
        // Log activity
        await logActivity({
          action_type: 'view_imported_data',
          action_details: `Viewed imported data from session ${sessionId}`,
          data_count: result.data.length
        });
      } else {
        setError(result.error || 'Failed to load imported data');
      }
    } catch (error) {
      console.error('Error loading imported data:', error);
      setError('Failed to load imported data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    loadData();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const exportToCSV = () => {
    if (!data.length) return;
    
    const headers = [
      'ID', 'Name', 'Father Name', 'Mother Name', 'Gender', 'Date of Birth',
      'Mobile Number', 'District', 'Block', 'GP', 'Village', 'Address',
      'Caste', 'Religion', 'Parliament', 'Assembly'
    ];
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.id,
        `"${row.name || ''}"`,
        `"${row.father_name || ''}"`,
        `"${row.mother_name || ''}"`,
        `"${row.gender || ''}"`,
        `"${row.date_of_birth || ''}"`,
        `"${row.mobile_number || ''}"`,
        `"${row.district || ''}"`,
        `"${row.block || ''}"`,
        `"${row.gp || ''}"`,
        `"${row.village || ''}"`,
        `"${row.address || ''}"`,
        `"${row.caste || ''}"`,
        `"${row.religion || ''}"`,
        `"${row.parliament || ''}"`,
        `"${row.assembly || ''}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `imported_data_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!sessionId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <Info className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">No import session selected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Eye className="mr-2 h-6 w-6 text-blue-600" />
            Imported Data Viewer
          </h2>
          {sessionInfo && (
            <p className="text-sm text-gray-600 mt-1">
              Session: {sessionInfo.sessionId} | File: {sessionInfo.fileName} | 
              Rows: {sessionInfo.rowCount} | Created: {new Date(sessionInfo.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={!data.length}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, father name, district, village..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading imported data...</p>
        </div>
      ) : data.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-700">ID</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Father</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Mother</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Gender</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Mobile</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">District</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Block</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Village</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{row.id}</td>
                    <td className="px-3 py-2 text-gray-900 font-medium">{row.name || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.father_name || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.mother_name || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.gender || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.mobile_number || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.district || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.block || '-'}</td>
                    <td className="px-3 py-2 text-gray-700">{row.village || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRows)} of{' '}
                {pagination.totalRows} results
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 text-sm border rounded ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Info className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No data found matching your search criteria.' : 'No imported data available.'}
          </p>
        </div>
      )}
    </div>
  );
}
