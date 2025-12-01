import React, { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import Modal from '../ui/Modal';
import { useAuth } from '../auth/AuthContext';
import {
  fetchDocumentCompanies,
  createDocumentCompany,
  updateDocumentCompany,
  deleteDocumentCompany,
  DocumentCompanyDto,
} from '../api/documentsService';

export default function DocumentsCompanyList() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const normalizedRole = (role || '').toUpperCase();
  const isTeamLeader = normalizedRole === 'TEAM LEADER';
  const isGM = normalizedRole === 'GM';
  const [companies, setCompanies] = useState<DocumentCompanyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    console.log('Loaded Documents > Company List');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetchDocumentCompanies({ page: 1, pageSize: 200 });
        setCompanies(res.data || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAddCompany() {
    const name = newCompany.trim();
    if (!name) return;
    if (companies.some((c) => c.name === name)) return;
    try {
      setSaving(true);
      const created = await createDocumentCompany({ name });
      setCompanies((prev) => [created, ...prev]);
      setNewCompany('');
      setAddOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditCompany(c: DocumentCompanyDto) {
    const current = c.name;
    const next = window.prompt('Edit company name', current);
    if (!next) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    const updated = await updateDocumentCompany({ id: c.id }, { name: trimmed });
    setCompanies((prev) => prev.map((row) => (row.id === c.id ? updated : row)));
  }

  async function handleDeleteCompany(c: DocumentCompanyDto) {
    const name = c.name;
    const ok = window.confirm(`Delete company "${name}"?`);
    if (!ok) return;
    await deleteDocumentCompany({ id: c.id });
    setCompanies((prev) => prev.filter((row) => row.id !== c.id));
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 space-y-6 bg-[color:var(--bg)] text-[color:var(--text-primary)]">
        <div className="text-lg font-semibold mb-2">Documents / Company List</div>
        <div className="zynq-muted text-sm">Home &gt; Documents &gt; Company List</div>
        <div>
          <Button
            variant="secondary"
            size="sm"
            className="mt-2 flex items-center gap-2"
            onClick={() => navigate('/documents-main')}
          >
            <IonIcon icon={chevronBackOutline} />
            <span>Back</span>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Company List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end mb-4">
              {!isTeamLeader && !isGM && (
                <Button onClick={() => setAddOpen(true)}>Add Company</Button>
              )}
            </div>

            <div className="overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-xs sm:text-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b zynq-border bg-[color:var(--muted)]/10">
                    <th className="px-3 py-2 text-left">Company Name</th>
                    <th className="px-3 py-2 text-left">Created By</th>
                    <th className="px-3 py-2 text-left w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b zynq-border last:border-0">
                      <td className="px-3 py-2 align-top">
                        <div className="text-sm">{c.name}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="text-sm">{c.createdByName || '—'}</div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-wrap gap-2">
                          {!isTeamLeader && !isGM && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEditCompany(c)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteCompany(c)}
                              >
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && !loading && (
                    <tr>
                      <td className="px-3 py-4 text-center text-[color:var(--text-secondary)]" colSpan={3}>
                        No companies added yet.
                      </td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td className="px-3 py-4 text-center text-[color:var(--text-secondary)]" colSpan={3}>
                        Loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Modal
          open={addOpen}
          onClose={() => {
            if (!saving) setAddOpen(false);
          }}
          title="Add Company"
          footer={(
            <>
              {!isTeamLeader && !isGM && (
                <>
                  <Button variant="secondary" onClick={() => !saving && setAddOpen(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddCompany} disabled={saving || !newCompany.trim()}>
                    Save
                  </Button>
                </>
              )}
            </>
          )}
        >
          <div className="space-y-3">
            <Input
              label="Company Name"
              placeholder="Enter company name"
              value={newCompany}
              onChange={(e) => setNewCompany((e.target as HTMLInputElement).value)}
              disabled={isTeamLeader || isGM}
            />
          </div>
        </Modal>
      </IonContent>
    </IonPage>
  );
}
