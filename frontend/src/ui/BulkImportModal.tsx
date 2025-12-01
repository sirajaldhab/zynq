import React from 'react';
import Modal from './Modal';
import Button from './Button';
import * as XLSX from 'xlsx';

export type ImportField = { key: string; label: string; required?: boolean };

export default function BulkImportModal({
  open,
  onClose,
  fields,
  onValidate,
  onConfirm,
  templateHint,
}: {
  open: boolean;
  onClose: () => void;
  fields: ImportField[];
  onValidate: (row: Record<string, any>) => string | undefined;
  onConfirm: (rows: Record<string, any>[]) => Promise<void> | void;
  templateHint?: string;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rows, setRows] = React.useState<any[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [importing, setImporting] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setHeaders([]); setRows([]); setMapping({}); setImporting(false);
    }
  }, [open]);

  function onPickFile() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      setImporting(true);
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const first = wb.SheetNames?.[0]; if (!first) throw new Error('No sheets');
      const ws = wb.Sheets[first]; if (!ws) throw new Error('Worksheet missing');
      const json = XLSX.utils.sheet_to_json<any>(ws, { raw: false, defval: '' });
      const hs = extractHeaders(ws);
      setHeaders(hs);
      setRows(json);
      const autoMap: Record<string,string> = {};
      for (const f of fields) {
        const match = hs.find(h => normalize(h) === normalize(f.key) || normalize(h) === normalize(f.label)) || '';
        if (match) autoMap[f.key] = match;
      }
      setMapping(autoMap);
    } catch (e) {
      alert('Failed to parse Excel');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function extractHeaders(ws: XLSX.WorkSheet): string[] {
    const range = XLSX.utils.decode_range(ws['!ref'] as string);
    const headers: string[] = [];
    const R = range.s.r; // first row
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      headers.push(cell ? String(cell.v) : `COL${C}`);
    }
    return headers;
  }

  function normalize(s: string) { return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ''); }

  function buildMappedRows(): Array<any & { _err?: string; _row?: number }> {
    if (!rows.length) return [];
    return rows.map((r, idx) => {
      const out: Record<string, any> = {};
      for (const f of fields) {
        const src = mapping[f.key];
        if (src) out[f.key] = r[src];
      }
      const errs: string[] = [];
      for (const f of fields) {
        if (f.required && (out[f.key] === undefined || out[f.key] === '' || out[f.key] === null)) errs.push(f.key);
      }
      const custom = onValidate(out);
      if (custom) errs.push(custom);
      return { ...out, _row: idx + 2, _err: errs.length ? `Missing/invalid: ${errs.join(', ')}` : undefined };
    });
  }

  async function handleConfirm() {
    // If no rows are loaded yet, treat Import as a shortcut to open the file picker
    if (!rows.length) {
      onPickFile();
      return;
    }

    const mapped = buildMappedRows();
    const valid = mapped.filter(r => !r._err).map(({ _err, _row, ...r }) => r);
    if (valid.length === 0) { alert('No valid rows to import'); return; }
    try {
      setImporting(true);
      await onConfirm(valid);
      onClose();
    } finally { setImporting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk Import">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileChange} />
          <Button variant="secondary" onClick={onPickFile} disabled={importing}>Choose Excel</Button>
          {templateHint ? <div className="text-xs zynq-muted">{templateHint}</div> : null}
        </div>

        {rows.length ? (
          <div className="max-h-[45vh] overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Row#</th>
                  {fields.map(f => (<th key={f.key} className="p-2">{f.label}</th>))}
                  <th className="p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {buildMappedRows().map((r, i) => (
                  <tr key={i} className={r._err ? 'bg-red-500/5' : ''}>
                    <td className="p-2">{r._row}</td>
                    {fields.map(f => (<td key={f.key} className="p-2">{r[f.key] ?? '—'}</td>))}
                    <td className="p-2 text-red-500">{r._err || 'OK'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={importing}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={importing}>Import</Button>
        </div>
      </div>
    </Modal>
  );
}
