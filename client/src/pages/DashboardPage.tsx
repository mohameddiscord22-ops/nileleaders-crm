import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CATEGORY_LABELS } from "@/pages/LeadsPage";

const STATUS_LABELS: Record<string, string> = {
  available: "متاح",
  not_available: "مش متاح",
  will_be_free_later: "هيبقى فاضي بعدين",
  do_not_contact: "متتصلش تاني",
};

const CHART_COLORS: Record<string, string> = {
  available: "#22c55e",
  unavailable: "#ef4444",
  upcoming: "#eab308",
  contacted: "#3b82f6",
  unassigned: "#6b7280",
};

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const statsQuery = trpc.dashboard.stats.useQuery();
  const upcomingQuery = trpc.dashboard.upcoming.useQuery();
  const activityQuery = trpc.dashboard.recentActivity.useQuery();

  const stats = statsQuery.data;

  const chartData = stats
    ? (["available", "unavailable", "upcoming", "contacted", "unassigned"] as const)
        .map(key => ({ name: CATEGORY_LABELS[key], key, value: stats[key] }))
        .filter(d => d.value > 0)
    : [];

  const cards = [
    { key: "total", label: "إجمالي الليدز", value: stats?.total ?? 0, color: "text-foreground" },
    { key: "available", label: "متاح", value: stats?.available ?? 0, color: "text-green-500" },
    { key: "unavailable", label: "مش متاح", value: stats?.unavailable ?? 0, color: "text-red-500" },
    { key: "upcoming", label: "هيبقى فاضي", value: stats?.upcoming ?? 0, color: "text-yellow-600" },
    { key: "contacted", label: "اتقفل", value: stats?.contacted ?? 0, color: "text-blue-500" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <h1 className="text-xl font-bold">الداشبورد</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map(card => (
          <div key={card.key} className="rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border p-4">
          <h2 className="font-bold mb-3">توزيع الليدز</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">مفيش بيانات كفاية لعرض الشارت</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {chartData.map(entry => (
                    <Cell key={entry.key} fill={CHART_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border p-4">
          <h2 className="font-bold mb-3">متابعات قادمة (خلال أسبوع)</h2>
          {upcomingQuery.isLoading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
          {upcomingQuery.data?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-10">مفيش متابعات قريبة</p>
          )}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {upcomingQuery.data?.map((item: any) => (
              <div
                key={item.lead.id}
                onClick={() => setLocation(`/leads/${item.lead.id}`)}
                className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm cursor-pointer hover:bg-accent/30"
              >
                <div>
                  <p className="font-medium">{item.lead.ownerName || item.lead.phone}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{item.lead.phone}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString("ar-EG") : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <h2 className="font-bold mb-3">آخر الأنشطة</h2>
        {activityQuery.isLoading && <p className="text-sm text-muted-foreground">جاري التحميل...</p>}
        {activityQuery.data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">مفيش نشاط لسه</p>
        )}
        <div className="space-y-2">
          {activityQuery.data?.map(item => (
            <div
              key={item.id}
              onClick={() => setLocation(`/leads/${item.leadId}`)}
              className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm cursor-pointer hover:bg-accent/30"
            >
              <div>
                <p className="font-medium">{item.ownerName || item.phone}</p>
                <p className="text-xs text-muted-foreground">{STATUS_LABELS[item.status]}</p>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(item.createdAt).toLocaleString("ar-EG")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
