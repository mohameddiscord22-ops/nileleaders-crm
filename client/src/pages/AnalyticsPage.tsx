import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export function AnalyticsPage() {
  const { data: dashboardStats, isLoading: statsLoading } = trpc.analytics.getDashboardStats.useQuery({});
  const { data: userPerformance, isLoading: performanceLoading } = trpc.analytics.getUserPerformance.useQuery({});
  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.analytics.getLeadsTimeSeries.useQuery({
    interval: "day",
  });
  const { data: conversionFunnel, isLoading: funnelLoading } = trpc.analytics.getConversionFunnel.useQuery({});

  const categoryData = useMemo(() => {
    if (!dashboardStats?.byCategory) return [];
    return Object.entries(dashboardStats.byCategory).map(([category, count]) => ({
      name: getCategoryLabel(category),
      value: count as number,
    }));
  }, [dashboardStats]);

  const funnelData = useMemo(() => {
    if (!conversionFunnel) return [];
    return [
      { name: "غير مصنفة", value: conversionFunnel.unassigned },
      { name: "متاحة", value: conversionFunnel.available },
      { name: "تم التواصل", value: conversionFunnel.contacted },
      { name: "متابعة", value: conversionFunnel.upcoming },
    ];
  }, [conversionFunnel]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">لوحة التحليلات</h1>
        <p className="text-muted-foreground">عرض شامل لأداء النظام والعملاء</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي العملاء</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{dashboardStats?.totalLeads || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">تم التواصل</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{dashboardStats?.contacted || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{dashboardStats?.conversionRate || 0}%</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الموظفون النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{userPerformance?.length || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>نمو العملاء</CardTitle>
            <CardDescription>عدد العملاء الجدد يومياً</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeries || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" name="إجمالي" />
                  <Line type="monotone" dataKey="contacted" stroke="#10b981" name="تم التواصل" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع العملاء</CardTitle>
            <CardDescription>حسب الفئة</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>قمع التحويل</CardTitle>
            <CardDescription>مراحل العملية</CardDescription>
          </CardHeader>
          <CardContent>
            {funnelLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Performance */}
        <Card>
          <CardHeader>
            <CardTitle>أداء الموظفين</CardTitle>
            <CardDescription>معدل التحويل لكل موظف</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-80" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userPerformance || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="conversionRate" fill="#10b981" name="معدل التحويل %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    unassigned: "غير مصنفة",
    available: "متاحة",
    unavailable: "غير متاحة",
    upcoming: "متابعة",
    contacted: "تم التواصل",
  };
  return labels[category] || category;
}
