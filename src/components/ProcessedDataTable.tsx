'use client';

import { useState, useMemo } from 'react';
import ExcelDataTable from './ExcelDataTable';

// Interface for processed data (dynamic structure)
export interface ProcessedDataRow {
  [key: string]: any;
}

interface ProcessedDataTableProps {
  data: ProcessedDataRow[];
}

export default function ProcessedDataTable({ data }: ProcessedDataTableProps) {
  // Define the columns we want to show by default
  const defaultVisibleColumns = [
    'AC', 'PC', 'District', 'Block', 'surname', 'castId', 'castIda'
  ];
  
  // Generate columns based on data structure - only show required columns
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Only show the columns we want, in the order we want
    return defaultVisibleColumns.map((key) => ({
      accessorKey: key,
      header: key === 'castId' ? 'Cast ID' : 
              key === 'castIda' ? 'Cast IDA' : 
              key === 'AC' ? 'AC' :
              key === 'PC' ? 'PC' :
              key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      size: key === 'AC' || key === 'PC' || key === 'District' || key === 'Block' ? 180 : 150,
      type: 'text'
    }));
  }, [data]);

  // Debug logging
  console.log('ProcessedDataTable received data:', {
    dataLength: data?.length || 0,
    firstRow: data?.[0],
    columns: columns.length,
    visibleColumns: defaultVisibleColumns
  });

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-lg font-medium">No processed data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto relative" style={{ zIndex: 1 }}>
      {/* Excel-like DataTable */}
      <div className="h-full">
        <ExcelDataTable
          data={data}
          columns={columns}
          loading={false}
          enableExcelFeatures={true}
          showRefreshButton={false}
          tableHeight="h-full"
          rowHeight={28}
          enableColumnResize={true}
          enableRowResize={true}
          showPagination={false}
        />
      </div>
    </div>
  );
}
