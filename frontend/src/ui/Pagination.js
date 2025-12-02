import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import Button from './Button';
export default function Pagination({ page, pageSize, total, onChange }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < pages;
    return (_jsxs("div", { className: "flex items-center justify-between mt-3", children: [_jsxs("div", { className: "text-sm zynq-muted", children: ["Page ", page, " of ", pages] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "secondary", size: "sm", disabled: !canPrev, onClick: () => onChange(page - 1), children: "Previous" }), _jsx(Button, { variant: "secondary", size: "sm", disabled: !canNext, onClick: () => onChange(page + 1), children: "Next" })] })] }));
}
