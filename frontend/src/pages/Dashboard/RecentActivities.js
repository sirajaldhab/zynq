import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { fetchSystemLogs } from '../../api/adminService';
import Pagination from '../../ui/Pagination';
function formatRelativeTime(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    if (diffSec < 60)
        return 'Just now';
    if (diffMin < 60)
        return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHr < 24)
        return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    if (diffDay === 1)
        return 'Yesterday';
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: 'numeric',
        minute: '2-digit',
    });
}
function toActivity(log) {
    let user = '';
    let action = '';
    let entityType = '';
    let entityName;
    let details;
    try {
        if (log.context_json) {
            const ctx = JSON.parse(log.context_json);
            if (ctx?.userName)
                user = ctx.userName;
            else if (ctx?.userEmail)
                user = ctx.userEmail || '';
            if (ctx?.action)
                action = ctx.action;
            if (ctx?.entityType)
                entityType = ctx.entityType;
            if (ctx?.entityName)
                entityName = ctx.entityName;
            else if (ctx?.entityId)
                entityName = ctx.entityId;
            const extras = [];
            const activityAction = ctx?.action || action;
            const deletedValue = ctx?.deletedValue || ctx?.previousValue;
            if (activityAction === 'deleted' &&
                (deletedValue || ctx?.entityName || ctx?.entityId)) {
                const label = deletedValue || ctx?.entityName || ctx?.entityId;
                extras.push(`Deleted Value: ${label}`);
            }
            const projectLabel = ctx.projectName || ctx.projectId;
            const companyLabel = ctx.companyName || ctx.companyId;
            const clientLabel = ctx.clientName || ctx.clientId;
            const vendorLabel = ctx.vendorName || ctx.vendorId;
            if (projectLabel)
                extras.push(`Project: ${projectLabel}`);
            if (companyLabel)
                extras.push(`Company: ${companyLabel}`);
            if (clientLabel)
                extras.push(`Client: ${clientLabel}`);
            if (vendorLabel)
                extras.push(`Vendor: ${vendorLabel}`);
            if (ctx.site)
                extras.push(`Site: ${ctx.site}`);
            if (ctx.status)
                extras.push(`Status: ${ctx.status}`);
            if (ctx.month) {
                try {
                    const d = new Date(ctx.month);
                    if (!Number.isNaN(d.getTime())) {
                        extras.push(`Month: ${d.toLocaleDateString()}`);
                    }
                }
                catch {
                    // ignore invalid date
                }
            }
            if (typeof ctx.total === 'number')
                extras.push(`Total: ${ctx.total}`);
            if (typeof ctx.totalLabour === 'number')
                extras.push(`Labour: ${ctx.totalLabour}`);
            if (typeof ctx.count === 'number')
                extras.push(`Count: ${ctx.count}`);
            details = extras.join(' • ') || undefined;
        }
    }
    catch {
        // ignore malformed context
    }
    return {
        id: log.id,
        user: user || '-',
        action: action || log.level || '-',
        entityType: entityType || '-',
        entityName,
        details,
        rawMessage: log.message,
        timestamp: formatRelativeTime(log.created_at),
    };
}
export default function RecentActivities() {
    const [present] = useIonToast();
    const [page, setPage] = React.useState(1);
    const pageSize = 20;
    const bulkLoadPageSize = 200;
    const bulkLoadMaxPages = 25;
    const [items, setItems] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [loading, setLoading] = React.useState(false);
    const [search, setSearch] = React.useState('');
    const [actionFilter, setActionFilter] = React.useState('All');
    const [entityFilter, setEntityFilter] = React.useState('All');
    const filtersActive = search.trim().length > 0 || actionFilter !== 'All' || entityFilter !== 'All';
    React.useEffect(() => {
        if (filtersActive && page !== 1) {
            setPage(1);
        }
    }, [filtersActive, page]);
    async function load(fetchAll) {
        const token = localStorage.getItem('token') || undefined;
        setLoading(true);
        try {
            if (fetchAll) {
                const collected = [];
                let totalCount = null;
                let currentPage = 1;
                while (currentPage <= bulkLoadMaxPages) {
                    const res = await fetchSystemLogs({ page: currentPage, pageSize: bulkLoadPageSize, token });
                    const mapped = (res.data || []).map(toActivity);
                    collected.push(...mapped);
                    if (typeof res.total === 'number') {
                        totalCount = res.total;
                    }
                    if (mapped.length < bulkLoadPageSize || (totalCount != null && collected.length >= totalCount)) {
                        break;
                    }
                    currentPage += 1;
                }
                setItems(collected);
                setTotal(totalCount ?? collected.length);
            }
            else {
                const res = await fetchSystemLogs({ page, pageSize, token });
                const mapped = (res.data || []).map(toActivity);
                setItems(mapped);
                setTotal(res.total ?? mapped.length);
            }
        }
        catch (e) {
            present({ message: 'Failed to load activities', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        load(filtersActive);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, filtersActive]);
    const actionOptions = React.useMemo(() => {
        const set = new Set();
        for (const item of items) {
            if (item.action)
                set.add(item.action);
        }
        return Array.from(set).sort();
    }, [items]);
    const entityOptions = React.useMemo(() => {
        const set = new Set();
        for (const item of items) {
            if (item.entityType && item.entityType !== '-')
                set.add(item.entityType);
        }
        return Array.from(set).sort();
    }, [items]);
    const filteredItems = React.useMemo(() => {
        return items.filter((item) => {
            if (actionFilter !== 'All' && item.action !== actionFilter)
                return false;
            if (entityFilter !== 'All' && item.entityType !== entityFilter)
                return false;
            if (search.trim()) {
                const term = search.trim().toLowerCase();
                const haystack = [
                    item.user,
                    item.action,
                    item.entityType,
                    item.entityName,
                    item.details,
                    item.rawMessage,
                ]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                if (!haystack.includes(term))
                    return false;
            }
            return true;
        });
    }, [items, actionFilter, entityFilter, search]);
    const showReset = filtersActive;
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Dashboard / Recent Activities" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Dashboard > Recent Activities" }), _jsxs("div", { className: "mt-4", children: [_jsx("div", { className: "text-base font-semibold mb-2", children: "Recent Activities" }), _jsxs("div", { className: "rounded-lg border zynq-border bg-[color:var(--surface)]", children: [_jsxs("div", { className: "p-4 border-b zynq-border grid gap-3 md:grid-cols-4", children: [_jsxs("label", { className: "text-xs uppercase tracking-wide text-zinc-400 flex flex-col gap-1 md:col-span-2", children: ["Search", _jsx("input", { type: "text", className: "zynq-input text-sm", placeholder: "User, action, entity, details\u2026", value: search, onChange: (e) => setSearch(e.target.value) })] }), _jsxs("label", { className: "text-xs uppercase tracking-wide text-zinc-400 flex flex-col gap-1", children: ["Action", _jsxs("select", { className: "zynq-input text-sm", value: actionFilter, onChange: (e) => setActionFilter(e.target.value || 'All'), children: [_jsx("option", { value: "All", children: "All" }), actionOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })] }), _jsxs("label", { className: "text-xs uppercase tracking-wide text-zinc-400 flex flex-col gap-1", children: ["Entity", _jsxs("select", { className: "zynq-input text-sm", value: entityFilter, onChange: (e) => setEntityFilter(e.target.value || 'All'), children: [_jsx("option", { value: "All", children: "All" }), entityOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt)))] })] }), showReset && (_jsx("button", { type: "button", className: "text-xs justify-self-start text-indigo-400 hover:text-indigo-300", onClick: () => {
                                                        setSearch('');
                                                        setActionFilter('All');
                                                        setEntityFilter('All');
                                                    }, children: "Clear filters" }))] }), _jsxs("div", { className: "max-h-[480px] overflow-y-auto", children: [loading && items.length === 0 && (_jsx("div", { className: "p-4 text-sm zynq-muted", children: "Loading activities\u2026" })), !loading && filteredItems.length === 0 && (_jsx("div", { className: "p-4 text-sm zynq-muted", children: "No recent activities found." })), filteredItems.length > 0 && (_jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "text-xs uppercase zynq-muted border-b zynq-border", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 text-left", children: "Time" }), _jsx("th", { className: "px-4 py-2 text-left", children: "User" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Action" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Entity" }), _jsx("th", { className: "px-4 py-2 text-left", children: "Details" })] }) }), _jsx("tbody", { className: "divide-y divide-zinc-800/40", children: filteredItems.map((a) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 whitespace-nowrap text-xs zynq-muted", children: a.timestamp }), _jsx("td", { className: "px-4 py-2", children: a.user }), _jsxs("td", { className: "px-4 py-2", children: [a.action, ' ', a.entityType !== '-' ? a.entityType.toLowerCase() : ''] }), _jsx("td", { className: "px-4 py-2", children: a.entityName || '-' }), _jsx("td", { className: "px-4 py-2", children: a.details ? (_jsx("span", { children: a.details })) : (_jsx("span", { className: "zynq-muted text-xs", children: a.rawMessage })) })] }, a.id))) })] }))] }), _jsxs("div", { className: "p-3 border-t zynq-border flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-zinc-400", children: [_jsx("span", { children: filtersActive
                                                        ? `Showing ${filteredItems.length} filtered entr${filteredItems.length === 1 ? 'y' : 'ies'}`
                                                        : `Showing ${filteredItems.length} of ${total} entries (page ${page})` }), !filtersActive && (_jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage }))] })] })] })] }) })] }));
}
