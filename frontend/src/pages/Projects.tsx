import React, { useEffect, useMemo, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, useIonToast, IonIcon } from '@ionic/react';
import Nav from '../components/Nav';
import Table, { Column } from '../ui/Table';
import Pagination from '../ui/Pagination';
import { toCsv, downloadCsv, CsvColumn } from '../utils/csv';
import { useQueryParam } from '../hooks/useQueryParam';
import { fetchProjects, ProjectDto, createProject, updateProject, deleteProject } from '../api/projectsService';
import { fetchDocumentCompanies, DocumentCompanyDto } from '../api/documentsService';
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
  const [items, setItems] = useState<ProjectDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useQueryParam<string>('q', '');
  const [page, setPage] = useQueryParam<number>('page', 1);
  const pageSize = 8;
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterContractor, setFilterContractor] = useState('');
  const [filterManager, setFilterManager] = useState('');
  const [filterType, setFilterType] = useState<'' | 'MAIN' | 'SUB'>('');
  const contractorOptions = useMemo(() => Array.from(new Set(items.map(i => i.main_contractor || '').filter(Boolean))), [items]);
  const managerOptions = useMemo(() => Array.from(new Set(items.map(i => i.project_manager_id || '').filter(Boolean))), [items]);
  const [companies, setCompanies] = useState<DocumentCompanyDto[]>([]);

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
          type: (filterType || undefined) as any,
          companyId: filterCompanyId || undefined,
          token,
        });
        setItems(res.data);
        setTotal(res.total || res.data.length);
      } catch (_) {
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
      } catch (_) {
        // Keep silent here to avoid noisy toasts; project creation will still work with fallback company handling on backend
      }
    })();
  }, []);

  function exportProjectsCsv() {
    const cols: CsvColumn<ProjectDto>[] = [
      { key: 'main_contractor', header: 'Main-Contractor' },
      { key: 'project_manager_id', header: 'Project-Manager' },
      { key: 'client', header: 'Client', map: (r) => (r as any).client?.name || (r as any).clientId || '' },
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
  const [editing, setEditing] = useState<ProjectDto | null>(null);
  const [deleting, setDeleting] = useState<ProjectDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    project_manager_id?: string;
    clientId?: string;
    main_contractor?: string;
    site?: string;
    type: 'MAIN' | 'SUB';
    parentId?: string | null;
    companyId?: string;
  }>({ name: '', project_manager_id: '', clientId: '', main_contractor: '', site: '', type: 'MAIN', parentId: null, companyId: '' });

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
  function openEdit(p: ProjectDto) {
    setForm({
      name: p.name,
      project_manager_id: p.project_manager_id || '',
      clientId: (p as any).client?.name || p.clientId || '',
      main_contractor: p.main_contractor || '',
      site: p.site || '',
      type: p.parentId ? 'SUB' : 'MAIN',
      parentId: p.parentId || null,
      companyId: (p.companyId as string | undefined) || (p.company?.id as string | undefined) || '',
    });
    setEditing(p);
  }
  function openDelete(p: ProjectDto) { setDeleting(p); }

  async function refresh() {
    const token = localStorage.getItem('token') || undefined;
    const res = await fetchProjects({
      page,
      pageSize,
      contractor: filterContractor || undefined,
      manager: filterManager || undefined,
      type: (filterType || undefined) as any,
      companyId: filterCompanyId || undefined,
      token,
    });
    setItems(res.data); setTotal(res.total || res.data.length);
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
      } as any);
      present({ message: 'Project created', color: 'success', duration: 1500, position: 'top' });
      setCreating(false);
      await refresh();
    } catch (_) {
      present({ message: 'Create failed', color: 'danger', duration: 1800, position: 'top' });
    } finally { setBusy(false); }
  }

  async function handleEdit() {
    if (!editing) return;
    setBusy(true);
    const token = localStorage.getItem('token') || undefined;
    try {
      await updateProject(
        { id: editing.id, token },
        {
          name: form.name,
          project_manager_id: form.project_manager_id || null,
          clientId: form.clientId || null,
          main_contractor: form.main_contractor || null,
          site: form.site || null,
          parentId: form.type === 'SUB' ? (form.parentId || null) : null,
          companyId: form.companyId || undefined,
        } as any,
      );
      present({ message: 'Project updated', color: 'success', duration: 1500, position: 'top' });
      setEditing(null);
      await refresh();
    } catch (_) {
      present({ message: 'Update failed', color: 'danger', duration: 1800, position: 'top' });
    } finally { setBusy(false); }
  }

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    const token = localStorage.getItem('token') || undefined;
    try {
      await deleteProject({ id: deleting.id, token });
      present({ message: 'Project deleted', color: 'success', duration: 1500, position: 'top' });
      setDeleting(null);
      await refresh();
    } catch (_) {
      present({ message: 'Delete failed', color: 'danger', duration: 1800, position: 'top' });
    } finally { setBusy(false); }
  }

  const mainProjects = useMemo(() => items.filter(p => !p.parentId), [items]);

  return (
    <IonPage>
      <Nav />
      <IonContent className="bg-[color:var(--bg)]">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="max-w-screen-md lg:max-w-none space-y-4 mx-auto">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-lg font-semibold hidden lg:block">Projects</div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <IonButton size="small" onClick={openCreate} className="w-full sm:w-auto justify-center px-4">Add Project</IonButton>
                <IonButton size="small" onClick={resetFilters} color="medium" className="w-full sm:w-auto justify-center px-4">Reset Filters</IonButton>
                <IonButton size="small" onClick={exportProjectsCsv} className="w-full sm:w-auto justify-center px-4">Export CSV</IonButton>
              </div>
            </div>
            <div className="zynq-muted text-sm hidden lg:block">Home &gt; Projects</div>
            <div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2 flex items-center gap-2 w-full sm:w-auto justify-center"
                onClick={() => navigate('/')}
              >
                <IonIcon icon={chevronBackOutline} />
                <span>Back</span>
              </Button>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <select
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            value={filterCompanyId}
            onChange={(e) => {
              setFilterCompanyId((e.target as HTMLSelectElement).value);
              setPage(1);
            }}
          >
            <option value="">Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            value={filterContractor}
            onChange={(e) => {
              setFilterContractor((e.target as HTMLSelectElement).value);
              setPage(1);
            }}
          >
            <option value="">Main-Contractor</option>
            {contractorOptions.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            value={filterManager}
            onChange={(e) => {
              setFilterManager((e.target as HTMLSelectElement).value);
              setPage(1);
            }}
          >
            <option value="">Project-Manager</option>
            {managerOptions.map(m => (<option key={m} value={m}>{m}</option>))}
          </select>
          <select
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm"
            value={filterType}
            onChange={(e) => {
              setFilterType((e.target as HTMLSelectElement).value as any);
              setPage(1);
            }}
          >
            <option value="">Type</option>
            <option value="MAIN">Main</option>
            <option value="SUB">Sub</option>
          </select>
          </div>
          <div className="space-y-3">
          {(() => {
          const cols: Column<ProjectDto>[] = [
            { key: 'company', header: 'Company', render: (r) => (r.company?.name || '—') },
            { key: 'main_contractor', header: 'Main-Contractor', render: (r) => r.main_contractor || '—' },
            { key: 'project_manager_id', header: 'Project-Manager', render: (r) => r.project_manager_id || '—' },
            { key: 'client', header: 'Client', render: (r) => ((r as any).client?.name || r.clientId || '—') },
            { key: 'name', header: 'Project', render: (r) => (
              <span
                className="text-blue-500 hover:underline cursor-pointer"
                onClick={() => navigate(`/projects/view/${r.id}`)}
              >
                {r.name}
              </span>
            ) },
            { key: 'site', header: 'Site', render: (r) => r.site || '—' },
            { key: 'type', header: 'Type', render: (r) => (r.parentId ? 'Sub' : 'Main') },
            { key: 'actions', header: 'Actions', render: (r) => (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/projects/${r.id}/material-delivery`, { state: { projectName: r.name } })}
                >
                  Material Delivery
                </Button>
                {!isTeamLeader && (
                  <>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => openDelete(r)}>Delete</Button>
                  </>
                )}
              </div>
            ) },
          ];
          const view = items;
          return (
            <>
              <Table columns={cols} data={view} emptyText="No projects found" />
              <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />
            </>
          );
          })()}
          </div>

          {/* Add/Edit Modal */}
          {creating || editing ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(680px,95vw)] space-y-3">
              <div className="text-base font-semibold">{creating ? 'Add Project' : 'Edit Project'}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Project Name" value={form.name} onChange={(e: any) => setForm({ ...form, name: (e.target as HTMLInputElement).value })} />
                <Select
                  label="Company"
                  value={form.companyId || ''}
                  onChange={(e: any) => setForm({ ...form, companyId: (e.target as HTMLSelectElement).value })}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <Input label="Project Manager" value={form.project_manager_id} onChange={(e: any) => setForm({ ...form, project_manager_id: (e.target as HTMLInputElement).value })} />
                <Input label="Client" value={form.clientId} onChange={(e: any) => setForm({ ...form, clientId: (e.target as HTMLInputElement).value })} />
                <Input label="Contractor" value={form.main_contractor} onChange={(e: any) => setForm({ ...form, main_contractor: (e.target as HTMLInputElement).value })} />
                <Input label="Site" value={form.site} onChange={(e: any) => setForm({ ...form, site: (e.target as HTMLInputElement).value })} />
                <Select label="Type" value={form.type} onChange={(e: any) => setForm({ ...form, type: (e.target as HTMLSelectElement).value as any })}>
                  <option value="MAIN">Main Project</option>
                  <option value="SUB">Sub-Project</option>
                </Select>
                {form.type === 'SUB' ? (
                  <Select label="Main-Contractor" value={form.parentId || ''} onChange={(e: any) => setForm({ ...form, parentId: (e.target as HTMLSelectElement).value || null })}>
                    <option value="">Select Main-Contractor</option>
                    {mainProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.main_contractor || p.name}</option>
                    ))}
                  </Select>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => { setCreating(false); setEditing(null); }} disabled={busy}>Cancel</Button>
                {creating ? (
                  <Button onClick={handleCreate} disabled={busy || !form.companyId}>Create</Button>
                ) : (
                  <Button onClick={handleEdit} disabled={busy}>Save</Button>
                )}
              </div>
            </div>
          </div>
          ) : null}

          {/* Delete confirm */}
          {deleting ? (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[color:var(--surface)] zynq-border border rounded-md p-4 w-[min(420px,95vw)] space-y-3">
              <div className="text-base font-semibold">Delete Project</div>
              <div className="text-sm">Delete project <span className="font-medium">{deleting.name}</span>?</div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>Cancel</Button>
                <Button variant="danger" onClick={handleDelete} disabled={busy}>Delete</Button>
              </div>
            </div>
          </div>
          ) : null}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
