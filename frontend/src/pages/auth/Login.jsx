import { ArrowLeft, GraduationCap, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const roles = [
  { id: "student", label: "Student", hint: "Registration Number", demoId: "REG2024001", demoPassword: "password123" },
  { id: "faculty", label: "HOD/Advisor/Faculty", hint: "Employee ID", demoId: "EMP1001", demoPassword: "password123" },
  { id: "admin", label: "Admin", hint: "Admin ID", demoId: "ADM001", demoPassword: "admin123" }
];

const Login = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [mode, setMode] = useState(query.get("mode") === "reset" ? "reset" : "login");
  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("REG2024001");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState("REG2024001");
  const [resetToken, setResetToken] = useState(query.get("token") || "");
  const [resetPassword, setResetPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState(null);

  useEffect(() => {
    const tokenFromQuery = query.get("token") || "";
    if (query.get("mode") === "reset") {
      setMode("reset");
      setResetToken(tokenFromQuery);
    }
  }, [query]);

  if (isAuthenticated) return <Navigate to={`/${user.role}`} replace />;

  const selected = roles.find((item) => item.id === role);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const loggedIn = await login({ identifier, password, role });
      navigate(`/${loggedIn.role}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const requestReset = async (event) => {
    event.preventDefault();
    if (!recoveryIdentifier) {
      toast.error("Enter your registration number or employee ID first.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { identifier: recoveryIdentifier });
      setRecoveryStatus(data);
      toast.success(data.smtpConfigured ? "If the account exists, a reset email has been sent." : "SMTP is not configured on this setup, so reset emails are disabled.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to generate reset link");
    } finally {
      setLoading(false);
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token: resetToken,
        password: resetPassword,
        confirmPassword
      });
      toast.success("Password reset complete. You can sign in now.");
      setMode("login");
      setPassword("");
      setResetPassword("");
      setConfirmPassword("");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (nextRole) => {
    const option = roles.find((item) => item.id === nextRole);
    setRole(nextRole);
    setIdentifier(option.demoId);
    setPassword(option.demoPassword);
    setRecoveryIdentifier(option.demoId);
    setRecoveryStatus(null);
  };

  const title = mode === "login" ? "Sign in" : mode === "forgot" ? "Recover password" : "Set a new password";
  const subtitle =
    mode === "login"
      ? "Choose your portal and continue."
      : mode === "forgot"
        ? "Generate a secure reset link for your account."
        : "Use the one-time reset token to finish recovery.";

  return (
    <div className="min-h-screen bg-paper dark:bg-[#181c1a]">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            alt="University campus walkway"
            src="https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1400&q=80"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/55" />
          <div className="absolute inset-x-0 bottom-0 p-12 text-white">
            <p className="mb-3 inline-flex rounded-lg bg-mint px-3 py-1 text-sm font-semibold text-ink">University ERP</p>
            <h1 className="max-w-2xl text-5xl font-bold leading-tight">Student Registration and Enrolment System</h1>
            <p className="mt-5 max-w-xl text-lg text-white/80">Register semesters, approve enrollments, manage courses, and keep academic operations moving.</p>
          </div>
        </section>

        <section className="flex items-center justify-center p-5">
          <div className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-ink">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-mint text-ink">
                <GraduationCap />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">{title}</h2>
              <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{subtitle}</p>
            </div>

            {mode !== "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  navigate("/login", { replace: true });
                }}
                className="focus-ring mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink/70 dark:text-white/70"
              >
                <ArrowLeft size={16} />
                Back to sign in
              </button>
            )}

            {mode === "login" && (
              <form onSubmit={submit}>
                <div className="mb-5 grid grid-cols-3 gap-2">
                  {roles.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => switchRole(item.id)}
                      className={`focus-ring rounded-lg px-2 py-3 text-xs font-semibold ${role === item.id ? "bg-mint text-ink" : "bg-paper text-ink/70 dark:bg-white/10 dark:text-white/70"}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <label className="mb-4 block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">{selected.hint}</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <Mail size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
                  </div>
                </label>

                <label className="mb-2 block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">Password</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <LockKeyhole size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryIdentifier(identifier);
                    setMode("forgot");
                  }}
                  className="mb-5 text-sm font-semibold text-coral"
                >
                  Forgot password?
                </button>

                <button disabled={loading} className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-mint dark:text-ink">
                  <ShieldCheck size={18} />
                  {loading ? "Signing in..." : "Login"}
                </button>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={requestReset} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">Registration Number / Employee ID</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <Mail size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" value={recoveryIdentifier} onChange={(event) => setRecoveryIdentifier(event.target.value)} />
                  </div>
                </label>
                <button disabled={loading} className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-mint dark:text-ink">
                  <KeyRound size={18} />
                  {loading ? "Generating..." : "Generate reset link"}
                </button>
                {recoveryStatus && (
                  <div className="rounded-lg border border-ink/10 bg-paper p-3 text-sm text-ink/75 dark:border-white/10 dark:bg-white/10 dark:text-white/75">
                    <p className="font-semibold dark:text-white">Password recovery status</p>
                    <p className="mt-1">{recoveryStatus.message}</p>
                    {recoveryStatus.smtpConfigured ? (
                      <p className="mt-2 text-xs text-ink/60 dark:text-white/60">Open the reset link from the registered email inbox, then continue on the reset screen.</p>
                    ) : (
                      <p className="mt-2 text-xs text-coral">SMTP is not configured in `backend/.env`, so email delivery is currently disabled on this machine.</p>
                    )}
                  </div>
                )}
                <button type="button" onClick={() => setMode("reset")} className="text-sm font-semibold text-coral">
                  I already have a reset token
                </button>
              </form>
            )}

            {mode === "reset" && (
              <form onSubmit={submitReset} className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">Reset Token</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <KeyRound size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" value={resetToken} onChange={(event) => setResetToken(event.target.value)} />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">New Password</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <LockKeyhole size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" type="password" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium dark:text-white">Confirm Password</span>
                  <div className="flex items-center gap-2 rounded-lg border border-ink/20 bg-paper px-3 dark:border-white/10 dark:bg-white/10">
                    <LockKeyhole size={18} className="text-ink/50 dark:text-white/50" />
                    <input className="focus-ring w-full bg-transparent py-3 text-sm dark:text-white" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
                  </div>
                </label>
                <button disabled={loading} className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-mint dark:text-ink">
                  <ShieldCheck size={18} />
                  {loading ? "Updating..." : "Reset password"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
