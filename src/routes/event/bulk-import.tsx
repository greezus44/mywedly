import { Fragment, useState, useRef, useCallback } from "react";
import { Modal } from "../../components/ui";
import { Button } from "../../components/ui/Button";

export interface ExistingGuestSummary {
  name: string | null;
  username: string | null;
  groupName: string | null;
}

type Decision = "pending" | "same" | "different";

interface RepeatInfo {
  title: string;
  details: string[];
}

interface ParsedGuest {
  id: string;
  fullName: string;
  username: string;
  repeat: RepeatInfo | null;
  decision: Decision;
  marked: boolean;
}

type AnnotatedGuest = ParsedGuest & { error?: string };

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (guests: { name: string; username: string; groupId: string | null }[]) => Promise<{ imported: number; invited: number; failed: number; errors: string[] }>;
  existingGuests: ExistingGuestSummary[];
  groups: { id: string; name: string }[];
}

const normalise = (s: string) => s.trim().toLowerCase();

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

function buildRows(names: string[], existing: ExistingGuestSummary[]): ParsedGuest[] {
  const existingByName = new Map<string, ExistingGuestSummary>();
  for (const g of existing) if (g.name) existingByName.set(normalise(g.name), g);
  const firstEntryByName = new Map<string, ParsedGuest>();
  return names.map((name, i) => {
    const key = normalise(name);
    const row: ParsedGuest = { id: `row-${i}`, fullName: name, username: name, repeat: null, decision: "pending", marked: false };
    if (key) {
      const guest = existingByName.get(key);
      const first = firstEntryByName.get(key);
      if (guest) {
        row.repeat = {
          title: "Already in your guest list",
          details: [`Name: ${guest.name ?? "-"}`, `Login name: ${guest.username ?? "-"}`, `Group: ${guest.groupName ?? "Ungrouped"}`],
        };
      } else if (first) {
        row.repeat = { title: "Appears earlier in your list", details: [`Entry ${first.id.replace("row-", "")}: ${first.fullName}`] };
      } else {
        firstEntryByName.set(key, row);
      }
    }
    return row;
  });
}

function willImport(r: ParsedGuest): boolean {
  return !r.marked && r.fullName.trim() !== "" && (!r.repeat || r.decision === "different");
}

function annotateRows(rows: ParsedGuest[], existingUsernames: Set<string>): AnnotatedGuest[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!willImport(r)) continue;
    const k = normalise(r.username);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return rows.map((r) => {
    let error: string | undefined;
    if (!r.fullName.trim()) error = "Empty name";
    else if (willImport(r)) {
      const k = normalise(r.username);
      if (!k) error = "Login name is required";
      else if (existingUsernames.has(k)) error = "Login name already exists";
      else if ((counts.get(k) ?? 0) > 1) error = "Login name used more than once";
    }
    return { ...r, error };
  });
}

