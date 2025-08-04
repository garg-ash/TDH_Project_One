'use client';

import { Eye, Download, FileText, Printer } from 'lucide-react';

export default function ExportButtons() {
  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Stock Summary</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            <Eye size={16} />
            <span>Column visibility</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            <Download size={16} />
            <span>Excel</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            <FileText size={16} />
            <span>CSV</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
} 