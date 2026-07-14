import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import ExcelImport from "@/components/ExcelImport";

const CATEGORY_LABELS: Record<string, string> = {
  unassigned: "غير مصنف",
  available: "متاح",
  unavailable: "مش متاح",
  upcoming: "هيتصل لاحقًا",
  contacted: "اتقفل",
};

const CATEGORY_COLORS: Record<string, string> = {
  unassigned: "bg-gray-500/15 text-gray-500",
  available: "bg-green-500/15 text-green-500",
  unavailable: "bg-red-500/15 text-red-500",
  upcoming: "bg-yellow-500/15 text-yellow-600",
  contacted: "bg-blue-500/15 text-blue-500",
};

function toWhatsAppLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  // Normalize Egyptian numbers (01xxxxxxxxx) to international format (20xxxxxxxxx)
  const normalized = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export default function LeadsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [showImport, setShowImport] = useState(false);

  const leadsQuery = trpc.leads.list.useQuery({
    search: search || undefined,
    autoCategory: category as any,
  });

  return (
    <div className="p-4 md:p-6 space-y-4" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">الليدز</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(v => !v)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
          >
            {showImport ? "قفل الاستيراد" : "استيراد من إكسل"}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="rounded-xl border border-border p-4">
          <ExcelImport onDone={() => setShowImport(false)} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="دور بالاسم أو الرقم..."
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={category ?? ""}
          onChange={e => setCategory(e.target.value || undefined)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="">كل التصنيفات</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-right">
              <th className="p-3 font-medium">الاسم</th>
              <th className="p-3 font-medium">الرقم</th>
              <th className="p-3 font-medium">التصنيف</th>
              <th className="p-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {leadsQuery.isLoading && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {leadsQuery.data?.map(lead => (
              <tr
                key={lead.id}
                className="border-t border-border hover:bg-accent/30 cursor-pointer"
                onClick={() => setLocation(`/leads/${lead.id}`)}
              >
                <td className="p-3">{lead.ownerName || "-"}</td>
                <td className="p-3" dir="ltr">{lead.phone}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${CATEGORY_COLORS[lead.autoCategory]}`}>
                    {CATEGORY_LABELS[lead.autoCategory]}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    <a
                      href={toWhatsAppLink(lead.phone)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600 hover:underline text-xs font-medium"
                    >
                      واتساب
                    </a>
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline text-xs font-medium">
                      اتصال
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {leadsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-10 text-center text-muted-foreground">
                  مفيش ليدز لسه — استورد ملف إكسل عشان تبدأ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { toWhatsAppLink, CATEGORY_LABELS, CATEGORY_COLORS };
