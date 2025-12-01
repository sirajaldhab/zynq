import React from 'react';

export default function FilterBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 ${className}`}>
      {children}
    </div>
  );
}
