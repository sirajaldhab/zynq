import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Modal({ open, onClose, title, children, footer }) {
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center", children: [_jsx("div", { className: "absolute inset-0 bg-black/40", onClick: onClose }), _jsxs("div", { className: "relative z-10 w-full max-w-lg zynq-card max-h-[80vh] flex flex-col", children: [title && _jsx("div", { className: "mb-3 text-lg font-semibold flex-shrink-0", children: title }), _jsx("div", { className: "overflow-y-auto pr-1 flex-1 min-h-0", children: children }), footer && _jsx("div", { className: "mt-4 flex justify-end gap-2", children: footer })] })] }));
}
