import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonPage, IonContent } from '@ionic/react';
import Nav from '../../components/Nav';
export default function AdminSyncStatus() {
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsxs(IonContent, { className: "p-8 bg-[color:var(--bg)] space-y-4", children: [_jsx("div", { className: "text-lg font-semibold", children: "Admin / Database Sync Status" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Admin > Sync Status" }), _jsx("div", { className: "mt-4 text-sm zynq-muted", children: "Coming Soon \u2014 RxDB/Prisma sync diagnostics" })] })] }));
}
