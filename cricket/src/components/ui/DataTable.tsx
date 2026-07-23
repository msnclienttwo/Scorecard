'use client';

import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  onRowClick?: (row: Record<string, unknown>) => void;
  emptyMessage?: string;
  className?: string;
}

function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available', className }: DataTableProps) {
  return (
    <div className={cn('bg-white/5 rounded-2xl overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs uppercase tracking-wider text-white/50 font-medium"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={FileText} title={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-t border-white/5 transition-colors',
                    onRowClick && 'cursor-pointer hover:bg-white/5'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-white">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
