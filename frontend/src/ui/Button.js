import { jsx as _jsx } from "react/jsx-runtime";
const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
const sizes = {
    sm: 'h-8 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};
const variants = {
    primary: 'bg-[color:var(--accent)] text-white hover:brightness-110 focus:ring-[color:var(--accent)]',
    secondary: 'border zynq-border bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg)] focus:ring-[color:var(--accent)]',
    subtle: 'bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg)] focus:ring-[color:var(--accent)]',
    danger: 'bg-[#EF4444] text-white hover:brightness-110 focus:ring-[#EF4444]',
};
export default function Button({ variant = 'primary', size = 'md', fullWidth, className = '', ...props }) {
    const width = fullWidth ? 'w-full' : '';
    return (_jsx("button", { className: `${base} ${sizes[size]} ${variants[variant]} ${width} ${className}`, ...props }));
}
