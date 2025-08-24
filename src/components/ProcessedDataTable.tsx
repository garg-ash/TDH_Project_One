'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';

// Interface for processed data (dynamic structure)
export interface ProcessedDataRow {
  [key: string]: any;
}

interface ProcessedDataTableProps {
  data: ProcessedDataRow[];
}

export default function ProcessedDataTable({ data }: ProcessedDataTableProps) {
  // Generate dynamic columns based on data structure
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const firstRow = data[0];
    const columnKeys = Object.keys(firstRow);
    
    // Filter out unwanted columns
    const excludedColumns = ['percentage', 'density', 'isTop10', 'isBottom10'];
    const filteredColumnKeys = columnKeys.filter(key => !excludedColumns.includes(key));
    
    return filteredColumnKeys.map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      size: 150,
      cell: ({ getValue }: any) => {
        const value = getValue();
        return (
          <div className="px-3 py-2 text-sm text-gray-900">
            {typeof value === 'object' ? JSON.stringify(value) : String(value || '')}
          </div>
        );
      },
    }));
  }, [data]);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
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
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-3 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wide border-b border-gray-200"
                  style={{ width: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-3 py-2 text-sm text-gray-900 border-r border-gray-200"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
