import React from 'react';

export type SortState = { key: string; dir: 'asc' | 'desc' } | null;
export type AdvColumn<T> = { key: keyof T | string; header: string; width?: string; render?: (row: T) => React.ReactNode; sortable?: boolean };

export default function AdvancedTable<T>({
  columns,
  data,
  loading,
  page,
  pageSize,
  total,
  sort,
  onSortChange,
  onPageChange,
  onRowClick,
  stickyHeader = true,
  emptyText = 'No data',
  headerClassName,
}: {
  columns: AdvColumn<T>[];
  data: T[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  sort?: SortState;
  onSortChange?: (s: SortState) => void;
  onPageChange?: (p: number) => void;
  onRowClick?: (row: T) => void;
  stickyHeader?: boolean;
  emptyText?: string;
  headerClassName?: string;
}) {
  const handleSort = (col: AdvColumn<T>) => {
    if (!col.sortable) return;
    if (!onSortChange) return;
    const key = String(col.key);
    if (!sort || sort.key !== key) onSortChange({ key, dir: 'asc' });
    else onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
  };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  // Ensure sticky headers always sit on a solid background so rows do not show through.
  const stickyHeaderBg: React.CSSProperties = { backgroundColor: 'var(--surface)' };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2 text-sm">
        <div className="zynq-muted">Showing {data.length ? `${start}-${end}` : 0} of {total}</div>
      </div>
      <div className={`overflow-auto border border-[color:var(--border)] rounded-md ${stickyHeader ? 'max-h-[60vh]' : ''} ${headerClassName || ''}`}>
        <table className="w-full text-sm">
          <thead
            className={`${headerClassName || ''}`}
            style={stickyHeaderBg}
          >
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  style={{ width: c.width, ...stickyHeaderBg }}
                  className={`p-2 text-left ${stickyHeader ? 'sticky top-0 z-20' : ''} ${headerClassName || ''} ${c.sortable ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => handleSort(c)}
                >
                  <div className="flex items-center gap-1">
                    <span>{c.header}</span>
                    {sort && sort.key === String(c.key) ? (
                      <span className="text-[10px]">{sort.dir === 'asc' ? '▲' : '▼'}</span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
            {/* Spacer row so the first body row starts below the sticky header height */}
            <tr aria-hidden="true">
              {columns.map((c) => (
                <th key={String(c.key)} className="h-0 p-0 m-0 border-none" />
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4 text-center" colSpan={columns.length}>Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td className="p-6 text-center zynq-muted" colSpan={columns.length}>{emptyText}</td></tr>
            ) : (
              data.map((row, i) => (
                <tr key={i} className={`border-t border-[color:var(--border)] ${onRowClick ? 'cursor-pointer hover:bg-[color:var(--muted)]/20' : ''}`} onClick={() => onRowClick && onRowClick(row)}>
                  {columns.map((c) => (
                    <td key={String(c.key)} className="p-2 align-top">{c.render ? c.render(row) : (row as any)[c.key as any]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {onPageChange ? (
        <div className="flex justify-end mt-3">
          <div className="inline-flex items-center gap-2">
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>Prev</button>
            <span className="text-sm">Page {page}</span>
            <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={() => onPageChange(total > page * pageSize ? page + 1 : page)} disabled={!(total > page * pageSize)}>Next</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
