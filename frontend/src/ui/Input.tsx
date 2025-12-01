import React from 'react';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

export default function Input({ label, helper, error, className = '', ...props }: Props) {
  const base = 'w-full rounded-xl border zynq-border bg-[color:var(--surface)] px-3 py-2 text-[color:var(--text-primary)] placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]';
  return (
    <label className={`block ${className}`}>
      {label && <div className="mb-1 text-sm zynq-muted">{label}</div>}
      <input className={base} {...props} />
      {helper && !error && <div className="mt-1 text-xs zynq-muted">{helper}</div>}
      {error && <div className="mt-1 text-xs text-[#EF4444]">{error}</div>}
    </label>
  );
}
