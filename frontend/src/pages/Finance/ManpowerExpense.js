import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { IonPage, IonContent, IonIcon } from '@ionic/react';
import { useNavigate } from 'react-router-dom';
import Nav from '../../components/Nav';
import Button from '../../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { chevronBackOutline } from 'ionicons/icons';
export default function ManpowerExpensePage() {
    const navigate = useNavigate();
    return (_jsxs(IonPage, { children: [_jsx(Nav, {}), _jsx(IonContent, { className: "bg-[color:var(--bg)] py-8", children: _jsxs("div", { className: "space-y-4 px-4 sm:px-6 lg:px-8", children: [_jsx("div", { className: "text-lg font-semibold", children: "Finance / Manpower Expense" }), _jsx("div", { className: "zynq-muted text-sm", children: "Home > Finance > Manpower Expense" }), _jsx("div", { children: _jsxs(Button, { variant: "secondary", size: "sm", className: "mt-2 flex items-center gap-2", onClick: () => navigate('/finance/expenses'), children: [_jsx(IonIcon, { icon: chevronBackOutline }), _jsx("span", { children: "Back" })] }) }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mt-4", children: [_jsxs(Card, { className: "cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors", onClick: () => navigate('/finance/expenses/company-employee-salary'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "Company Employee Expenses" }) }), _jsx(CardContent, { className: "text-sm zynq-muted", children: "Manage salary-related expenses for internal company employees." })] }), _jsxs(Card, { className: "cursor-pointer bg-[color:var(--card-bg,rgba(255,255,255,0.04))] hover:bg-[color:var(--card-bg-hover,rgba(255,255,255,0.08))] transition-colors", onClick: () => navigate('/finance/expenses/manpower/external-labour-expense'), children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: "External Labour Expense" }) }), _jsx(CardContent, { className: "text-sm zynq-muted", children: "View and manage external labour-related expenses." })] })] })] }) })] }));
}
