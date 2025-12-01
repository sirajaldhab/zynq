import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[color:var(--accent)] text-white hover:brightness-110 focus:ring-[color:var(--accent)]',
  secondary: 'border zynq-border bg-[color:var(--surface)] text-[color:var(--text-primary)] hover:bg-[color:var(--bg)] focus:ring-[color:var(--accent)]',
  subtle: 'bg-transparent text-[color:var(--text-primary)] hover:bg-[color:var(--bg)] focus:ring-[color:var(--accent)]',
  danger: 'bg-[#EF4444] text-white hover:brightness-110 focus:ring-[#EF4444]',
};

export default function Button({ variant = 'primary', size = 'md', fullWidth, className = '', ...props }: Props) {
  const width = fullWidth ? 'w-full' : '';
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${width} ${className}`} {...props} />
  );
}
