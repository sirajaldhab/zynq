import { jsx as _jsx } from "react/jsx-runtime";
export default function FilterBar({ children, className = '' }) {
    return (_jsx("div", { className: `grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 ${className}`, children: children }));
}
