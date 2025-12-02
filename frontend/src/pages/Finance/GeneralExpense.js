import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { chevronBackOutline } from 'ionicons/icons';
import BulkImportModal from '../../ui/BulkImportModal';
import AdvancedTable from '../../ui/AdvancedTable';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Modal from '../../ui/Modal';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { bulkCreateGeneralExpenses, deleteGeneralExpense, fetchGeneralExpenses, updateGeneralExpense } from '../../api/financeService';
import { fetchDocumentCompanies } from '../../api/documentsService';
import { useAuth } from '../../auth/AuthContext';
export default function GeneralExpensePage() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [rows, setRows] = React.useState([]);
    const [sort, setSort] = React.useState(null);
    const [page, setPage] = React.useState(1);
    const pageSize = 20;
    const [loading, setLoading] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [search, setSearch] = React.useState('');
    const [dateFrom, setDateFrom] = React.useState('');
    const [dateTo, setDateTo] = React.useState('');
    const [supplierFilter, setSupplierFilter] = React.useState('');
    const [companyFilter, setCompanyFilter] = React.useState('');
    const [companyModalOpen, setCompanyModalOpen] = React.useState(false);
    const [companies, setCompanies] = React.useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = React.useState('');
    const [pendingImportRows, setPendingImportRows] = React.useState([]);
    const loadExisting = React.useCallback(async () => {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchGeneralExpenses({ page: 1, pageSize: 500, token });
            const data = (res.rows ?? res.data ?? []);
            const mapped = data.map((e, idx) => {
                const note = e.note || '';
                const parts = note.split(';');
                const get = (key) => {
                    const p = parts.find((s) => s.trim().toLowerCase().startsWith(key));
                    if (!p)
                        return '';
                    return p.split(':').slice(1).join(':').trim();
                };
                const invNo = get('inv');
                const supplier = get('supplier');
                const unit = get('unit');
                const qty = Number(get('qty') || '1') || 1;
                const totalAmount = Number(get('totalamount') || e.amount) || e.amount;
                const company = get('company');
                return {
                    id: e.id,
                    sn: idx + 1,
                    company,
                    date: e.date?.substring(0, 10) || '',
                    invNo,
                    description: e.category || e.note || '',
                    supplier,
                    unit,
                    qty,
                    totalAmount,
                    source: 'Existing',
                };
            });
            setRows(mapped);
        }
        catch (err) {
            console.error('Failed to load general expenses', err);
            present({ message: 'Failed to load general expenses', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setLoading(false);
        }
    }, [present]);
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
        loadExisting();
    }, [loadExisting]);
    const supplierOptions = React.useMemo(() => {
        const set = new Set();
        for (const r of rows) {
            if (r.supplier)
                set.add(r.supplier);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [rows]);
    const filteredRows = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        return rows.filter((r) => {
            if (dateFrom && r.date && r.date < dateFrom)
                return false;
            if (dateTo && r.date && r.date > dateTo)
                return false;
            if (companyFilter && r.company !== companyFilter)
                return false;
            if (supplierFilter && r.supplier !== supplierFilter)
                return false;
            if (q) {
                const haystack = [
                    r.sn,
                    r.company,
                    r.date,
                    r.invNo,
                    r.description,
                    r.supplier,
                    r.unit,
                    r.qty,
                    r.totalAmount,
                    r.source,
                ]
                    .map((v) => (v === undefined || v === null ? '' : String(v)))
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(q))
                    return false;
            }
            return true;
        });
    }, [rows, search, dateFrom, dateTo, supplierFilter, companyFilter]);
    const summaryTotal = React.useMemo(() => {
        return filteredRows.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    }, [filteredRows]);
    const sortedRows = React.useMemo(() => {
        if (!sort)
            return filteredRows;
        const key = String(sort.key);
        const copy = [...filteredRows];
        copy.sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            if (av == null && bv == null)
                return 0;
            if (av == null)
                return 1;
            if (bv == null)
                return -1;
            if (av < bv)
                return sort.dir === 'asc' ? -1 : 1;
            if (av > bv)
                return sort.dir === 'asc' ? 1 : -1;
            return 0;
        });
        return copy;
    }, [filteredRows, sort]);
    const pagedRows = React.useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedRows.slice(start, start + pageSize);
    }, [sortedRows, page]);
    const columns = [
        { key: 'company', header: 'Company', sortable: true },
        { key: 'sn', header: 'S/N', width: '60px', sortable: true },
        { key: 'date', header: 'Date', sortable: true },
        { key: 'invNo', header: 'Inv No', sortable: true },
        { key: 'description', header: 'Description', sortable: true },
        { key: 'supplier', header: 'Supplier', sortable: true },
        { key: 'unit', header: 'Unit' },
        { key: 'qty', header: 'Qty.', sortable: true },
        { key: 'totalAmount', header: 'Total Amount', sortable: true },
        {
            key: 'source',
            header: 'Source',
            render: (row) => (_jsx("span", { className: row.source === 'Existing'
                    ? 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[color:var(--surface)] text-[color:var(--text-secondary)]'
                    : 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] bg-[color:var(--accent)]/10 text-[color:var(--accent)]', children: row.source })),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (row) => (_jsx("div", { className: "flex gap-2", children: !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: (e) => {
                                e.stopPropagation();
                                setEditRow(row);
                            }, children: "Edit" }), _jsx(Button, { variant: "danger", size: "sm", onClick: async (e) => {
                                e.stopPropagation();
                                if (!row.id) {
                                    present({ message: 'Cannot delete row without ID', color: 'danger', duration: 1600, position: 'top' });
                                    return;
                                }
                                const ok = window.confirm('Are you sure you want to delete this general expense?');
                                if (!ok)
                                    return;
                                const token = localStorage.getItem('token') || undefined;
                                try {
                                    setLoading(true);
                                    await deleteGeneralExpense({ id: row.id, token });
                                    present({ message: 'General expense deleted', color: 'success', duration: 1600, position: 'top' });
                                    await loadExisting();
                                }
                                catch (err) {
                                    console.error('Delete general expense failed', err);
                                    present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
                                }
                                finally {
                                    setLoading(false);
                                }
                            }, children: "Delete" })] })) })),
        },
    ];
    async function handleConfirmImport(rowsData) {
        if (!rowsData.length) {
            present({ message: 'No valid rows to import', color: 'warning', duration: 1800, position: 'top' });
            return;
        }
        setPendingImportRows(rowsData);
        setSelectedCompanyId('');
        setCompanyModalOpen(true);
    }
    async function handleConfirmImportWithCompany() {
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
        const mapped = pendingImportRows.map((r, idx) => {
            const sn = Number(r.sn ?? idx + 1);
            const date = String(r.date ?? '');
            const invNo = String(r.invNo ?? '');
            const description = String(r.description ?? '');
            const supplier = String(r.supplier ?? '');
            const unit = String(r.unit ?? '');
            const qty = Number(r.qty ?? 0);
            const totalAmount = Number(r.totalAmount ?? 0);
            return { sn, company: companyName, date, invNo, description, supplier, unit, qty, totalAmount, source: 'Imported' };
        });
        try {
            await bulkCreateGeneralExpenses(mapped.map((m) => ({
                date: m.date,
                amount: m.totalAmount,
                note: `Company:${m.company}; Inv:${m.invNo}; Supplier:${m.supplier}; Unit:${m.unit}; Qty:${m.qty}; TotalAmount:${m.totalAmount}`,
                token,
            })));
            setCompanyModalOpen(false);
            setPendingImportRows([]);
            await loadExisting();
            present({ message: `Imported ${mapped.length} general expenses`, color: 'success', duration: 1800, position: 'top' });
        }
        catch (e) {
            console.error('General expense import failed', e);
            present({ message: 'Import failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / General Expense" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > General Expense" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance/expenses'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsx("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-4 gap-4", children: _jsxs(Card, { className: "md:col-span-1", children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Total Amount" }) }), _jsx(CardContent, { className: "text-2xl font-semibold", children: summaryTotal.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        }) })] }) }), _jsxs("div", { className: "mt-6 space-y-4", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsx("div", { className: "text-base font-semibold", children: "Import from Excel" }), _jsx(Button, { variant: "primary", size: "sm", onClick: () => setPreviewOpen(true), children: "Import from Excel" })] }), _jsxs("div", { className: "mt-2 space-y-3", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsx(Input, { label: "Search", placeholder: "Search general expenses", value: search, onChange: (e) => setSearch(e.target.value) }), _jsx(Input, { label: "From", type: "date", value: dateFrom, onChange: (e) => setDateFrom(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: dateTo, onChange: (e) => setDateTo(e.target.value) }), _jsxs(Select, { label: "Company", value: companyFilter, onChange: (e) => setCompanyFilter(e.target.value), children: [_jsx("option", { value: "", children: "All companies" }), companies.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.id)))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsx("div", {}), _jsx("div", {}), _jsx("div", {}), _jsxs(Select, { label: "Supplier", value: supplierFilter, onChange: (e) => setSupplierFilter(e.target.value), children: [_jsx("option", { value: "", children: "All suppliers" }), supplierOptions.map((s) => (_jsx("option", { value: s, children: s }, s)))] })] }), _jsx(AdvancedTable, { columns: columns, data: pagedRows, loading: loading, page: page, pageSize: pageSize, total: filteredRows.length, sort: sort, onSortChange: (s) => setSort(s), onPageChange: (p) => setPage(p), emptyText: "No general expenses" })] })] }), _jsx(BulkImportModal, { open: previewOpen, onClose: () => setPreviewOpen(false), fields: [
                                { key: 'sn', label: 'S/N', required: true },
                                { key: 'date', label: 'Date', required: true },
                                { key: 'invNo', label: 'Inv No', required: true },
                                { key: 'description', label: 'Description', required: true },
                                { key: 'supplier', label: 'Supplier', required: true },
                                { key: 'unit', label: 'Unit', required: true },
                                { key: 'qty', label: 'Qty.', required: true },
                                { key: 'totalAmount', label: 'Total Amount', required: true },
                            ], onValidate: (row) => {
                                const missing = [];
                                const mustHave = ['sn', 'date', 'invNo', 'description', 'supplier', 'unit', 'qty', 'totalAmount'];
                                for (const key of mustHave) {
                                    if (row[key] === undefined || row[key] === null || row[key] === '') {
                                        missing.push(key);
                                    }
                                }
                                if (row.qty !== undefined && !(Number(row.qty) > 0))
                                    missing.push('qty');
                                if (row.totalAmount !== undefined && !(Number(row.totalAmount) >= 0))
                                    missing.push('totalAmount');
                                return missing.length ? `Missing/invalid: ${missing.join(', ')}` : undefined;
                            }, onConfirm: handleConfirmImport, templateHint: "Expected columns: S/N, Date, Inv No, Description, Supplier, Unit, Qty., Total Amount" }), _jsx(Modal, { open: companyModalOpen, onClose: () => setCompanyModalOpen(false), title: "Select Company", footer: (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setCompanyModalOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleConfirmImportWithCompany, disabled: !selectedCompanyId, children: "Import" })] })), children: _jsx("div", { className: "space-y-3", children: _jsxs(Select, { label: "Company", value: selectedCompanyId, onChange: (e) => setSelectedCompanyId(e.target.value), children: [_jsx("option", { value: "", children: "Select company" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }) }) }), editRow ? (_jsx(EditGeneralExpenseModal, { row: editRow, companies: companies, onClose: () => setEditRow(null), onSubmit: async (updated) => {
                                if (!editRow.id) {
                                    present({ message: 'Cannot edit row without ID', color: 'danger', duration: 1600, position: 'top' });
                                    return;
                                }
                                const ok = window.confirm('Save changes to this general expense?');
                                if (!ok)
                                    return;
                                const token = localStorage.getItem('token') || undefined;
                                try {
                                    setLoading(true);
                                    await updateGeneralExpense({ id: editRow.id, token }, {
                                        date: updated.date,
                                        amount: updated.totalAmount,
                                        note: `Company:${updated.company}; Inv:${updated.invNo}; Supplier:${updated.supplier}; Unit:${updated.unit}; Qty:${updated.qty}; TotalAmount:${updated.totalAmount}`,
                                    });
                                    present({ message: 'General expense updated', color: 'success', duration: 1600, position: 'top' });
                                    setEditRow(null);
                                    await loadExisting();
                                }
                                catch (err) {
                                    console.error('Update general expense failed', err);
                                    present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
                                }
                                finally {
                                    setLoading(false);
                                }
                            } })) : null] }) })] }));
}
function EditGeneralExpenseModal({ row, companies, onClose, onSubmit }) {
    const [form, setForm] = React.useState(row);
    React.useEffect(() => { setForm(row); }, [row]);
    function update(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }
    const canSave = !!form.date && !!form.description && form.totalAmount >= 0;
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    return (_jsx(Modal, { open: true, onClose: onClose, title: "Edit General Expense", children: _jsxs("div", { className: "space-y-3 max-h-[70vh] overflow-y-auto pr-2", children: [_jsxs(Select, { label: "Company", value: form.company, onChange: (e) => update('company', e.target.value), children: [_jsx("option", { value: "", children: "Select company" }), companies.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.id)))] }), _jsx(Input, { label: "Date", type: "date", value: form.date, onChange: (e) => update('date', e.target.value) }), _jsx(Input, { label: "Inv No", value: form.invNo, onChange: (e) => update('invNo', e.target.value) }), _jsx(Input, { label: "Description", value: form.description, onChange: (e) => update('description', e.target.value) }), _jsx(Input, { label: "Supplier", value: form.supplier, onChange: (e) => update('supplier', e.target.value) }), _jsx(Input, { label: "Unit", value: form.unit, onChange: (e) => update('unit', e.target.value) }), _jsx(Input, { label: "Qty", type: "number", value: String(form.qty), onChange: (e) => update('qty', Number(e.target.value) || 0) }), _jsx(Input, { label: "Total Amount", type: "number", value: String(form.totalAmount), onChange: (e) => update('totalAmount', Number(e.target.value) || 0) }), _jsx("div", { className: "flex justify-end gap-2 mt-4", children: !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: onClose, children: "Cancel" }), _jsx(Button, { onClick: () => onSubmit(form), disabled: !canSave, children: "Save" })] })) })] }) }));
}
