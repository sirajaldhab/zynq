import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonContent, IonPage } from '@ionic/react';
import Nav from '../components/Nav';
export default function Admin() {
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { fullscreen: true, children: _jsxs("div", { className: "p-4", children: [_jsx("h1", { className: "text-xl font-semibold", children: "Admin" }), _jsx("p", { children: "Users, roles, and system settings will appear here." })] }) })] }));
}