function suggestLoginName(base: string, taken: Set<string>): string {
  const root = base.trim() || "guest";
  if (!taken.has(normalise(root))) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}${n}`;
    if (!taken.has(normalise(candidate))) return candidate;
  }
}

export function BulkImportModal({ open, onClose, onImport, existingGuests, groups }: BulkImportModalProps) {
  const [parsed, setParsed] = useState<ParsedGuest[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [openRepeatId, setOpenRepeatId] = useState<string | null>(null);
  const [removedCount, setRemovedCount] = useState(0);
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingUsernames = new Set(existingGuests.map((g) => normalise(g.username ?? "")).filter(Boolean));

  const reset = useCallback(() => {
    setParsed([]);
    setFileName("");
    setImportError(null);
    setImportSummary(null);
    setSelectedGroupId("");
    setOpenRepeatId(null);
    setRemovedCount(0);
    setConfirmingRemoval(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImportError(null);
    setImportSummary(null);
    setOpenRepeatId(null);
    setRemovedCount(0);
    setConfirmingRemoval(false);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setParsed(buildRows(parseCsv(text), existingGuests));
    };
    reader.readAsText(file);
  };

  const updateUsername = (id: string, username: string) => {
    setParsed((prev) => prev.map((r) => (r.id === id ? { ...r, username } : r)));
  };

  const toggleMark = (id: string) => {
    setParsed((prev) => prev.map((r) => (r.id === id ? { ...r, marked: !r.marked } : r)));
  };

  const removeMarked = () => {
    const count = parsed.filter((r) => r.marked).length;
    setParsed((prev) => prev.filter((r) => !r.marked));
    setRemovedCount((c) => c + count);
    setConfirmingRemoval(false);
    setOpenRepeatId(null);
  };

  const chooseDecision = (id: string, decision: Decision) => {
    setParsed((prev) => {
      const taken = new Set(existingUsernames);
      for (const r of prev) if (r.id !== id && willImport(r)) taken.add(normalise(r.username));
      return prev.map((r) => {
        if (r.id !== id) return r;
        if (decision !== "different") return { ...r, decision };
        const username = taken.has(normalise(r.username)) ? suggestLoginName(r.username, taken) : r.username;
        return { ...r, decision, username };
      });
    });
  };

  const annotated = annotateRows(parsed, existingUsernames);
  const importRows = annotated.filter((r) => willImport(r) && !r.error);
  const repeatCount = parsed.filter((r) => r.repeat).length;
  const markedCount = parsed.filter((r) => r.marked).length;
  const pendingCount = parsed.filter((r) => r.repeat && r.decision === "pending" && !r.marked).length;
  const skippedCount = parsed.filter((r) => r.repeat && r.decision === "same" && !r.marked).length;
  const errorCount = annotated.filter((r) => r.error).length;

  const handleImport = async () => {
    if (importRows.length === 0) return;
    setImporting(true);
    setImportError(null);
    setImportSummary(null);
    try {
      const groupId = selectedGroupId || null;
      const result = await onImport(importRows.map((r) => ({ name: r.fullName, username: r.username, groupId })));
      if (result.failed > 0) {
        setImportError(`${result.imported} imported, ${result.failed} failed: ${result.errors.join(", ")}`);
      } else {
        setImportSummary(`${result.imported} guest(s) imported and ${result.invited} invited to the Main Event.`);
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

  const statusCell = (r: AnnotatedGuest) => {
    if (r.marked) return <span className="text-dash-danger">Marked for removal</span>;
    if (r.error) return <span className="text-dash-danger">{r.error}</span>;
    if (r.repeat && r.decision === "pending") return <span className="text-amber-700">Repeat: choose below</span>;
    if (r.repeat && r.decision === "same") return <span className="text-dash-muted">Same person: skipped</span>;
    if (r.repeat && r.decision === "different") return <span className="text-green-600">Different person: will import</span>;
    return <span className="text-green-600">OK</span>;
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
                {repeatCount > 0 && <span className="text-amber-700"> ({repeatCount} repeated)</span>}
                {errorCount > 0 && <span className="text-dash-danger"> ({errorCount} with errors)</span>}
              </p>
              <button onClick={() => reset()} className="text-xs text-dash-primary hover:underline">Choose different file</button>
            </div>
            {markedCount > 0 && !confirmingRemoval && (
              <div className="flex items-center justify-between rounded-lg bg-dash-bg px-3 py-2">
                <p className="text-xs text-dash-muted">{markedCount} entr{markedCount === 1 ? "y is" : "ies are"} marked for removal.</p>
                <Button variant="danger" size="sm" onClick={() => setConfirmingRemoval(true)}>Remove marked ({markedCount})</Button>
              </div>
            )}
            {confirmingRemoval && (
              <div className="space-y-2 rounded-lg border border-dash-border bg-dash-bg px-3 py-3">
                <p className="text-sm text-dash-text">Remove {markedCount} marked entr{markedCount === 1 ? "y" : "ies"} from this import? They will not be added. Your guest list is not changed.</p>
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmingRemoval(false)}>Keep them</Button>
                  <Button variant="danger" size="sm" onClick={removeMarked}>Yes, remove</Button>
                </div>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto rounded-lg border border-dash-border">
              <table className="w-full">
                <thead className="bg-dash-bg sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Full Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Login name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-dash-muted">Status</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-dash-muted"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dash-border bg-dash-surface">
                  {annotated.map((r) => (
                    <Fragment key={r.id}>
                      <tr className={r.marked ? "bg-dash-bg opacity-70" : r.error ? "bg-red-50" : r.repeat ? "bg-amber-50" : ""}>
                        <td className="px-3 py-2 text-sm text-dash-text">{r.fullName}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={r.username}
                            onChange={(e) => updateUsername(r.id, e.target.value)}
                            className="w-full rounded border border-dash-border bg-[var(--dash-field)] px-2 py-1 text-sm text-dash-text focus:border-dash-primary focus:outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-xs">{statusCell(r)}</td>
                        <td className="px-3 py-2 text-right">
                          {r.repeat && (
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setOpenRepeatId(openRepeatId === r.id ? null : r.id)}
                                className="text-xs text-dash-primary hover:underline"
                              >
                                {openRepeatId === r.id ? "Hide" : "Check"}
                              </button>
                              <button
                                onClick={() => toggleMark(r.id)}
                                className={r.marked ? "text-xs text-dash-text hover:underline" : "text-xs text-dash-danger hover:underline"}
                              >
                                {r.marked ? "Unmark" : "Remove"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {r.repeat && openRepeatId === r.id && (
                        <tr className="bg-dash-bg">
                          <td colSpan={4} className="px-3 py-3">
                            <p className="text-xs font-semibold text-dash-text">{r.repeat.title}</p>
                            <ul className="mt-1 space-y-0.5 text-xs text-dash-muted">
                              {r.repeat.details.map((d) => <li key={d}>{d}</li>)}
                            </ul>
                            <p className="mt-3 text-xs text-dash-text">Is this the same person?</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Button size="sm" variant={r.decision === "same" ? undefined : "secondary"} onClick={() => chooseDecision(r.id, "same")}>Same person: skip</Button>
                              <Button size="sm" variant={r.decision === "different" ? undefined : "secondary"} onClick={() => chooseDecision(r.id, "different")}>Different person: import</Button>
                            </div>
                            {r.decision === "different" && (
                              <p className="mt-2 text-xs text-dash-muted">Edit the login name in the table above if you want a different one.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-700">{pendingCount} repeated name(s) still need a decision and will be skipped.</p>
            )}
            <p className="text-xs text-dash-muted">
              {importRows.length} will be added
              {removedCount > 0 && `, ${removedCount} removed`}
              {skippedCount > 0 && `, ${skippedCount} skipped as the same person`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" size="sm" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button size="sm" onClick={handleImport} loading={importing} disabled={importRows.length === 0}>
                Import {importRows.length} guest(s)
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
