import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, useIonToast, IonIcon } from '@ionic/react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Nav from '../../components/Nav';
import Table from '../../ui/Table';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { fetchMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api/materialsService';
import { fetchVendors, createVendor } from '../../api/vendorsService';
import * as XLSX from 'xlsx';
import { createPortal } from 'react-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { useAuth } from '../../auth/AuthContext';
export default function MaterialDelivery() {
    const { id: projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const [rows, setRows] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const fileInputRef = React.useRef(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewRows, setPreviewRows] = React.useState([]);
    const [importing, setImporting] = React.useState(false);
    const [vendors, setVendors] = React.useState([]);
    const [vendorFilter, setVendorFilter] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const columns = [
        { key: 'invoice_date', header: 'Invoice Date', render: (r) => (r.invoice_date ? new Date(r.invoice_date).toLocaleDateString() : '—') },
        { key: 'vendor', header: 'Vendor', render: (r) => {
                const byId = (id) => vendorOptions.find(v => v.id === id)?.name;
                return r.vendor?.name || byId(r.vendorId) || r.vendorId || '—';
            } },
        { key: 'item_description', header: 'Description' },
        { key: 'quantity', header: 'Quantity' },
        { key: 'unit_price', header: 'Unit Price', render: (r) => (r.unit_price ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { key: 'gross', header: 'Gross', render: (r) => ((r.quantity || 0) * (r.unit_price || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        { key: 'vat', header: 'VAT', render: (r) => r.vat ? Number(r.vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—' },
        { key: 'total', header: 'Total', render: (r) => (r.total ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsx("div", { className: "flex gap-2", children: !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => onDelete(r), children: "Delete" })] })) })),
        },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            // Ensure we have the latest vendors for client-side resolution
            let vlist = vendors;
            try {
                vlist = await fetchVendors({ token });
                setVendors(vlist);
            }
            catch (err) {
                console.error('MaterialDelivery vendors refresh failed', err);
                present({ message: 'Unable to refresh vendors list', color: 'warning', duration: 1800, position: 'top' });
            }
            const res = await fetchMaterials({ projectId, token });
            const data = (Array.isArray(res) ? res : res.data) || [];
            const byId = new Map(vlist.map(v => [v.id, v]));
            const resolved = data.map((r) => (r.vendor || !r.vendorId) ? r : { ...r, vendor: byId.get(r.vendorId) || r.vendor });
            setRows(resolved);
            try {
                if (Array.isArray(data)) {
                    // Debug a few rows for vendor-related fields
                    console.log('Materials sample:', resolved.slice(0, 5).map((r) => ({ id: r.id, vendorId: r.vendorId, vendor: r.vendor })));
                }
            }
            catch { }
        }
        catch (_) {
            present({ message: 'Failed to load materials', color: 'danger', duration: 1800, position: 'top' });
            setRows([]);
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => { load(); }, [projectId]);
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        fetchVendors({ token })
            .then(setVendors)
            .catch((err) => {
            console.error('MaterialDelivery initial vendors load failed', err);
            present({ message: 'Failed to load vendors', color: 'danger', duration: 2000, position: 'top' });
        });
    }, [present]);
    async function resolveVendorId(raw, token) {
        let v = raw?.trim();
        if (!v)
            return undefined;
        // If already a UUID, return as-is
        if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(v))
            return v;
        const key = v.toLowerCase();
        // Check current list
        let found = vendors.find(x => x.name.trim().toLowerCase() === key);
        if (found)
            return found.id;
        // Try create, then fallback to refetch on failure
        try {
            const created = await createVendor({ name: v, token });
            if (created?.id) {
                setVendors(prev => [...prev, created]);
                return created.id;
            }
        }
        catch (_) {
            // ignore and fallback to refetch
        }
        try {
            const fresh = await fetchVendors({ token });
            setVendors(fresh);
            const again = fresh.find(x => x.name.trim().toLowerCase() === key);
            if (again)
                return again.id;
        }
        catch { }
        return undefined;
    }
    const filteredRows = React.useMemo(() => {
        return rows.filter((r) => {
            // Vendor filter
            if (vendorFilter && r.vendorId !== vendorFilter && r.vendor?.id !== vendorFilter)
                return false;
            // Date range filter
            if (dateFrom || dateTo) {
                if (!r.invoice_date)
                    return false;
                const dIso = (() => {
                    try {
                        return new Date(r.invoice_date).toISOString().slice(0, 10);
                    }
                    catch {
                        return undefined;
                    }
                })();
                if (!dIso)
                    return false;
                if (dateFrom && dIso < dateFrom)
                    return false;
                if (dateTo && dIso > dateTo)
                    return false;
            }
            return true;
        });
    }, [rows, vendorFilter, dateFrom, dateTo]);
    const resolvedRows = React.useMemo(() => {
        if (!vendors?.length)
            return filteredRows;
        const byId = new Map(vendors.map(v => [v.id, v]));
        return filteredRows.map(r => (r.vendor || !r.vendorId) ? r : { ...r, vendor: byId.get(r.vendorId) || r.vendor });
    }, [filteredRows, vendors]);
    const sortedRows = React.useMemo(() => {
        const toKey = (r) => {
            if (!r.invoice_date)
                return '';
            try {
                return new Date(r.invoice_date).toISOString();
            }
            catch {
                return '';
            }
        };
        const copy = [...resolvedRows];
        copy.sort((a, b) => {
            const ka = toKey(a);
            const kb = toKey(b);
            if (ka === kb)
                return 0;
            // Descending (latest first)
            return ka > kb ? -1 : 1;
        });
        return copy;
    }, [resolvedRows]);
    const projectLabel = React.useMemo(() => {
        const state = location.state;
        if (state?.projectName)
            return state.projectName;
        return projectId || '';
    }, [location.state, projectId]);
    const totalSum = React.useMemo(() => {
        return sortedRows.reduce((acc, r) => acc + (typeof r.total === 'number' ? r.total : Number(r.total || 0)), 0);
    }, [sortedRows]);
    const vendorOptions = React.useMemo(() => {
        const map = new Map();
        vendors.forEach(v => { if (v.id)
            map.set(v.id, v.name); });
        resolvedRows.forEach(r => { if (r.vendor?.id)
            map.set(r.vendor.id, r.vendor.name); });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [vendors, resolvedRows]);
    const onPickExcel = async (ev) => {
        const file = ev.target.files?.[0];
        if (!file)
            return;
        try {
            const rows = await readExcel(file);
            setPreviewRows(rows);
            setPreviewOpen(true);
            if (!rows || rows.length === 0) {
                present({ message: 'No rows detected in sheet', color: 'warning', duration: 1800, position: 'top' });
            }
        }
        catch (e) {
            console.error(e);
            present({ message: 'Failed to parse Excel file', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            // Reset value so selecting the same file again still triggers onChange
            try {
                ev.target.value = '';
            }
            catch { }
        }
    };
    const onConfirmImport = async () => {
        const ok = previewRows.filter((r) => !r._err);
        if (ok.length === 0) {
            present({ message: 'No valid rows to import. Please fix highlighted rows.', color: 'warning', duration: 2200, position: 'top' });
            return;
        }
        setImporting(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            // Prepare vendor map and ensure vendors exist for name strings
            const existing = await fetchVendors({ token }).catch(() => []);
            const byName = new Map();
            existing.forEach(v => byName.set(v.name.trim().toLowerCase(), v));
            let success = 0;
            const failures = [];
            let missingVendor = 0;
            for (const r of ok) {
                const payload = {
                    projectId: projectId,
                    invoice_date: r.invoice_date || undefined,
                    item_description: r.item_description || '',
                    quantity: Number(r.quantity || 0),
                    unit_price: r.unit_price,
                    vat: r.vat,
                    total: Number(r.total || 0),
                    token,
                };
                const rawVendor = r.vendorId; // Excel may put name here
                if (rawVendor) {
                    if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(rawVendor)) {
                        payload.vendorId = rawVendor;
                    }
                    else {
                        const key = rawVendor.trim().toLowerCase();
                        let ven = byName.get(key);
                        if (!ven) {
                            const id = await resolveVendorId(rawVendor, token);
                            if (id) {
                                payload.vendorId = id;
                                // Keep our local map in sync for this batch
                                const maybe = vendors.find(x => x.id === id);
                                if (maybe)
                                    byName.set(key, maybe);
                            }
                        }
                        else {
                            payload.vendorId = ven.id;
                        }
                    }
                }
                if (!payload.vendorId && rawVendor) {
                    // Fallback: pass vendor NAME to backend; backend will upsert and link by name
                    payload.vendorId = rawVendor.trim();
                }
                if (!payload.vendorId)
                    missingVendor++;
                try {
                    console.log('Import payload', { row: r._row, vendorInSheet: rawVendor, vendorId: payload.vendorId });
                }
                catch { }
                if (payload.vendorId) {
                    try {
                        await createMaterial(payload);
                        success++;
                    }
                    catch (e) {
                        failures.push({ row: r._row, err: e });
                        console.error('Import row failed', r, e);
                    }
                }
                else {
                    failures.push({ row: r._row, err: new Error('Vendor not resolved') });
                }
            }
            if (success > 0) {
                await load();
                // Refresh vendors list for filters
                try {
                    setVendors(await fetchVendors({ token }));
                }
                catch { }
            }
            if (failures.length === 0) {
                setPreviewOpen(false);
                present({ message: `Import completed (${success} rows)`, color: 'success', duration: 1800, position: 'top' });
                if (missingVendor > 0)
                    present({ message: `${missingVendor} row(s) had no vendor resolved`, color: 'warning', duration: 2200, position: 'top' });
            }
            else {
                // annotate preview rows with failure info
                setPreviewRows((prev) => prev.map((r) => {
                    const f = failures.find((x) => x.row === r._row);
                    if (!f)
                        return r;
                    const msg = (f.err && (f.err.message || f.err.error || f.err.toString?.())) || 'Server rejected row';
                    return { ...r, _err: r._err ? `${r._err}; Import failed: ${msg}` : `Import failed: ${msg}` };
                }));
                present({ message: `Imported ${success} row(s). ${failures.length} failed. See status column for details.`, color: 'warning', duration: 3200, position: 'top' });
            }
        }
        catch (e) {
            console.error(e);
            present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setImporting(false);
        }
    };
    function normalizeHeader(h) {
        if (!h)
            return '';
        return String(h)
            .replace(/\u00A0/g, ' ') // NBSP to space
            .replace(/[._-]+/g, ' ') // punctuation to space
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }
    function canonicalHeader(h) {
        const x = normalizeHeader(h);
        if (!x)
            return undefined;
        const map = {
            'invoice date': 'invoice date',
            'date': 'invoice date',
            'invoice_date': 'invoice date',
            'invoicedate': 'invoice date',
            'vendor': 'vendor',
            'vendor id': 'vendor',
            'vendorid': 'vendor',
            'vendor name': 'vendor',
            'supplier': 'vendor',
            'supplier name': 'vendor',
            'description': 'description',
            'item': 'description',
            'item description': 'description',
            'quantity': 'quantity',
            'qty': 'quantity',
            'qty.': 'quantity',
            'unit price': 'unit price',
            'unit_price': 'unit price',
            'price': 'unit price',
            'rate': 'unit price',
            'unitprice': 'unit price',
            'vat': 'vat',
            'tax': 'vat',
            'gst': 'vat',
            'total': 'total',
            'amount': 'total',
            'total amount': 'total',
            'gross': 'gross',
            'gross amount': 'gross',
        };
        return map[x] || undefined;
    }
    function parseExcelDate(val) {
        if (!val && val !== 0)
            return undefined;
        // Try as Date string
        const s = String(val).trim();
        // dd/MM/yyyy or dd-MM-yyyy
        const m = s.match(/^([0-3]?\d)[\/-]([0-1]?\d)[\/-](\d{2,4})$/);
        if (m && m[1] && m[2] && m[3]) {
            const ddStr = m[1];
            const mmStr = m[2];
            const yyStr = m[3];
            const dd = parseInt(ddStr, 10);
            const mm = parseInt(mmStr, 10);
            const yyyy = parseInt(yyStr.length === 2 ? ('20' + yyStr) : yyStr, 10);
            const d = new Date(Date.UTC(yyyy, mm - 1, dd));
            if (!isNaN(d.getTime()))
                return d.toISOString().substring(0, 10);
        }
        // Avoid letting JS parse weird strings like '+045382-12' as year 45382
        {
            const d1 = new Date(s);
            const y = d1.getUTCFullYear();
            if (!isNaN(d1.getTime()) && y >= 1900 && y <= 2100)
                return d1.toISOString().substring(0, 10);
        }
        // Excel serialized number (days since 1899-12-30)
        const n = Number(val);
        if (!isNaN(n)) {
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const ms = epoch.getTime() + n * 86400000;
            const d2 = new Date(ms);
            return d2.toISOString().substring(0, 10);
        }
        // Try extracting number from string and treat as serial if in plausible range
        const maybeNum = toNumber(s);
        if (typeof maybeNum === 'number' && maybeNum > 20000 && maybeNum < 60000) {
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const ms = epoch.getTime() + maybeNum * 86400000;
            const d3 = new Date(ms);
            if (!isNaN(d3.getTime()))
                return d3.toISOString().substring(0, 10);
        }
        // Extract any 5+ digit window that looks like an Excel serial (handles '+045382-12' pattern)
        const five = s.match(/\d{5,6}/);
        if (five) {
            const serial = parseInt(five[0].slice(0, 5), 10);
            if (serial > 20000 && serial < 60000) {
                const epoch = new Date(Date.UTC(1899, 11, 30));
                const ms = epoch.getTime() + serial * 86400000;
                const d4 = new Date(ms);
                if (!isNaN(d4.getTime()))
                    return d4.toISOString().substring(0, 10);
            }
        }
        return undefined;
    }
    function toNumber(x) {
        if (x === null || x === undefined)
            return undefined;
        const s = String(x).trim();
        if (s === '' || s === '—' || s === '-')
            return undefined;
        // Remove currency symbols and thousand separators, keep digits, dot, minus
        let cleaned = s.replace(/\((.*)\)/, '-$1');
        cleaned = cleaned.replace(/\+/g, '');
        cleaned = cleaned.replace(/[^0-9.-]/g, '');
        // remove any '-' not at start
        if (cleaned.length > 1) {
            cleaned = (cleaned[0] === '-' ? '-' : '') + cleaned.slice(cleaned[0] === '-' ? 1 : 0).replace(/-/g, '');
        }
        // If multiple dots, keep first
        const parts = cleaned.split('.');
        if (parts.length > 2)
            cleaned = parts.shift() + '.' + parts.join('');
        const n = Number(cleaned);
        return isNaN(n) ? undefined : n;
    }
    function mapRow(row) {
        // Supported headers (case-insensitive):
        // Invoice Date, Vendor, Description, Quantity, Unit Price, Gross, VAT, Total
        const get = (keys) => {
            for (const k of keys) {
                if (row[k] !== undefined)
                    return row[k];
            }
            return undefined;
        };
        const invoice_date = parseExcelDate(get(['invoice date', 'invoice_date', 'date']));
        const vendorId = (get(['vendor', 'vendor id', 'vendorid']) ?? '');
        const item_description = (get(['description', 'item', 'item description']) ?? '').toString();
        const quantity = toNumber(get(['quantity', 'qty']));
        const unit_price = toNumber(get(['unit price', 'price', 'unit_price']));
        const gross = toNumber(get(['gross']));
        const vat = toNumber(get(['vat', 'tax']));
        let total = toNumber(get(['total', 'amount']));
        // Derivations
        let derivedUnit = unit_price;
        if ((derivedUnit === undefined || derivedUnit === null) && gross !== undefined && quantity && quantity > 0) {
            derivedUnit = gross / quantity;
        }
        if ((total === undefined || total === null)) {
            if (gross !== undefined)
                total = gross + (vat || 0);
            else if (quantity !== undefined)
                total = (quantity || 0) * (derivedUnit || 0) + (vat || 0);
        }
        const rec = { invoice_date, vendorId: vendorId || undefined, item_description, quantity, unit_price: derivedUnit, vat, total };
        if (row._row !== undefined)
            rec._row = row._row;
        // Validation
        const errs = [];
        if (!item_description)
            errs.push('Description required');
        if (quantity === undefined || quantity <= 0)
            errs.push('Quantity must be > 0');
        if (total === undefined)
            errs.push('Total missing');
        if (errs.length)
            rec._err = errs.join('; ');
        return rec;
    }
    function sheetToJson(XLSX, wb) {
        let best = null;
        let bestScore = -1;
        for (const name of wb.SheetNames) {
            const ws = wb.Sheets[name];
            const rows2d = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: true });
            if (!rows2d || rows2d.length === 0)
                continue;
            let headerIdx = -1;
            let maxHits = 0;
            let firstOneHit = -1;
            for (let i = 0; i < Math.min(rows2d.length, 20); i++) {
                const r = rows2d[i] || [];
                const norm = r.map((c) => normalizeHeader(c));
                const hits = norm.reduce((acc, h) => acc + (canonicalHeader(h || '') ? 1 : 0), 0);
                if (hits > maxHits) {
                    maxHits = hits;
                    headerIdx = i;
                }
                if (firstOneHit === -1 && hits >= 1)
                    firstOneHit = i;
            }
            if (maxHits < 2)
                headerIdx = firstOneHit !== -1 ? firstOneHit : 0;
            if (headerIdx === -1)
                headerIdx = 0;
            const headerRow = rows2d[headerIdx] || [];
            const keyMap = headerRow.map((h) => canonicalHeader(h) || normalizeHeader(h));
            // Score: number of known headers matched
            const score = keyMap.reduce((acc, k) => acc + (['invoice date', 'vendor', 'description', 'quantity', 'unit price', 'vat', 'total', 'gross'].includes(k) ? 1 : 0), 0);
            if (score > bestScore) {
                bestScore = score;
                best = { ws, rows2d, headerIdx, keyMap };
            }
        }
        if (!best)
            return [];
        const { rows2d, headerIdx, keyMap } = best;
        const out = [];
        for (let i = headerIdx + 1; i < rows2d.length; i++) {
            const row = rows2d[i] || [];
            if (!row || row.every((c) => c === '' || c === null || c === undefined))
                continue;
            const obj = { _row: i + 1 };
            for (let c = 0; c < keyMap.length; c++) {
                const key = keyMap[c];
                if (!key)
                    continue;
                obj[key] = row[c];
            }
            out.push(obj);
        }
        return out;
    }
    async function readExcel(file) {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const rows = sheetToJson(XLSX, wb);
        return rows.map(mapRow);
    }
    function PreviewImportModal({ open, rows, onClose, onConfirm, busy }) {
        const hasErrors = rows.some(r => r._err);
        if (!open)
            return null;
        return createPortal(_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]", children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(900px,96vw)] space-y-3 shadow-xl", children: [_jsxs("div", { className: "text-base font-semibold", children: ["Preview Import (", rows.length, " rows)"] }), _jsx("div", { className: "overflow-auto max-h-[60vh]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left", children: [_jsx("th", { className: "p-2", children: "Row" }), _jsx("th", { className: "p-2", children: "Invoice Date" }), _jsx("th", { className: "p-2", children: "Vendor" }), _jsx("th", { className: "p-2", children: "Description" }), _jsx("th", { className: "p-2", children: "Qty" }), _jsx("th", { className: "p-2", children: "Unit Price" }), _jsx("th", { className: "p-2", children: "VAT" }), _jsx("th", { className: "p-2", children: "Total" }), _jsx("th", { className: "p-2", children: "Status" })] }) }), _jsx("tbody", { children: rows.map((r, idx) => (_jsxs("tr", { className: r._err ? 'bg-red-500/10' : '', children: [_jsx("td", { className: "p-2", children: r._row ?? '' }), _jsx("td", { className: "p-2", children: r.invoice_date || '—' }), _jsx("td", { className: "p-2", children: r.vendorId || '—' }), _jsx("td", { className: "p-2", children: r.item_description || '' }), _jsx("td", { className: "p-2", children: r.quantity ?? '' }), _jsx("td", { className: "p-2", children: r.unit_price ?? '' }), _jsx("td", { className: "p-2", children: r.vat ?? '' }), _jsx("td", { className: "p-2", children: r.total ?? '' }), _jsx("td", { className: "p-2", children: r._err ? r._err : 'OK' })] }, idx))) })] }) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: busy, children: "Cancel" }), _jsx(Button, { onClick: onConfirm, disabled: busy, children: busy ? 'Importing...' : 'Confirm Import' })] })] }) }), document.body);
    }
    React.useEffect(() => { load(); }, [projectId]);
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            // Resolve vendor field: if it's a non-UUID string (name), find or create vendor and use its id
            let vendorId = await resolveVendorId(body.vendorId, token);
            // If still not resolved but a name/string was provided, pass it through for backend to resolve
            const vendorField = vendorId || (body.vendorId?.trim() || undefined);
            if (!vendorField) {
                present({ message: 'Vendor is required.', color: 'warning', duration: 2000, position: 'top' });
                return;
            }
            await createMaterial({ projectId: projectId, ...body, vendorId: vendorField, token });
            present({ message: 'Material added', color: 'success', duration: 1400, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (e) {
            const msg = e?.message || e?.error || 'Create failed';
            present({ message: String(msg), color: 'danger', duration: 2200, position: 'top' });
        }
    }
    async function onUpdate(row, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateMaterial({ id: row.id, token }, body);
            present({ message: 'Material updated', color: 'success', duration: 1400, position: 'top' });
            setEditRow(null);
            load();
        }
        catch (_) {
            present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onDelete(row) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await deleteMaterial({ id: row.id, token });
            present({ message: 'Material deleted', color: 'success', duration: 1400, position: 'top' });
            load();
        }
        catch (_) {
            present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "lg:hidden space-y-1", children: [_jsx("div", { className: "text-base font-semibold", children: "Material Delivery" }), _jsx("div", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "Projects / Materials" })] }), _jsxs("div", { className: "hidden lg:block", children: [_jsx("div", { className: "text-lg font-semibold", children: "Material Delivery" }), _jsx("div", { className: "zynq-muted text-sm", children: "Projects > Material Delivery" })] }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/projects'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), projectLabel ? (_jsxs("div", { className: "inline-flex items-center px-3 py-1 mt-1 text-sm font-medium rounded bg-yellow-100 text-yellow-900", children: [_jsx("span", { className: "mr-1", children: "Project:" }), _jsx("span", { children: projectLabel })] })) : null, _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total" }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-2xl font-semibold", children: totalSum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }) })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [_jsx(CardTitle, { children: "Material Delivery" }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx(Button, { size: "sm", className: "text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2", onClick: () => setAddOpen(true), children: "Add Entry" }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".xlsx,.xls,.xlsm", className: "hidden", onChange: onPickExcel }), _jsx(Button, { size: "sm", variant: "secondary", className: "text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2", onClick: () => fileInputRef.current?.click(), children: "Import Excel" })] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3 text-sm", children: [_jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "From" }), _jsx(Input, { type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "To" }), _jsx(Input, { type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) })] }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("span", { className: "text-xs uppercase tracking-wide text-[color:var(--text-secondary)]", children: "Vendor" }), _jsxs("select", { className: "zynq-border border rounded px-3 py-2 bg-[color:var(--surface)]", value: vendorFilter, onChange: (e) => setVendorFilter(e.target.value), children: [_jsx("option", { value: "", children: "All Vendors" }), vendorOptions.map(v => (_jsx("option", { value: v.id, children: v.name }, v.id)))] })] })] }), _jsx(Table, { columns: columns, data: sortedRows, emptyText: "No materials" })] })] })] }) }), _jsx(AddMaterialModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate, vendors: vendorOptions }), _jsx(EditMaterialModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (b) => { if (editRow)
                    return onUpdate(editRow, b); } }), _jsx(PreviewImportModal, { open: previewOpen, rows: previewRows, onClose: () => setPreviewOpen(false), onConfirm: onConfirmImport, busy: importing })] }));
}
function AddMaterialModal({ open, onClose, onSubmit, vendors }) {
    const [invoiceDate, setInvoiceDate] = React.useState('');
    const [vendorId, setVendorId] = React.useState('');
    const [newVendor, setNewVendor] = React.useState('');
    const [vendorModeNew, setVendorModeNew] = React.useState(false);
    const [desc, setDesc] = React.useState('');
    const [qty, setQty] = React.useState(0);
    const [unit, setUnit] = React.useState(0);
    const [vat, setVat] = React.useState(0);
    const gross = React.useMemo(() => Math.max(0, (qty || 0) * (unit || 0)), [qty, unit]);
    const total = React.useMemo(() => Math.max(0, gross + (vat || 0)), [gross, vat]);
    const [submitting, setSubmitting] = React.useState(false);
    const canCreate = !!desc && qty > 0 && ((vendorModeNew ? newVendor.trim().length > 0 : vendorId.trim().length > 0));
    return (_jsx("div", { className: `fixed inset-0 ${open ? '' : 'hidden'} bg-black/50 flex items-center justify-center z-50`, children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(680px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: "Add Material" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Input, { label: "Invoice Date", type: "date", value: invoiceDate, onChange: (e) => setInvoiceDate(e.target.value) }), _jsxs("div", { className: "flex flex-col gap-1", children: [_jsx("label", { className: "text-xs opacity-75", children: "Vendor" }), _jsxs("select", { className: "zynq-border border rounded px-2 py-1 bg-transparent", value: vendorModeNew ? '__new__' : (vendorId || ''), onChange: (e) => {
                                        const val = e.target.value;
                                        if (val === '__new__') {
                                            setVendorModeNew(true);
                                            setVendorId('');
                                        }
                                        else {
                                            setVendorModeNew(false);
                                            setVendorId(val);
                                        }
                                    }, children: [_jsx("option", { value: "", children: "Select vendor\u2026" }), vendors.map(v => (_jsx("option", { value: v.id, children: v.name }, v.id))), _jsx("option", { value: "__new__", children: "Add new vendor\u2026" })] }), vendorModeNew && (_jsx(Input, { label: "New vendor name", value: newVendor, onChange: (e) => setNewVendor(e.target.value) }))] }), _jsx(Input, { label: "Description", value: desc, onChange: (e) => setDesc(e.target.value) }), _jsx(Input, { label: "Quantity", type: "number", value: String(qty), onChange: (e) => setQty(Number(e.target.value) || 0) }), _jsx(Input, { label: "Unit Price", type: "number", value: String(unit), onChange: (e) => setUnit(Number(e.target.value) || 0) }), _jsx(Input, { label: "Gross", type: "number", value: String(gross), onChange: () => { }, disabled: true }), _jsx(Input, { label: "VAT", type: "number", value: String(vat), onChange: (e) => setVat(Number(e.target.value) || 0) }), _jsx(Input, { label: "Total", type: "number", value: String(total), onChange: () => { }, disabled: true })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                const vendorField = vendorModeNew ? (newVendor.trim() || undefined) : (vendorId || undefined);
                                await onSubmit({ invoice_date: invoiceDate || undefined, vendorId: vendorField, item_description: desc, quantity: qty, unit_price: unit || undefined, vat: vat || undefined, total });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditMaterialModal({ row, onClose, onSubmit }) {
    const [invoiceDate, setInvoiceDate] = React.useState(row?.invoice_date ? row.invoice_date.substring(0, 10) : '');
    const [vendorId, setVendorId] = React.useState(row?.vendorId || '');
    const [desc, setDesc] = React.useState(row?.item_description || '');
    const [qty, setQty] = React.useState(row?.quantity || 0);
    const [unit, setUnit] = React.useState(row?.unit_price || 0);
    const [vat, setVat] = React.useState(row?.vat || 0);
    const [submitting, setSubmitting] = React.useState(false);
    const gross = React.useMemo(() => Math.max(0, (qty || 0) * (unit || 0)), [qty, unit]);
    React.useEffect(() => {
        setInvoiceDate(row?.invoice_date ? row.invoice_date.substring(0, 10) : '');
        setVendorId(row?.vendorId || '');
        setDesc(row?.item_description || '');
        setQty(row?.quantity || 0);
        setUnit(row?.unit_price || 0);
        setVat(row?.vat || 0);
    }, [row]);
    if (!row)
        return null;
    const canSave = !!desc && qty > 0;
    return (_jsx("div", { className: `fixed inset-0 ${row ? '' : 'hidden'} bg-black/50 flex items-center justify-center z-50`, children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(680px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: "Edit Material" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Input, { label: "Invoice Date", type: "date", value: invoiceDate, onChange: (e) => setInvoiceDate(e.target.value) }), _jsx(Input, { label: "Vendor", value: vendorId, onChange: (e) => setVendorId(e.target.value) }), _jsx(Input, { label: "Description", value: desc, onChange: (e) => setDesc(e.target.value) }), _jsx(Input, { label: "Quantity", type: "number", value: String(qty), onChange: (e) => setQty(Number(e.target.value) || 0) }), _jsx(Input, { label: "Unit Price", type: "number", value: String(unit), onChange: (e) => setUnit(Number(e.target.value) || 0) }), _jsx(Input, { label: "Gross", type: "number", value: String(gross), onChange: () => { }, disabled: true }), _jsx(Input, { label: "VAT", type: "number", value: String(vat), onChange: (e) => setVat(Number(e.target.value) || 0) }), _jsx(Input, { label: "Total", type: "number", value: String(gross + (vat || 0)), onChange: () => { }, disabled: true })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ invoice_date: invoiceDate || undefined, vendorId: vendorId || undefined, item_description: desc, quantity: qty, unit_price: unit || undefined, vat: vat || undefined, total: gross + (vat || 0) });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canSave || submitting, children: "Save" })] })] }) }));
}
