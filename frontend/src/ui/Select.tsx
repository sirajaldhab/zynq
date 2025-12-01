import React from 'react';

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helper?: string;
  error?: string;
  wrapperClassName?: string;
}

export default function Select({ label, helper, error, className = '', wrapperClassName = '', children, ...props }: Props) {
  const base = 'w-full rounded-xl border zynq-border bg-[color:var(--surface)] px-3 py-2 text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]';
  return (
    <label className={`block ${wrapperClassName}`}>
      {label && <div className="mb-1 text-sm zynq-muted">{label}</div>}
      <select className={`${base} ${className}`.trim()} {...props}>{children}</select>
      {helper && !error && <div className="mt-1 text-xs zynq-muted">{helper}</div>}
      {error && <div className="mt-1 text-xs text-[#EF4444]">{error}</div>}
    </label>
  );
}
