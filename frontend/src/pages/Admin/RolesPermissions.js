import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import { fetchRoles, createRole, updateRole, deleteRole, parsePermissions } from '../../api/adminService';
import Select from '../../ui/Select';
import { useAuth } from '../../auth/AuthContext';
export default function AdminRolesPermissions() {
    const [present] = useIonToast();
    const { accessToken, role } = useAuth();
    const [rows, setRows] = React.useState([]);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [permRow, setPermRow] = React.useState(null);
    const isAdmin = role === 'ADMIN';
    const filteredRows = React.useMemo(() => rows.filter((r) => !['STAFF', 'EMPLOYEE', 'MANAGER'].includes((r.name || '').toUpperCase())), [rows]);
    const columns = [
        { key: 'name', header: 'Role Name' },
        { key: 'description', header: 'Description', render: (r) => r.description || '-' },
        { key: 'status', header: 'Status', render: (r) => (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${r.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`, children: r.status || 'ACTIVE' })) },
        isAdmin ? {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setPermRow(r), children: "Manage Permissions" }), r.name !== 'ADMIN' && (_jsx(Button, { size: "sm", variant: "danger", onClick: () => onDelete(r), children: "Delete" }))] })),
        } : undefined,
    ].filter(Boolean);
    async function load() {
        const token = accessToken || undefined;
        try {
            const list = await fetchRoles({ token });
            setRows(list);
        }
        catch (e) {
            present({ message: 'Failed to load roles', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    React.useEffect(() => {
        if (isAdmin && accessToken)
            load();
    }, [isAdmin, accessToken]);
    async function onCreate(body) {
        const token = accessToken || undefined;
        try {
            await createRole({ ...body, token });
            present({ message: 'Role created successfully.', color: 'success', duration: 1500, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (e) {
            const msg = e?.message || 'Create failed';
            present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
        }
    }
    async function onUpdate(id, body) {
        const token = accessToken || undefined;
        try {
            await updateRole({ id, token }, body);
            present({ message: 'Role updated', color: 'success', duration: 1500, position: 'top' });
            setEditRow(null);
            load();
        }
        catch (e) {
            const msg = e?.message || 'Update failed';
            present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
        }
    }
    async function onDelete(r) {
        const token = accessToken || undefined;
        try {
            await deleteRole({ id: r.id, token });
            present({ message: 'Role deleted', color: 'success', duration: 1500, position: 'top' });
            load();
        }
        catch (e) {
            const msg = e?.message || 'Delete failed';
            present({ message: msg, color: 'danger', duration: 2500, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / Roles & Permissions" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > Roles & Permissions" }), !isAdmin ? (_jsxs("div", { className: "mt-6 border zynq-border rounded-xl p-6 bg-[color:var(--card-bg)]", children: [_jsx("div", { className: "font-medium mb-1", children: "Read-only access" }), _jsx("div", { className: "text-sm zynq-muted", children: "You don't have permission to manage roles and permissions. Please contact an administrator." })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex items-end gap-3 mt-4", children: _jsx(Button, { onClick: () => setAddOpen(true), children: "Add Role" }) }), _jsx(Table, { columns: columns, data: filteredRows, emptyText: "No roles" })] }))] }), isAdmin && _jsx(AddRoleModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate }), isAdmin && (_jsx(EditRoleModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (b) => {
                    if (editRow)
                        return onUpdate(editRow.id, b);
                } })), isAdmin && (_jsx(PermissionsModal, { row: permRow, onClose: () => setPermRow(null), onChange: async (updated) => {
                    if (!permRow)
                        return;
                    const token = accessToken || undefined;
                    try {
                        await updateRole({ id: permRow.id, token }, { permissionsJson: JSON.stringify(updated) });
                        present({ message: 'Permissions updated', color: 'success', duration: 1200, position: 'top' });
                        // refresh in background
                        load();
                    }
                    catch (e) {
                        const msg = e?.message || 'Failed to update permissions';
                        present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
                    }
                } }))] }));
}
function AddRoleModal({ open, onClose, onSubmit }) {
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [baseRoleName, setBaseRoleName] = React.useState('');
    const [status, setStatus] = React.useState('ACTIVE');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { if (!open) {
        setName('');
        setDescription('');
        setBaseRoleName('');
        setStatus('ACTIVE');
    } }, [open]);
    const nameOk = name.trim().length > 0;
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Add Role", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Name", value: name, onChange: (e) => setName(e.target.value) }), _jsx(Input, { label: "Description (optional)", value: description, onChange: (e) => setDescription(e.target.value) }), _jsxs(Select, { label: "Base Role (optional)", value: baseRoleName, onChange: (e) => setBaseRoleName(e.target.value), children: [_jsx("option", { value: "", children: "None" }), ['ADMIN', 'MANAGER', 'ACCOUNTANT', 'HR_MANAGER', 'FINANCE_MANAGER'].map((r) => (_jsx("option", { value: r, children: r }, r)))] }), _jsxs(Select, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "INACTIVE", children: "INACTIVE" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ name, description: description || undefined, status, baseRoleName: baseRoleName || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !nameOk || submitting, children: "Create" })] })] }) }));
}
function EditRoleModal({ row, onClose, onSubmit }) {
    const [name, setName] = React.useState(row?.name || '');
    const [description, setDescription] = React.useState(row?.description || '');
    const [status, setStatus] = React.useState(row?.status || 'ACTIVE');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { setName(row?.name || ''); setDescription(row?.description || ''); setStatus(row?.status || 'ACTIVE'); }, [row]);
    const nameOk = !name || name.trim().length > 0;
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Role", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Name", value: name, onChange: (e) => setName(e.target.value) }), _jsx(Input, { label: "Description (optional)", value: description, onChange: (e) => setDescription(e.target.value) }), _jsxs(Select, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value), children: [_jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "INACTIVE", children: "INACTIVE" })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ name: name || undefined, description: description || undefined, status: status || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !nameOk || submitting, children: "Save" })] })] })) }));
}
function PermissionsModal({ row, onClose, onChange }) {
    const [local, setLocal] = React.useState(null);
    const [saving, setSaving] = React.useState(false);
    React.useEffect(() => {
        if (row)
            setLocal(parsePermissions(row.permissionsJson));
        else
            setLocal(null);
        setSaving(false);
    }, [row]);
    if (!row || !local)
        return null;
    const cats = Object.keys(local);
    const actions = ['view', 'create', 'edit', 'delete', 'manage'];
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: `Manage Permissions  ${row.name}`, children: _jsxs("div", { className: "space-y-4", children: [cats.map((cat) => (_jsxs("div", { className: "border zynq-border rounded-xl p-3", children: [_jsx("div", { className: "font-medium mb-2", children: cat }), _jsx("div", { className: "grid grid-cols-5 gap-2", children: actions.map((act) => (_jsxs("label", { className: "flex items-center gap-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: Boolean(local[cat]?.[act]), onChange: (e) => {
                                            const currentCat = local[cat] || { view: false, create: false, edit: false, delete: false, manage: false };
                                            const next = { ...local, [cat]: { ...currentCat, [act]: e.target.checked } };
                                            setLocal(next);
                                        } }), _jsx("span", { className: "capitalize", children: String(act) })] }, String(act)))) })] }, String(cat)))), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: saving, children: "Cancel" }), _jsx(Button, { onClick: async () => {
                                if (!local)
                                    return;
                                setSaving(true);
                                try {
                                    await onChange(local);
                                }
                                finally {
                                    setSaving(false);
                                }
                            }, disabled: saving, children: "Save" })] })] }) }));
}
