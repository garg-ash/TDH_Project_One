'use client';

import { Eye, Download, FileText, Printer } from 'lucide-react';
import { useActivityLogger } from './ActivityLogger';

interface ExportButtonsProps {
  filters?: object;
  dataCount?: number;
  fileName?: string;
}

export default function ExportButtons({ filters = {}, dataCount = 0, fileName = 'data' }: ExportButtonsProps) {
  const { logActivity } = useActivityLogger();

  const handleExcelExport = async () => {
    try {
      // Log the export activity
      await logActivity({
        action_type: 'export',
        action_details: `Exported data to Excel format`,
        filters_applied: filters,
        data_count: dataCount,
        file_name: `${fileName}.xlsx`
      });

      // Your existing Excel export logic here
      console.log('Exporting to Excel...');
      // Add your Excel export implementation
    } catch (error) {
      console.error('Error during Excel export:', error);
    }
  };

  const handleCSVExport = async () => {
    try {
      // Log the export activity
      await logActivity({
        action_type: 'export',
        action_details: `Exported data to CSV format`,
        filters_applied: filters,
        data_count: dataCount,
        file_name: `${fileName}.csv`
      });

      // Your existing CSV export logic here
      console.log('Exporting to CSV...');
      // Add your CSV export implementation
    } catch (error) {
      console.error('Error during CSV export:', error);
    }
  };

  const handlePrint = async () => {
    try {
      // Log the print activity
      await logActivity({
        action_type: 'export',
        action_details: `Printed data`,
        filters_applied: filters,
        data_count: dataCount,
        file_name: `${fileName}_print`
      });

      // Your existing print logic here
      console.log('Printing data...');
      window.print();
    } catch (error) {
      console.error('Error during print:', error);
    }
  };

  return (
    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Stock Summary</h3>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
            <Eye size={16} />
            <span>Column visibility</span>
          </button>
          <button 
            onClick={handleExcelExport}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <Download size={16} />
            <span>Excel</span>
          </button>
          <button 
            onClick={handleCSVExport}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <FileText size={16} />
            <span>CSV</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <Printer size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </div>
  );
} 