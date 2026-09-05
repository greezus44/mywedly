import { useState, useRef, useCallback } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";

interface ParsedGuest {
  id: string;
  fullName: string;
  username: string;
  edited: boolean;
  error?: string;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (guests: { name: string; username: string }[]) => Promise<void>;
  existingUsernames: Set<string>;
}

function parseCsv(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const firstLine = lines[0].toLowerCase();
  const headerIdx = firstLine.includes("full name") || firstLine.includes("name") ? 1 : 0;
  return lines.slice(headerIdx).map((l) => l.trim().replace(/^["']|["']$/g, "")).filter((l) => l);
}

export function BulkImportModal({ open, onClose, onImport, existingUsernames }: BulkImportModalProps) {
  const [parsed, setParsed] = useState<ParsedGuest[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setParsed([]);
    setFileName("");
    setImportError(null);
    setImportSuccess(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportError(null);
    setImportSuccess(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const names = parseCsv(text);
      const seen = new Map<string, number>();
      const rows: ParsedGuest[] = names.map((name, i) => {
        const id = `row-${i}`;
        let error: string | undefined;
        if (!name.trim()) error = "Empty name";
        const count = seen.get(name.toLowerCase()) ?? 0;
        seen.set(name.toLowerCase(), count + 1);
        if (count > 0) error = "Duplicate in file";
        return { id, fullName: name, username: name, edited: false, error };
      });
      setParsed(rows);
    };
    reader.readAsText(file);
  };

  const updateUsername = (id: string, username: string) => {
    setParsed((prev) => {
      const next = prev.map((r) => {
        if (r.id === id) return { ...r, username, edited: true };
        return r;
      });
      return revalidate(next);
    });
  };

  const revalidate = (rows: ParsedGuest[]): ParsedGuest[] => {
    const userSeen = new Map<string, number>();
    return rows.map((r) => {
      let error: string | undefined;
      if (!r.fullName.trim()) error = "Empty name";
      else {
        const count = userSeen.get(r.username.toLowerCase()) ?? 0;
        userSeen.set(r.username.toLowerCase(), count + 1);
        if (count > 0) error = "Duplicate username in import";
        else if (existingUsernames.has(r.username.toLowerCase())) error = "Username already exists";
      }
      return { ...r, error };
    });
  };

  const validGuests = parsed.filter((r) => !r.error);
  const invalidCount = parsed.length - validGuests.length;

  const handleImport = async () => {
    if (validGuests.length === 0) return;
    setImporting(true);
    setImportError(null);
    try {
      await onImport(validGuests.map((r) => ({ name: r.fullName, username: r.username })));
      setImportSuccess(true);
      reset();
      onClose();
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Bulk Import Guests"
    >
      <div className="space-y-4">
        {importError && <p className="text-sm text-dash-danger">{importError}</p>}
        {parsed.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-dash-muted">Upload a CSV file with a "Full Name" column. Each row becomes one guest. Only the full name is required.</p>
            <div className="rounded-lg border-2 border-dashed border-dash-border p-6 text-center">
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" id="bulk-import-file" />
              <label htmlFor="bulk-import-file" className="cursor-pointer text-sm font-medium text-dash-primary hover:underline">
                {fileName || "Choose CSV file"}
              </label>
            </div>
            <div className="text-xs text-dash-muted">
              <p className="font-medium mb-1">Example CSV:</p>
              <pre className="bg-dash-bg rounded p-2">Full Name{"\n"}John Smith{"\n"}Sarah Tan{"\n"}Ahmad bin Ali</pre>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!importSuccess && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dash-muted">
                    {fileName} — {parsed.length} guest(s)
                    {invalidCount > 0 && <span className="text-dash-danger"> ({invalidCount} with errors)</span>}
                  </p>
                  <button onClick={() => reset()} className="text-xs text-dash-primary hover:underline">Choose different file</button>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-dash-border">
                  <table className="w-full">
                    <thead className="bg-dash-bg sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Full Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Username</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dash-border bg-dash-surface">
                      {parsed.map((r) => (
                        <tr key={r.id} className={r.error ? "bg-red-50" : ""}>
                          <td className="px-3 py-2 text-sm text-dash-text">{r.fullName}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={r.username}
                              onChange={(e) => updateUsername(r.id, e.target.value)}
                              className="w-full rounded border border-dash-border bg-white px-2 py-1 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
                            />
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {r.error ? <span className="text-dash-danger">{r.error}</span> : <span className="text-green-600">OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
                  <Button size="sm" onClick={handleImport} loading={importing} disabled={validGuests.length === 0}>
                    Import {validGuests.length} guest(s)
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
