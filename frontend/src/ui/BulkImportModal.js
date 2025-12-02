import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import Modal from './Modal';
import Button from './Button';
import * as XLSX from 'xlsx';
export default function BulkImportModal({ open, onClose, fields, onValidate, onConfirm, templateHint, }) {
    const fileInputRef = React.useRef(null);
    const [headers, setHeaders] = React.useState([]);
    const [rows, setRows] = React.useState([]);
    const [mapping, setMapping] = React.useState({});
    const [importing, setImporting] = React.useState(false);
    React.useEffect(() => {
        if (!open) {
            setHeaders([]);
            setRows([]);
            setMapping({});
            setImporting(false);
        }
    }, [open]);
    function onPickFile() {
        if (fileInputRef.current)
            fileInputRef.current.click();
    }
    async function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            setImporting(true);
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const first = wb.SheetNames?.[0];
            if (!first)
                throw new Error('No sheets');
            const ws = wb.Sheets[first];
            if (!ws)
                throw new Error('Worksheet missing');
            const json = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
            const hs = extractHeaders(ws);
            setHeaders(hs);
            setRows(json);
            const autoMap = {};
            for (const f of fields) {
                const match = hs.find(h => normalize(h) === normalize(f.key) || normalize(h) === normalize(f.label)) || '';
                if (match)
                    autoMap[f.key] = match;
            }
            setMapping(autoMap);
        }
        catch (e) {
            alert('Failed to parse Excel');
        }
        finally {
            setImporting(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    }
    function extractHeaders(ws) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        const headers = [];
        const R = range.s.r; // first row
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            headers.push(cell ? String(cell.v) : `COL${C}`);
        }
        return headers;
    }
    function normalize(s) { return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ''); }
    function buildMappedRows() {
        if (!rows.length)
            return [];
        return rows.map((r, idx) => {
            const out = {};
            for (const f of fields) {
                const src = mapping[f.key];
                if (src)
                    out[f.key] = r[src];
            }
            const errs = [];
            for (const f of fields) {
                if (f.required && (out[f.key] === undefined || out[f.key] === '' || out[f.key] === null))
                    errs.push(f.key);
            }
            const custom = onValidate(out);
            if (custom)
                errs.push(custom);
            return { ...out, _row: idx + 2, _err: errs.length ? `Missing/invalid: ${errs.join(', ')}` : undefined };
        });
    }
    async function handleConfirm() {
        // If no rows are loaded yet, treat Import as a shortcut to open the file picker
        if (!rows.length) {
            onPickFile();
            return;
        }
        const mapped = buildMappedRows();
        const valid = mapped.filter(r => !r._err).map(({ _err, _row, ...r }) => r);
        if (valid.length === 0) {
            alert('No valid rows to import');
            return;
        }
        try {
            setImporting(true);
            await onConfirm(valid);
            onClose();
        }
        finally {
            setImporting(false);
        }
    }
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Bulk Import", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { ref: fileInputRef, type: "file", accept: ".xlsx,.xls", className: "hidden", onChange: onFileChange }), _jsx(Button, { variant: "secondary", onClick: onPickFile, disabled: importing, children: "Choose Excel" }), templateHint ? _jsx("div", { className: "text-xs zynq-muted", children: templateHint }) : null] }), rows.length ? (_jsx("div", { className: "max-h-[45vh] overflow-auto", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-2", children: "Row#" }), fields.map(f => (_jsx("th", { className: "p-2", children: f.label }, f.key))), _jsx("th", { className: "p-2", children: "Error" })] }) }), _jsx("tbody", { children: buildMappedRows().map((r, i) => (_jsxs("tr", { className: r._err ? 'bg-red-500/5' : '', children: [_jsx("td", { className: "p-2", children: r._row }), fields.map(f => (_jsx("td", { className: "p-2", children: r[f.key] ?? '—' }, f.key))), _jsx("td", { className: "p-2 text-red-500", children: r._err || 'OK' })] }, i))) })] }) })) : null, _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: importing, children: "Cancel" }), _jsx(Button, { onClick: handleConfirm, disabled: importing, children: "Import" })] })] }) }));
}
