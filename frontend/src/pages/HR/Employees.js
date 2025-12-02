import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonSpinner, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import Select from '../../ui/Select';
import { fetchEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../api/hrService';
import { usePermissions } from '../../auth/usePermissions';
import { useAuth } from '../../auth/AuthContext';
import { fetchDocumentCompanies } from '../../api/documentsService';
import { chevronBackOutline } from 'ionicons/icons';
export default function HREmployees() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const { can } = usePermissions();
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [filterCompany, setFilterCompany] = React.useState('');
    const [companies, setCompanies] = React.useState([]);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [deleteRow, setDeleteRow] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const columns = [
        { key: 'company', header: 'COMPANY' },
        { key: 'employeeName', header: 'EMPLOYEE NAME' },
        { key: 'dateOfJoining', header: 'DATE OF JOINING' },
        { key: 'emiratesId', header: 'EMIRATES ID' },
        { key: 'labourCardNo', header: 'LABOUR CARD NO' },
        { key: 'mobileNo', header: 'MOB NO' },
        { key: 'bankAccountNo', header: 'BANK ACCOUNT NO' },
        { key: 'salary', header: 'SALARY' },
        {
            key: 'status',
            header: 'STATUS',
            render: (r) => {
                const s = (r.status || '').toUpperCase();
                const cls = s === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : s === 'INACTIVE'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-slate-500/10 text-slate-400';
                return (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${cls}`, children: s }));
            },
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsx("div", { className: "flex gap-2", children: !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), disabled: !can('HR.Employees.Edit'), children: "Edit" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => setDeleteRow(r), disabled: !can('HR.Employees.Delete'), children: "Delete" })] })) })),
        },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchEmployees({
                page,
                pageSize,
                search: filterCompany || undefined,
                token,
            });
            setRows(res.data);
            setTotal(res.total ?? res.data.length);
        }
        catch (e) {
            present({ message: 'Failed to load employees', color: 'danger', duration: 2000, position: 'top' });
            setRows([]);
            setTotal(0);
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterCompany, page]);
    // Load companies for the Company filter dropdown
    React.useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token') || undefined;
                const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
                setCompanies(res.data || []);
            }
            catch {
                setCompanies([]);
            }
        })();
    }, []);
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await createEmployee({
                company: body.company,
                employeeName: body.employeeName,
                dateOfJoining: body.dateOfJoining,
                emiratesId: body.emiratesId,
                labourCardNo: body.labourCardNo,
                mobileNo: body.mobileNo,
                bankAccountNo: body.bankAccountNo,
                salary: body.salary,
                status: body.status,
                token,
            });
            present({ message: 'Employee created', color: 'success', duration: 1500, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (e) {
            let msg = 'Create failed';
            const raw = e?.message;
            if (raw && raw.includes('{')) {
                const jsonPart = raw.slice(raw.indexOf('{'));
                try {
                    const parsed = JSON.parse(jsonPart);
                    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
                        msg = parsed.message;
                    }
                }
                catch {
                    // fall back to default message
                }
            }
            present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onUpdate(id, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateEmployee({ id, token }, body);
            present({ message: 'Employee updated', color: 'success', duration: 1500, position: 'top' });
            setEditRow(null);
            load();
        }
        catch (e) {
            present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onDelete(r) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await deleteEmployee({ id: r.id, token });
            present({ message: 'Employee deleted', color: 'success', duration: 1500, position: 'top' });
            load();
        }
        catch (e) {
            present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)]", children: _jsxs("div", { className: "px-4 py-8 sm:px-6 lg:px-8 space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Employees" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Employees" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/hr'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "flex items-end gap-3 mt-4", children: [_jsx("div", { className: "flex-1", children: _jsxs(Select, { label: "Company", value: filterCompany, onChange: (e) => {
                                            setFilterCompany(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "All Companies" }), companies.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.id)))] }) }), can('HR.Employees.Create') && !isTeamLeader && (_jsx(Button, { onClick: () => setAddOpen(true), children: "Add Employee" }))] }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsx(Table, { columns: columns, data: rows, emptyText: "No employees" })), _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage })] }) }), _jsx(AddEmployeeModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate, isTeamLeader: isTeamLeader }), _jsx(EditEmployeeModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (b) => {
                    if (editRow)
                        return onUpdate(editRow.id, b);
                }, isTeamLeader: isTeamLeader }), _jsx(Modal, { open: !!deleteRow, onClose: () => setDeleteRow(null), title: "Confirm Delete", children: deleteRow && (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "text-sm", children: "Are you sure you want to delete this employee?" }), _jsx("div", { className: "flex justify-end gap-2", children: !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => setDeleteRow(null), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: async () => {
                                            await onDelete(deleteRow);
                                            setDeleteRow(null);
                                        }, children: "Delete" })] })) })] })) })] }));
}
function AddEmployeeModal({ open, onClose, onSubmit, isTeamLeader }) {
    const [company, setCompany] = React.useState('');
    const [employeeName, setEmployeeName] = React.useState('');
    const [dateOfJoining, setDateOfJoining] = React.useState('');
    const [emiratesId, setEmiratesId] = React.useState('');
    const [labourCard, setLabourCard] = React.useState('');
    const [mobile, setMobile] = React.useState('');
    const [bankAccount, setBankAccount] = React.useState('');
    const [salary, setSalary] = React.useState('');
    const [status, setStatus] = React.useState('ACTIVE');
    const [previewOpen, setPreviewOpen] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [companies, setCompanies] = React.useState([]);
    React.useEffect(() => {
        if (!open) {
            setCompany('');
            setEmployeeName('');
            setDateOfJoining('');
            setEmiratesId('');
            setLabourCard('');
            setMobile('');
            setBankAccount('');
            setSalary('');
            setStatus('ACTIVE');
            setPreviewOpen(false);
            setSubmitting(false);
        }
        else {
            // Load companies from Documents > Company List when modal opens
            (async () => {
                try {
                    const token = localStorage.getItem('token') || undefined;
                    const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
                    setCompanies(res.data || []);
                }
                catch {
                    setCompanies([]);
                }
            })();
        }
    }, [open]);
    const canContinue = !!company &&
        !!employeeName &&
        !!dateOfJoining &&
        !!emiratesId &&
        !!mobile &&
        !!salary &&
        !!status &&
        !submitting;
    const payload = {
        company,
        employeeName,
        dateOfJoining,
        emiratesId,
        labourCardNo: labourCard || undefined,
        mobileNo: mobile,
        bankAccountNo: bankAccount || undefined,
        salary: Number(salary || 0),
        status,
    };
    return (_jsxs(_Fragment, { children: [_jsx(Modal, { open: open, onClose: onClose, title: "Add Employee", children: _jsxs("div", { className: "space-y-3", children: [_jsxs(Select, { label: "COMPANY", value: company, onChange: (e) => setCompany(e.target.value), disabled: isTeamLeader, children: [_jsx("option", { value: "", children: "Select Company" }), companies.map((c) => (_jsx("option", { value: c.name, children: c.name }, c.id)))] }), _jsx(Input, { label: "EMPLOYEE NAME", value: employeeName, onChange: (e) => setEmployeeName(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "DATE OF JOINING", type: "date", value: dateOfJoining, onChange: (e) => setDateOfJoining(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "EMIRATES ID", value: emiratesId, onChange: (e) => setEmiratesId(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "LABOUR CARD NO", value: labourCard, onChange: (e) => setLabourCard(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "MOB NO", value: mobile, onChange: (e) => setMobile(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "BANK ACCOUNT NO", value: bankAccount, onChange: (e) => setBankAccount(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "SALARY", type: "number", value: salary, onChange: (e) => setSalary(e.target.value), disabled: isTeamLeader }), _jsxs(Select, { label: "STATUS", value: status, onChange: (e) => setStatus(e.target.value), disabled: isTeamLeader, children: [_jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "INACTIVE", children: "INACTIVE" })] }), !isTeamLeader && (_jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: () => setPreviewOpen(true), disabled: !canContinue, children: "Add" })] }))] }) }), _jsx(Modal, { open: previewOpen, onClose: () => setPreviewOpen(false), title: "Confirm Employee Details", children: _jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-sm", children: _jsx("table", { className: "min-w-full", children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "COMPANY" }), _jsx("td", { className: "px-4 py-2", children: company })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "EMPLOYEE NAME" }), _jsx("td", { className: "px-4 py-2", children: employeeName })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "DATE OF JOINING" }), _jsx("td", { className: "px-4 py-2", children: dateOfJoining || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "EMIRATES ID" }), _jsx("td", { className: "px-4 py-2", children: emiratesId || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "LABOUR CARD NO" }), _jsx("td", { className: "px-4 py-2", children: labourCard || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "MOB NO" }), _jsx("td", { className: "px-4 py-2", children: mobile || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "BANK ACCOUNT NO" }), _jsx("td", { className: "px-4 py-2", children: bankAccount || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "SALARY" }), _jsx("td", { className: "px-4 py-2", children: salary || '-' })] }), _jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 font-medium", children: "STATUS" }), _jsx("td", { className: "px-4 py-2", children: status })] })] }) }) }), !isTeamLeader && (_jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setPreviewOpen(false), disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => {
                                        setSubmitting(true);
                                        try {
                                            await onSubmit(payload);
                                            setPreviewOpen(false);
                                        }
                                        finally {
                                            setSubmitting(false);
                                        }
                                    }, disabled: submitting, children: "Confirm" })] }))] }) })] }));
}
function EditEmployeeModal({ row, onClose, onSubmit, isTeamLeader }) {
    const [employeeName, setEmployeeName] = React.useState(row?.employeeName || '');
    const [dateOfJoining, setDateOfJoining] = React.useState('');
    const [labourCardNo, setLabourCardNo] = React.useState(row?.labourCardNo || '');
    const [mobileNo, setMobileNo] = React.useState(row?.mobileNo || '');
    const [bankAccountNo, setBankAccountNo] = React.useState(row?.bankAccountNo || '');
    const [salary, setSalary] = React.useState(row ? String(row.salary) : '');
    const [status, setStatus] = React.useState(row?.status || '');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => {
        if (row) {
            setEmployeeName(row.employeeName || '');
            setLabourCardNo(row.labourCardNo || '');
            setMobileNo(row.mobileNo || '');
            setBankAccountNo(row.bankAccountNo || '');
            setSalary(String(row.salary ?? ''));
            setStatus(row.status || '');
            if (row.dateOfJoining) {
                const d = new Date(row.dateOfJoining);
                const iso = d.toISOString().slice(0, 10);
                setDateOfJoining(iso);
            }
            else {
                setDateOfJoining('');
            }
        }
        else {
            setEmployeeName('');
            setLabourCardNo('');
            setMobileNo('');
            setBankAccountNo('');
            setSalary('');
            setStatus('');
            setDateOfJoining('');
        }
    }, [row]);
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Employee", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "COMPANY", value: row.company, disabled: true }), _jsx(Input, { label: "EMIRATES ID", value: row.emiratesId, disabled: true }), _jsx(Input, { label: "DATE OF JOINING", type: "date", value: dateOfJoining, onChange: (e) => setDateOfJoining(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "EMPLOYEE NAME", value: employeeName, onChange: (e) => setEmployeeName(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "LABOUR CARD NO", value: labourCardNo, onChange: (e) => setLabourCardNo(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "MOB NO", value: mobileNo, onChange: (e) => setMobileNo(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "BANK ACCOUNT NO", value: bankAccountNo, onChange: (e) => setBankAccountNo(e.target.value), disabled: isTeamLeader }), _jsx(Input, { label: "SALARY", type: "number", value: salary, onChange: (e) => setSalary(e.target.value), disabled: isTeamLeader }), _jsxs(Select, { label: "STATUS", value: status, onChange: (e) => setStatus(e.target.value), disabled: isTeamLeader, children: [_jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "INACTIVE", children: "INACTIVE" })] }), !isTeamLeader && (_jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => {
                                setSubmitting(true);
                                try {
                                    await onSubmit({
                                        dateOfJoining: dateOfJoining || undefined,
                                        employeeName: employeeName || undefined,
                                        labourCardNo: labourCardNo || undefined,
                                        mobileNo: mobileNo || undefined,
                                        bankAccountNo: bankAccountNo || undefined,
                                        salary: salary ? Number(salary) : undefined,
                                        status: status || undefined,
                                    });
                                }
                                finally {
                                    setSubmitting(false);
                                }
                            }, children: "Save" })] }))] })) }));
}
