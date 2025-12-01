import React from 'react';
import Button from './Button';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, total, onChange }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;
  return (
    <div className="flex items-center justify-between mt-3">
      <div className="text-sm zynq-muted">Page {page} of {pages}</div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={!canPrev} onClick={() => onChange(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={!canNext} onClick={() => onChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
