'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Download, Info } from 'lucide-react';
import { useActivityLogger } from './ActivityLogger';
import { useProcessing } from '../contexts/ProcessingContext';

interface ImportDataProps {
  masterFilters?: {
    parliament?: string;
    assembly?: string;
    district?: string;
    block?: string;
  };
  onDataImported?: (data: {
    sessionId: string;
    tempTableName: string;
    importedRows: number;
    fileName: string;
  }) => void; // Callback for imported data
}

interface ImportResult {
  success: boolean;
  message: string;
  importedRows?: number;
  errors?: string[];
  fileName?: string;
  sessionId?: string;
  tempTableName?: string;
}

export default function ImportData({ masterFilters = {} }: ImportDataProps) {
  const { logActivity } = useActivityLogger();
  const { startProcessing, updateProgress, completeProcessing, isProcessing, processingState } = useProcessing();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supported file types
  const supportedFormats = ['.csv']; // Only CSV for now
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Progress state for pie chart
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(4);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`;
    }

    // Check file extension
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!supportedFormats.includes(fileExtension)) {
      return `Unsupported file format. Please use CSV format only`;
    }

    // Check if file is empty
    if (file.size === 0) {
      return 'File is empty. Please select a valid CSV file with data.';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      alert(validationError);
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setPreviewData([]);
    setShowPreview(false);

    // Preview file content
    previewFileContent(file);
  };

  const previewFileContent = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim() !== '').slice(0, 6); // First 5 rows + header
        const preview = lines.map((line, index) => {
          const columns = line.split(',').map(col => col.trim());
          return { row: index + 1, data: columns };
        });
        setPreviewData(preview);
      } else {
        // For other files, show basic info
        setPreviewData([{ row: 1, data: ['File detected', 'Preview not available for this file type'] }]);
      }
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    // Check if another operation is in progress
    if (isProcessing) {
      alert('Another operation is in progress. Please wait for it to complete.');
      return;
    }

    // Start processing
    const started = startProcessing('import', selectedFile.name, 4);
    if (!started) {
      alert('Cannot start import - another operation is in progress');
      return;
    }

    // Reset local progress
    setProgress(0);
    setCurrentStep(0);
    setProgressMessage('Starting import...');

    try {
      // Step 1: Preparing file
      setProgress(25);
      setCurrentStep(1);
      setProgressMessage('Preparing file for upload...');
      updateProgress(25, 'Preparing file for upload...', 1);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Uploading file
      setProgress(50);
      setCurrentStep(2);
      setProgressMessage('Uploading file to server...');
      updateProgress(50, 'Uploading file to server...', 2);
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Add master filters if they exist
      if (masterFilters.parliament) formData.append('parliament', masterFilters.parliament);
      if (masterFilters.assembly) formData.append('assembly', masterFilters.assembly);
      if (masterFilters.district) formData.append('district', masterFilters.district);
      if (masterFilters.block) formData.append('block', masterFilters.block);

      const response = await fetch('http://localhost:5002/api/import', {
        method: 'POST',
        body: formData,
      });

      // Step 3: Processing data
      setProgress(75);
      setCurrentStep(3);
      setProgressMessage('Processing imported data...');
      updateProgress(75, 'Processing imported data...', 3);
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result: ImportResult = await response.json();

      // Step 4: Finalizing
      setProgress(100);
      setCurrentStep(4);
      setProgressMessage('Finalizing import...');
      updateProgress(100, 'Finalizing import...', 4);
      await new Promise(resolve => setTimeout(resolve, 300));

      if (result.success) {
        setImportResult(result);
        completeProcessing(true, `Import completed successfully! ${result.importedRows || 0} rows imported.`);
        
        // Pass imported data to parent component if callback exists
        if (onDataImported && result.sessionId) {
          // Pass the session ID and actual imported data info
          onDataImported({
            sessionId: result.sessionId,
            tempTableName: result.tempTableName,
            importedRows: result.importedRows,
            fileName: result.fileName
          });
        }
        
        // Log activity
        await logActivity({
          action_type: 'import',
          action_details: `Imported ${result.importedRows || 0} rows from ${selectedFile.name}`,
          filters_applied: {
            parliament: masterFilters.parliament,
            assembly: masterFilters.assembly,
            district: masterFilters.district,
            block: masterFilters.block,
          },
          data_count: result.importedRows || 0,
          file_name: selectedFile.name
        });
      } else {
        throw new Error(result.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setImportResult({
        success: false,
        message: errorMessage,
        fileName: selectedFile.name,
      });
      completeProcessing(false, `Import failed: ${errorMessage}`);
    } finally {
      // Reset progress after completion
      setTimeout(() => {
        setProgress(0);
        setCurrentStep(0);
        setProgressMessage('');
      }, 2000);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setImportResult(null);
    setPreviewData([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template matching the area_mapping table structure
    const template = `name,father_name,mother_name,gender,date_of_birth,mobile_number,district,block,gp,village,address,caste,religion,parliament,assembly\nJohn Doe,Father Name,Mother Name,Male,01-01-1998,1234567890,District Name,Block Name,GP Name,Village Name,Full Address,Caste Name,Religion Name,Parliament 1,Assembly 1`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voter_data_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
      'Uploading', 
      'Processing',
      'Finalizing'
    ];

    return (
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
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
                stroke="#3b82f6"
                strokeWidth="8"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-blue-600">{Math.round(progress)}%</span>
            </div>
          </div>
          
          {/* Progress Details */}
          <div className="flex-1">
            <h4 className="font-medium text-blue-800 mb-2">Import Progress</h4>
            <p className="text-sm text-blue-700 mb-3">{progressMessage}</p>
            
            {/* Step indicators */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    index < currentStep ? 'bg-green-500' : 
                    index === currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span className={`text-sm ${
                    index < currentStep ? 'text-green-700' : 
                    index === currentStep ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                  {index === currentStep && (
                    <span className="text-xs text-blue-600">(Current)</span>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Upload className="mr-2 h-6 w-6 text-blue-600" />
          Import Data
        </h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          title="Download CSV template"
        >
          <Download className="mr-1 h-4 w-4" />
          Template
        </button>
      </div>

      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : selectedFile 
              ? 'border-green-400 bg-green-50' 
              : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <>
            <Upload className={`mx-auto h-16 w-16 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            <div className="mt-4">
              <p className="text-lg font-medium text-gray-700">
                {dragActive ? 'Drop your CSV file here' : 'Drag and drop your CSV file here'}
              </p>
              <p className="text-sm text-gray-500 mt-2">or</p>
                              <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="file-upload"
                />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 mt-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Choose File
              </label>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Supported format: CSV only</p>
              <p>Maximum file size: {maxFileSize / (1024 * 1024)}MB</p>
            </div>
          </>
        ) : (
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <p className="text-lg font-medium text-gray-700 mt-2">{selectedFile.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              Size: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
            </p>
            <div className="mt-4 space-x-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={clearFile}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Remove File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File Preview */}
      {showPreview && previewData.length > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-2">File Preview (First 5 rows):</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-2 py-1 text-left">Row</th>
                  {previewData[0]?.data.map((_: any, index: number) => (
                    <th key={index} className="px-2 py-1 text-left">Column {index + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="px-2 py-1 font-medium">{row.row}</td>
                    {row.data.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="px-2 py-1 text-gray-600">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import Button */}
      {selectedFile && (
        <div className="mt-6 text-center">
          <button
            onClick={handleImport}
            disabled={isProcessing}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isProcessing
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing CSV and importing...
              </div>
            ) : (
              <div className="flex items-center">
                <Upload className="mr-2 h-4 w-4" />
                Import Data
              </div>
            )}
          </button>
        </div>
      )}

      {/* Pie Chart Progress */}
      <PieChartProgress />

      {/* Import Result */}
      {importResult && (
        <div className={`mt-6 p-4 rounded-lg ${
          importResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-2 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className={`font-medium ${
                importResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {importResult.success ? 'Import Successful!' : 'Import Failed'}
              </h4>
              <p className={`text-sm mt-1 ${
                importResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {importResult.message}
              </p>
              {importResult.success && importResult.importedRows && (
                <p className="text-sm text-green-600 mt-1">
                  Successfully imported {importResult.importedRows} rows from {importResult.fileName}
                </p>
              )}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-700">Errors:</p>
                  <ul className="text-xs text-red-600 mt-1 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setImportResult(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Import Instructions */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Import Instructions:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Only CSV format is supported</li>
                    <li>• First row must contain column headers</li>
                    <li>• Ensure data matches your database structure</li>
                    <li>• Download template for correct format</li>
                    <li>• Maximum file size: {maxFileSize / (1024 * 1024)}MB</li>
                  </ul>
                </div>
              </div>
            </div>
      {/* Pie Chart Progress */}
      {progress > 0 && progress < 100 && (
        <PieChartProgress />
      )}
    </div>
  );
}
