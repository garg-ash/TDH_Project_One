'use client';

import React, { useState, useCallback } from 'react';
import ExcelDataTable from '../../components/ExcelDataTable';

// Example data interface
interface ExampleData {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  salary: number;
  joinDate: string;
}

// Example columns definition
const exampleColumns = [
  {
    id: 'select',
    header: 'Sr. No.',
    size: 80,
    isRowHeader: true
  },
  {
    accessorKey: 'name',
    header: 'Employee Name',
    size: 200
  },
  {
    accessorKey: 'email',
    header: 'Email Address',
    size: 250
  },
  {
    accessorKey: 'phone',
    header: 'Phone Number',
    size: 150
  },
  {
    accessorKey: 'department',
    header: 'Department',
    size: 150
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 120
  },
  {
    accessorKey: 'joinDate',
    header: 'Join Date',
    size: 120
  }
];

// Sample data
const sampleData: ExampleData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+91-98765-43210',
    department: 'Engineering',
    salary: 75000,
    joinDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@company.com',
    phone: '+91-98765-43211',
    department: 'Marketing',
    salary: 65000,
    joinDate: '2023-02-20'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@company.com',
    phone: '+91-98765-43212',
    department: 'Sales',
    salary: 70000,
    joinDate: '2023-03-10'
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@company.com',
    phone: '+91-98765-43213',
    department: 'HR',
    salary: 60000,
    joinDate: '2023-04-05'
  },
  {
    id: '5',
    name: 'David Brown',
    email: 'david.brown@company.com',
    phone: '+91-98765-43214',
    department: 'Finance',
    salary: 80000,
    joinDate: '2023-05-12'
  }
];

export default function ExcelExamplePage() {
  const [data, setData] = useState<ExampleData[]>(sampleData);
  const [loading, setLoading] = useState(false);
  const [undoHistory, setUndoHistory] = useState<Array<{action: string, details: string}>>([]);

  // Handle row updates
  const handleUpdateRow = useCallback(async (rowIndex: number, columnId: string, value: any) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setData(prevData => {
        const newData = [...prevData];
        if (newData[rowIndex]) {
          newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
        }
        return newData;
      });
      
      console.log(`Updated row ${rowIndex}, column ${columnId} to: ${value}`);
    } catch (error) {
      console.error('Error updating row:', error);
      throw error;
    }
  }, []);

  // Handle undo
  const handleUndo = useCallback((historyEntry: { rowIndex: number; columnId: string; oldValue: any; newValue: any }) => {
    setUndoHistory(prev => [...prev, {
      action: 'Undo',
      details: `${historyEntry.columnId}: "${historyEntry.newValue}" → "${historyEntry.oldValue}"`
    }]);
  }, []);

  // Handle redo
  const handleRedo = useCallback((historyEntry: { rowIndex: number; columnId: string; oldValue: any; newValue: any }) => {
    setUndoHistory(prev => [...prev, {
      action: 'Redo',
      details: `${historyEntry.columnId}: "${historyEntry.oldValue}" → "${historyEntry.newValue}"`
    }]);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setData([...sampleData]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ExcelDataTable Example
          </h1>
          <p className="text-gray-600">
            This page demonstrates how to use the reusable ExcelDataTable component with Excel-like functionality.
          </p>
          
          {/* Features List */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Excel Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Click to edit cells</li>
                <li>• Arrow key navigation</li>
                <li>• Tab/Enter navigation</li>
                <li>• F2 to edit</li>
                <li>• Ctrl+A to select all</li>
                <li>• Ctrl+C to copy selected cells</li>
                <li>• Ctrl+V to paste into selected cells</li>
                <li>• Shift+Arrow for range selection</li>
                <li>• Column resizing</li>
                <li>• Undo/Redo (Ctrl+Z, Ctrl+Y)</li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Component Features:</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Fully reusable</li>
                <li>• Generic data support</li>
                <li>• Customizable columns</li>
                <li>• Built-in pagination</li>
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Responsive design</li>
                <li>• History tracking</li>
                <li>• External callbacks</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ExcelDataTable */}
        <div className="bg-white rounded-lg shadow-sm">
          <ExcelDataTable
            data={data}
            columns={exampleColumns}
            loading={loading}
            onUpdateRow={handleUpdateRow}
            onUndo={handleUndo}
            onRedo={handleRedo}
            enableExcelFeatures={true}
            showRefreshButton={true}
            onRefresh={handleRefresh}
            tableHeight="h-[600px]"
            rowHeight={40}
            enableColumnResize={true}
            enableRowResize={false}
          />
        </div>

        {/* Usage Instructions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use ExcelDataTable:</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">1. Import the Component:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`import ExcelDataTable from '../components/ExcelDataTable';`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">2. Define Your Columns:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const columns = [
  {
    id: 'select',
    header: 'Sr. No.',
    size: 80,
    isRowHeader: true
  },
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200
  }
];`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">3. Use the Component:</h3>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<ExcelDataTable
  data={yourData}
  columns={yourColumns}
  onUpdateRow={handleUpdateRow}
  onUndo={handleUndo}
  onRedo={handleRedo}
  enableExcelFeatures={true}
  showRefreshButton={true}
  onRefresh={handleRefresh}
/>`}
              </pre>
            </div>
          </div>

          {/* Copy-Paste Instructions */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">Copy-Paste Instructions:</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p><strong>To Copy:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Select cells using Shift+Arrow or Ctrl+Click</li>
                <li>Press Ctrl+C to copy selected cells</li>
                <li>Data is copied in tab-separated format</li>
              </ul>
              
              <p className="mt-3"><strong>To Paste:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Select target cells (same number as copied)</li>
                <li>Press Ctrl+V to paste from clipboard</li>
                <li>Data is pasted row by row, cell by cell</li>
              </ul>
              
              <p className="mt-3"><strong>Note:</strong> Copy-paste works with external applications like Excel, Google Sheets, etc.</p>
            </div>
          </div>
        </div>

        {/* Undo History Display */}
        {undoHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Undo/Redo History:</h2>
            <div className="space-y-2">
              {undoHistory.slice(-10).reverse().map((entry, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    entry.action === 'Undo' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {entry.action}
                  </span>
                  <span className="text-sm text-gray-700">{entry.details}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Showing last 10 actions. Use Ctrl+Z to undo and Ctrl+Y to redo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
