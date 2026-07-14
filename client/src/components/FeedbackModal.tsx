import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "available", label: "متاح" },
  { value: "not_available", label: "مش متاح" },
  { value: "will_be_free_later", label: "هيبقى فاضي بعدين" },
  { value: "do_not_contact", label: "متتصلش تاني" },
] as const;

export default function FeedbackModal({
  leadId,
  onClose,
}: {
  leadId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("available");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      utils.feedback.list.invalidate({ leadId });
      utils.leads.list.invalidate();
      utils.leads.get.invalidate({ id: leadId });
      utils.dashboard.stats.invalidate();
      utils.dashboard.upcoming.invalidate();
      toast.success("تم حفظ الفيدباك بنجاح! ✓");
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء حفظ الفيدباك");
    },
  });

  const handleSubmit = () => {
    createMutation.mutate({
      leadId,
      status,
      followUpDate:
        status === "will_be_free_later" && followUpDate ? new Date(followUpDate).getTime() : undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-bold text-lg">إضافة فيدباك</h2>

        <div>
          <label className="block text-sm mb-1">الحالة</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {status === "will_be_free_later" && (
          <div>
            <label className="block text-sm mb-1">هيبقى فاضي إمتى</label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
        )}

        <div>
          <label className="block text-sm mb-1">ملاحظات</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder="اكتب أي تفاصيل مهمة عن المكالمة..."
          />
        </div>

        {createMutation.error && (
          <p className="text-sm text-red-500">{createMutation.error.message}</p>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
          >
            {createMutation.isPending ? "جاري الحفظ..." : "حفظ"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
