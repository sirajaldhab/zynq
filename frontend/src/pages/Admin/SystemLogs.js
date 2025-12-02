import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Pagination from '../../ui/Pagination';
import { fetchSystemLogs } from '../../api/adminService';
export default function AdminSystemLogs() {
    const [present] = useIonToast();
    const [level, setLevel] = useQueryParam('level', '');
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 20;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const columns = [
        { key: 'created_at', header: 'Time', render: (r) => new Date(r.created_at).toLocaleString() },
        { key: 'level', header: 'Level' },
        { key: 'message', header: 'Message' },
        { key: 'context_json', header: 'Context', render: (r) => (r.context_json || '').slice(0, 60) },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            const res = await fetchSystemLogs({ page, pageSize, level: level || undefined, token });
            setRows(res.data);
            setTotal(res.total ?? res.data.length);
        }
        catch (e) {
            present({ message: 'Failed to load logs', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    React.useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [level, page]);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / System Logs" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > System Logs" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4", children: _jsx(Input, { label: "Level", placeholder: "INFO/WARN/ERROR", value: level, onChange: (e) => setLevel(e.target.value) }) }), _jsx(Table, { columns: columns, data: rows, emptyText: "No logs" }), _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage })] })] }));
}
