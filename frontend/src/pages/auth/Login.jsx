import { GraduationCap, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const roles = [
  { id: "student", label: "Student", hint: "Registration Number" },
  { id: "faculty", label: "HOD/Advisor/Faculty", hint: "Employee ID" },
  { id: "admin", label: "Admin", hint: "Admin ID" }
];

const Login = () => {
  const { isAuthenticated, user, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [identifier, setIdentifier] = useState("REG2024001");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);

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

  const forgotPassword = async () => {
    if (!identifier) return toast.error("Enter your ID first");
    await api.post("/auth/forgot-password", { identifier });
    toast.success("Reset instructions sent to registered email");
  };

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
          <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-ink">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-mint text-ink">
                <GraduationCap />
              </div>
              <h2 className="text-2xl font-bold dark:text-white">Sign in</h2>
              <p className="mt-1 text-sm text-ink/60 dark:text-white/60">Choose your portal and continue.</p>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2">
              {roles.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setRole(item.id);
                    setIdentifier(item.id === "student" ? "REG2024001" : item.id === "faculty" ? "EMP1001" : "ADM001");
                    setPassword(item.id === "admin" ? "admin123" : "password123");
                  }}
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

            <button type="button" onClick={forgotPassword} className="mb-5 text-sm font-semibold text-coral">
              Forgot password?
            </button>

            <button disabled={loading} className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60 dark:bg-mint dark:text-ink">
              <ShieldCheck size={18} />
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Login;
