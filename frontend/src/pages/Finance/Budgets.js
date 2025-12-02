import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage, useIonToast } from '@ionic/react';
import Nav from '../../components/Nav';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import AdvancedTable from '../../ui/AdvancedTable';
import BulkImportModal from '../../ui/BulkImportModal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useQueryParam } from '../../hooks/useQueryParam';
import { fetchBudgets, createBudget, updateBudget, deleteBudget, exportBudgetsCsv, bulkCreateBudgets } from '../../api/financeService';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { fetchProjects } from '../../api/projectsService';
export default function Budgets() {
    const [present] = useIonToast();
    useEffect(() => { console.log('Loaded Finance > Budgets page'); }, []);
    const [q, setQ] = useQueryParam('budQ', '');
    const [projectId, setProjectId] = useQueryParam('budProject', '');
    const [dateFrom, setDateFrom] = useQueryParam('budFrom', '');
    const [dateTo, setDateTo] = useQueryParam('budTo', '');
    const [page, setPage] = useQueryParam('budPage', 1);
    const pageSize = 10;
    const [rows, setRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [addOpen, setAddOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const filtered = useMemo(() => rows, [rows]);
    const cols = [
        { key: 'periodStart', header: 'Start', render: (r) => new Date(r.periodStart).toLocaleDateString() },
        { key: 'periodEnd', header: 'End', render: (r) => new Date(r.periodEnd).toLocaleDateString() },
        { key: 'amount', header: 'Amount', render: (r) => r.amount.toLocaleString() },
        { key: 'spent', header: 'Spent', render: (r) => r.spent.toLocaleString() },
        { key: 'category', header: 'Category', render: (r) => r.category || '—' },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onDelete(r), children: "Delete" })] })) },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchBudgets({ projectId: projectId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, page, pageSize, token });
            const mapped = res.data.map((b) => ({ id: b.id, periodStart: b.periodStart, periodEnd: b.periodEnd, amount: b.amount, spent: b.spent, category: b.category }));
            setRows(mapped);
            setTotal(res.total || mapped.length);
            console.log('Budgets loaded', mapped.length);
        }
        catch (e) {
            console.error('Budgets load error:', e);
            setRows([]);
            setTotal(0);
            present({ message: 'Failed to load budgets', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        (async () => {
            const token = localStorage.getItem('token') || undefined;
            try {
                const ps = await fetchProjects({ page: 1, pageSize: 200, token });
                setProjects(ps.data ?? []);
            }
            catch { }
        })();
    }, []);
    useEffect(() => { setPage(1); }, [projectId, dateFrom, dateTo, q]);
    useEffect(() => { load(); }, [page, projectId, dateFrom, dateTo, q]);
    async function onExportCsv() {
        const token = localStorage.getItem('token') || undefined;
        try {
            const csv = await exportBudgetsCsv({ projectId: projectId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, search: q || undefined, token });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'budgets.csv';
            a.click();
            URL.revokeObjectURL(url);
        }
        catch (_) {
            present({ message: 'Export failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await createBudget({ ...body, token });
            present({ message: 'Budget created', color: 'success', duration: 1400, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (_) {
            present({ message: 'Create failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    async function onUpdate(row, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateBudget({ id: row.id, token }, body);
            present({ message: 'Budget updated', color: 'success', duration: 1400, position: 'top' });
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
            await deleteBudget({ id: row.id, token });
            present({ message: 'Budget deleted', color: 'success', duration: 1400, position: 'top' });
            load();
        }
        catch (_) {
            present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Budgets" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Budgets" }), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Budgets" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setPreviewOpen(true), children: "Import Excel" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: onExportCsv, children: "Export CSV" }), _jsx(Button, { size: "sm", onClick: () => setAddOpen(true), children: "Add Budget" })] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3 mb-3", children: [_jsx(Input, { label: "Search", placeholder: "Category", value: q, onChange: (e) => setQ(e.target.value) }), _jsxs(Select, { label: "Project", value: projectId, onChange: (e) => setProjectId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), projects.map(p => (_jsx("option", { value: p.id, children: p.name }, p.id)))] }), _jsx(Input, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) })] }), _jsx("div", { className: "flex justify-between items-center mb-2 text-sm", children: _jsxs("div", { className: "zynq-muted", children: ["Showing ", rows.length, " of ", total, " records"] }) }), _jsx(AdvancedTable, { columns: cols, data: filtered, loading: loading, page: page, pageSize: pageSize, total: total, onPageChange: (p) => setPage(p), stickyHeader: true, emptyText: "No budgets" })] })] })] }), _jsx(AddBudgetModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate }), _jsx(EditBudgetModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (body) => onUpdate(editRow, body) }), _jsx(BulkImportModal, { open: previewOpen, onClose: () => setPreviewOpen(false), fields: [
                    { key: 'projectId', label: 'Project ID', required: true },
                    { key: 'periodStart', label: 'Start', required: true },
                    { key: 'periodEnd', label: 'End', required: true },
                    { key: 'amount', label: 'Amount', required: true },
                    { key: 'spent', label: 'Spent' },
                    { key: 'category', label: 'Category' },
                ], onValidate: (r) => {
                    const errs = [];
                    if (!r.projectId)
                        errs.push('projectId');
                    if (!r.periodStart)
                        errs.push('periodStart');
                    if (!r.periodEnd)
                        errs.push('periodEnd');
                    if (!(Number(r.amount) > 0))
                        errs.push('amount');
                    return errs.length ? errs.join(', ') : undefined;
                }, onConfirm: async (valid) => {
                    const token = localStorage.getItem('token') || undefined;
                    await bulkCreateBudgets(valid.map(v => ({ ...v, token })));
                    present({ message: `Imported ${valid.length} rows`, color: 'success', duration: 1600, position: 'top' });
                    load();
                }, templateHint: "Expected columns: projectId, periodStart, periodEnd, amount, spent, category" })] }));
}
function AddBudgetModal({ open, onClose, onSubmit }) {
    const [projectId, setProjectId] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [amount, setAmount] = useState(0);
    const [spent, setSpent] = useState(0);
    const [category, setCategory] = useState('');
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => { if (!open) {
        setProjectId('');
        setPeriodStart('');
        setPeriodEnd('');
        setAmount(0);
        setSpent(0);
        setCategory('');
    } }, [open]);
    const datesOk = !!periodStart && !!periodEnd && new Date(periodStart) <= new Date(periodEnd);
    const canCreate = !!projectId && datesOk && amount > 0 && spent >= 0;
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Add Budget", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Project ID", value: projectId, onChange: (e) => setProjectId(e.target.value) }), _jsx(Input, { label: "Start", type: "date", value: periodStart, onChange: (e) => setPeriodStart(e.target.value) }), _jsx(Input, { label: "End", type: "date", value: periodEnd, onChange: (e) => setPeriodEnd(e.target.value) }), _jsx(Input, { label: "Amount", type: "number", value: String(amount), onChange: (e) => setAmount(Number(e.target.value)) }), _jsx(Input, { label: "Spent (optional)", type: "number", value: String(spent), onChange: (e) => setSpent(Number(e.target.value)) }), _jsx(Input, { label: "Category (optional)", value: category, onChange: (e) => setCategory(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ projectId, periodStart, periodEnd, amount, spent: spent || undefined, category: category || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditBudgetModal({ row, onClose, onSubmit }) {
    const [periodStart, setPeriodStart] = useState(row?.periodStart ? row.periodStart.substring(0, 10) : '');
    const [periodEnd, setPeriodEnd] = useState(row?.periodEnd ? row.periodEnd.substring(0, 10) : '');
    const [amount, setAmount] = useState(row?.amount || 0);
    const [spent, setSpent] = useState(row?.spent || 0);
    const [category, setCategory] = useState(row?.category || '');
    const [submitting, setSubmitting] = useState(false);
    useEffect(() => {
        setPeriodStart(row?.periodStart ? row.periodStart.substring(0, 10) : '');
        setPeriodEnd(row?.periodEnd ? row.periodEnd.substring(0, 10) : '');
        setAmount(row?.amount || 0);
        setSpent(row?.spent || 0);
        setCategory(row?.category || '');
    }, [row]);
    if (!row)
        return null;
    const datesOk = !periodStart || !periodEnd || new Date(periodStart) <= new Date(periodEnd);
    const canSave = datesOk && amount > 0 && spent >= 0;
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Budget", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Start", type: "date", value: periodStart, onChange: (e) => setPeriodStart(e.target.value) }), _jsx(Input, { label: "End", type: "date", value: periodEnd, onChange: (e) => setPeriodEnd(e.target.value) }), _jsx(Input, { label: "Amount", type: "number", value: String(amount), onChange: (e) => setAmount(Number(e.target.value)) }), _jsx(Input, { label: "Spent", type: "number", value: String(spent), onChange: (e) => setSpent(Number(e.target.value)) }), _jsx(Input, { label: "Category", value: category, onChange: (e) => setCategory(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ periodStart, periodEnd, amount, spent, category: category || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canSave || submitting, children: "Save" })] })] }) }));
}
