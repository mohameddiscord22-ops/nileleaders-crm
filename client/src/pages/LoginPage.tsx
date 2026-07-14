import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Local login/register page.
 * - If no users exist yet in the system, this acts as a "create the first
 *   admin account" screen (register mode).
 * - Otherwise it's a normal login screen. New users after the first one are
 *   created by an admin from the Users management page, not via self-signup.
 */
export default function LoginPage() {
  const { login, register, loginPending, registerPending } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pending = loginPending || registerPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (mode === "login") {
        await login(username, password);
        toast.success("تم الدخول بنجاح! 👋");
      } else {
        await register(username, password, name || undefined);
        toast.success("تم إنشاء الحساب بنجاح! 🎉");
      }
    } catch (err: any) {
      const msg = err?.message || "حصل خطأ، حاول تاني";
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-1">Nile Leaders CRM</h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          {mode === "login" ? "سجل دخولك عشان تكمل شغلك" : "إنشاء أول حساب أدمن للنظام"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm mb-1">الاسم</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
                placeholder="اسمك"
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">اليوزرنيم</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="username"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">الباسورد</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-red-500 text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2 font-medium disabled:opacity-60"
          >
            {pending ? "جاري..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(m => (m === "login" ? "register" : "login"));
            setErrorMsg(null);
          }}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground text-center"
        >
          {mode === "login"
            ? "أول مرة تدخل النظام؟ اعمل حساب الأدمن"
            : "عندك حساب بالفعل؟ سجل دخول"}
        </button>
      </div>
    </div>
  );
}
