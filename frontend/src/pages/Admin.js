import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonToast, IonButton, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { toCsv, downloadCsv } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { useAuth } from '../auth/AuthContext';
import { fetchUsers, fetchRoles, updateUser, createUser, deleteUser, fetchPendingUsers, approveUser, rejectUser } from '../api/usersService';
// No mock roles/users; all data must come from the live API
function prettifyRole(name) {
    return (name || '').toString().replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}
function RoleBadge({ name }) {
    const key = (name || '').toUpperCase();
    const map = {
        ADMIN: 'bg-purple-500/10 text-purple-400',
        MANAGER: 'bg-blue-500/10 text-blue-400',
        STAFF: 'bg-emerald-500/10 text-emerald-400',
        VIEWER: 'bg-slate-500/10 text-slate-400',
        HR_MANAGER: 'bg-pink-500/10 text-pink-400',
        FINANCE_MANAGER: 'bg-amber-500/10 text-amber-500',
        ACCOUNTANT: 'bg-indigo-500/10 text-indigo-400',
        EMPLOYEE: 'bg-slate-500/10 text-slate-400',
    };
    const klass = map[key] || 'bg-slate-500/10 text-slate-400';
    return _jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${klass}`, children: prettifyRole(name) });
}
function toUiStatus(s) {
    // Show exact backend status string as required
    return (s || '').toString();
}
function toApiStatus(s) {
    const u = (s || '').toLowerCase();
    if (u.startsWith('active'))
        return 'ACTIVE';
    if (u.startsWith('inactive'))
        return 'INACTIVE';
    if (u.startsWith('pending'))
        return 'PENDING_APPROVAL';
    if (u.startsWith('rejected'))
        return 'REJECTED';
    return s || '';
}
export default function Admin() {
    const [present] = useIonToast();
    const navigate = useNavigate();
    const { role } = useAuth();
    const upperRole = (role || '').toUpperCase();
    const isGM = upperRole === 'GM';
    const isAdmin = upperRole === 'ADMIN';
    useEffect(() => {
        console.log('Loaded Admin > Overview page');
    }, []);
    // Users state
    const [userSearch, setUserSearch] = useQueryParam('userQ', '');
    const [userRole, setUserRole] = useQueryParam('userRole', 'All');
    const [userStatus, setUserStatus] = useQueryParam('userStatus', 'All');
    const [userPage, setUserPage] = useQueryParam('userPage', 1);
    const userPageSize = 8;
    const [viewUser, setViewUser] = useState(null);
    const [editUser, setEditUser] = useState(null);
    const [resetUser, setResetUser] = useState(null);
    const [resetPassword, setResetPassword] = useState('');
    const [resetSubmitting, setResetSubmitting] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersTotal, setUsersTotal] = useState(0);
    // Pending Requests
    const [pendingPage, setPendingPage] = useQueryParam('pendingPage', 1);
    const pendingPageSize = 8;
    const [pendingUsers, setPendingUsers] = useState([]);
    const [pendingTotal, setPendingTotal] = useState(0);
    const [pendingRoleMap, setPendingRoleMap] = useState({});
    // Roles state
    const [rolePage, setRolePage] = useQueryParam('rolePage', 1);
    const rolePageSize = 8;
    const [viewRole, setViewRole] = useState(null);
    const [roles, setRoles] = useState([]);
    const [rolesTotal, setRolesTotal] = useState(0);
    const filteredRoles = React.useMemo(() => roles.filter((r) => {
        const n = (r.name || '').toUpperCase();
        return !['ADMIN', 'STAFF', 'EMPLOYEE', 'MANAGER'].includes(n);
    }), [roles]);
    React.useEffect(() => {
        const token = localStorage.getItem('accessToken') || undefined;
        (async () => {
            try {
                const res = await fetchUsers({
                    search: userSearch,
                    role: userRole,
                    status: userStatus,
                    page: userPage,
                    pageSize: userPageSize,
                    token,
                });
                const mapped = res.data.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role?.name || u.role || '', roleId: u.role?.id, status: u.status, createdAt: u.createdAt }));
                setUsers(mapped);
                setUsersTotal(res.total || mapped.length);
            }
            catch (_) {
                present({ message: 'Failed to load users.', color: 'danger', duration: 2000, position: 'top' });
                setUsers([]);
                setUsersTotal(0);
            }
        })();
    }, [userSearch, userRole, userStatus, userPage]);
    async function handleResetPasswordSubmit() {
        if (!resetUser || !resetPassword)
            return;
        setResetSubmitting(true);
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            await updateUser(resetUser.id, { password: resetPassword }, token);
            present({ message: 'Password reset successfully.', color: 'success', duration: 1500, position: 'top' });
            setResetUser(null);
            setResetPassword('');
        }
        catch {
            present({ message: 'Failed to reset password.', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setResetSubmitting(false);
        }
    }
    // Load pending users
    React.useEffect(() => {
        const token = localStorage.getItem('accessToken') || undefined;
        (async () => {
            try {
                const res = await fetchPendingUsers({ page: pendingPage, pageSize: pendingPageSize, token });
                const mapped = res.data.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role?.name || u.role || '', roleId: u.role?.id, status: u.status, createdAt: u.createdAt }));
                setPendingUsers(mapped);
                // initialize role selection map
                const nextMap = {};
                mapped.forEach((u) => { if (u.roleId)
                    nextMap[u.id] = u.roleId; });
                setPendingRoleMap(nextMap);
                setPendingTotal(res.total || mapped.length);
            }
            catch (_) {
                setPendingUsers([]);
                setPendingRoleMap({});
                setPendingTotal(0);
            }
        })();
    }, [pendingPage]);
    React.useEffect(() => {
        const token = localStorage.getItem('accessToken') || undefined;
        (async () => {
            try {
                const res = await fetchRoles({ page: rolePage, pageSize: rolePageSize, token });
                const mapped = res.map((r) => ({ id: r.id, name: r.name, permissions: r.permissions ?? 0 }));
                setRoles(mapped);
                setRolesTotal(mapped.length);
            }
            catch (_) {
                present({ message: 'Failed to load roles.', color: 'danger', duration: 2000, position: 'top' });
                setRoles([]);
                setRolesTotal(0);
            }
        })();
    }, [rolePage]);
    const filteredUsers = useMemo(() => {
        const q = userSearch.toLowerCase();
        return users
            .filter((u) => (userRole === 'All' || (u.roleId || '') === (userRole || '')) &&
            (userStatus === 'All' || (u.status || '').toUpperCase() === toApiStatus(userStatus)) &&
            (u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)))
            .filter((u) => (u.role || '').toUpperCase() !== 'ADMIN');
    }, [users, userSearch, userRole, userStatus]);
    function exportUsersCsv() {
        const cols = [
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', map: (r) => prettifyRole(r.role) },
            { key: 'status', header: 'Status', map: (r) => toUiStatus(r.status) },
        ];
        downloadCsv('users.csv', toCsv(filteredUsers, cols));
    }
    function exportRolesCsv() {
        const cols = [
            { key: 'name', header: 'Role' },
            { key: 'permissions', header: 'Permissions' },
        ];
        downloadCsv('roles.csv', toCsv(roles, cols));
    }
    const usersColumns = [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', render: (r) => _jsx(RoleBadge, { name: r.role }) },
        { key: 'status', header: 'Status', render: (r) => (_jsx("span", { className: `px-2 py-0.5 rounded-full text-xs ${toApiStatus(r.status) === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : toApiStatus(r.status) === 'PENDING' ? 'bg-amber-500/10 text-amber-500' : toApiStatus(r.status) === 'REJECTED' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-500/10 text-slate-400'}`, children: toUiStatus(r.status) })) },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setViewUser(r), children: "View" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditUser(r), children: "Edit" }), (toApiStatus(r.status) === 'ACTIVE' || !isGM) && (_jsx(Button, { size: "sm", variant: toApiStatus(r.status) === 'ACTIVE' ? 'danger' : 'secondary', onClick: () => handleToggleUserActive(r), children: toApiStatus(r.status) === 'ACTIVE' ? 'Deactivate' : 'Activate' })), toApiStatus(r.status) === 'PENDING' && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", onClick: () => handleApprove(r), children: "Approve" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => handleReject(r), children: "Reject" })] })), isAdmin && (_jsx(Button, { size: "sm", variant: "secondary", onClick: () => {
                            setResetUser(r);
                            setResetPassword('');
                        }, children: "Reset Password" })), !isGM && (_jsx(Button, { size: "sm", variant: "danger", onClick: () => handleDelete(r), children: "Delete" }))] })) },
    ];
    const rolesColumns = [
        { key: 'name', header: 'Role', render: (r) => _jsx(RoleBadge, { name: r.name }) },
        { key: 'permissions', header: 'Permissions' },
        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setViewRole(r), children: "View" }), _jsx(Button, { size: "sm", variant: "secondary", children: "Edit" })] })) },
    ];
    // Include pending users also in the main Users table view (with their current status)
    const viewUsers = useMemo(() => {
        const pendingIds = new Set(pendingUsers.map((u) => u.id));
        // Merge filtered active users with pending ones, avoiding duplicates
        const merged = [
            ...filteredUsers,
            ...pendingUsers.filter((u) => !pendingIds.has(u.id)),
        ];
        return merged;
    }, [filteredUsers, pendingUsers]);
    const viewRoles = roles;
    async function handleToggleUserActive(row) {
        const nextStatus = toApiStatus(row.status) === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const prev = users.slice();
        setUsers((list) => list.map((u) => (u.id === row.id ? { ...u, status: nextStatus } : u)));
        try {
            const token = localStorage.getItem('accessToken') || undefined;
            await updateUser(row.id, { status: nextStatus }, token);
            present({ message: `User ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`, color: 'success', duration: 1500, position: 'top' });
        }
        catch (e) {
            setUsers(prev);
            present({ message: 'Failed to update user status.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleApprove(row) {
        const prevPending = pendingUsers.slice();
        setPendingUsers((list) => list.filter((u) => u.id !== row.id));
        const roleId = pendingRoleMap[row.id] || row.roleId;
        try {
            const token = localStorage.getItem('accessToken') || undefined;
            await approveUser(row.id, roleId ? { roleId } : {}, token);
            // Move to users as ACTIVE
            const approved = { ...row, status: 'ACTIVE', roleId, role: roles.find(r => r.id === roleId)?.name || row.role };
            setUsers((list) => [approved, ...list]);
            setUsersTotal((t) => t + 1);
            present({ message: 'User approved.', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            setPendingUsers(prevPending);
            present({ message: 'Failed to approve user.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleReject(row) {
        const prevPending = pendingUsers.slice();
        setPendingUsers((list) => list.filter((u) => u.id !== row.id));
        try {
            const token = localStorage.getItem('accessToken') || undefined;
            await rejectUser(row.id, token);
            present({ message: 'User rejected.', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            setPendingUsers(prevPending);
            present({ message: 'Failed to reject user.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleDelete(row) {
        const prev = users.slice();
        setUsers((list) => list.filter((u) => u.id !== row.id));
        setUsersTotal((t) => Math.max(0, t - 1));
        try {
            const token = localStorage.getItem('accessToken') || undefined;
            await deleteUser(row.id, token);
            present({ message: 'User deleted.', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            setUsers(prev);
            setUsersTotal(prev.length);
            present({ message: 'Failed to delete user.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    function resetUserFilters() {
        setUserSearch('');
        setUserRole('All');
        setUserStatus('All');
        setUserPage(1);
    }
    function resetRoleFilters() {
        setRolePage(1);
    }
    // Add User Modal
    const [addOpen, setAddOpen] = useState(false);
    const [addName, setAddName] = useState('');
    const [addEmail, setAddEmail] = useState('');
    const [addPassword, setAddPassword] = useState('');
    const [addRoleId, setAddRoleId] = useState('');
    // Edit User state for role assignment
    const [editRoleId, setEditRoleId] = useState('');
    useEffect(() => {
        if (editUser) {
            const r = roles.find((x) => (x.name || '').toUpperCase() === (editUser.role || '').toUpperCase());
            setEditRoleId(r?.id || '');
        }
        else {
            setEditRoleId('');
        }
    }, [editUser, roles]);
    async function handleEditSave() {
        if (!editUser)
            return;
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            const body = { name: editUser.name, email: editUser.email };
            if (editRoleId)
                body.roleId = editRoleId;
            const updated = await updateUser(editUser.id, body, token);
            setUsers((list) => list.map((u) => (u.id === editUser.id ? {
                ...u,
                name: updated.name ?? editUser.name,
                email: updated.email ?? editUser.email,
                role: updated.role?.name || updated.role || editUser.role,
            } : u)));
            setEditUser(null);
            present({ message: 'User updated.', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            present({ message: 'Failed to update user.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleCreateUser() {
        if (!addEmail || !addName || !addRoleId)
            return;
        const token = localStorage.getItem('accessToken') || undefined;
        try {
            const res = await createUser({ email: addEmail, name: addName, password: addPassword || undefined, roleId: addRoleId, status: 'ACTIVE' }, token);
            setAddOpen(false);
            setAddName('');
            setAddEmail('');
            setAddPassword('');
            setAddRoleId('');
            // refresh list
            setUserPage(1);
            present({ message: 'User created.', color: 'success', duration: 1500, position: 'top' });
            // Optimistically insert
            setUsers((list) => [{ id: res.id, name: res.name, email: res.email, role: res.role?.name || res.role || '', status: res.status || 'ACTIVE' }, ...list]);
            setUsersTotal((t) => t + 1);
        }
        catch (e) {
            present({ message: e?.message || 'Failed to create user.', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "px-4 py-6 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-6", children: _jsxs("div", { className: "mx-auto w-full max-w-screen-md lg:max-w-none space-y-6", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Admin" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Admin" }), !isGM && (_jsx("div", { className: "hidden lg:block", children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) })), !isGM && (_jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [_jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/users", children: "Users" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/roles", children: "Roles & Permissions" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/settings", children: "App Settings" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/logs", children: "System Logs" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/sync", children: "Sync Status" }), _jsx(IonButton, { size: "small", color: "medium", routerLink: "/admin/backup", children: "Backup" })] })), _jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsx(CardTitle, { children: "Users" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", size: "sm", onClick: resetUserFilters, children: "Reset Filters" }), !isGM && (_jsx(Button, { size: "sm", onClick: () => setAddOpen(true), children: "Add User" }))] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3", children: [_jsx(Input, { label: "Search", placeholder: "Name or email", value: userSearch, onChange: (e) => setUserSearch(e.target.value) }), _jsxs(Select, { label: "Role", value: userRole, onChange: (e) => setUserRole(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), roles
                                                            .filter((r) => ['GM', 'TEAM LEADER'].includes((r.name || '').toUpperCase()))
                                                            .map((r) => (_jsx("option", { value: r.id, children: prettifyRole(r.name) }, r.id)))] }), _jsxs(Select, { label: "Status", value: userStatus, onChange: (e) => setUserStatus(e.target.value), children: [_jsx("option", { value: "All", children: "All" }), _jsx("option", { value: "Active", children: "Active" }), _jsx("option", { value: "Pending Approval", children: "Pending Approval" }), _jsx("option", { value: "Inactive", children: "Inactive" })] }), !isGM && (_jsx("div", { className: "flex items-end", children: _jsx(Button, { onClick: () => setAddOpen(true), children: "Add User" }) }))] }), _jsx(Table, { columns: usersColumns, data: viewUsers, emptyText: "No users" }), _jsx(Pagination, { page: userPage, pageSize: userPageSize, total: usersTotal, onChange: setUserPage })] })] }), _jsxs(_Fragment, { children: [_jsx(Modal, { open: !!viewUser, onClose: () => setViewUser(null), title: "User \u2014 View", children: viewUser && (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("b", { children: "Name:" }), " ", viewUser.name] }), _jsxs("div", { children: [_jsx("b", { children: "Email:" }), " ", viewUser.email] }), _jsxs("div", { children: [_jsx("b", { children: "Role:" }), " ", prettifyRole(viewUser.role)] }), _jsxs("div", { children: [_jsx("b", { children: "Status:" }), " ", toUiStatus(viewUser.status)] })] })) }), _jsx(Modal, { open: !!editUser, onClose: () => setEditUser(null), title: "User \u2014 Edit", children: editUser && (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Name", value: editUser.name, onChange: (e) => setEditUser({ ...editUser, name: e.target.value }) }), _jsx(Input, { label: "Email", value: editUser.email, onChange: (e) => setEditUser({ ...editUser, email: e.target.value }) }), _jsx(Select, { label: "Role", value: editRoleId, onChange: (e) => setEditRoleId(e.target.value), children: filteredRoles.map((r) => _jsx("option", { value: r.id, children: prettifyRole(r.name) }, r.id)) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setEditUser(null), children: "Cancel" }), _jsx(Button, { onClick: handleEditSave, children: "Save" })] })] })) }), _jsx(Modal, { open: addOpen, onClose: () => setAddOpen(false), title: "Add User", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Name", value: addName, onChange: (e) => setAddName(e.target.value) }), _jsx(Input, { label: "Email", value: addEmail, onChange: (e) => setAddEmail(e.target.value) }), _jsx(Input, { label: "Password", type: "password", value: addPassword, onChange: (e) => setAddPassword(e.target.value) }), _jsxs(Select, { label: "Role", value: addRoleId, onChange: (e) => setAddRoleId(e.target.value), children: [_jsx("option", { value: "", children: "Select role\u2026" }), filteredRoles.map((r) => _jsx("option", { value: r.id, children: prettifyRole(r.name) }, r.id))] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setAddOpen(false), children: "Cancel" }), _jsx(Button, { onClick: handleCreateUser, disabled: !addName || !addEmail || !addRoleId, children: "Create" })] })] }) }), _jsx(Modal, { open: !!resetUser, onClose: () => { setResetUser(null); setResetPassword(''); }, title: "Reset Password", children: resetUser && (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "text-sm zynq-muted", children: ["Reset password for ", _jsx("span", { className: "font-semibold", children: resetUser.name || resetUser.email })] }), _jsx(Input, { label: "New Password", type: "password", value: resetPassword, onChange: (e) => setResetPassword(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => { setResetUser(null); setResetPassword(''); }, disabled: resetSubmitting, children: "Cancel" }), _jsx(Button, { onClick: handleResetPasswordSubmit, disabled: !resetPassword || resetSubmitting, children: "Reset Password" })] })] })) }), _jsx(Modal, { open: !!viewRole, onClose: () => setViewRole(null), title: "Role \u2014 View", children: viewRole && (_jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { children: [_jsx("b", { children: "Role:" }), " ", prettifyRole(viewRole.name)] }), _jsxs("div", { children: [_jsx("b", { children: "Permissions:" }), " ", viewRole.permissions] })] })) })] })] }) })] }));
}
