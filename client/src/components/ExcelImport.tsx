import { useState } from "react";
import * as XLSX from "xlsx";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type ParsedRow = Record<string, unknown>;

const REQUIRED_FIELD = "phone";
const KNOWN_FIELDS = [
  { key: "ownerName", label: "اسم المالك" },
  { key: "phone", label: "رقم الموبايل" },
];

/**
 * Excel import flow:
 * 1. User picks a .xlsx/.xls/.csv file, we parse the first sheet with SheetJS.
 * 2. We show a column-mapping UI: for each known field (ownerName, phone),
 *    the user picks which Excel column it corresponds to. Any unmapped
 *    columns are kept as customFields on the lead.
 * 3. On confirm, we batch-create leads via leads.batchCreate.
 */
export default function ExcelImport({ onDone }: { onDone?: () => void }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const utils = trpc.useUtils();
  const batchCreateMutation = trpc.leads.batchCreate.useMutation();

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<ParsedRow>(sheet, { defval: "" });

      if (json.length === 0) {
        setError("الملف فاضي أو مش متعرف على البيانات جواه");
        return;
      }

      setRows(json);
      const cols = Object.keys(json[0]);
      setColumns(cols);

      // Try to auto-guess mapping based on column name similarity.
      const guessed: Record<string, string> = {};
      for (const field of KNOWN_FIELDS) {
        const match = cols.find(c => {
          const normalized = c.toLowerCase().trim();
          if (field.key === "phone") {
            return /phone|mobile|رقم|موبايل|تليفون|هاتف/.test(normalized);
          }
          if (field.key === "ownerName") {
            return /name|اسم|مالك|owner/.test(normalized);
          }
          return false;
        });
        if (match) guessed[field.key] = match;
      }
      setMapping(guessed);
    } catch (err) {
      console.error(err);
      setError("مقدرتش أقرا الملف، اتأكد إنه إكسل صحيح");
    }
  };

  const handleImport = async () => {
    setError(null);
    if (!mapping[REQUIRED_FIELD]) {
      setError("لازم تحدد عمود رقم الموبايل الأول");
      return;
    }

    const phoneCol = mapping.phone;
    const nameCol = mapping.ownerName;
    const mappedCols = new Set(Object.values(mapping).filter(Boolean));

    const leadsData = rows
      .map(row => {
        const phone = String(row[phoneCol] ?? "").trim();
        if (!phone) return null;
        const customFields: Record<string, unknown> = {};
        for (const col of columns) {
          if (!mappedCols.has(col) && row[col] !== "" && row[col] !== undefined) {
            customFields[col] = row[col];
          }
        }
        return {
          ownerName: nameCol ? String(row[nameCol] ?? "").trim() || undefined : undefined,
          phone,
          customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
        } as { ownerName?: string; phone: string; customFields?: Record<string, unknown> };
      })
      .filter((r): r is { ownerName?: string; phone: string; customFields?: Record<string, unknown> } => r !== null);

    const skipped = rows.length - leadsData.length;

    // De-duplicate by phone within the file itself.
    const seen = new Set<string>();
    const deduped = leadsData.filter(l => {
      if (seen.has(l.phone)) return false;
      seen.add(l.phone);
      return true;
    });

    try {
      const count = await batchCreateMutation.mutateAsync({ leadsData: deduped });
      setResult({ imported: count, skipped: skipped + (leadsData.length - deduped.length) });
      utils.leads.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success(`تم استيراد ${count} ليد بنجاح! 🎉`);
      onDone?.();
    } catch (err: any) {
      const errorMsg = err?.message || "حصل خطأ أثناء الاستيراد";
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      {!fileName && (
        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-10 cursor-pointer hover:bg-accent/30 transition-colors">
          <span className="text-sm font-medium">اضغط لاختيار ملف إكسل (.xlsx / .csv)</span>
          <span className="text-xs text-muted-foreground">هيتقرا أول شيت في الملف تلقائي</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {fileName && rows.length > 0 && !result && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            الملف: <span className="font-medium text-foreground">{fileName}</span> — {rows.length} صف
          </p>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <p className="text-sm font-medium">حدد الأعمدة</p>
            {KNOWN_FIELDS.map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <label className="w-32 text-sm shrink-0">
                  {field.label}
                  {field.key === REQUIRED_FIELD && <span className="text-red-500"> *</span>}
                </label>
                <select
                  value={mapping[field.key] || ""}
                  onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">— اختر عمود —</option>
                  {columns.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              أي عمود تاني هيتحفظ مع الليد كبيانات إضافية أوتوماتيك.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleImport}
              disabled={batchCreateMutation.isPending}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
            >
              {batchCreateMutation.isPending ? "جاري الاستيراد..." : `استيراد ${rows.length} ليد`}
            </button>
            <button
              onClick={() => {
                setFileName(null);
                setRows([]);
                setColumns([]);
                setMapping({});
              }}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm space-y-2">
          <p>
            تم استيراد <span className="font-bold">{result.imported}</span> ليد بنجاح.
            {result.skipped > 0 && ` (${result.skipped} صف اتجاهل لعدم وجود رقم موبايل أو تكرار)`}
          </p>
          <button
            onClick={() => {
              setFileName(null);
              setRows([]);
              setColumns([]);
              setMapping({});
              setResult(null);
            }}
            className="rounded-lg border border-border px-3 py-1.5 text-xs"
          >
            استيراد ملف تاني
          </button>
        </div>
      )}
    </div>
  );
}
