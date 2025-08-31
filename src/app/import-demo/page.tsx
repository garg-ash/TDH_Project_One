'use client';

import React, { useState } from 'react';
import ImportData from '../../../components/ImportData';
import ImportedDataViewer from '../../../components/ImportedDataViewer';

interface ImportedDataInfo {
  sessionId: string;
  tempTableName: string;
  importedRows: number;
  fileName: string;
}

export default function ImportDemoPage() {
  const [importedDataInfo, setImportedDataInfo] = useState<ImportedDataInfo | null>(null);
  const [masterFilters, setMasterFilters] = useState({
    parliament: 'Parliament 1',
    assembly: 'Assembly 1',
    district: 'Sample District',
    block: 'Sample Block'
  });

  const handleDataImported = (data: ImportedDataInfo) => {
    console.log('Data imported successfully:', data);
    setImportedDataInfo(data);
  };

  const handleFiltersChange = (newFilters: any) => {
    setMasterFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Import Data Demo</h1>
          <p className="mt-2 text-gray-600">
            This page demonstrates how to import CSV data and view it in a temporary table.
          </p>
        </div>

        {/* Master Filters */}
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Master Filters</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parliament</label>
              <input
                type="text"
                value={masterFilters.parliament}
                onChange={(e) => setMasterFilters(prev => ({ ...prev, parliament: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assembly</label>
              <input
                type="text"
                value={masterFilters.assembly}
                onChange={(e) => setMasterFilters(prev => ({ ...prev, assembly: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                type="text"
                value={masterFilters.district}
                onChange={(e) => setMasterFilters(prev => ({ ...prev, district: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block</label>
              <input
                type="text"
                value={masterFilters.block}
                onChange={(e) => setMasterFilters(prev => ({ ...prev, block: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="mb-8">
          <ImportData 
            masterFilters={masterFilters}
            onDataImported={handleDataImported}
          />
        </div>

        {/* Imported Data Viewer */}
        {importedDataInfo && (
          <div className="mb-8">
            <ImportedDataViewer 
              sessionId={importedDataInfo.sessionId}
              onDataLoaded={(data) => {
                console.log('Data loaded in viewer:', data.length, 'rows');
              }}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">How it works:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Upload a CSV file using the import section above</li>
            <li>The file will be processed and stored in a temporary database table</li>
            <li>You'll receive a session ID that identifies your imported data</li>
            <li>Use the data viewer below to search, paginate, and export your imported data</li>
            <li>Temporary tables are automatically cleaned up after 24 hours</li>
          </ol>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">CSV Format Requirements:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• First row must contain column headers</li>
              <li>• Supported columns: name, father_name, mother_name, gender, date_of_birth, mobile_number, district, block, gp, village, address, caste, religion, parliament, assembly</li>
              <li>• Column names are case-insensitive and flexible (e.g., "fatherName" or "father" both work)</li>
              <li>• Empty cells are allowed and will be stored as empty strings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
