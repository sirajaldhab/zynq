import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { IonButton, IonContent, IonPage, useIonToast, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Table from '../ui/Table';
import Pagination from '../ui/Pagination';
import { toCsv, downloadCsv } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchProjects, createProject, updateProject, deleteProject } from '../api/projectsService';
import { fetchDocumentCompanies } from '../api/documentsService';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import { useAuth } from '../auth/AuthContext';
export default function Projects() {
    const [present] = useIonToast();
    const navigate = useNavigate();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    useEffect(() => {
        console.log('Loaded Projects > Overview page');
    }, []);
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useQueryParam('q', '');
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 8;
    const [filterCompanyId, setFilterCompanyId] = useState('');
    const [filterContractor, setFilterContractor] = useState('');
    const [filterManager, setFilterManager] = useState('');
    const [filterType, setFilterType] = useState('');
    const contractorOptions = useMemo(() => Array.from(new Set(items.map(i => i.main_contractor || '').filter(Boolean))), [items]);
    const managerOptions = useMemo(() => Array.from(new Set(items.map(i => i.project_manager_id || '').filter(Boolean))), [items]);
    const [companies, setCompanies] = useState([]);
    // Fetch from backend with fallback to local RxDB data
    useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                const res = await fetchProjects({
                    page,
                    pageSize,
                    contractor: filterContractor || undefined,
                    manager: filterManager || undefined,
                    type: (filterType || undefined),
                    companyId: filterCompanyId || undefined,
                    token,
                });
                setItems(res.data);
                setTotal(res.total || res.data.length);
            }
            catch (_) {
                present({ message: 'Failed to load projects.', color: 'danger', duration: 2000, position: 'top' });
                setItems([]);
                setTotal(0);
            }
        })();
    }, [page, pageSize, filterCompanyId, filterContractor, filterManager, filterType]);
    // Load companies for dropdown from Documents > Company List
    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('token') || undefined;
                const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
                setCompanies(res.data || []);
            }
            catch (_) {
                // Keep silent here to avoid noisy toasts; project creation will still work with fallback company handling on backend
            }
        })();
    }, []);
    function exportProjectsCsv() {
        const cols = [
            { key: 'main_contractor', header: 'Main-Contractor' },
            { key: 'project_manager_id', header: 'Project-Manager' },
            { key: 'client', header: 'Client', map: (r) => r.client?.name || r.clientId || '' },
            { key: 'name', header: 'Project' },
            { key: 'site', header: 'Site' },
            { key: 'parentId', header: 'Type', map: (r) => (r.parentId ? 'Sub' : 'Main') },
        ];
        downloadCsv('projects.csv', toCsv(items, cols));
    }
    function resetFilters() {
        setPage(1);
        setFilterCompanyId('');
        setFilterContractor('');
        setFilterManager('');
        setFilterType('');
    }
    // CRUD UI state
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [busy, setBusy] = useState(false);
    const [form, setForm] = useState({ name: '', project_manager_id: '', clientId: '', main_contractor: '', site: '', type: 'MAIN', parentId: null, companyId: '' });
    function openCreate() {
        setForm({
            name: '',
            project_manager_id: '',
            clientId: '',
            main_contractor: '',
            site: '',
            type: 'MAIN',
            parentId: null,
            companyId: '',
        });
        setCreating(true);
    }
    function openEdit(p) {
        setForm({
            name: p.name,
            project_manager_id: p.project_manager_id || '',
            clientId: p.client?.name || p.clientId || '',
            main_contractor: p.main_contractor || '',
            site: p.site || '',
            type: p.parentId ? 'SUB' : 'MAIN',
            parentId: p.parentId || null,
            companyId: p.companyId || p.company?.id || '',
        });
        setEditing(p);
    }
    function openDelete(p) { setDeleting(p); }
    async function refresh() {
        const token = localStorage.getItem('token') || undefined;
        const res = await fetchProjects({
            page,
            pageSize,
            contractor: filterContractor || undefined,
            manager: filterManager || undefined,
            type: (filterType || undefined),
            companyId: filterCompanyId || undefined,
            token,
        });
        setItems(res.data);
        setTotal(res.total || res.data.length);
    }
    async function handleCreate() {
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            await createProject({
                companyId: form.companyId || undefined,
                name: form.name,
                project_manager_id: form.project_manager_id || undefined,
                clientName: form.clientId || undefined,
                main_contractor: form.main_contractor || undefined,
                site: form.site || undefined,
                parentId: form.type === 'SUB' ? (form.parentId || undefined) : undefined,
                token,
            });
            present({ message: 'Project created', color: 'success', duration: 1500, position: 'top' });
            setCreating(false);
            await refresh();
        }
        catch (_) {
            present({ message: 'Create failed', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    async function handleEdit() {
        if (!editing)
            return;
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateProject({ id: editing.id, token }, {
                name: form.name,
                project_manager_id: form.project_manager_id || null,
                clientId: form.clientId || null,
                main_contractor: form.main_contractor || null,
                site: form.site || null,
                parentId: form.type === 'SUB' ? (form.parentId || null) : null,
                companyId: form.companyId || undefined,
            });
            present({ message: 'Project updated', color: 'success', duration: 1500, position: 'top' });
            setEditing(null);
            await refresh();
        }
        catch (_) {
            present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    async function handleDelete() {
        if (!deleting)
            return;
        setBusy(true);
        const token = localStorage.getItem('token') || undefined;
        try {
            await deleteProject({ id: deleting.id, token });
            present({ message: 'Project deleted', color: 'success', duration: 1500, position: 'top' });
            setDeleting(null);
            await refresh();
        }
        catch (_) {
            present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
        }
        finally {
            setBusy(false);
        }
    }
    const mainProjects = useMemo(() => items.filter(p => !p.parentId), [items]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)]", children: _jsx("div", { className: "w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4", children: _jsxs("div", { className: "max-w-screen-md lg:max-w-none space-y-4 mx-auto", children: [_jsxs("div", { className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between", children: [_jsx("div", { className: "text-lg font-semibold hidden lg:block", children: "Projects" }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", children: [_jsx(IonButton, { size: "small", onClick: openCreate, className: "w-full sm:w-auto justify-center px-4", children: "Add Project" }), _jsx(IonButton, { size: "small", onClick: resetFilters, color: "medium", className: "w-full sm:w-auto justify-center px-4", children: "Reset Filters" }), _jsx(IonButton, { size: "small", onClick: exportProjectsCsv, className: "w-full sm:w-auto justify-center px-4", children: "Export CSV" })] })] }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Projects" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2 w-full sm:w-auto justify-center", onClick: () => navigate('/'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3", children: [_jsxs("select", { className: "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm", value: filterCompanyId, onChange: (e) => {
                                            setFilterCompanyId(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "Company" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsxs("select", { className: "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm", value: filterContractor, onChange: (e) => {
                                            setFilterContractor(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "Main-Contractor" }), contractorOptions.map(c => (_jsx("option", { value: c, children: c }, c)))] }), _jsxs("select", { className: "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm", value: filterManager, onChange: (e) => {
                                            setFilterManager(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "Project-Manager" }), managerOptions.map(m => (_jsx("option", { value: m, children: m }, m)))] }), _jsxs("select", { className: "w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm", value: filterType, onChange: (e) => {
                                            setFilterType(e.target.value);
                                            setPage(1);
                                        }, children: [_jsx("option", { value: "", children: "Type" }), _jsx("option", { value: "MAIN", children: "Main" }), _jsx("option", { value: "SUB", children: "Sub" })] })] }), _jsx("div", { className: "space-y-3", children: (() => {
                                    const cols = [
                                        { key: 'company', header: 'Company', render: (r) => (r.company?.name || '—') },
                                        { key: 'main_contractor', header: 'Main-Contractor', render: (r) => r.main_contractor || '—' },
                                        { key: 'project_manager_id', header: 'Project-Manager', render: (r) => r.project_manager_id || '—' },
                                        { key: 'client', header: 'Client', render: (r) => (r.client?.name || r.clientId || '—') },
                                        { key: 'name', header: 'Project', render: (r) => (_jsx("span", { className: "text-blue-500 hover:underline cursor-pointer", onClick: () => navigate(`/projects/view/${r.id}`), children: r.name })) },
                                        { key: 'site', header: 'Site', render: (r) => r.site || '—' },
                                        { key: 'type', header: 'Type', render: (r) => (r.parentId ? 'Sub' : 'Main') },
                                        { key: 'actions', header: 'Actions', render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => navigate(`/projects/${r.id}/material-delivery`, { state: { projectName: r.name } }), children: "Material Delivery" }), !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => openEdit(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => openDelete(r), children: "Delete" })] }))] })) },
                                    ];
                                    const view = items;
                                    return (_jsxs(_Fragment, { children: [_jsx(Table, { columns: cols, data: view, emptyText: "No projects found" }), _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage })] }));
                                })() }), creating || editing ? (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(680px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: creating ? 'Add Project' : 'Edit Project' }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [_jsx(Input, { label: "Project Name", value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }), _jsxs(Select, { label: "Company", value: form.companyId || '', onChange: (e) => setForm({ ...form, companyId: e.target.value }), children: [_jsx("option", { value: "", children: "Select Company" }), companies.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))] }), _jsx(Input, { label: "Project Manager", value: form.project_manager_id, onChange: (e) => setForm({ ...form, project_manager_id: e.target.value }) }), _jsx(Input, { label: "Client", value: form.clientId, onChange: (e) => setForm({ ...form, clientId: e.target.value }) }), _jsx(Input, { label: "Contractor", value: form.main_contractor, onChange: (e) => setForm({ ...form, main_contractor: e.target.value }) }), _jsx(Input, { label: "Site", value: form.site, onChange: (e) => setForm({ ...form, site: e.target.value }) }), _jsxs(Select, { label: "Type", value: form.type, onChange: (e) => setForm({ ...form, type: e.target.value }), children: [_jsx("option", { value: "MAIN", children: "Main Project" }), _jsx("option", { value: "SUB", children: "Sub-Project" })] }), form.type === 'SUB' ? (_jsxs(Select, { label: "Main-Contractor", value: form.parentId || '', onChange: (e) => setForm({ ...form, parentId: e.target.value || null }), children: [_jsx("option", { value: "", children: "Select Main-Contractor" }), mainProjects.map(p => (_jsx("option", { value: p.id, children: p.main_contractor || p.name }, p.id)))] })) : null] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => { setCreating(false); setEditing(null); }, disabled: busy, children: "Cancel" }), creating ? (_jsx(Button, { onClick: handleCreate, disabled: busy || !form.companyId, children: "Create" })) : (_jsx(Button, { onClick: handleEdit, disabled: busy, children: "Save" }))] })] }) })) : null, deleting ? (_jsx("div", { className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(420px,95vw)] space-y-3", children: [_jsx("div", { className: "text-base font-semibold", children: "Delete Project" }), _jsxs("div", { className: "text-sm", children: ["Delete project ", _jsx("span", { className: "font-medium", children: deleting.name }), "?"] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { variant: "secondary", onClick: () => setDeleting(null), disabled: busy, children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: handleDelete, disabled: busy, children: "Delete" })] })] }) })) : null] }) }) })] }));
}
