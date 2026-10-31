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
  onImport: (guests: { name: string; username: string; groupId: string | null }[]) => Promise<{ imported: number; failed: number; errors: string[] }>;
  existingUsernames: Set<string>;
  groups: { id: string; name: string }[];
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { fields.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const firstLine = lines[0];
  const headers = splitCsvLine(firstLine).map((h) => h.toLowerCase());
  const nameIdx = headers.findIndex((h) => h.includes("full name") || h === "name");
  const headerIdx = nameIdx >= 0 ? 1 : 0;
  const colIdx = nameIdx >= 0 ? nameIdx : 0;
  return lines.slice(headerIdx).map((l) => {
    const fields = splitCsvLine(l);
    return (fields[colIdx] ?? "").trim();
  }).filter((l) => l);
}

export function BulkImportModal({ open, onClose, onImport, existingUsernames, groups }: BulkImportModalProps) {
  const [parsed, setParsed] = useState<ParsedGuest[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setParsed([]);
    setFileName("");
    setImportError(null);
    setImportSummary(null);
    setSelectedGroupId("");
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportError(null);
    setImportSummary(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const names = parseCsv(text);
      const seen = new Map<string, number>();
      const rows: ParsedGuest[] = names.map((name, i) => {
        const id = `row-${i}`;
        const username = name;
        let error: string | undefined;
        if (!name.trim()) error = "Empty name";
        else {
          const count = seen.get(name.toLowerCase()) ?? 0;
          seen.set(name.toLowerCase(), count + 1);
          if (count > 0) error = "Duplicate in file";
          else if (existingUsernames.has(name.toLowerCase())) error = "Username already exists";
        }
        return { id, fullName: name, username, edited: false, error };
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
    setImportSummary(null);
    try {
      const groupId = selectedGroupId || null;
      const result = await onImport(validGuests.map((r) => ({ name: r.fullName, username: r.username, groupId })));
      if (result.failed > 0) {
        setImportError(`${result.imported} imported, ${result.failed} failed: ${result.errors.join(", ")}`);
      } else {
        setImportSummary(`${result.imported} guest(s) imported successfully.`);
      }
      if (result.imported > 0 && result.failed === 0) {
        reset();
        onClose();
      }
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
        {importSummary && <p className="text-sm text-green-600">{importSummary}</p>}
        {parsed.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-dash-muted">Upload a CSV file with a "Full Name" column. Each row becomes one guest. Only the full name is required. If your CSV has other columns (email, phone, etc.), they will be ignored.</p>
            {groups.length > 0 && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-dash-text">Add to group (optional)</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full rounded-lg border border-dash-border bg-[var(--dash-field)] px-3 py-2 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
                >
                  <option value="" className="bg-[var(--dash-field)] text-dash-text">No group</option>
                  {[...groups].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })).map((g) => (
                    <option key={g.id} value={g.id} className="bg-[var(--dash-field)] text-dash-text">{g.name}</option>
                  ))}
                </select>
              </div>
            )}
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
                          className="w-full rounded border border-dash-border bg-[var(--dash-field)] px-2 py-1 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
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
          </div>
        )}
      </div>
    </Modal>
  );
}
