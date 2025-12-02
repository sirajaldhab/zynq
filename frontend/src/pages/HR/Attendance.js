import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import { usePermissions } from '../../auth/usePermissions';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import { chevronBackOutline } from 'ionicons/icons';
export default function HRAttendance() {
    const navigate = useNavigate();
    const { can } = usePermissions();
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "HR / Attendance" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > HR > Attendance" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/hr'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4", children: [can('HR.Attendance.Entry.View') && (_jsx("div", { onClick: () => navigate('/hr/attendance/entry'), children: _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Attendance" }), _jsxs(CardContent, { children: [_jsx(CardTitle, { className: "mb-1", children: "Attendance Entry" }), _jsx("div", { className: "text-sm zynq-muted", children: "Record daily check-in and check-out details." })] })] }) })), can('HR.Attendance.Records.View') && (_jsx("div", { onClick: () => navigate('/hr/attendance/records'), children: _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Attendance" }), _jsxs(CardContent, { children: [_jsx(CardTitle, { className: "mb-1", children: "Attendance Records" }), _jsx("div", { className: "text-sm zynq-muted", children: "View and analyze historical attendance records." })] })] }) })), can('HR.Attendance.ManpowerSupplier.View') && (_jsx("div", { onClick: () => navigate('/hr/attendance/manpower-supplier'), children: _jsxs(Card, { children: [_jsx(CardHeader, { className: "text-sm zynq-muted", children: "Attendance" }), _jsxs(CardContent, { children: [_jsx(CardTitle, { className: "mb-1", children: "Manpower Supplier" }), _jsx("div", { className: "text-sm zynq-muted", children: "Manage and track manpower suppliers." })] })] }) }))] })] }) })] }));
}
