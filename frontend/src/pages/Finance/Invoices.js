import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, useIonToast, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import AdvancedTable from '../../ui/AdvancedTable';
import BulkImportModal from '../../ui/BulkImportModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { useQueryParam } from '../../hooks/useQueryParam';
import { useAuth } from '../../auth/AuthContext';
import { fetchInvoices, createInvoice, updateInvoice, deleteInvoice, exportInvoicesCsv, bulkCreateInvoices } from '../../api/financeService';
import { fetchDocumentCompanies } from '../../api/documentsService';
import { fetchProjects } from '../../api/projectsService';
import { fetchClients } from '../../api/clientsService';
import * as XLSX from 'xlsx';
import { chevronBackOutline } from 'ionicons/icons';
function DetailInvoiceModal({ row, projects, clients, onClose, currentUserToken }) {
    if (!row)
        return null;
    const projectName = projects.find(p => p.id === row.projectId)?.name || row.projectId;
    const clientName = clients.find(c => c.id === row.clientId)?.name || row.clientId;
    const subTotal = Number(row.subtotal || 0);
    const vat = Math.round(subTotal * 0.05 * 100) / 100;
    const total = Math.round((subTotal + vat) * 100) / 100;
    const invoiceNo = row.invoice_no || `INV-${(row.id || '').substring(0, 6).toUpperCase()}`;
    let enteredBy = 'User';
    try {
        const payload = JSON.parse(atob((currentUserToken || '').split('.')[1] || '')) || {};
        enteredBy = payload.name || payload.username || payload.email || enteredBy;
    }
    catch { }
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Invoice Details", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Date" }), _jsx("div", { className: "font-medium", children: new Date(row.invoice_date).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Invoice No" }), _jsx("div", { className: "font-medium", children: invoiceNo })] }), _jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Project" }), _jsx("div", { className: "font-medium", children: projectName })] }), _jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Client" }), _jsx("div", { className: "font-medium", children: clientName })] }), _jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Status" }), _jsx("div", { className: "font-medium", children: (() => { const v = String(row.status || '').toLowerCase(); return (v === 'paid' || v === 'received') ? 'Received' : 'Pending'; })() })] }), _jsxs("div", { children: [_jsx("div", { className: "zynq-muted text-xs", children: "Entered By" }), _jsx("div", { className: "font-medium", children: enteredBy })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { className: "text-right", children: [_jsx("div", { className: "zynq-muted text-xs", children: "Sub-Total" }), _jsx("div", { className: "font-semibold", children: subTotal.toLocaleString() })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "zynq-muted text-xs", children: "VAT (5%)" }), _jsx("div", { className: "font-semibold", children: vat.toLocaleString() })] }), _jsxs("div", { className: "text-right", children: [_jsx("div", { className: "zynq-muted text-xs", children: "Total" }), _jsx("div", { className: "font-semibold", children: total.toLocaleString() })] })] }), _jsx("div", { className: "flex justify-end", children: _jsx(Button, { variant: "secondary", onClick: onClose, children: "Back to Invoices" }) })] }) }));
}
export default function Invoices() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { accessToken, role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const [q, setQ] = useQueryParam('invQ', '');
    const [projectId, setProjectId] = useQueryParam('invProject', '');
    const [clientId, setClientId] = useQueryParam('invClient', '');
    const [status, setStatus] = useQueryParam('invStatus', 'All');
    const [dateFrom, setDateFrom] = useQueryParam('invFrom', '');
    const [dateTo, setDateTo] = useQueryParam('invTo', '');
    const [page, setPage] = useQueryParam('invPage', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [projects, setProjects] = React.useState([]);
    const [clients, setClients] = React.useState([]);
    const [sumLoading, setSumLoading] = React.useState(false);
    const [summary, setSummary] = React.useState({ subTotal: 0, vat: 0, total: 0, pendingAmount: 0 });
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [detailRow, setDetailRow] = React.useState(null);
    const [importing, setImporting] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewRows, setPreviewRows] = React.useState([]);
    const [sort, setSort] = React.useState(null);
    const [companies, setCompanies] = React.useState([]);
    const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
    const [selectedCompanyId, setSelectedCompanyId] = React.useState('');
    const [pendingImportRows, setPendingImportRows] = React.useState([]);
    const [companyFilter, setCompanyFilter] = React.useState('');
    const cols = [
        { key: 'company', header: 'Company', render: (r) => r.company || '', sortable: true },
        { key: 'invoice_date', header: 'Date', render: (r) => new Date(r.invoice_date).toLocaleDateString(), sortable: true },
        { key: 'invoice_no', header: 'Invoice No', render: (r) => r.invoice_no || `INV-${(r.id || '').substring(0, 6).toUpperCase()}` },
        { key: 'subject', header: 'Subject', render: (r) => r.subject || '' },
        { key: 'projectId', header: 'Project', render: (r) => (projects.find(p => p.id === r.projectId)?.name || r.projectId) },
        { key: 'clientId', header: 'Client', render: (r) => (clients.find(c => c.id === r.clientId)?.name || r.clientId) },
        { key: 'status', header: 'Status', render: (r) => {
                const v = (r.status || 'Pending').toLowerCase();
                const isReceived = v === 'received' || v === 'paid';
                const label = isReceived ? 'Received' : 'Pending';
                const cls = isReceived ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
                return _jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${cls}`, children: label });
            } },
        { key: 'subtotal', header: 'Sub-Total', render: (r) => _jsx("div", { className: "text-right", children: Number(r.subtotal || 0).toLocaleString() }) },
        { key: 'vat', header: 'VAT (5%)', render: (r) => _jsx("div", { className: "text-right", children: Number(r.vat || 0).toLocaleString() }) },
        { key: 'total', header: 'Total', render: (r) => _jsx("div", { className: "text-right", children: Number(r.total || 0).toLocaleString() }), sortable: true },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", onClick: (e) => e.stopPropagation(), children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), !isTeamLeader && (_jsx(Button, { size: "sm", variant: "secondary", onClick: () => onDelete(r), children: "Delete" }))] })) },
    ];
    React.useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const [ps, cs] = await Promise.all([
                    fetchProjects({ page: 1, pageSize: 200, token }),
                    fetchClients({ token })
                ]);
                setProjects(ps.data ?? []);
                setClients(cs ?? []);
            }
            catch {
                // ignore
            }
        })();
    }, []);
    React.useEffect(() => {
        (async () => {
            if (companies.length)
                return;
            const token = localStorage.getItem('token') || undefined;
            try {
                const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
                setCompanies(res.data || []);
            }
            catch {
                setCompanies([]);
            }
        })();
    }, [companies.length]);
    React.useEffect(() => {
        setPage(1); // reset to first page on filter/sort change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, clientId, status, dateFrom, dateTo, q, sort?.key, sort?.dir]);
    React.useEffect(() => { load(); }, [page, projectId, clientId, status, dateFrom, dateTo, q, sort?.key, sort?.dir]);
    React.useEffect(() => { loadSummary(); }, [projectId, clientId, status, dateFrom, dateTo, q]);
    const filteredRows = React.useMemo(() => {
        let data = rows;
        if (status === 'Pending' || status === 'Received') {
            data = data.filter((r) => {
                const v = (r.status || '').toLowerCase();
                const isReceived = v === 'received' || v === 'paid';
                return status === 'Received' ? isReceived : !isReceived;
            });
        }
        if (companyFilter) {
            data = data.filter((r) => r.company === companyFilter);
        }
        return data;
    }, [rows, status, companyFilter]);
    async function loadSummary() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setSumLoading(true);
            let p = 1;
            const ps = 100;
            let sub = 0; // Received only
            let vatSum = 0; // Received only
            let totalSum = 0; // Received only (subtotal + vat)
            let pending = 0; // Pending only (subtotal + vat)
            while (true) {
                const res = await fetchInvoices({
                    projectId: projectId || undefined,
                    clientId: clientId || undefined,
                    status: status || undefined,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                    search: q || undefined,
                    page: p,
                    pageSize: ps,
                    token,
                });
                const data = (res.rows ?? res.data ?? []);
                for (const inv of data) {
                    const s = Number(inv.subtotal || 0);
                    const v = Number(inv.vat != null ? inv.vat : Math.round(s * 0.05 * 100) / 100);
                    const st = String(inv.status || '').toLowerCase();
                    const isReceived = st === 'received' || st === 'paid';
                    const isPending = st === 'pending' || (!isReceived && st !== '');
                    if (isReceived) {
                        // Only Received contributes to Sub-Total, VAT, and Total (which is s + v)
                        sub += s;
                        vatSum += v;
                        totalSum += (s + v);
                    }
                    if (isPending) {
                        // Pending card shows combined Sub-Total + VAT for Pending only
                        pending += (s + v);
                    }
                }
                if (data.length < ps)
                    break;
                p += 1;
            }
            setSummary({
                subTotal: Math.round(sub * 100) / 100,
                vat: Math.round(vatSum * 100) / 100,
                total: Math.round(totalSum * 100) / 100,
                pendingAmount: Math.round(pending * 100) / 100,
            });
        }
        catch (e) {
            console.error('Invoices summary load error:', e);
            setSummary({ subTotal: 0, vat: 0, total: 0, pendingAmount: 0 });
        }
        finally {
            setSumLoading(false);
        }
    }
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchInvoices({ projectId: projectId || undefined, clientId: clientId || undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, sortKey: sort?.key, sortDir: sort?.dir, page, pageSize, token });
            const data = res.rows ?? res.data ?? [];
            const mapped = data.map((inv) => {
                const rawItems = inv.items_json;
                let items = {};
                if (rawItems) {
                    if (typeof rawItems === 'string') {
                        try {
                            items = JSON.parse(rawItems);
                        }
                        catch {
                            items = {};
                        }
                    }
                    else {
                        items = rawItems;
                    }
                }
                const company = typeof items?.company === 'string' ? items.company : undefined;
                const subject = typeof items?.subject === 'string' ? items.subject : undefined;
                return {
                    id: inv.id,
                    company,
                    subject,
                    invoice_date: inv.invoice_date,
                    invoice_no: inv.invoice_no,
                    due_date: inv.due_date,
                    projectId: inv.projectId,
                    clientId: inv.clientId,
                    subtotal: inv.subtotal,
                    vat: inv.vat,
                    total: inv.total,
                    status: inv.status,
                };
            });
            setRows(mapped);
            setTotal(res.total ?? mapped.length);
        }
        catch (e) {
            console.error('Invoices load error:', e);
            setRows([]);
            setTotal(0);
            const msg = e?.message || '';
            if (/HTTP\s(4|5)\d{2}/.test(msg)) {
                present({ message: 'Failed to load invoices', color: 'danger', duration: 1800, position: 'top' });
            }
        }
        finally {
            setLoading(false);
        }
    }
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            const items_json = typeof body.items_json === 'string' ? body.items_json : JSON.stringify(body.items_json || {});
            await createInvoice({ token }, { ...body, items_json });
            present({ message: 'Invoice created', color: 'success', duration: 1400, position: 'top' });
            setAddOpen(false);
            load();
            loadSummary();
        }
        catch (e) {
            const msg = e?.message || '';
            const pretty = /HTTP\s\d+\:\s*(.*)/.exec(msg)?.[1] || msg || 'Create failed';
            present({ message: pretty, color: 'danger', duration: 2200, position: 'top' });
        }
    }
    async function onUpdate(row, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            const normalized = { ...body };
            if (Object.prototype.hasOwnProperty.call(body, 'items_json')) {
                const v = body.items_json;
                normalized.items_json = typeof v === 'string' ? v : (v == null ? undefined : JSON.stringify(v));
            }
            await updateInvoice({ id: row.id, token }, normalized);
            present({ message: 'Invoice updated', color: 'success', duration: 1400, position: 'top' });
            setEditRow(null);
            setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, ...normalized } : r));
            loadSummary();
        }
        catch (e) {
            const msg = e?.message || '';
            const pretty = /HTTP\s\d+\:\s*(.*)/.exec(msg)?.[1] || msg || 'Update failed';
            present({ message: pretty, color: 'danger', duration: 2200, position: 'top' });
        }
    }
    async function onDelete(row) {
        const token = localStorage.getItem('token') || undefined;
        try {
            const ok = window.confirm('Are you sure you want to delete this invoice?');
            if (!ok)
                return;
            await deleteInvoice({ id: row.id, token });
            present({ message: 'Invoice deleted', color: 'success', duration: 1400, position: 'top' });
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            setTotal((t) => Math.max(0, t - 1));
            loadSummary();
        }
        catch {
            present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onExportCsv() {
        const token = localStorage.getItem('token') || undefined;
        try {
            const csv = await exportInvoicesCsv({ projectId: projectId || undefined, clientId: clientId || undefined, status: status || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, token });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'invoices.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
        catch {
            present({ message: 'Export failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    function onPickExcel() { if (fileInputRef.current)
        fileInputRef.current.click(); }
    async function onFileChange(e) {
        const file = e.target.files?.[0];
        if (!file)
            return;
        try {
            setImporting(true);
            const buf = await file.arrayBuffer();
            const wb = XLSX.read(buf, { type: 'array' });
            const firstSheetName = (wb.SheetNames && wb.SheetNames.length > 0) ? wb.SheetNames[0] : undefined;
            if (!firstSheetName)
                throw new Error('No sheets found');
            const ws = wb.Sheets[firstSheetName];
            if (!ws)
                throw new Error('Worksheet not found');
            const json = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '' });
            const normalized = json.map((r, idx) => {
                // Align expected Excel headers with Add Invoice form fields
                // Preferred headers: Invoice Date, Invoice No, Subject, Company, Project, Client, Subtotal, VAT, Total, Status
                const invoice_date = r.invoice_date ||
                    r["Invoice Date"] ||
                    r.date ||
                    r.Date ||
                    '';
                const invoice_no = r.invoice_no || r["Invoice No"] || r.invoiceNo || '';
                const subject = r.subject || r.Subject || '';
                const companyName = r.company || r.Company || '';
                const project = r.projectId || r["Project ID"] || r.project || r.Project || '';
                const client = r.clientId || r["Client ID"] || r.client || r.Client || '';
                const subtotal = Number(r.subtotal || r.Subtotal || r["Subtotal"] || 0);
                const vat = Number(r.vat || r.VAT || r["VAT"] || 0);
                const total = Number(r.total || r.Total || r["Total"] || (subtotal + vat));
                const status = r.status || r.Status || r["Status"] || 'Pending';
                // Build items_json similar to Add Invoice (company + subject + any existing JSON)
                let items = {};
                const rawItems = r.items_json || r.items || r.Items || '';
                if (typeof rawItems === 'string' && rawItems.trim()) {
                    try {
                        items = JSON.parse(rawItems);
                    }
                    catch {
                        items = {};
                    }
                }
                else if (rawItems && typeof rawItems === 'object') {
                    items = rawItems;
                }
                if (companyName)
                    items.company = companyName;
                if (subject)
                    items.subject = subject;
                const row = {
                    projectId: String(project),
                    clientId: String(client),
                    invoice_date,
                    due_date: undefined,
                    invoice_no: invoice_no || undefined,
                    items_json: items,
                    subtotal,
                    vat,
                    total,
                    status,
                };
                const errs = [];
                if (!row.projectId)
                    errs.push('projectId');
                if (!row.clientId)
                    errs.push('clientId');
                if (!invoice_date)
                    errs.push('invoice_date');
                if (!(total > 0))
                    errs.push('total');
                return { ...row, _row: idx + 2, _err: errs.length ? `Missing/invalid: ${errs.join(', ')}` : undefined };
            });
            setPreviewRows(normalized);
            setPreviewOpen(true);
        }
        catch {
            present({ message: 'Failed to parse Excel', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setImporting(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    }
    function onConfirmImport(valid) {
        const cleaned = (valid || []).filter((r) => !r._err);
        if (!cleaned.length) {
            present({ message: 'No valid rows to import', color: 'warning', duration: 1600, position: 'top' });
            return;
        }
        setPendingImportRows(cleaned);
        setSelectedCompanyId('');
        setCompanyModalOpen(true);
    }
    async function onConfirmImportWithCompany() {
        const token = localStorage.getItem('token') || undefined;
        if (!pendingImportRows.length) {
            setCompanyModalOpen(false);
            return;
        }
        if (!selectedCompanyId) {
            present({ message: 'Please select a company', color: 'warning', duration: 1600, position: 'top' });
            return;
        }
        const company = companies.find((c) => c.id === selectedCompanyId);
        const companyName = company?.name || '';
        try {
            setImporting(true);
            const payload = pendingImportRows.map((r) => {
                let items = {};
                if (r.items_json) {
                    if (typeof r.items_json === 'string') {
                        try {
                            items = JSON.parse(r.items_json);
                        }
                        catch {
                            items = {};
                        }
                    }
                    else {
                        items = r.items_json;
                    }
                }
                items = { ...items, company: companyName };
                return {
                    projectId: r.projectId,
                    clientId: r.clientId,
                    invoice_date: r.invoice_date,
                    due_date: r.due_date,
                    items_json: items,
                    subtotal: r.subtotal,
                    vat: r.vat,
                    total: r.total,
                    status: r.status,
                    token,
                };
            });
            await bulkCreateInvoices(payload);
            present({ message: `Imported ${pendingImportRows.length} rows`, color: 'success', duration: 1600, position: 'top' });
            setCompanyModalOpen(false);
            setPreviewOpen(false);
            setPendingImportRows([]);
            setPreviewRows([]);
            load();
            loadSummary();
        }
        catch {
            present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setImporting(false);
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Finance / Invoices" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Finance > Invoices" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Invoices" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: onExportCsv, children: "Export CSV" }), _jsx(Button, { size: "sm", onClick: () => setAddOpen(true), children: "Add Invoice" })] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 mb-4", children: [_jsxs("div", { className: "border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Sub-Total" }), _jsx("div", { className: "text-xl font-semibold", children: sumLoading ? '…' : summary.subTotal.toLocaleString() })] }), _jsxs("div", { className: "border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20", children: [_jsx("div", { className: "text-xs zynq-muted", children: "VAT (5%)" }), _jsx("div", { className: "text-xl font-semibold", children: sumLoading ? '…' : summary.vat.toLocaleString() })] }), _jsxs("div", { className: "border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Total" }), _jsx("div", { className: "text-xl font-semibold text-green-600 dark:text-green-400", children: sumLoading ? '…' : summary.total.toLocaleString() })] }), _jsxs("div", { className: "border border-[color:var(--border)] rounded-md p-3 bg-[color:var(--muted)]/20", children: [_jsx("div", { className: "text-xs zynq-muted", children: "Pending Amount" }), _jsx("div", { className: "text-xl font-semibold text-red-600 dark:text-red-400", children: sumLoading ? '…' : summary.pendingAmount.toLocaleString() })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-3 mb-3", children: [_jsx(Input, { label: "Search", placeholder: "Items or status", value: q, onChange: (e) => setQ(e.target.value) }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), projects.map(p => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsxs(Select, { label: "Client", value: clientId, onChange: (e) => setClientId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), clients.map(c => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsxs(Select, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Received", children: "Received" })] }), _jsx(Input, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }), _jsxs(Select, { label: "Company", value: companyFilter, onChange: (e) => setCompanyFilter(e.target.value), children: [_jsx("option", { value: "", children: "All companies" }), companies.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.id)))] })] }), _jsx("div", { className: "flex justify-between items-center mb-2 text-sm", children: _jsxs("div", { className: "zynq-muted", children: ["Showing ", rows.length, " of ", total, " records"] }) }), _jsx(AdvancedTable, { columns: cols, data: filteredRows, loading: loading, page: page, pageSize: pageSize, total: total, sort: sort, onSortChange: (s) => setSort(s), onPageChange: (p) => setPage(p), stickyHeader: true, emptyText: "No invoices", onRowClick: (r) => setDetailRow(r) })] })] })] }) }), _jsx(AddInvoiceModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate, projects: projects, clients: clients, companies: companies }), editRow ? (_jsx(EditInvoiceModal, { row: editRow, companies: companies, clients: clients, onClose: () => setEditRow(null), onSubmit: (body) => onUpdate(editRow, body) })) : null, _jsx(DetailInvoiceModal, { row: detailRow, projects: projects, clients: clients, onClose: () => setDetailRow(null), currentUserToken: accessToken || '' }), _jsx(BulkImportModal, { open: previewOpen, onClose: () => setPreviewOpen(false), fields: [
                    { key: 'invoice_date', label: 'Invoice Date', required: true },
                    { key: 'invoice_no', label: 'Invoice No' },
                    { key: 'subject', label: 'Subject' },
                    { key: 'company', label: 'Company' },
                    { key: 'project', label: 'Project' },
                    { key: 'client', label: 'Client' },
                    { key: 'subtotal', label: 'Subtotal', required: true },
                    { key: 'vat', label: 'VAT (5%)' },
                    { key: 'total', label: 'Total', required: true },
                    { key: 'status', label: 'Status' },
                ], onValidate: (r) => {
                    const errs = [];
                    if (!r.invoice_date)
                        errs.push('invoice_date');
                    if (!r.projectId)
                        errs.push('projectId');
                    if (!r.clientId)
                        errs.push('clientId');
                    if (!(Number(r.total) > 0))
                        errs.push('total');
                    return errs.length ? errs.join(', ') : undefined;
                }, onConfirm: onConfirmImport, templateHint: "Expected columns: Invoice Date, Invoice No, Subject, Company, Project ID, Client ID, Subtotal, VAT, Total, Status" }), _jsx(Modal, { open: companyModalOpen, onClose: () => setCompanyModalOpen(false), title: "Select Company", footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setCompanyModalOpen(false), children: "Cancel" }), _jsx(Button, { onClick: onConfirmImportWithCompany, disabled: !selectedCompanyId, children: "Import" })] })), children: _jsx("div", { className: "space-y-3", children: _jsxs(Select, { label: "Company", value: selectedCompanyId, onChange: (e) => setSelectedCompanyId(e.target.value), children: [_jsx("option", { value: "", children: "Select company" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }) }) })] }));
}
function AddInvoiceModal({ open, onClose, onSubmit, projects, clients, companies }) {
    const [invoiceDate, setInvoiceDate] = React.useState('');
    const [invoiceNo, setInvoiceNo] = React.useState('');
    const [dueDate, setDueDate] = React.useState('');
    const [subject, setSubject] = React.useState('');
    const [projectId, setProjectId] = React.useState('');
    const [clientId, setClientId] = React.useState('');
    const [subtotal, setSubtotal] = React.useState(0);
    const [vat, setVat] = React.useState(0);
    const total = React.useMemo(() => {
        const sub = subtotal || 0;
        const v = vat || 0;
        return Math.max(0, sub + v);
    }, [subtotal, vat]);
    const [status, setStatus] = React.useState('Pending');
    const [itemsJson, setItemsJson] = React.useState('');
    const [companyId, setCompanyId] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const [localProjects, setLocalProjects] = React.useState(projects);
    const [allClients, setAllClients] = React.useState(clients);
    const [localClients, setLocalClients] = React.useState(clients);
    React.useEffect(() => { if (!open) {
        setInvoiceDate('');
        setInvoiceNo('');
        setDueDate('');
        setSubject('');
        setProjectId('');
        setClientId('');
        setSubtotal(0);
        setVat(0);
        setStatus('Pending');
        setItemsJson('');
        setCompanyId('');
    } }, [open]);
    // When subtotal changes (user edits Subtotal), keep VAT at 5% and recompute Total via memo
    React.useEffect(() => {
        if (!subtotal) {
            setVat(0);
            return;
        }
        const v = Math.round(subtotal * 0.05 * 100) / 100;
        setVat(v);
    }, [subtotal]);
    React.useEffect(() => {
        if (!open)
            return;
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const ps = await fetchProjects({ page: 1, pageSize: 500, companyId: companyId || undefined, token });
                setLocalProjects(ps.data ?? []);
            }
            catch {
                setLocalProjects(projects);
            }
            try {
                const cs = await fetchClients({ token });
                setAllClients(cs ?? clients);
            }
            catch {
                setAllClients(clients);
            }
        })();
    }, [open, projects, companyId, clients]);
    // For Edit: keep existing project/client when opening.
    // If the user later changes company manually, they can adjust Project/Client themselves.
    // Derive clients belonging to projects under the selected company
    React.useEffect(() => {
        if (!companyId) {
            setLocalClients([]);
            return;
        }
        // If a project is selected, restrict clients to that project's client only
        const selectedProject = projectId
            ? localProjects.find((p) => p.id === projectId)
            : undefined;
        if (selectedProject?.clientId) {
            const client = allClients.find((c) => c.id === selectedProject.clientId);
            setLocalClients(client ? [client] : []);
            return;
        }
        // Otherwise, show all clients belonging to projects under the selected company
        const clientIds = new Set();
        for (const p of localProjects) {
            if (p.clientId)
                clientIds.add(p.clientId);
        }
        const filtered = allClients.filter((c) => clientIds.has(c.id));
        setLocalClients(filtered);
    }, [companyId, projectId, localProjects, allClients]);
    // When project changes, automatically enforce the matching client
    React.useEffect(() => {
        if (!projectId)
            return;
        const proj = localProjects.find((p) => p.id === projectId);
        if (proj?.clientId) {
            setClientId(proj.clientId);
        }
    }, [projectId, localProjects]);
    const labelFor = React.useCallback((p) => {
        const parent = p.parentId ? localProjects.find(x => x.id === p.parentId) : undefined;
        return parent ? `${parent.name} / ${p.name}` : p.name;
    }, [localProjects]);
    const canCreate = !!invoiceDate && !!invoiceNo && !!projectId && !!clientId && !!companyId && !!subject && total > 0;
    const invoiceDateError = !invoiceDate ? 'Required' : '';
    const invoiceNoError = !invoiceNo ? 'Required' : '';
    const subjectError = !subject ? 'Required' : '';
    const companyError = !companyId ? 'Required' : '';
    const projectError = !projectId ? 'Required' : '';
    const clientError = !clientId ? 'Required' : '';
    const totalError = !(total > 0) ? 'Required' : '';
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Add Invoice", children: _jsxs("div", { className: "space-y-3 max-h-[70vh] overflow-y-auto pr-2", children: [_jsx(Input, { label: "Invoice Date", type: "date", value: invoiceDate, onChange: (e) => setInvoiceDate(e.target.value), error: invoiceDateError }), _jsx(Input, { label: "Invoice No", placeholder: "INV-001", value: invoiceNo, onChange: (e) => setInvoiceNo(e.target.value), error: invoiceNoError }), _jsx(Input, { label: "Subject", value: subject, onChange: (e) => setSubject(e.target.value), error: subjectError }), _jsxs(Select, { label: "Company", value: companyId, onChange: (e) => setCompanyId(e.target.value), error: companyError, children: [_jsx("option", { value: "", children: "(Select)" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), error: projectError, disabled: !companyId || submitting || !localProjects.length, children: [_jsx("option", { value: "", children: "(Select)" }), localProjects.map(p => (_jsx("option", { value: p.id, children: labelFor(p) }, p.id)))] }), _jsxs(Select, { label: "Client", value: clientId, onChange: (e) => setClientId(e.target.value), error: clientError, disabled: !companyId || submitting || !localClients.length, children: [_jsx("option", { value: "", children: "(Select)" }), localClients.map(c => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsx(Input, { label: "Subtotal", type: "number", value: String(subtotal), onChange: (e) => {
                        const v = Number(e.target.value) || 0;
                        setSubtotal(v);
                    } }), _jsx(Input, { label: "VAT (5%)", type: "number", value: String(vat), onChange: () => { }, disabled: true }), _jsx(Input, { label: "Total", type: "number", value: String(total), onChange: (e) => {
                        const newTotal = Number(e.target.value) || 0;
                        if (!newTotal) {
                            setSubtotal(0);
                            setVat(0);
                            return;
                        }
                        const newSubtotal = Math.round((newTotal / 1.05) * 100) / 100;
                        const newVat = Math.max(0, Math.round((newTotal - newSubtotal) * 100) / 100);
                        setSubtotal(newSubtotal);
                        setVat(newVat);
                    }, error: totalError }), _jsxs(Select, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Received", children: "Received" })] }), _jsx(Input, { label: "Items JSON (optional)", value: itemsJson, onChange: (e) => setItemsJson(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => {
                                setSubmitting(true);
                                try {
                                    const raw = itemsJson ? JSON.parse(itemsJson) : {};
                                    const company = companies.find((c) => c.id === companyId)?.name || '';
                                    const items = { ...raw, company, subject: subject || undefined };
                                    await onSubmit({ projectId, clientId, invoice_no: invoiceNo || undefined, invoice_date: invoiceDate, due_date: dueDate || undefined, items_json: items, subtotal, vat, total, status });
                                }
                                catch {
                                    window.alert('Invalid items JSON');
                                }
                                finally {
                                    setSubmitting(false);
                                }
                            }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditInvoiceModal({ row, companies, clients, onClose, onSubmit }) {
    const normDate = (d) => {
        if (!d)
            return '';
        try {
            return new Date(d).toISOString().slice(0, 10);
        }
        catch {
            return '';
        }
    };
    const initialInvoiceNo = React.useMemo(() => {
        if (!row)
            return '';
        if (row.invoice_no && row.invoice_no.trim())
            return row.invoice_no;
        const id = row.id || '';
        return id ? `INV-${id.substring(0, 6).toUpperCase()}` : '';
    }, [row]);
    const [invoiceDate, setInvoiceDate] = React.useState(normDate(row?.invoice_date));
    const [invoiceNo, setInvoiceNo] = React.useState(initialInvoiceNo);
    const [dueDate, setDueDate] = React.useState(normDate(row?.due_date));
    const [subtotal, setSubtotal] = React.useState(row?.subtotal || 0);
    const [vat, setVat] = React.useState(row?.vat || 0);
    const total = React.useMemo(() => Math.max(0, (subtotal || 0) + (vat || 0)), [subtotal, vat]);
    const [status, setStatus] = React.useState((String(row?.status).toLowerCase() === 'paid' || String(row?.status).toLowerCase() === 'received') ? 'Received' : 'Pending');
    const [itemsJson, setItemsJson] = React.useState('');
    const [projectId, setProjectId] = React.useState(row?.projectId || '');
    const [clientId, setClientId] = React.useState(row?.clientId || '');
    const [subject, setSubject] = React.useState(row?.subject || '');
    const [companyId, setCompanyId] = React.useState(() => {
        const initial = companies.find((c) => c.name === (row?.company || ''));
        return initial?.id || '';
    });
    const [localProjects, setLocalProjects] = React.useState([]);
    const [allClients, setAllClients] = React.useState(clients);
    const [localClients, setLocalClients] = React.useState([]);
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => {
        setInvoiceDate(normDate(row?.invoice_date));
        setInvoiceNo(initialInvoiceNo);
        setDueDate(normDate(row?.due_date));
        setSubtotal(row?.subtotal || 0);
        setVat(row?.vat || 0);
        setStatus((String(row?.status).toLowerCase() === 'paid' || String(row?.status).toLowerCase() === 'received') ? 'Received' : 'Pending');
        setItemsJson('');
        setProjectId(row?.projectId || '');
        setClientId(row?.clientId || '');
        const initial = companies.find((c) => c.name === (row?.company || ''));
        setCompanyId(initial?.id || '');
    }, [row, companies, initialInvoiceNo]);
    React.useEffect(() => {
        if (!row)
            return;
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const ps = await fetchProjects({ page: 1, pageSize: 500, companyId: companyId || undefined, token });
                setLocalProjects(ps.data ?? []);
            }
            catch {
                setLocalProjects([]);
            }
            try {
                const cs = await fetchClients({ token });
                setAllClients(cs ?? clients);
            }
            catch {
                setAllClients(clients);
            }
        })();
    }, [row, companyId, clients]);
    // Derive clients belonging to projects under the selected company
    React.useEffect(() => {
        if (!companyId) {
            setLocalClients([]);
            return;
        }
        const clientIds = new Set();
        for (const p of localProjects) {
            if (p.clientId)
                clientIds.add(p.clientId);
        }
        const filtered = allClients.filter((c) => clientIds.has(c.id));
        setLocalClients(filtered);
    }, [companyId, localProjects, allClients]);
    React.useEffect(() => { setVat(Math.round((subtotal * 0.05) * 100) / 100); }, [subtotal]);
    if (!row)
        return null;
    const labelFor = React.useCallback((p) => {
        const parent = p.parentId ? localProjects.find(x => x.id === p.parentId) : undefined;
        return parent ? `${parent.name} / ${p.name}` : p.name;
    }, [localProjects]);
    const canSave = !!invoiceDate && !!invoiceNo && !!subject && !!companyId && !!projectId && !!clientId && total > 0;
    const invoiceDateError = !invoiceDate ? 'Required' : '';
    const invoiceNoError = !invoiceNo ? 'Required' : '';
    const subjectError = !subject ? 'Required' : '';
    const companyError = !companyId ? 'Required' : '';
    const projectError = !projectId ? 'Required' : '';
    const clientError = !clientId ? 'Required' : '';
    const totalError = !(total > 0) ? 'Required' : '';
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Invoice", children: _jsxs("div", { className: "space-y-3 max-h-[70vh] overflow-y-auto pr-2", children: [_jsx(Input, { label: "Invoice Date", type: "date", value: invoiceDate, onChange: (e) => setInvoiceDate(e.target.value), error: invoiceDateError }), _jsx(Input, { label: "Invoice No", placeholder: "INV-001", value: invoiceNo, onChange: (e) => setInvoiceNo(e.target.value), error: invoiceNoError }), _jsx(Input, { label: "Due Date", type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value) }), _jsx(Input, { label: "Subject", value: subject, onChange: (e) => setSubject(e.target.value), error: subjectError }), _jsxs(Select, { label: "Company", value: companyId, onChange: (e) => setCompanyId(e.target.value), error: companyError, children: [_jsx("option", { value: "", children: "(Select)" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), error: projectError, disabled: !companyId || submitting || !localProjects.length, children: [_jsx("option", { value: "", children: "(Select)" }), localProjects.map(p => (_jsx("option", { value: p.id, children: labelFor(p) }, p.id)))] }), _jsxs(Select, { label: "Client", value: clientId, onChange: (e) => setClientId(e.target.value), error: clientError, disabled: !companyId || submitting || !localClients.length, children: [_jsx("option", { value: "", children: "(Select)" }), localClients.map(c => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsx(Input, { label: "Subtotal", type: "number", value: String(subtotal), onChange: (e) => setSubtotal(Number(e.target.value) || 0) }), _jsx(Input, { label: "VAT (5%)", type: "number", value: String(vat), onChange: () => { }, disabled: true }), _jsx(Input, { label: "Total", type: "number", value: String(total), onChange: () => { }, disabled: true, error: totalError }), _jsxs(Select, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Received", children: "Received" })] }), _jsx(Input, { label: "Items JSON (optional)", value: itemsJson, onChange: (e) => setItemsJson(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => {
                                setSubmitting(true);
                                try {
                                    const raw = itemsJson ? JSON.parse(itemsJson) : {};
                                    const companyName = companies.find((c) => c.id === companyId)?.name || '';
                                    const items = { ...raw, company: companyName, subject: subject || undefined };
                                    await onSubmit({ projectId, invoice_no: invoiceNo || undefined, invoice_date: invoiceDate, due_date: dueDate || undefined, items_json: items, subtotal, vat, total, status });
                                }
                                catch {
                                    window.alert('Invalid items JSON');
                                }
                                finally {
                                    setSubmitting(false);
                                }
                            }, disabled: !canSave || submitting, children: "Save" })] })] }) }));
}
