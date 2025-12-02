import { jsx as _jsx } from "react/jsx-runtime";
export function Card({ className = '', ...props }) {
    return _jsx("div", { className: `zynq-card ${className}`, ...props });
}
export function CardHeader({ className = '', ...props }) {
    return _jsx("div", { className: `mb-2 ${className}`, ...props });
}
export function CardTitle({ className = '', ...props }) {
    return _jsx("h3", { className: `font-medium ${className}`, ...props });
}
export function CardContent({ className = '', ...props }) {
    return _jsx("div", { className: className, ...props });
}
export function CardFooter({ className = '', ...props }) {
    return _jsx("div", { className: `mt-3 ${className}`, ...props });
}
