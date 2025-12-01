import React, { useEffect, useState, useRef } from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import { useQueryParam } from '../hooks/useQueryParam';
import { useAuth } from '../auth/AuthContext';
import {
  fetchDocumentCompanies,
  DocumentCompanyDto,
  fetchCompanyDocuments,
  uploadCompanyDocument,
  deleteCompanyDocument,
  getCompanyDocumentDownloadUrl,
} from '../api/documentsService';

type CompanyDocType =
  | 'company-profile'
  | 'trade-license'
  | 'vat-certificate'
  | 'corporate-tax-certificate'
  | 'establishment-card';

const COMPANY_DOC_CARDS: { key: CompanyDocType; title: string; description: string }[] = [
  { key: 'company-profile', title: 'Company Profile', description: 'Core information and overview of the company.' },
  { key: 'trade-license', title: 'Trade License', description: 'Valid trade/commercial license for this entity.' },
  { key: 'vat-certificate', title: 'VAT Certificate', description: 'Tax registration / VAT certificate documents.' },
  { key: 'corporate-tax-certificate', title: 'Corporate Tax Certificate', description: 'Corporate income tax registration documents.' },
  { key: 'establishment-card', title: 'Establishment Card', description: 'Establishment or immigration card documents.' },
];

export default function DocumentsLibrary() {
  const navigate = useNavigate();
  const [present] = useIonToast();
  const { role } = useAuth();
  const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
  const [companies, setCompanies] = useState<DocumentCompanyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [companyId, setCompanyId] = useQueryParam<string>('docCompany', '');
  const [docs, setDocs] = useState<Record<CompanyDocType, { fileName: string; url: string } | null>>({
    'company-profile': null,
    'trade-license': null,
    'vat-certificate': null,
    'corporate-tax-certificate': null,
    'establishment-card': null,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeDocType, setActiveDocType] = useState<CompanyDocType | null>(null);

  useEffect(() => {
    console.log('Loaded Documents > Documents Library');
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token') || undefined;
        const res = await fetchDocumentCompanies({ page: 1, pageSize: 200, token });
        setCompanies(res.data || []);
      } catch {
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load existing documents for the selected company
  useEffect(() => {
    if (!companyId) {
      setDocs({
        'company-profile': null,
        'trade-license': null,
        'vat-certificate': null,
        'corporate-tax-certificate': null,
        'establishment-card': null,
      });
      return;
    }
    (async () => {
      try {
        const metas = await fetchCompanyDocuments(companyId);
        const next: typeof docs = {
          'company-profile': null,
          'trade-license': null,
          'vat-certificate': null,
          'corporate-tax-certificate': null,
          'establishment-card': null,
        };
        metas.forEach((m) => {
          const key = m.type as CompanyDocType;
          if (next[key] === undefined) return;
          next[key] = {
            fileName: m.fileName,
            url: getCompanyDocumentDownloadUrl(companyId, key),
          };
        });
        setDocs(next);
      } catch {
        setDocs({
          'company-profile': null,
          'trade-license': null,
          'vat-certificate': null,
          'corporate-tax-certificate': null,
          'establishment-card': null,
        });
      }
    })();
  }, [companyId]);

  const selected = companyId ? companies.find((c) => c.id === companyId) : undefined;

  const showList = !companyId || !selected;

  function openFilePicker(type: CompanyDocType) {
    if (isTeamLeader) return;
    setActiveDocType(type);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isTeamLeader) return;
    const file = e.target.files?.[0];
    if (!file || !activeDocType || !companyId) return;
    if (file.type !== 'application/pdf') {
      present({ message: 'Please upload a PDF file.', color: 'warning', duration: 1800, position: 'top' });
      return;
    }
    try {
      const meta = await uploadCompanyDocument(companyId, activeDocType, file);
      setDocs((prev) => ({
        ...prev,
        [activeDocType]: {
          fileName: meta.fileName,
          url: getCompanyDocumentDownloadUrl(companyId, activeDocType),
        },
      }));
      present({ message: 'Document uploaded.', color: 'success', duration: 1500, position: 'top' });
    } catch (err: any) {
      present({ message: err?.message || 'Upload failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleDownload(type: CompanyDocType) {
    const entry = docs[type];
    if (!entry || !companyId) {
      present({ message: 'No file uploaded yet for this card.', color: 'warning', duration: 1600, position: 'top' });
      return;
    }
    try {
      const url = getCompanyDocumentDownloadUrl(companyId, type);
      const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(`Download failed (${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = entry.fileName || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      present({ message: err?.message || 'Download failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  async function handleRemove(type: CompanyDocType) {
    if (isTeamLeader) return;
    const entry = docs[type];
    if (!entry || !companyId) return;
    try {
      await deleteCompanyDocument(companyId, type);
      setDocs((prev) => ({ ...prev, [type]: null }));
      present({ message: 'Document removed.', color: 'success', duration: 1400, position: 'top' });
    } catch (err: any) {
      present({ message: err?.message || 'Remove failed', color: 'danger', duration: 2000, position: 'top' });
    }
  }

  return (
    <IonPage>
      <Nav />
      <IonContent className="p-8 space-y-6 bg-[color:var(--bg)] text-[color:var(--text-primary)]">
        <div className="text-lg font-semibold mb-2">Documents / Documents</div>
        <div className="zynq-muted text-sm">Home &gt; Documents &gt; Documents</div>
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

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        {showList ? (
          <Card>
            <CardHeader>
              <CardTitle>Select Company</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm zynq-muted">Loading companies…</div>
              ) : companies.length === 0 ? (
                <div className="text-sm zynq-muted">No companies found. Add companies in Documents / Company List.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {companies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCompanyId(c.id)}
                      className="text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] rounded-lg"
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="truncate" title={c.name}>{c.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xs zynq-muted">
                            {c.createdByName ? `Created by ${c.createdByName}` : 'Documents by company'}
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>{selected?.name || 'Company Documents'}</CardTitle>
                <div className="text-xs zynq-muted mt-1">Company-specific documents page</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setCompanyId('')}>
                Back to companies
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm zynq-muted">
                  Manage core compliance documents for <span className="font-semibold">{selected?.name}</span>.
                  <br />
                  
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {COMPANY_DOC_CARDS.map((card) => {
                    const entry = docs[card.key];
                    return (
                      <div
                        key={card.key}
                        className="border zynq-border rounded-lg bg-[color:var(--surface)] p-4 flex flex-col justify-between gap-3 shadow-sm"
                      >
                        <div>
                          <div className="text-sm font-semibold mb-1">{card.title}</div>
                          <div className="text-xs zynq-muted mb-2">{card.description}</div>
                          {entry ? (
                            <div className="text-xs">
                              <span className="font-medium">Current file:</span>{' '}
                              <span className="break-all">{entry.fileName}</span>
                            </div>
                          ) : (
                            <div className="text-xs zynq-muted">No file uploaded yet.</div>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {!isTeamLeader && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openFilePicker(card.key)}
                              >
                                {entry ? 'Upload New' : 'Upload'}
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleDownload(card.key)}
                            disabled={!entry}
                          >
                            Download
                          </Button>
                          {!isTeamLeader && (
                            <>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => openFilePicker(card.key)}
                                disabled={!entry}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleRemove(card.key)}
                                disabled={!entry}
                              >
                                Remove
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </IonContent>
    </IonPage>
  );
}
