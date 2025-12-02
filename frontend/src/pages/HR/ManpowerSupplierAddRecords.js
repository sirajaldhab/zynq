import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonIcon, useIonToast } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import { chevronBackOutline } from 'ionicons/icons';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Select from '../../ui/Select';
import Table from '../../ui/Table';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { fetchVendors } from '../../api/vendorsService';
import { fetchProjects } from '../../api/projectsService';
import { fetchManpowerRecords, createManpowerRecord, deleteManpowerRecord } from '../../api/manpowerRecordsService';
import { useAuth } from '../../auth/AuthContext';
export default function HRAttendanceManpowerSupplierAddRecords() {
    const navigate = useNavigate();
    const [present] = useIonToast();
    const { role } = useAuth();
    const isTeamLeader = (role || '').toUpperCase() === 'TEAM LEADER';
    const [suppliers, setSuppliers] = React.useState([]);
    const [projects, setProjects] = React.useState([]);
    const [siteOptions, setSiteOptions] = React.useState([]);
    const [records, setRecords] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);
    const [supplierId, setSupplierId] = React.useState('');
    const [site, setSite] = React.useState('');
    const [date, setDate] = React.useState('');
    const [totalLabour, setTotalLabour] = React.useState('');
    const [dailyRate, setDailyRate] = React.useState('');
    const [errors, setErrors] = React.useState({});
    const [filterSupplierId, setFilterSupplierId] = React.useState('');
    const [filterSite, setFilterSite] = React.useState('');
    const [filterFrom, setFilterFrom] = React.useState('');
    const [filterTo, setFilterTo] = React.useState('');
    const total = React.useMemo(() => {
        const labour = Number(totalLabour) || 0;
        const rate = Number(dailyRate) || 0;
        return labour * rate;
    }, [totalLabour, dailyRate]);
    React.useEffect(() => {
        const token = localStorage.getItem('token') || undefined;
        (async () => {
            try {
                setLoading(true);
                const [vendorsRes, projectsRes, recordsRes] = await Promise.all([
                    fetchVendors({ token }),
                    fetchProjects({ page: 1, pageSize: 500, token }),
                    fetchManpowerRecords({ token }),
                ]);
                setSuppliers(vendorsRes || []);
                const projectsList = projectsRes?.data ?? [];
                setProjects(projectsList);
                const sites = [];
                const seen = new Set();
                projectsList.forEach((p) => {
                    const siteName = (p.site || '').trim();
                    if (!siteName)
                        return;
                    if (seen.has(siteName))
                        return;
                    seen.add(siteName);
                    sites.push({ site: siteName, projectId: p.id, main_contractor: p.main_contractor });
                });
                setSiteOptions(sites);
                setRecords(recordsRes || []);
            }
            catch (e) {
                setSuppliers([]);
                setProjects([]);
                setSiteOptions([]);
                setRecords([]);
                present({ message: 'Failed to load data.', color: 'danger', duration: 1800, position: 'top' });
            }
            finally {
                setLoading(false);
            }
        })();
    }, [present]);
    const columns = [
        {
            key: 'createdAt',
            header: 'Date',
            render: (r) => {
                const raw = r.date || r.createdAt;
                if (!raw)
                    return '';
                try {
                    return new Date(raw).toLocaleDateString();
                }
                catch {
                    return String(raw);
                }
            },
        },
        {
            key: 'supplierName',
            header: 'Manpower Supplier',
            render: (r) => r.vendor?.name || r.supplierName || r.vendorId,
        },
        {
            key: 'site',
            header: 'Site',
        },
        {
            key: 'projectName',
            header: 'Project',
            render: (r) => r.project?.name || r.projectName || r.projectId,
        },
        {
            key: 'main_contractor',
            header: 'Main Contractor',
            render: (r) => r.main_contractor || r.project?.main_contractor || '—',
        },
        {
            key: 'totalLabour',
            header: 'Total Labour',
            render: (r) => Number(r.totalLabour || 0).toLocaleString(),
        },
        {
            key: 'dailyRate',
            header: 'Daily Rate',
            render: (r) => Number(r.dailyRate || 0).toLocaleString(),
        },
        {
            key: 'total',
            header: 'Total',
            render: (r) => Number(r.total || 0).toLocaleString(),
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (!isTeamLeader ? (_jsx(Button, { size: "sm", variant: "danger", onClick: async () => {
                    if (!r.id)
                        return;
                    if (!window.confirm('Are you sure you want to delete this record?'))
                        return;
                    const token = localStorage.getItem('token') || undefined;
                    try {
                        await deleteManpowerRecord({ id: r.id, token });
                        setRecords((prev) => prev.filter((rec) => rec.id !== r.id));
                        present({ message: 'Record deleted.', color: 'success', duration: 1500, position: 'top' });
                    }
                    catch (e) {
                        const msg = e?.message || e?.error || 'Failed to delete record.';
                        present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
                    }
                }, children: "Delete" })) : null),
        },
    ];
    async function handleSubmit() {
        const nextErrors = {};
        if (!supplierId)
            nextErrors.supplierId = 'Manpower Supplier is required';
        if (!site)
            nextErrors.site = 'Site is required';
        const labourNum = Number(totalLabour);
        const rateNum = Number(dailyRate);
        if (!Number.isFinite(labourNum) || labourNum <= 0)
            nextErrors.totalLabour = 'Total Labour must be greater than 0';
        if (!Number.isFinite(rateNum) || rateNum <= 0)
            nextErrors.dailyRate = 'Daily Rate must be greater than 0';
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            present({ message: 'Please fill in all required fields.', color: 'danger', duration: 1800, position: 'top' });
            return;
        }
        const siteMeta = siteOptions.find((s) => s.site === site);
        if (!siteMeta) {
            present({ message: 'Invalid site selected.', color: 'danger', duration: 1800, position: 'top' });
            return;
        }
        const token = localStorage.getItem('token') || undefined;
        setSubmitting(true);
        try {
            const created = await createManpowerRecord({
                projectId: siteMeta.projectId,
                vendorId: supplierId,
                site,
                main_contractor: siteMeta.main_contractor || undefined,
                totalLabour: labourNum,
                dailyRate: rateNum,
                total,
                date: date || undefined,
                token,
            });
            setRecords((prev) => [created, ...prev]);
            setSupplierId('');
            setSite('');
            setDate('');
            setTotalLabour('');
            setDailyRate('');
            setErrors({});
            present({ message: 'Record added.', color: 'success', duration: 1500, position: 'top' });
        }
        catch (e) {
            const msg = e?.message || e?.error || 'Failed to add record.';
            present({ message: msg, color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setSubmitting(false);
        }
    }
    const supplierOptions = React.useMemo(() => suppliers ?? [], [suppliers]);
    const enhancedRecords = React.useMemo(() => {
        const vendorById = new Map();
        supplierOptions.forEach((v) => vendorById.set(v.id, v));
        const projectById = new Map();
        projects.forEach((p) => projectById.set(p.id, p));
        const withMeta = (records || []).map((r) => ({
            ...r,
            supplierName: r.vendor?.name || vendorById.get(r.vendorId || '')?.name,
            projectName: r.project?.name || projectById.get(r.projectId || '')?.name,
        }));
        // Sort by logical date descending: use saved date if present, otherwise createdAt
        return withMeta.slice().sort((a, b) => {
            const ra = a.date || a.createdAt;
            const rb = b.date || b.createdAt;
            const da = ra ? new Date(ra).getTime() : 0;
            const db = rb ? new Date(rb).getTime() : 0;
            return db - da;
        });
    }, [records, supplierOptions, projects]);
    const filteredRecords = React.useMemo(() => {
        return enhancedRecords.filter((r) => {
            if (filterSupplierId && r.vendorId !== filterSupplierId && r.vendor?.id !== filterSupplierId)
                return false;
            if (filterSite && (r.site || '') !== filterSite)
                return false;
            if (filterFrom || filterTo) {
                const raw = r.date || r.createdAt;
                if (!raw)
                    return false;
                let dIso;
                try {
                    dIso = new Date(raw).toISOString().slice(0, 10);
                }
                catch {
                    dIso = undefined;
                }
                if (!dIso)
                    return false;
                if (filterFrom && dIso < filterFrom)
                    return false;
                if (filterTo && dIso > filterTo)
                    return false;
            }
            return true;
        });
    }, [enhancedRecords, filterSupplierId, filterSite, filterFrom, filterTo]);
    const summaryFromTable = React.useMemo(() => {
        let totalLabourSum = 0;
        let totalSum = 0;
        for (const r of filteredRecords) {
            totalLabourSum += Number(r.totalLabour || 0);
            totalSum += Number(r.total || 0);
        }
        return { totalLabourSum, totalSum };
    }, [filteredRecords]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "px-4 py-8 sm:px-6 lg:px-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Attendance / Manpower Supplier / Add Records" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Attendance > Manpower Supplier > Add Records" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/hr/attendance/manpower-supplier'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Add Daily Record" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-3 items-end", children: [_jsxs("div", { children: [_jsxs(Select, { label: "Manpower Supplier", value: supplierId, onChange: (e) => setSupplierId(e.target.value), children: [_jsx("option", { value: "", children: "(Select)" }), supplierOptions.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }), errors.supplierId && (_jsx("div", { className: "mt-1 text-xs text-[color:var(--danger)]", children: errors.supplierId }))] }), _jsxs("div", { children: [_jsxs(Select, { label: "Site", value: site, onChange: (e) => setSite(e.target.value), children: [_jsx("option", { value: "", children: "(Select)" }), siteOptions.map((s) => (_jsx("option", { value: s.site, children: s.site }, s.site)))] }), errors.site && (_jsx("div", { className: "mt-1 text-xs text-[color:var(--danger)]", children: errors.site }))] }), _jsx("div", { children: _jsx(Input, { label: "Date", type: "date", value: date, onChange: (e) => setDate(e.target.value) }) }), _jsxs("div", { children: [_jsx(Input, { label: "Total Labour", type: "number", value: totalLabour, onChange: (e) => setTotalLabour(e.target.value) }), errors.totalLabour && (_jsx("div", { className: "mt-1 text-xs text-[color:var(--danger)]", children: errors.totalLabour }))] }), _jsxs("div", { children: [_jsx(Input, { label: "Daily Rate", type: "number", value: dailyRate, onChange: (e) => setDailyRate(e.target.value) }), errors.dailyRate && (_jsx("div", { className: "mt-1 text-xs text-[color:var(--danger)]", children: errors.dailyRate }))] }), _jsx("div", { children: _jsx(Input, { label: "Total", type: "number", value: String(total || 0), onChange: () => { }, disabled: true }) })] }), _jsx("div", { className: "flex justify-end mt-4", children: _jsx(Button, { onClick: handleSubmit, disabled: submitting || loading, children: "Submit" }) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Daily Records" }) }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-2 gap-3 mb-4 text-xs sm:text-sm", children: [_jsxs("div", { className: "rounded-lg border zynq-border bg-[color:var(--surface)] px-3 py-2", children: [_jsx("div", { className: "zynq-muted text-[11px] uppercase tracking-wide", children: "Total Labour" }), _jsx("div", { className: "text-base font-semibold", children: summaryFromTable.totalLabourSum.toLocaleString() })] }), _jsxs("div", { className: "rounded-lg border zynq-border bg-[color:var(--surface)] px-3 py-2", children: [_jsx("div", { className: "zynq-muted text-[11px] uppercase tracking-wide", children: "Total" }), _jsx("div", { className: "text-base font-semibold", children: summaryFromTable.totalSum.toLocaleString() })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 mb-3", children: [_jsxs(Select, { label: "Filter by Supplier", value: filterSupplierId, onChange: (e) => setFilterSupplierId(e.target.value), children: [_jsx("option", { value: "", children: "All" }), supplierOptions.map((s) => (_jsx("option", { value: s.id, children: s.name }, s.id)))] }), _jsxs(Select, { label: "Filter by Site", value: filterSite, onChange: (e) => setFilterSite(e.target.value), children: [_jsx("option", { value: "", children: "All" }), siteOptions.map((s) => (_jsx("option", { value: s.site, children: s.site }, s.site)))] }), _jsx(Input, { label: "From", type: "date", value: filterFrom, onChange: (e) => setFilterFrom(e.target.value) }), _jsx(Input, { label: "To", type: "date", value: filterTo, onChange: (e) => setFilterTo(e.target.value) })] }), _jsx(Table, { columns: columns, data: filteredRecords, emptyText: loading ? 'Loading...' : 'No records' })] })] })] })] }));
}
