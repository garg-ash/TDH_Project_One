'use client';

import React, { useState } from 'react';
import { Download, FileText, Printer, Eye, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useActivityLogger } from './ActivityLogger';
import { useProcessing } from '../contexts/ProcessingContext';

interface ExportDataProps {
  masterFilters?: {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  };
  detailedFilters?: any;
  dataCount?: number;
}

interface ExportResult {
  success: boolean;
  message: string;
  fileName?: string;
  exportedRows?: number;
}

export default function ExportData({ masterFilters = {}, detailedFilters = {}, dataCount = 0 }: ExportDataProps) {
  const { logActivity } = useActivityLogger();
  const { startProcessing, updateProgress, completeProcessing, isProcessing, processingState } = useProcessing();
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'name', 'fname', 'mname', 'gender', 'age', 'mobile1', 'district', 'block', 'village', 'caste'
  ]);

  // Progress state for pie chart
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(3);

  // Available columns for export
  const availableColumns = [
    { id: 'name', label: 'Name', required: true },
    { id: 'fname', label: 'Father Name', required: false },
    { id: 'mname', label: 'Mother Name', required: false },
    { id: 'surname', label: 'Surname', required: false },
    { id: 'gender', label: 'Gender', required: false },
    { id: 'age', label: 'Age', required: false },
    { id: 'date_of_birth', label: 'Date of Birth', required: false },
    { id: 'mobile1', label: 'Mobile 1', required: false },
    { id: 'mobile2', label: 'Mobile 2', required: false },
    { id: 'district', label: 'District', required: false },
    { id: 'block', label: 'Block', required: false },
    { id: 'tehsil', label: 'GP', required: false },
    { id: 'village', label: 'Village', required: false },
    { id: 'address', label: 'Address', required: false },
    { id: 'caste', label: 'Caste', required: false },
    { id: 'religion', label: 'Religion', required: false },
    { id: 'parliament', label: 'Parliament', required: false },
    { id: 'assembly', label: 'Assembly', required: false }
  ];

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      alert('Please select at least one column to export');
      return;
    }

    // Check if another operation is in progress
    if (isProcessing) {
      alert('Another operation is in progress. Please wait for it to complete.');
      return;
    }

    // Start processing
    const started = startProcessing('export', `voter_data.${selectedFormat}`, 3);
    if (!started) {
      alert('Cannot start export - another operation is in progress');
      return;
    }

    // Reset local progress
    setProgress(0);
    setCurrentStep(0);
    setProgressMessage('Starting export...');
    setExportResult(null);

    try {
      // Step 1: Preparing export request
      setProgress(33);
      setCurrentStep(1);
      setProgressMessage('Preparing export request...');
      updateProgress(33, 'Preparing export request...', 1);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Build export request
      const exportRequest = {
        format: selectedFormat,
        columns: selectedColumns,
        includeHeaders: includeHeaders,
        masterFilters,
        detailedFilters
      };

      // Step 2: Processing export
      setProgress(66);
      setCurrentStep(2);
      setProgressMessage('Processing export request...');
      updateProgress(66, 'Processing export request...', 2);
      const response = await fetch('http://localhost:5002/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Export failed: ${errorText}`);
      }

      // Step 3: Downloading file
      setProgress(100);
      setCurrentStep(3);
      setProgressMessage('Preparing file download...');
      updateProgress(100, 'Preparing file download...', 3);
      const blob = await response.blob();
      const fileName = `voter_data_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
      
      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const successResult: ExportResult = {
        success: true,
        message: `Data exported successfully to ${selectedFormat.toUpperCase()} format!`,
        fileName: fileName,
        exportedRows: dataCount
      };

      setExportResult(successResult);
      completeProcessing(true, `Export completed successfully! File: ${fileName}`);

      // Log activity
      await logActivity({
        action_type: 'export',
        action_details: `Exported ${dataCount} rows to ${selectedFormat.toUpperCase()} format`,
        filters_applied: { ...masterFilters, ...detailedFilters },
        data_count: dataCount,
        file_name: fileName
      });

    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorResult: ExportResult = {
        success: false,
        message: `Export failed: ${errorMessage}`,
        fileName: `voter_data.${selectedFormat}`
      };
      setExportResult(errorResult);
      completeProcessing(false, `Export failed: ${errorMessage}`);
    } finally {
      // Reset progress after completion
      setTimeout(() => {
        setProgress(0);
        setCurrentStep(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  const toggleColumn = (columnId: string) => {
    setSelectedColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const selectAllColumns = () => {
    setSelectedColumns(availableColumns.map(col => col.id));
  };

  const deselectAllColumns = () => {
    setSelectedColumns([]);
  };

  // Pie Chart Progress Component
  const PieChartProgress = () => {
    if (progress === 0) return null;
    
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    const steps = [
      'Preparing',
      'Processing', 
      'Downloading'
    ];

    return (
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-8">
          {/* Pie Chart */}
          <div className="relative">
            <svg width="100" height="100" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-green-600">{Math.round(progress)}%</span>
            </div>
          </div>
          
          {/* Progress Details */}
          <div className="flex-1">
            <h4 className="font-medium text-green-800 mb-2">Export Progress</h4>
            <p className="text-sm text-green-700 mb-3">{progressMessage}</p>
            
            {/* Step indicators */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index < currentStep ? 'bg-green-500' : 
                    index === currentStep ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    index < currentStep ? 'text-green-700' : 
                    index === currentStep ? 'text-green-800' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                  {index === currentStep && (
                    <span className="text-xs text-green-600">(Current)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Download className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Export Data</h2>
          <p className="text-sm text-gray-600">Export filtered voter data in various formats</p>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
        <div className="grid grid-cols-3 gap-3">
          {(['csv', 'xlsx', 'pdf'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedFormat === format
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-medium uppercase">{format}</div>
                <div className="text-xs text-gray-500">
                  {format === 'csv' && 'Comma Separated Values'}
                  {format === 'xlsx' && 'Excel Spreadsheet'}
                  {format === 'pdf' && 'PDF Document'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Column Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">Select Columns</label>
          <div className="flex space-x-2">
            <button
              onClick={selectAllColumns}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All
            </button>
            <button
              onClick={deselectAllColumns}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Clear All
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {availableColumns.map((column) => (
            <label key={column.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedColumns.includes(column.id)}
                onChange={() => toggleColumn(column.id)}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                {column.label}
                {column.required && <span className="text-red-500 ml-1">*</span>}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div className="mb-6 space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeHeaders}
            onChange={(e) => setIncludeHeaders(e.target.checked)}
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">Include column headers</span>
        </label>
      </div>

      {/* Data Count Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Available Records:</span>
          <span className="text-lg font-bold text-gray-900">
            {typeof dataCount === 'number' ? dataCount.toLocaleString() : dataCount || 0}
          </span>
        </div>
        {dataCount === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            No data available for export. Please apply filters to see data.
          </p>
        )}
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isProcessing || selectedColumns.length === 0 || dataCount === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isProcessing || selectedColumns.length === 0 || dataCount === 0
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-green-600 text-white hover:bg-green-700'
        }`}
      >
        {isProcessing ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Exporting...</span>
          </div>
        ) : (
          `Export to ${selectedFormat.toUpperCase()}`
        )}
      </button>

      {/* Export Result */}
      {exportResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          exportResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {exportResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={`font-medium ${
              exportResult.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {exportResult.message}
            </span>
          </div>
          {exportResult.fileName && (
            <p className="text-sm text-green-700 mt-1">
              File: {exportResult.fileName}
            </p>
          )}
          {exportResult.exportedRows && (
            <p className="text-sm text-green-700 mt-1">
              Exported {exportResult.exportedRows.toLocaleString()} rows
            </p>
          )}
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="text-green-800">Processing export...</span>
          </div>
        </div>
      )}

      {/* Pie Chart Progress */}
      <PieChartProgress />
    </div>
  );
}
