import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';
export default function HR() {
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { fullscreen: true, children: _jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "HR" }), _jsx("p", { children: "Employees, attendance, and HR KPIs will appear here." })] }) })] }));
}
