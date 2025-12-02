import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { IonPage, IonContent, IonSpinner } from '@ionic/react';
import Nav from '../../components/Nav';
import { useIonToast } from '@ionic/react';
import { useQueryParam } from '../../hooks/useQueryParam';
import Table from '../../ui/Table';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import Pagination from '../../ui/Pagination';
import Modal from '../../ui/Modal';
import { fetchLeaves, createLeave, updateLeave, deleteLeave } from '../../api/hrService';
export default function HRLeaves() {
    const [present] = useIonToast();
    const [status, setStatus] = useQueryParam('status', 'All');
    const [employeeId, setEmployeeId] = useQueryParam('employeeId', '');
    const [start, setStart] = useQueryParam('start', '');
    const [end, setEnd] = useQueryParam('end', '');
    const [page, setPage] = useQueryParam('page', 1);
    const pageSize = 10;
    const [rows, setRows] = React.useState([]);
    const [total, setTotal] = React.useState(0);
    const [addOpen, setAddOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const columns = [
        { key: 'employeeId', header: 'Employee ID' },
        { key: 'type', header: 'Type' },
        { key: 'status', header: 'Status' },
        { key: 'start_date', header: 'Start', render: (r) => new Date(r.start_date).toLocaleDateString() },
        { key: 'end_date', header: 'End', render: (r) => new Date(r.end_date).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            render: (r) => (_jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", variant: "secondary", onClick: () => setEditRow(r), children: "Edit" }), _jsx(Button, { size: "sm", variant: "secondary", onClick: () => onDelete(r), children: "Delete" })] })),
        },
    ];
    async function load() {
        const token = localStorage.getItem('token') || undefined;
        try {
            setLoading(true);
            const res = await fetchLeaves({ page, pageSize, status, employeeId: employeeId || undefined, start: start || undefined, end: end || undefined, token });
            setRows(res.data);
            setTotal(res.total ?? res.data.length);
        }
        catch (e) {
            present({ message: 'Failed to load leaves', color: 'danger', duration: 2000, position: 'top' });
            setRows([]);
            setTotal(0);
        }
        finally {
            setLoading(false);
        }
    }
    React.useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, employeeId, start, end, page]);
    async function onCreate(body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await createLeave({ ...body, token });
            present({ message: 'Leave created', color: 'success', duration: 1500, position: 'top' });
            setAddOpen(false);
            load();
        }
        catch (e) {
            present({ message: 'Create failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onUpdate(id, body) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await updateLeave({ id, token }, body);
            present({ message: 'Leave updated', color: 'success', duration: 1500, position: 'top' });
            setEditRow(null);
            load();
        }
        catch (e) {
            present({ message: 'Update failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    async function onDelete(r) {
        const token = localStorage.getItem('token') || undefined;
        try {
            await deleteLeave({ id: r.id, token });
            present({ message: 'Leave deleted', color: 'success', duration: 1500, position: 'top' });
            load();
        }
        catch (e) {
            present({ message: 'Delete failed', color: 'danger', duration: 2000, position: 'top' });
        }
    }
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Leaves" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Leaves" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 mt-4", children: [_jsx(Input, { label: "Status", placeholder: "All/Approved/Pending/Rejected", value: status, onChange: (e) => setStatus(e.target.value) }), _jsx(Input, { label: "Employee ID (optional)", value: employeeId, onChange: (e) => setEmployeeId(e.target.value) }), _jsx(Input, { label: "Start (YYYY-MM-DD)", type: "date", value: start, onChange: (e) => setStart(e.target.value) }), _jsx(Input, { label: "End (YYYY-MM-DD)", type: "date", value: end, onChange: (e) => setEnd(e.target.value) })] }), _jsx("div", { className: "flex justify-end mt-2", children: _jsx(Button, { onClick: () => setAddOpen(true), children: "New Leave" }) }), loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx(IonSpinner, { name: "dots" }) })) : (_jsx(Table, { columns: columns, data: rows, emptyText: "No leaves" })), _jsx(Pagination, { page: page, pageSize: pageSize, total: total, onChange: setPage })] }), _jsx(AddLeaveModal, { open: addOpen, onClose: () => setAddOpen(false), onSubmit: onCreate }), _jsx(EditLeaveModal, { row: editRow, onClose: () => setEditRow(null), onSubmit: (b) => {
                    if (editRow)
                        return onUpdate(editRow.id, b);
                } })] }));
}
function AddLeaveModal({ open, onClose, onSubmit }) {
    const [employeeId, setEmployeeId] = React.useState('');
    const [type, setType] = React.useState('Annual');
    const [status, setStatus] = React.useState('PENDING');
    const [start, setStart] = React.useState('');
    const [end, setEnd] = React.useState('');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { if (!open) {
        setEmployeeId('');
        setType('Annual');
        setStatus('PENDING');
        setStart('');
        setEnd('');
    } }, [open]);
    const validDates = start && end && new Date(start) <= new Date(end);
    const canCreate = !!employeeId && !!type && validDates;
    return (_jsx(Modal, { open: open, onClose: onClose, title: "New Leave", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Employee ID", value: employeeId, onChange: (e) => setEmployeeId(e.target.value) }), _jsx(Input, { label: "Type", value: type, onChange: (e) => setType(e.target.value) }), _jsx(Input, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value) }), _jsx(Input, { label: "Start Date (ISO)", value: start, onChange: (e) => setStart(e.target.value) }), _jsx(Input, { label: "End Date (ISO)", value: end, onChange: (e) => setEnd(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ employeeId, type, status, start_date: start, end_date: end });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !canCreate || submitting, children: "Create" })] })] }) }));
}
function EditLeaveModal({ row, onClose, onSubmit }) {
    const [type, setType] = React.useState(row?.type || '');
    const [status, setStatus] = React.useState(row?.status || '');
    const [start, setStart] = React.useState(row?.start_date || '');
    const [end, setEnd] = React.useState(row?.end_date || '');
    const [submitting, setSubmitting] = React.useState(false);
    React.useEffect(() => { setType(row?.type || ''); setStatus(row?.status || ''); setStart(row?.start_date || ''); setEnd(row?.end_date || ''); }, [row]);
    const validDates = !start || !end || new Date(start) <= new Date(end);
    return (_jsx(Modal, { open: !!row, onClose: onClose, title: "Edit Leave", children: row && (_jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Type", value: type, onChange: (e) => setType(e.target.value) }), _jsx(Input, { label: "Status", value: status, onChange: (e) => setStatus(e.target.value) }), _jsx(Input, { label: "Start Date (ISO)", value: start, onChange: (e) => setStart(e.target.value) }), _jsx(Input, { label: "End Date (ISO)", value: end, onChange: (e) => setEnd(e.target.value) }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: submitting, children: "Cancel" }), _jsx(Button, { onClick: async () => { setSubmitting(true); try {
                                await onSubmit({ type: type || undefined, status: status || undefined, start_date: start || undefined, end_date: end || undefined });
                            }
                            finally {
                                setSubmitting(false);
                            } }, disabled: !validDates || submitting, children: "Save" })] })] })) }));
}
