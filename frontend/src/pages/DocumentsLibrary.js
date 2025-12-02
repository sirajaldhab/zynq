import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import { useQueryParam } from '../hooks/useQueryParam';
import { useAuth } from '../auth/AuthContext';
import { fetchDocumentCompanies, fetchCompanyDocuments, uploadCompanyDocument, deleteCompanyDocument, getCompanyDocumentDownloadUrl, } from '../api/documentsService';
const COMPANY_DOC_CARDS = [
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
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [companyId, setCompanyId] = useQueryParam('docCompany', '');
    const [docs, setDocs] = useState({
        'company-profile': null,
        'trade-license': null,
        'vat-certificate': null,
        'corporate-tax-certificate': null,
        'establishment-card': null,
    });
    const fileInputRef = useRef(null);
    const [activeDocType, setActiveDocType] = useState(null);
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
            }
            catch {
                setCompanies([]);
            }
            finally {
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
                const next = {
                    'company-profile': null,
                    'trade-license': null,
                    'vat-certificate': null,
                    'corporate-tax-certificate': null,
                    'establishment-card': null,
                };
                metas.forEach((m) => {
                    const key = m.type;
                    if (next[key] === undefined)
                        return;
                    next[key] = {
                        fileName: m.fileName,
                        url: getCompanyDocumentDownloadUrl(companyId, key),
                    };
                });
                setDocs(next);
            }
            catch {
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
    function openFilePicker(type) {
        if (isTeamLeader)
            return;
        setActiveDocType(type);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    }
    async function handleFileChange(e) {
        if (isTeamLeader)
            return;
        const file = e.target.files?.[0];
        if (!file || !activeDocType || !companyId)
            return;
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
        }
        catch (err) {
            present({ message: err?.message || 'Upload failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleDownload(type) {
        const entry = docs[type];
        if (!entry || !companyId) {
            present({ message: 'No file uploaded yet for this card.', color: 'warning', duration: 1600, position: 'top' });
            return;
        }
        try {
            const url = getCompanyDocumentDownloadUrl(companyId, type);
            const token = window.localStorage.getItem('accessToken') || window.localStorage.getItem('token');
            const headers = {};
            if (token)
                headers['Authorization'] = `Bearer ${token}`;
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
        }
        catch (err) {
            present({ message: err?.message || 'Download failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function handleRemove(type) {
        if (isTeamLeader)
            return;
        const entry = docs[type];
        if (!entry || !companyId)
            return;
        try {
            await deleteCompanyDocument(companyId, type);
            setDocs((prev) => ({ ...prev, [type]: null }));
            present({ message: 'Document removed.', color: 'success', duration: 1400, position: 'top' });
        }
        catch (err) {
            present({ message: err?.message || 'Remove failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 space-y-6 bg-[color:var(--bg)] text-[color:var(--text-primary)]", children: [_jsx("div", { className: "text-lg font-semibold mb-2", children: "Documents / Documents" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Documents > Documents" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/documents-main'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "application/pdf", className: "hidden", onChange: handleFileChange }), showList ? (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Select Company" }) }), _jsx(CardContent, { children: loading ? (_jsx("div", { className: "text-sm zynq-muted", children: "Loading companies\u2026" })) : companies.length === 0 ? (_jsx("div", { className: "text-sm zynq-muted", children: "No companies found. Add companies in Documents / Company List." })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4", children: companies.map((c) => (_jsx("button", { type: "button", onClick: () => setCompanyId(c.id), className: "text-left transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] rounded-lg", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "truncate", title: c.name, children: c.name }) }), _jsx(CardContent, { children: _jsx("div", { className: "text-xs zynq-muted", children: c.createdByName ? `Created by ${c.createdByName}` : 'Documents by company' }) })] }) }, c.id))) })) })] })) : (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx(CardTitle, { children: selected?.name || 'Company Documents' }), _jsx("div", { className: "text-xs zynq-muted mt-1", children: "Company-specific documents page" })] }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => setCompanyId(''), children: "Back to companies" })] }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "text-sm zynq-muted", children: ["Manage core compliance documents for ", _jsx("span", { className: "font-semibold", children: selected?.name }), ".", _jsx("br", {})] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: COMPANY_DOC_CARDS.map((card) => {
                                                const entry = docs[card.key];
                                                return (_jsxs("div", { className: "border zynq-border rounded-lg bg-[color:var(--surface)] p-4 flex flex-col justify-between gap-3 shadow-sm", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold mb-1", children: card.title }), _jsx("div", { className: "text-xs zynq-muted mb-2", children: card.description }), entry ? (_jsxs("div", { className: "text-xs", children: [_jsx("span", { className: "font-medium", children: "Current file:" }), ' ', _jsx("span", { className: "break-all", children: entry.fileName })] })) : (_jsx("div", { className: "text-xs zynq-muted", children: "No file uploaded yet." }))] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-2", children: [!isTeamLeader && (_jsx(_Fragment, { children: _jsx(Button, { size: "sm", onClick: () => openFilePicker(card.key), children: entry ? 'Upload New' : 'Upload' }) })), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => handleDownload(card.key), disabled: !entry, children: "Download" }), !isTeamLeader && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => openFilePicker(card.key), disabled: !entry, children: "Edit" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => handleRemove(card.key), disabled: !entry, children: "Remove" })] }))] })] }, card.key));
                                            }) })] }) })] }))] })] }));
}
