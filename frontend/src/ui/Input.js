import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Input({ label, helper, error, className = '', ...props }) {
    const base = 'w-full rounded-xl border zynq-border bg-[color:var(--surface)] px-3 py-2 text-[color:var(--text-primary)] placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]';
    return (_jsxs("label", { className: `block ${className}`, children: [label && _jsx("div", { className: "mb-1 text-sm zynq-muted", children: label }), _jsx("input", { className: base, ...props }), helper && !error && _jsx("div", { className: "mt-1 text-xs zynq-muted", children: helper }), error && _jsx("div", { className: "mt-1 text-xs text-[#EF4444]", children: error })] }));
}
