import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
}

export default function Table<T>({ columns, data, emptyText = 'No records' }: TableProps<T>) {
  return (
    <div className="overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)]">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-[color:var(--text-secondary)]">
            {columns.map((c) => (
              <th
                key={String(c.key)}
                className={`sticky top-0 z-10 bg-[color:var(--surface)] px-4 py-3 font-medium ${c.className || ''}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
          {/* Spacer row to ensure body rows start below the sticky header height */}
          <tr aria-hidden="true">
            {columns.map((c) => (
              <th key={String(c.key)} className="h-0 p-0 m-0 border-none" />
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-[color:var(--text-secondary)]">
                {emptyText}
              </td>
            </tr>
          )}
          {data.map((row, idx) => (
            <tr key={idx} className={`${idx % 2 ? 'bg-black/0' : 'bg-black/0'} hover:bg-[color:var(--bg)]/60 transition-colors`}>
              {columns.map((c) => (
                <td key={String(c.key)} className={`px-4 py-3 border-t zynq-border ${c.className || ''}`}>
                  {c.render ? c.render(row) : (row as any)[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
