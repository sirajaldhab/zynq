import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
import Modal from '../ui/Modal';
import { useAuth } from '../auth/AuthContext';
import { fetchDocumentCompanies, createDocumentCompany, updateDocumentCompany, deleteDocumentCompany, } from '../api/documentsService';
export default function DocumentsCompanyList() {
    const navigate = useNavigate();
    const { role } = useAuth();
    const normalizedRole = (role || '').toUpperCase();
    const isTeamLeader = normalizedRole === 'TEAM LEADER';
    const isGM = normalizedRole === 'GM';
    const [companies, setCompanies] = useState([]);
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
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    async function handleAddCompany() {
        const name = newCompany.trim();
        if (!name)
            return;
        if (companies.some((c) => c.name === name))
            return;
        try {
            setSaving(true);
            const created = await createDocumentCompany({ name });
            setCompanies((prev) => [created, ...prev]);
            setNewCompany('');
            setAddOpen(false);
        }
        finally {
            setSaving(false);
        }
    }
    async function handleEditCompany(c) {
        const current = c.name;
        const next = window.prompt('Edit company name', current);
        if (!next)
            return;
        const trimmed = next.trim();
        if (!trimmed)
            return;
        const updated = await updateDocumentCompany({ id: c.id }, { name: trimmed });
        setCompanies((prev) => prev.map((row) => (row.id === c.id ? updated : row)));
    }
    async function handleDeleteCompany(c) {
        const name = c.name;
        const ok = window.confirm(`Delete company "${name}"?`);
        if (!ok)
            return;
        await deleteDocumentCompany({ id: c.id });
        setCompanies((prev) => prev.filter((row) => row.id !== c.id));
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 space-y-6 bg-[color:var(--bg)] text-[color:var(--text-primary)]", children: [_jsx("div", { className: "text-lg font-semibold mb-2", children: "Documents / Company List" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Documents > Company List" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/documents-main'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Company List" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "flex justify-end mb-4", children: !isTeamLeader && !isGM && (_jsx(Button, { onClick: () => setAddOpen(true), children: "Add Company" })) }), _jsx("div", { className: "overflow-auto rounded-xl border zynq-border bg-[color:var(--surface)] text-xs sm:text-sm", children: _jsxs("table", { className: "min-w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b zynq-border bg-[color:var(--muted)]/10", children: [_jsx("th", { className: "px-3 py-2 text-left", children: "Company Name" }), _jsx("th", { className: "px-3 py-2 text-left", children: "Created By" }), _jsx("th", { className: "px-3 py-2 text-left w-40", children: "Actions" })] }) }), _jsxs("tbody", { children: [companies.map((c) => (_jsxs("tr", { className: "border-b zynq-border last:border-0", children: [_jsx("td", { className: "px-3 py-2 align-top", children: _jsx("div", { className: "text-sm", children: c.name }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("div", { className: "text-sm", children: c.createdByName || '—' }) }), _jsx("td", { className: "px-3 py-2 align-top", children: _jsx("div", { className: "flex flex-wrap gap-2", children: !isTeamLeader && !isGM && (_jsxs(_Fragment, { children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => handleEditCompany(c), children: "Edit" }), _jsx(Button, { size: "sm", variant: "danger", onClick: () => handleDeleteCompany(c), children: "Delete" })] })) }) })] }, c.id))), companies.length === 0 && !loading && (_jsx("tr", { children: _jsx("td", { className: "px-3 py-4 text-center text-[color:var(--text-secondary)]", colSpan: 3, children: "No companies added yet." }) })), loading && (_jsx("tr", { children: _jsx("td", { className: "px-3 py-4 text-center text-[color:var(--text-secondary)]", colSpan: 3, children: "Loading..." }) }))] })] }) })] })] }), _jsx(Modal, { open: addOpen, onClose: () => {
                            if (!saving)
                                setAddOpen(false);
                        }, title: "Add Company", footer: (_jsx(_Fragment, { children: !isTeamLeader && !isGM && (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", onClick: () => !saving && setAddOpen(false), disabled: saving, children: "Cancel" }), _jsx(Button, { onClick: handleAddCompany, disabled: saving || !newCompany.trim(), children: "Save" })] })) })), children: _jsx("div", { className: "space-y-3", children: _jsx(Input, { label: "Company Name", placeholder: "Enter company name", value: newCompany, onChange: (e) => setNewCompany(e.target.value), disabled: isTeamLeader || isGM }) }) })] })] }));
}
