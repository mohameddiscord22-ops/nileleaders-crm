import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import FeedbackModal from "@/components/FeedbackModal";
import { toWhatsAppLink, CATEGORY_LABELS, CATEGORY_COLORS } from "@/pages/LeadsPage";

const STATUS_LABELS: Record<string, string> = {
  available: "متاح",
  not_available: "مش متاح",
  will_be_free_later: "هيبقى فاضي بعدين",
  do_not_contact: "متتصلش تاني",
};

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const leadId = Number(params.id);
  const utils = trpc.useUtils();

  const leadQuery = trpc.leads.get.useQuery({ id: leadId }, { enabled: !!leadId });
  const feedbackQuery = trpc.feedback.list.useQuery({ leadId }, { enabled: !!leadId });

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      utils.leads.get.invalidate({ id: leadId });
      utils.leads.list.invalidate();
      setEditMode(false);
      toast.success("تم تحديث الليد بنجاح! ✓");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء التحديث");
    },
  });

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("تم حذف الليد بنجاح! 🗑");
      setLocation("/leads");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء الحذف");
    },
  });

  const lead = leadQuery.data;

  if (leadQuery.isLoading) {
    return <div className="p-6 text-center text-muted-foreground">جاري التحميل...</div>;
  }

  if (!lead) {
    return <div className="p-6 text-center text-muted-foreground">الليد ده مش موجود</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl" dir="rtl">
      <button onClick={() => setLocation("/leads")} className="text-sm text-muted-foreground hover:text-foreground">
        ← رجوع للليدز
      </button>

      <div className="rounded-xl border border-border p-5 space-y-4">
        {!editMode ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-lg font-bold">{lead.ownerName || "بدون اسم"}</h1>
                <p className="text-muted-foreground text-sm" dir="ltr">{lead.phone}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[lead.autoCategory]}`}>
                {CATEGORY_LABELS[lead.autoCategory]}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={toWhatsAppLink(lead.phone)}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium"
              >
                واتساب
              </a>
              <a href={`tel:${lead.phone}`} className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium">
                اتصال
              </a>
              <button
                onClick={() => {
                  setOwnerName(lead.ownerName || "");
                  setPhone(lead.phone);
                  setEditMode(true);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
              >
                تعديل
              </button>
              <button
                onClick={() => {
                  if (confirm("متأكد إنك عايز تمسح الليد ده؟")) {
                    deleteMutation.mutate({ id: leadId });
                  }
                }}
                className="rounded-lg border border-destructive text-destructive px-4 py-2 text-sm font-medium"
              >
                حذف
              </button>
            </div>

            {lead.customFields && Object.keys(lead.customFields).length > 0 && (
              <div className="pt-2 border-t border-border">
                <p className="text-sm font-medium mb-2">بيانات إضافية</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(lead.customFields).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-muted-foreground">{key}: </span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">الاسم</label>
              <input
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">الرقم</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                dir="ltr"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate({ id: leadId, ownerName, phone })}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {updateMutation.isPending ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setEditMode(false)} className="rounded-lg border border-border px-4 py-2 text-sm">
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">سجل الفيدباك</h2>
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
          >
            + فيدباك جديد
          </button>
        </div>

        {feedbackQuery.isLoading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}

        {feedbackQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">لسه مفيش فيدباك على الليد ده</p>
        )}

        <div className="space-y-2">
          {feedbackQuery.data?.map(fb => (
            <div key={fb.id} className="rounded-lg border border-border p-3 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{STATUS_LABELS[fb.status]}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(fb.createdAt).toLocaleString("ar-EG")}
                </span>
              </div>
              {fb.followUpDate && (
                <p className="text-xs text-muted-foreground">
                  متابعة يوم: {new Date(fb.followUpDate).toLocaleDateString("ar-EG")}
                </p>
              )}
              {fb.notes && <p className="text-muted-foreground">{fb.notes}</p>}
            </div>
          ))}
        </div>
      </div>

      {showFeedbackModal && <FeedbackModal leadId={leadId} onClose={() => setShowFeedbackModal(false)} />}
    </div>
  );
}
