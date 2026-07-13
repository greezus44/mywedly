import { useState, useCallback, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase, Wedding, Guest } from "../../lib/supabase";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Input";
import { Card, Badge, FormField, Toast, ErrorState, EmptyState } from "../../components/ui/index";
import { generateToken } from "../../lib/utils";

type OutletContext = { wedding: Wedding | null };

interface ParsedGuest {
  name: string;
  email: string;
  phone: string;
  group_name: string;
  valid: boolean;
  error?: string;
}

export default function ImportsPage() {
  const { wedding } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [csvText, setCsvText] = useState("");
  const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (guests: ParsedGuest[]) => {
      if (!wedding) throw new Error("No wedding");
      const rows = guests.filter((g) => g.valid).map((g) => ({
        wedding_id: wedding.id,
        name: g.name,
        email: g.email,
        phone: g.phone,
        group_name: g.group_name,
        token: generateToken(),
        rsvp_status: "pending" as const,
        plus_ones: 0,
        actual_attendance: 0,
        dietary: "",
        message: "",
        side: "",
      }));
      if (rows.length === 0) throw new Error("No valid guests to import");
      const { error } = await supabase.from("guests").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["guests", wedding?.id] });
      setToast({ msg: `${count} guests imported successfully!`, type: "success" });
      setTimeout(() => setToast(null), 4000);
      setCsvText("");
      setParsedGuests([]);
    },
    onError: (err: any) => {
      setToast({ msg: "Failed: " + err.message, type: "error" });
      setTimeout(() => setToast(null), 4000);
    },
  });

  const handleParse = useCallback(() => {
    const lines = csvText.trim().split("\n");
    const result: ParsedGuest[] = [];
    const hasHeader = lines[0]?.toLowerCase().includes("name") && lines[0]?.toLowerCase().includes("email");

    const dataLines = hasHeader ? lines.slice(1) : lines;
    for (const line of dataLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(",").map((p) => p.trim());
      const name = parts[0] || "";
      const email = parts[1] || "";
      const phone = parts[2] || "";
      const group = parts[3] || "";

      if (!name) {
        result.push({ name, email, phone, group_name: group, valid: false, error: "Missing name" });
      } else {
        result.push({ name, email, phone, group_name: group, valid: true });
      }
    }
    setParsedGuests(result);
  }, [csvText]);

  const handleImport = useCallback(() => {
    importMutation.mutate(parsedGuests);
  }, [parsedGuests, importMutation]);

  const validCount = useMemo(() => parsedGuests.filter((g) => g.valid).length, [parsedGuests]);
  const invalidCount = parsedGuests.length - validCount;

  if (!wedding) return <ErrorState message="Could not load wedding data" onRetry={() => navigate("/admin")} />;

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Import Guests</h1>
        <p className="text-sm text-gray-500">Paste CSV data to bulk import guests</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
          <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">CSV Format</p>
            <p className="text-blue-600 text-xs mt-1">name, email, phone, group</p>
            <p className="text-blue-600 text-xs">Example: John Doe, john@example.com, +1234567890, Family</p>
          </div>
        </div>

        <FormField label="CSV Data" hint="First row can be a header (name,email,phone,group) or data directly">
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"John Doe, john@example.com, +1234567890, Family\nJane Smith, jane@example.com, +9876543210, Friends"}
            className="min-h-[200px] font-mono text-xs"
          />
        </FormField>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleParse} disabled={!csvText.trim()}>Parse & Preview</Button>
          {parsedGuests.length > 0 && (
            <Button onClick={handleImport} loading={importMutation.isPending} disabled={validCount === 0}>
              <Upload className="w-4 h-4" /> Import {validCount} Guest{validCount !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </Card>

      {parsedGuests.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Preview ({parsedGuests.length} rows)</h3>
            <div className="flex gap-2">
              <Badge color="green">{validCount} valid</Badge>
              {invalidCount > 0 && <Badge color="red">{invalidCount} invalid</Badge>}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden sm:table-cell">Email</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden md:table-cell">Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 hidden lg:table-cell">Group</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {parsedGuests.map((g, i) => (
                  <tr key={i} className={g.valid ? "" : "bg-red-50"}>
                    <td className="px-3 py-2">
                      {g.valid ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">{g.name || <span className="text-red-400">—</span>}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 hidden sm:table-cell">{g.email}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 hidden md:table-cell">{g.phone}</td>
                    <td className="px-3 py-2 text-sm text-gray-500 hidden lg:table-cell">{g.group_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {parsedGuests.length === 0 && !csvText.trim() && (
        <Card className="p-6">
          <EmptyState icon={<Upload className="w-10 h-10" />} title="Paste your CSV data above" description="Click Parse & Preview to validate before importing" />
        </Card>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
