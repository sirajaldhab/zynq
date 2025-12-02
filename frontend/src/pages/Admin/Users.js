import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import { fetchUsers, createUser, updateUser, deleteUser, fetchRoles } from '../../api/adminService';
import { chevronBackOutline } from 'ionicons/icons';
export default function AdminUsers() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const [search, setSearch] = useQueryParam('q', '');
    const [status, setStatus] = useQueryParam('status', 'All');
    const [role, setRole] = useQueryParam('role', '');
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [roles, setRoles] = React.useState([]);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [approveRow, setApproveRow] = React.useState(null);
    const [pendingRows, setPendingRows] = React.useState([]);
    const fmtDate = (s) => (s ? new Date(s).toLocaleString() : '');
    const filteredRoles = React.useMemo(() => roles.filter((r) => {
        const n = (r.name || '').toUpperCase();
        return !['ADMIN', 'STAFF', 'EMPLOYEE', 'MANAGER'].includes(n);
    }), [roles]);
    const filteredRows = React.useMemo(() => rows.filter((u) => !['STAFF', 'EMPLOYEE'].includes((u.role?.name || '').toUpperCase())), [rows]);
    const columns = [
        { key: 'email', header: 'Email' },
        { key: 'name', header: 'Name' },
        { key: 'status', header: 'Status', render: (r) => (r.status === 'ACTIVE' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected') },
        { key: 'role', header: 'Role', render: (r) => r.role?.name || '' },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onDelete(r), children: "Delete" }), r.status === 'PENDING' && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", onClick: () => setApproveRow(r), children: "Approve" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onUpdate(r.id, { status: 'REJECTED' }), children: "Reject" })] }))] })),
        },
    ];
    const pendingColumns = [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', render: (r) => r.role?.name || r.roleId || '' },
        { key: 'createdAt', header: 'Signup Date', render: (r) => fmtDate(r.createdAt) },
        { key: 'status', header: 'Status', render: (r) => (r.status === 'ACTIVE' ? 'Approved' : r.status === 'PENDING' ? 'Pending' : 'Rejected') },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", onClick: () => setApproveRow(r), children: "Approve" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onUpdate(r.id, { status: 'REJECTED' }), children: "Reject" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Change Role" })] })),
        },
    ];
    async function load() {
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            const effectiveStatus = status === 'Approved' ? 'ACTIVE' : status === 'Pending' ? 'PENDING' : status === 'Rejected' ? 'REJECTED' : status;
            const res = await fetchUsers({ page, pageSize, search, role: role || undefined, status: effectiveStatus, token });
            setRows(res.data);
            setTotal(res.total ?? res.data.length);
            // Load pending approvals snapshot
            const pendingRes = await fetchUsers({ page: 1, pageSize: 50, status: 'PENDING', search: '', role: undefined, token });
            setPendingRows(pendingRes.data || []);
        }
        catch (e) {
            present({ message: 'Failed to load users', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function loadRoles() {
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            const list = await fetchRoles({ token });
            setRoles(list);
        }
        catch { }
    }
    React.useEffect(() => {
        load();
        loadRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, status, role, page]);
    async function onCreate(body) {
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            await createUser({ ...body, token });
            present({ message: 'User created', color: 'success', duration: 1500, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (e) {
            present({ message: 'Create failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onUpdate(id, body) {
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            await updateUser({ id, token }, body);
            present({ message: 'User updated', color: 'success', duration: 1500, position: 'top' });
            setEditRow(null);
            load();
        }
        catch (e) {
            present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onDelete(r) {
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            await deleteUser({ id: r.id, token });
            present({ message: 'User deleted', color: 'success', duration: 1500, position: 'top' });
            load();
        }
        catch (e) {
            present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / Users" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > Users" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/admin'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "mt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "font-medium", children: "Pending User Requests" }), _jsxs("div", { className: "text-xs zynq-muted", children: [pendingRows.length, " pending"] })] }), pendingRows.length === 0 ? (_jsx("div", { className: "text-sm zynq-muted border zynq-border rounded-lg p-4 bg-[color:var(--surface)]", children: "No pending account requests." })) : (_jsx(Table, { columns: pendingColumns, data: pendingRows, emptyText: "No pending users" }))] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4", children: [_jsx(Input, { label: "Search", placeholder: "email/name", value: search, onChange: (e) => setSearch(e.target.value) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Status" }), _jsxs("select", { className: "w-full zynq-input", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), _jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Approved", children: "Approved" }), _jsx("option", { value: "Rejected", children: "Rejected" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Role" }), _jsxs("select", { className: "w-full zynq-input", value: role, onChange: (e) => setRole(e.target.value), children: [_jsx("option", { value: "", children: "All" }), filteredRoles.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), _jsx("div", { className: "flex items-end", children: _jsx(Button, { onClick: () => setAddOpen(true), children: "Add User" }) })] }), _jsx(Table, { columns: columns, data: filteredRows, emptyText: "No users" }), _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage })] }), _jsx(AddUserModal, { roles: roles, open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate }), _jsx(EditUserModal, { roles: roles, row: editRow, onClose: () => setEditRow(null), onSubmit: (b) => {
                    if (editRow)
                        return onUpdate(editRow.id, b);
                } }), _jsx(ApproveUserModal, { roles: roles, row: approveRow, onClose: () => setApproveRow(null), onSubmit: (roleId) => {
                    if (approveRow)
                        return onUpdate(approveRow.id, { status: 'ACTIVE', roleId });
                } })] }));
}
function AddUserModal({ roles, open, onClose, onSubmit }) {
    const [email, setEmail] = React.useState('');
    const [name, setName] = React.useState('');
    const [roleId, setRoleId] = React.useState('');
    const [status, setStatus] = React.useState('ACTIVE');
    const [password, setPassword] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    const selectableRoles = React.useMemo(() => roles.filter((r) => !['STAFF', 'EMPLOYEE'].includes((r.name || '').toUpperCase())), [roles]);
    React.useEffect(() => { if (!open) {
        setEmail('');
        setName('');
        setRoleId('');
        setStatus('ACTIVE');
        setPassword('');
    } }, [open]);
    const emailOk = /.+@.+\..+/.test(email);
    const canCreate = emailOk && !!name && !!roleId;
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Add User", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(Input, { label: "Name", value: name, onChange: (e) => setName(e.target.value) }), _jsx(Input, { label: "Password", value: password, onChange: (e) => setPassword(e.target.value) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Role" }), _jsxs("select", { className: "w-full zynq-input", value: roleId, onChange: (e) => setRoleId(e.target.value), children: [_jsx("option", { value: "", children: "Select role" }), selectableRoles.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Status" }), _jsxs("select", { className: "w-full zynq-input", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "PENDING", children: "Pending" }), _jsx("option", { value: "ACTIVE", children: "Approved" }), _jsx("option", { value: "REJECTED", children: "Rejected" })] })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ email, name, roleId, password: password || undefined, status });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditUserModal({ roles, row, onClose, onSubmit }) {
    const [email, setEmail] = React.useState(row?.email || '');
    const [name, setName] = React.useState(row?.name || '');
    const [roleId, setRoleId] = React.useState(row?.roleId || '');
    const [status, setStatus] = React.useState(row?.status || 'PENDING');
    const [password, setPassword] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { setEmail(row?.email || ''); setName(row?.name || ''); setRoleId(row?.roleId || ''); setStatus(row?.status || 'PENDING'); setPassword(''); }, [row]);
    const emailOk = !email || /.+@.+\..+/.test(email);
    const canSave = emailOk && (!!name || name === '') && (!!roleId || roleId === '') && (!!status || status === '');
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit User", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Email", value: email, onChange: (e) => setEmail(e.target.value) }), _jsx(Input, { label: "Name", value: name, onChange: (e) => setName(e.target.value) }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Role" }), _jsxs("select", { className: "w-full zynq-input", value: roleId, onChange: (e) => setRoleId(e.target.value), children: [_jsx("option", { value: "", children: "Select role" }), roles.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Status" }), _jsxs("select", { className: "w-full zynq-input", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "PENDING", children: "Pending" }), _jsx("option", { value: "ACTIVE", children: "Approved" }), _jsx("option", { value: "REJECTED", children: "Rejected" })] })] }), _jsx(Input, { label: "New Password (optional)", value: password, onChange: (e) => setPassword(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ email, name, roleId, status, password: password || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canSave || submitting, children: "Save" })] })] })) }));
}
function ApproveUserModal({ roles, row, onClose, onSubmit }) {
    const selectableRoles = React.useMemo(() => roles.filter((r) => !['STAFF', 'EMPLOYEE'].includes((r.name || '').toUpperCase())), [roles]);
    const [roleId, setRoleId] = React.useState(row?.roleId || (selectableRoles[0]?.id || ''));
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { setRoleId(row?.roleId || (selectableRoles[0]?.id || '')); }, [row, selectableRoles]);
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Approve Account", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-sm zynq-muted", children: ["Approve account for ", _jsxs("span", { className: "font-medium", children: [row.name, " (", row.email, ")"] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm mb-1", children: "Role" }), _jsx("select", { className: "w-full zynq-input", value: roleId, onChange: (e) => setRoleId(e.target.value), children: selectableRoles.map((r) => (_jsx("option", { value: r.id, children: r.name }, r.id))) })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit(roleId);
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !roleId || submitting, children: "Approve" })] })] })) }));
}
