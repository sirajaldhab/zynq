import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';
export default function Finance() {
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { fullscreen: true, children: _jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Finance" }), _jsx("p", { children: "Invoices, payments, and financial KPIs will appear here." })] }) })] }));
}
