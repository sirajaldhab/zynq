export function toCsv(rows, columns) {
    const esc = (v) => {
        if (v === null || v === undefined)
            return '';
        const s = String(v);
        if (/[",\n]/.test(s))
            return '"' + s.replace(/"/g, '""') + '"';
        return s;
    };
    const header = columns.map((c) => esc(c.header)).join(',');
    const body = rows.map((r) => columns.map((c) => esc(c.map ? c.map(r) : r[c.key])).join(',')).join('\n');
    return header + '\n' + body + '\n';
}
export function downloadCsv(filename, csv) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
