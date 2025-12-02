import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
export default function Documents() {
    const navigate = useNavigate();
    useEffect(() => {
        console.log('Loaded Documents > Main');
    }, []);
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] text-[color:var(--text-primary)] py-8", children: _jsxs("div", { className: "space-y-6 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold mb-1", children: "Documents" }), _jsx("div", { className: "zynq-muted text-sm hidden lg:block", children: "Home > Documents" }), _jsx("div", { className: "hidden lg:block", children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsx("button", { type: "button", onClick: () => navigate('/documents-main/company-list'), className: "text-left", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Company List" }) }), _jsx(CardContent, { children: _jsx("div", { className: "zynq-muted text-sm", children: "View documents grouped by company." }) })] }) }), _jsx("button", { type: "button", onClick: () => navigate('/documents-main/documents'), className: "text-left", children: _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Documents" }) }), _jsx(CardContent, { children: _jsx("div", { className: "zynq-muted text-sm", children: "Open the main document library." }) })] }) })] })] }) })] }));
}
