import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Admin-only user management page.
 * Wire this into your router as a protected route, e.g. `/users`, and only
 * show its sidebar entry when `user.role === "admin"`.
 */
export default function UsersPage() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const usersQuery = trpc.users.list.useQuery(undefined, { enabled: user?.role === "admin" });

  const [showAddModal, setShowAddModal] = useState(false);
  const [resetPasswordFor, setResetPasswordFor] = useState<{ id: number; name: string | null } | null>(null);

  const createMutation = trpc.users.create.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      setShowAddModal(false);
      toast.success("تم إضافة اليوزر بنجاح! 🌟");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء إضافة اليوزر");
    },
  });

  const updateMutation = trpc.users.update.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("تم تحديث اليوزر بنجاح! ✓");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء التحديث");
    },
  });

  const deleteMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("تم حذف اليوزر بنجاح! 🗑");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء الحذف");
    },
  });

  const resetPasswordMutation = trpc.users.resetPassword.useMutation({
    onSuccess: () => {
      setResetPasswordFor(null);
      toast.success("تم إعادة تعيين الباسورد بنجاح! 🔐");
    },
    onError: (error) => {
      toast.error(error.message || "حصل خطأ أثناء إعادة الباسورد");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="p-8 text-center text-muted-foreground" dir="rtl">
        الصفحة دي للأدمن بس.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">إدارة اليوزرز</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium"
        >
          + إضافة يوزر
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-right">
              <th className="p-3 font-medium">الاسم</th>
              <th className="p-3 font-medium">اليوزرنيم</th>
              <th className="p-3 font-medium">الصلاحية</th>
              <th className="p-3 font-medium">آخر دخول</th>
              <th className="p-3 font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {usersQuery.isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {usersQuery.data?.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3">{u.name || "-"}</td>
                <td className="p-3">{u.username || "-"}</td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={e =>
                      updateMutation.mutate({ id: u.id, role: e.target.value as "user" | "admin" })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1"
                  >
                    <option value="user">يوزر</option>
                    <option value="admin">أدمن</option>
                  </select>
                </td>
                <td className="p-3 text-muted-foreground">
                  {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString("ar-EG") : "-"}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setResetPasswordFor({ id: u.id, name: u.name })}
                      className="text-xs text-primary hover:underline"
                    >
                      تصفير الباسورد
                    </button>
                    <button
                      onClick={() => {
                        if (u.id === user.id) return;
                        if (confirm(`متأكد إنك عايز تمسح ${u.name || u.username}؟`)) {
                          deleteMutation.mutate({ id: u.id });
                        }
                      }}
                      disabled={u.id === user.id}
                      className="text-xs text-destructive hover:underline disabled:opacity-40"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usersQuery.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">
                  لسه مفيش يوزرز
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSubmit={data => createMutation.mutate(data)}
          pending={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}

      {resetPasswordFor && (
        <ResetPasswordModal
          userName={resetPasswordFor.name}
          onClose={() => setResetPasswordFor(null)}
          onSubmit={password => resetPasswordMutation.mutate({ id: resetPasswordFor.id, password })}
          pending={resetPasswordMutation.isPending}
          error={resetPasswordMutation.error?.message}
        />
      )}
    </div>
  );
}

function AddUserModal({
  onClose,
  onSubmit,
  pending,
  error,
}: {
  onClose: () => void;
  onSubmit: (data: { username: string; password: string; name?: string; role: "user" | "admin" }) => void;
  pending: boolean;
  error?: string;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-bold text-lg">إضافة يوزر جديد</h2>

        <div>
          <label className="block text-sm mb-1">الاسم</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">اليوزرنيم</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">الباسورد</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm mb-1">الصلاحية</label>
          <select value={role} onChange={e => setRole(e.target.value as "user" | "admin")} className="w-full rounded-lg border border-border bg-background px-3 py-2">
            <option value="user">يوزر</option>
            <option value="admin">أدمن</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSubmit({ username, password, name: name || undefined, role })}
            disabled={pending || !username || !password}
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "جاري..." : "إضافة"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({
  userName,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  userName: string | null;
  onClose: () => void;
  onSubmit: (password: string) => void;
  pending: boolean;
  error?: string;
}) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-xl bg-card border border-border p-6 space-y-4">
        <h2 className="font-bold text-lg">تصفير باسورد {userName || ""}</h2>
        <div>
          <label className="block text-sm mb-1">الباسورد الجديد</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSubmit(password)}
            disabled={pending || password.length < 6}
            className="flex-1 rounded-lg bg-primary text-primary-foreground py-2 text-sm font-medium disabled:opacity-60"
          >
            {pending ? "جاري..." : "حفظ"}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-border py-2 text-sm">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
