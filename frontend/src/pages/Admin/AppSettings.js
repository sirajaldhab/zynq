import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import { fetchAppSettings, updateAppSetting } from '../../api/adminService';
export default function AdminAppSettings() {
    const [present] = useIonToast();
    const [rows, setRows] = React.useState([]);
    const [editing, setEditing] = React.useState({});
    const [saving, setSaving] = React.useState({});
    const columns = [
        { key: 'key', header: 'Key' },
        {
            key: 'value',
            header: 'Value',
            render: (r) => (_jsxs("div", { className: "flex gap-2 items-center", children: [_jsx(Input, { value: editing[r.key] ?? r.value, onChange: (e) => setEditing((s) => ({ ...s, [r.key]: e.target.value })) }), _jsx(Button, { size: "sm", onClick: () => onSave(r.key), disabled: !!saving[r.key], children: "Save" })] })),
        },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            const data = await fetchAppSettings({ token });
            setRows(data);
            setEditing({});
        }
        catch (e) {
            present({ message: 'Failed to load settings', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    React.useEffect(() => { load(); }, []);
    async function onSave(key) {
        const token = localStorage.getItem('token') || undefined;
        try {
            const value = (editing[key] ?? rows.find((r) => r.key === key)?.value ?? '').trim();
            if (!value) {
                present({ message: 'Value cannot be empty', color: 'warning', duration: 1500, position: 'top' });
                return;
            }
            setSaving((s) => ({ ...s, [key]: true }));
            await updateAppSetting({ key, token }, { value });
            present({ message: 'Setting updated', color: 'success', duration: 1200, position: 'top' });
            load();
        }
        catch (e) {
            present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setSaving((s) => ({ ...s, [key]: false }));
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / App Settings" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > App Settings" }), _jsx(Table, { columns: columns, data: rows, emptyText: "No settings" })] })] }));
}
