'use client';

import React, { useState, useEffect } from 'react';
import ExcelDataTable from '../../components/ExcelDataTable';

// Sample data for demonstration
const sampleData = [
  {
    id: 1,
    name: 'Rahul Kumar',
    fname: 'Rajesh Kumar',
    mname: 'Sunita Devi',
    surname: 'Kumar',
    mobile1: '9876543210',
    age: '25',
    district: 'Jaipur',
    block: 'Amber',
    village: 'Amber Village'
  },
  {
    id: 2,
    name: 'Priya Sharma',
    fname: 'Amit Sharma',
    mname: 'Reena Sharma',
    surname: 'Sharma',
    mobile1: '9876543211',
    age: '28',
    district: 'Jaipur',
    block: 'Amber',
    village: 'Amber Village'
  },
  {
    id: 3,
    name: 'Vikram Singh',
    fname: 'Harinder Singh',
    mname: 'Gurpreet Kaur',
    surname: 'Singh',
    mobile1: '9876543212',
    age: '32',
    district: 'Jaipur',
    block: 'Amber',
    village: 'Amber Village'
  },
  {
    id: 4,
    name: 'Anjali Patel',
    fname: 'Ramesh Patel',
    mname: 'Sita Patel',
    surname: 'Patel',
    mobile1: '9876543213',
    age: '26',
    district: 'Jaipur',
    block: 'Amber',
    village: 'Amber Village'
  },
  {
    id: 5,
    name: 'Suresh Verma',
    fname: 'Lalit Verma',
    mname: 'Kavita Verma',
    surname: 'Verma',
    mobile1: '9876543214',
    age: '30',
    district: 'Jaipur',
    block: 'Amber',
    village: 'Amber Village'
  }
];

const columns = [
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
  },
  {
    accessorKey: 'fname',
    header: 'Father\'s Name',
    size: 200
  },
  {
    accessorKey: 'mname',
    header: 'Mother\'s Name',
    size: 200
  },
  {
    accessorKey: 'surname',
    header: 'Surname',
    size: 150
  },
  {
    accessorKey: 'mobile1',
    header: 'Mobile',
    size: 150
  },
  {
    accessorKey: 'age',
    header: 'Age',
    size: 100
  },
  {
    accessorKey: 'district',
    header: 'District',
    size: 150
  },
  {
    accessorKey: 'block',
    header: 'Block',
    size: 150
  },
  {
    accessorKey: 'village',
    header: 'Village',
    size: 200
  }
];

export default function ExcelDemoPage() {
  const [data, setData] = useState(sampleData);
  const [loading, setLoading] = useState(false);

  // Handle individual row updates
  const handleUpdateRow = async (rowIndex: number, columnId: string, value: any) => {
    console.log(`Updating row ${rowIndex}, column ${columnId} to ${value}`);
    
    // Update local state
    const newData = [...data];
    if (newData[rowIndex]) {
      newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      setData(newData);
    }
  };

  // Handle bulk updates
  const handleBulkUpdate = async (updates: Array<{rowIndex: number, columnId: string, value: any}>) => {
    console.log('Bulk updates:', updates);
    
    // Update local state
    const newData = [...data];
    updates.forEach(({ rowIndex, columnId, value }) => {
      if (newData[rowIndex]) {
        newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
      }
    });
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Excel-like Data Table Demo
          </h1>
          <p className="text-gray-600">
            Experience Excel-like functionality with multiple cell selection, bulk editing, and more!
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Features Available:
            </h2>
            <ul className="space-y-2 text-gray-600">
              <li>• <strong>Multiple Cell Selection:</strong> Click and drag to select multiple cells</li>
              <li>• <strong>Bulk Editing:</strong> Select multiple cells and edit them all at once</li>
              <li>• <strong>Copy/Paste:</strong> Use Ctrl+C and Ctrl+V for cell operations</li>
              <li>• <strong>Excel-like Interface:</strong> Familiar spreadsheet experience</li>
              <li>• <strong>Real-time Updates:</strong> See changes immediately</li>
            </ul>
          </div>

          <ExcelDataTable
            data={data}
            columns={columns}
            loading={loading}
            onUpdateRow={handleUpdateRow}
            onBulkUpdate={handleBulkUpdate}
            enableExcelFeatures={true}
            tableHeight="h-96"
            rowHeight={40}
            enableColumnResize={true}
            enableRowResize={true}
          />
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            How to Use:
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Cell Selection:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Click on a cell to select it</li>
                <li>• Click and drag to select multiple cells</li>
                <li>• Use Shift + Arrow keys for range selection</li>
                <li>• Use Ctrl + A to select all cells</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Bulk Operations:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Select multiple cells</li>
                <li>• Click "Bulk Edit" button</li>
                <li>• Choose column and enter new value</li>
                <li>• Apply to all selected cells</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Keyboard Shortcuts:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Ctrl + C: Copy selected cells</li>
                <li>• Ctrl + V: Paste data</li>
                <li>• Ctrl + A: Select all cells</li>
                <li>• Tab: Navigate between cells</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Editing:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Double-click to edit cell</li>
                <li>• Press Enter to confirm changes</li>
                <li>• Press Escape to cancel editing</li>
                <li>• Use arrow keys for navigation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
