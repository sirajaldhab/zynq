import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonHeader, IonToolbar, IonButtons, IonButton, IonTitle } from '@ionic/react';
export default function Nav() {
    return (_jsx(IonHeader, { children: _jsxs(IonToolbar, { children: [_jsx(IonTitle, { children: "Zynq" }), _jsxs(IonButtons, { slot: "end", children: [_jsx(IonButton, { href: "/", children: "Dashboard" }), _jsx(IonButton, { href: "/projects", children: "Projects" }), _jsx(IonButton, { href: "/finance", children: "Finance" }), _jsx(IonButton, { href: "/hr", children: "HR" }), _jsx(IonButton, { href: "/admin", children: "Admin" })] })] }) }));
}
