import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export default function AdvancedTable({ columns, data, loading, page, pageSize, total, sort, onSortChange, onPageChange, onRowClick, stickyHeader = true, emptyText = 'No data', headerClassName, }) {
    const handleSort = (col) => {
        if (!col.sortable)
            return;
        if (!onSortChange)
            return;
        const key = String(col.key);
        if (!sort || sort.key !== key)
            onSortChange({ key, dir: 'asc' });
        else
            onSortChange({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(total, page * pageSize);
    // Ensure sticky headers always sit on a solid background so rows do not show through.
    const stickyHeaderBg = { backgroundColor: 'var(--surface)' };
    return (_jsxs("div", { className: "w-full", children: [_jsx("div", { className: "flex justify-between items-center mb-2 text-sm", children: _jsxs("div", { className: "zynq-muted", children: ["Showing ", data.length ? `${start}-${end}` : 0, " of ", total] }) }), _jsx("div", { className: `overflow-auto border border-[color:var(--border)] rounded-md ${stickyHeader ? 'max-h-[60vh]' : ''} ${headerClassName || ''}`, children: _jsxs("table", { className: "w-full text-sm", children: [_jsxs("thead", { className: `${headerClassName || ''}`, style: stickyHeaderBg, children: [_jsx("tr", { children: columns.map((c) => (_jsx("th", { style: { width: c.width, ...stickyHeaderBg }, className: `p-2 text-left ${stickyHeader ? 'sticky top-0 z-20' : ''} ${headerClassName || ''} ${c.sortable ? 'cursor-pointer select-none' : ''}`, onClick: () => handleSort(c), children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("span", { children: c.header }), sort && sort.key === String(c.key) ? (_jsx("span", { className: "text-[10px]", children: sort.dir === 'asc' ? '▲' : '▼' })) : null] }) }, String(c.key)))) }), _jsx("tr", { "aria-hidden": "true", children: columns.map((c) => (_jsx("th", { className: "h-0 p-0 m-0 border-none" }, String(c.key)))) })] }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsx("td", { className: "p-4 text-center", colSpan: columns.length, children: "Loading..." }) })) : data.length === 0 ? (_jsx("tr", { children: _jsx("td", { className: "p-6 text-center zynq-muted", colSpan: columns.length, children: emptyText }) })) : (data.map((row, i) => (_jsx("tr", { className: `border-t border-[color:var(--border)] ${onRowClick ? 'cursor-pointer hover:bg-[color:var(--muted)]/20' : ''}`, onClick: () => onRowClick && onRowClick(row), children: columns.map((c) => (_jsx("td", { className: "p-2 align-top", children: c.render ? c.render(row) : row[c.key] }, String(c.key)))) }, i)))) })] }) }), onPageChange ? (_jsx("div", { className: "flex justify-end mt-3", children: _jsxs("div", { className: "inline-flex items-center gap-2", children: [_jsx("button", { className: "px-2 py-1 border rounded disabled:opacity-50", onClick: () => onPageChange(Math.max(1, page - 1)), disabled: page <= 1, children: "Prev" }), _jsxs("span", { className: "text-sm", children: ["Page ", page] }), _jsx("button", { className: "px-2 py-1 border rounded disabled:opacity-50", onClick: () => onPageChange(total > page * pageSize ? page + 1 : page), disabled: !(total > page * pageSize), children: "Next" })] }) })) : null] }));
}
