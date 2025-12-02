import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, useIonToast } from '@ionic/react';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import AdvancedTable from '../../ui/AdvancedTable';
import BulkImportModal from '../../ui/BulkImportModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchPayments, createPayment, updatePayment, deletePayment, exportPaymentsCsv, bulkCreatePayments, getPaymentsTotal } from '../../api/financeService';
import { fetchProjects } from '../../api/projectsService';
import * as XLSX from 'xlsx';
export default function Payments() {
    const [present] = useIonToast();
    const [q, setQ] = useQueryParam('payQ', '');
    const [projectId, setProjectId] = useQueryParam('payProject', '');
    const [method, setMethod] = useQueryParam('payMethod', '');
    const [dateFrom, setDateFrom] = useQueryParam('payFrom', '');
    const [dateTo, setDateTo] = useQueryParam('payTo', '');
    const [page, setPage] = useQueryParam('payPage', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [projects, setProjects] = React.useState([]);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [importing, setImporting] = React.useState(false);
    const fileInputRef = React.useRef(null);
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [previewRows, setPreviewRows] = React.useState([]);
    const [sort, setSort] = React.useState(null);
    const pageTotal = React.useMemo(() => rows.reduce((acc, r) => acc + (r.amount || 0), 0), [rows]);
    const [filteredTotal, setFilteredTotal] = React.useState(0);
    const advCols = [
        { key: 'payment_date', header: 'Date', sortable: true, render: (r) => new Date(r.payment_date).toLocaleDateString() },
        { key: 'method', header: 'Method', sortable: true, render: (r) => r.method || '—' },
        { key: 'amount', header: 'Amount', sortable: true, render: (r) => r.amount.toLocaleString() },
        { key: 'reference', header: 'Reference', render: (r) => r.reference || '—' },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onDelete(r), children: "Delete" })] })) },
    ];
    React.useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const ps = await fetchProjects({ page: 1, pageSize: 200, token });
                setProjects(ps.data ?? []);
            }
            catch {
                // ignore
            }
        })();
    }, []);
    React.useEffect(() => {
        setPage(1); // reset to first page on filter change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, method, dateFrom, dateTo, q, sort?.key, sort?.dir]);
    React.useEffect(() => { load(); }, [page, projectId, method, dateFrom, dateTo, q]);
    React.useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const res = await getPaymentsTotal({ projectId: projectId || undefined, method: method || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, token });
                setFilteredTotal(res.totalAmount || 0);
            }
            catch {
                setFilteredTotal(0);
            }
        })();
    }, [projectId, method, dateFrom, dateTo, q]);
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchPayments({ projectId: projectId || undefined, method: method || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, sortKey: sort?.key, sortDir: sort?.dir, page, pageSize, token });
            const data = res.rows ?? res.data ?? [];
            const mapped = data.map((p) => ({ id: p.id, payment_date: p.payment_date, amount: p.amount, method: p.method || null, reference: p.reference || null, projectId: p.projectId || null, invoiceId: p.invoiceId || null, expenseId: p.expenseId || null }));
            setRows(mapped);
            setTotal(res.total ?? mapped.length);
        }
        catch (e) {
            console.error('Payments load error:', e);
            setRows([]);
            setTotal(0);
            const msg = e?.message || '';
            if (/HTTP\s(4|5)\d{2}/.test(msg)) {
                present({ message: 'Failed to load payments', color: 'danger', duration: 1800, position: 'top' });
            }
        }
        finally {
            setLoading(false);
        }
    }
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await createPayment({ ...body, token });
            present({ message: 'Payment created', color: 'success', duration: 1400, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch {
            present({ message: 'Create failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onUpdate(row, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await updatePayment({ id: row.id, token }, body);
            present({ message: 'Payment updated', color: 'success', duration: 1400, position: 'top' });
            setEditRow(null);
            load();
        }
        catch {
            present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onDelete(row) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await deletePayment({ id: row.id, token });
            present({ message: 'Payment deleted', color: 'success', duration: 1400, position: 'top' });
            load();
        }
        catch {
            present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onExportCsv() {
        const token = localStorage.getItem('token') || undefined;
        try {
            const csv = await exportPaymentsCsv({ projectId: projectId || undefined, method: method || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, token });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'payments.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
        catch {
            present({ message: 'Export failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    function onPickExcel() { setPreviewOpen(true); }
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
                const payment_date = r.payment_date || r.date || r.Date || '';
                const amount = Number(r.amount || r.Amount || 0);
                const method = r.method || r.Method || '';
                const reference = r.reference || r.Reference || '';
                const project = r.projectId || r.project || r.Project || '';
                const invoice = r.invoiceId || r.invoice || r.Invoice || '';
                const expense = r.expenseId || r.expense || r.Expense || '';
                const row = { payment_date, amount, method: method || undefined, reference: reference || undefined };
                if (project)
                    row.projectId = String(project);
                if (invoice)
                    row.invoiceId = String(invoice);
                if (expense)
                    row.expenseId = String(expense);
                const errs = [];
                if (!payment_date)
                    errs.push('payment_date');
                if (!(amount > 0))
                    errs.push('amount');
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
    async function onConfirmImport() {
        const token = localStorage.getItem('token') || undefined;
        const valid = previewRows.filter(r => !r._err);
        if (valid.length === 0) {
            present({ message: 'No valid rows to import', color: 'warning', duration: 1600, position: 'top' });
            return;
        }
        try {
            setImporting(true);
            await bulkCreatePayments(valid.map(r => ({ ...r, token })));
            present({ message: `Imported ${valid.length} rows`, color: 'success', duration: 1600, position: 'top' });
            setPreviewOpen(false);
            setPreviewRows([]);
            load();
        }
        catch {
            present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setImporting(false);
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Payments" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Payments" }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Payments" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: onPickExcel, disabled: importing, children: "Import Excel" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: onExportCsv, children: "Export CSV" }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".xlsx,.xls", className: "hidden", onChange: onFileChange }), _jsx(Button, { size: "sm", onClick: () => setAddOpen(true), children: "Add Payment" })] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3 mb-3", children: [_jsx(Input, { label: "Search", placeholder: "Reference or method", value: q, onChange: (e) => setQ(e.target.value) }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), projects.map(p => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsxs(Select, { label: "Method", value: method, onChange: (e) => setMethod(e.target.value), children: [_jsx("option", { value: "", children: "All" }), _jsx("option", { value: "Cash", children: "Cash" }), _jsx("option", { value: "Bank Transfer", children: "Bank Transfer" }), _jsx("option", { value: "Cheque", children: "Cheque" }), _jsx("option", { value: "Other", children: "Other" })] }), _jsx(Input, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) })] }), _jsxs("div", { className: "flex justify-between items-center mb-2 text-sm", children: [_jsxs("div", { className: "zynq-muted", children: ["Showing ", rows.length, " of ", total, " records"] }), _jsxs("div", { className: "flex gap-4 items-center", children: [_jsxs("div", { children: ["Page Total: ", _jsx("span", { className: "font-semibold", children: pageTotal.toLocaleString() })] }), _jsxs("div", { children: ["Filtered Total: ", _jsx("span", { className: "font-semibold", children: filteredTotal.toLocaleString() })] })] })] }), _jsx(AdvancedTable, { columns: advCols, data: rows, loading: loading, page: page, pageSize: pageSize, total: total, sort: sort, onSortChange: (s) => setSort(s), onPageChange: (p) => setPage(p), stickyHeader: true, emptyText: "No payments" })] })] })] }), _jsx(AddPaymentModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate, projects: projects }), _jsx(EditPaymentModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (body) => onUpdate(editRow, body) }), _jsx(BulkImportModal, { open: previewOpen, onClose: () => setPreviewOpen(false), fields: [
                    { key: 'payment_date', label: 'Payment Date', required: true },
                    { key: 'amount', label: 'Amount', required: true },
                    { key: 'method', label: 'Method' },
                    { key: 'reference', label: 'Reference' },
                    { key: 'projectId', label: 'Project ID' },
                    { key: 'invoiceId', label: 'Invoice ID' },
                    { key: 'expenseId', label: 'Expense ID' },
                ], onValidate: (r) => {
                    const errs = [];
                    if (!r.payment_date)
                        errs.push('payment_date');
                    if (!(Number(r.amount) > 0))
                        errs.push('amount');
                    return errs.length ? errs.join(', ') : undefined;
                }, onConfirm: async (valid) => {
                    const token = localStorage.getItem('token') || undefined;
                    await bulkCreatePayments(valid.map(v => ({ ...v, token })));
                    present({ message: `Imported ${valid.length} rows`, color: 'success', duration: 1600, position: 'top' });
                    load();
                }, templateHint: "Expected columns: payment_date, amount, method, reference, projectId, invoiceId, expenseId" })] }));
}
function AddPaymentModal({ open, onClose, onSubmit, projects }) {
    const [paymentDate, setPaymentDate] = React.useState('');
    const [amount, setAmount] = React.useState(0);
    const [method, setMethod] = React.useState('Cash');
    const [reference, setReference] = React.useState('');
    const [projectId, setProjectId] = React.useState('');
    const [invoiceId, setInvoiceId] = React.useState('');
    const [expenseId, setExpenseId] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { if (!open) {
        setPaymentDate('');
        setAmount(0);
        setMethod('Cash');
        setReference('');
        setProjectId('');
        setInvoiceId('');
        setExpenseId('');
    } }, [open]);
    const canCreate = !!paymentDate && amount > 0;
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Add Payment", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Date", type: "date", value: paymentDate, onChange: (e) => setPaymentDate(e.target.value) }), _jsx(Input, { label: "Amount", type: "number", value: String(amount), onChange: (e) => setAmount(Number(e.target.value) || 0) }), _jsxs(Select, { label: "Method", value: method, onChange: (e) => setMethod(e.target.value), children: [_jsx("option", { value: "Cash", children: "Cash" }), _jsx("option", { value: "Bank Transfer", children: "Bank Transfer" }), _jsx("option", { value: "Cheque", children: "Cheque" }), _jsx("option", { value: "Other", children: "Other" })] }), _jsx(Input, { label: "Reference", value: reference, onChange: (e) => setReference(e.target.value) }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "(None)" }), projects.map(p => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsx(Input, { label: "Invoice ID (optional)", value: invoiceId, onChange: (e) => setInvoiceId(e.target.value) }), _jsx(Input, { label: "Expense ID (optional)", value: expenseId, onChange: (e) => setExpenseId(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ projectId: projectId || undefined, invoiceId: invoiceId || undefined, expenseId: expenseId || undefined, payment_date: paymentDate, amount, method, reference: reference || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditPaymentModal({ row, onClose, onSubmit }) {
    const [paymentDate, setPaymentDate] = React.useState(row?.payment_date ? row.payment_date.substring(0, 10) : '');
    const [amount, setAmount] = React.useState(row?.amount || 0);
    const [method, setMethod] = React.useState(row?.method || '');
    const [reference, setReference] = React.useState(row?.reference || '');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => {
        setPaymentDate(row?.payment_date ? row.payment_date.substring(0, 10) : '');
        setAmount(row?.amount || 0);
        setMethod(row?.method || '');
        setReference(row?.reference || '');
    }, [row]);
    if (!row)
        return null;
    const canSave = !!paymentDate && amount > 0;
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Payment", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Date", type: "date", value: paymentDate, onChange: (e) => setPaymentDate(e.target.value) }), _jsx(Input, { label: "Amount", type: "number", value: String(amount), onChange: (e) => setAmount(Number(e.target.value) || 0) }), _jsxs(Select, { label: "Method", value: method, onChange: (e) => setMethod(e.target.value), children: [_jsx("option", { value: "Cash", children: "Cash" }), _jsx("option", { value: "Bank Transfer", children: "Bank Transfer" }), _jsx("option", { value: "Cheque", children: "Cheque" }), _jsx("option", { value: "Other", children: "Other" })] }), _jsx(Input, { label: "Reference", value: reference, onChange: (e) => setReference(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ payment_date: paymentDate, amount, method, reference: reference || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canSave || submitting, children: "Save" })] })] }) }));
}
