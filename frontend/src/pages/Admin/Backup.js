import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonSpinner, useIonToast } from '@ionic/react';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { API_BASE } from '../../config';
import { useAuth } from '../../auth/AuthContext';
export default function AdminBackup() {
    const [present] = useIonToast();
    const [loading, setLoading] = React.useState(false);
    const [emailInput, setEmailInput] = React.useState('');
    const [saving, setSaving] = React.useState(false);
    const { accessToken } = useAuth();
    React.useEffect(() => {
        (async () => {
            if (!accessToken)
                return;
            try {
                const res = await fetch(`${API_BASE}/system/backup/settings`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!res.ok)
                    throw new Error();
                const data = await res.json();
                setEmailInput(data?.emails || '');
            }
            catch {
                present({ message: 'Failed to load backup settings.', color: 'warning', duration: 2000, position: 'top' });
            }
        })();
    }, [accessToken, present]);
    async function handleSaveEmails() {
        if (!accessToken)
            return;
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}/system/backup/settings`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ emails: (emailInput || '').trim() }),
            });
            if (!res.ok)
                throw new Error();
            present({ message: 'Backup emails saved.', color: 'success', duration: 1500, position: 'top' });
        }
        catch {
            present({ message: 'Failed to save backup emails.', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setSaving(false);
        }
    }
    async function handleDownload() {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/system/backup`, {
                method: 'GET',
                headers: {
                    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
                },
            });
            if (!res.ok) {
                throw new Error('Failed to generate backup');
            }
            const blob = await res.blob();
            const disposition = res.headers.get('Content-Disposition') || '';
            const fileNameMatch = disposition.match(/filename\*=UTF-8''([^;]+)/) || disposition.match(/filename="?([^";]+)"?/);
            const fallbackName = `system-backup-${new Date().toISOString().slice(0, 10)}.zip`;
            const fileName = fileNameMatch?.[1] ? decodeURIComponent(fileNameMatch[1]) : fallbackName;
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            present({ message: 'Backup download started.', color: 'success', duration: 1500, position: 'top' });
        }
        catch (error) {
            present({ message: 'Failed to download backup.', color: 'danger', duration: 2000, position: 'top' });
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-6", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / System Backup" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > Backup" }), _jsx("div", { className: "max-w-3xl", children: _jsxs("div", { className: "border zynq-border rounded-2xl bg-[color:var(--surface)] p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xl font-semibold", children: "System Backup" }), _jsx("p", { className: "text-sm zynq-muted mt-1", children: "Generate and download a full system backup. This may take a few minutes." })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "text-sm font-medium", children: "Backup Email Address" }), _jsx("input", { type: "text", className: "zynq-input", placeholder: "Enter email to receive daily backup", value: emailInput, onChange: (e) => setEmailInput(e.target.value) }), _jsx("div", { className: "flex gap-2", children: _jsx(Button, { variant: "secondary", size: "sm", onClick: handleSaveEmails, disabled: saving, children: saving ? 'Saving…' : 'Save Emails' }) }), _jsx("p", { className: "text-xs zynq-muted", children: "A full system backup ZIP will be emailed daily to the saved email address(es)." })] }), _jsxs(Button, { onClick: handleDownload, disabled: loading, className: "flex items-center gap-2 min-w-[220px] justify-center", children: [loading && _jsx(IonSpinner, { name: "dots", className: "w-4 h-4" }), _jsx("span", { children: loading ? 'Preparing backup…' : 'Download Full Backup' })] }), _jsx("p", { className: "text-xs zynq-muted", children: "A .zip/.sql archive will be downloaded once the backup is ready." })] }) })] })] }));
}
