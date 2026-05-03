import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, Check, UserCircle, Building2, ShieldCheck } from "lucide-react";
import { useAuth, UserRole } from "@/src/context/AuthContext";
import { cn } from "@/src/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const ROLES: { id: UserRole; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "usuario",
    label: "Comprador",
    description: "Busque e salve imóveis de alto padrão",
    icon: UserCircle,
  },
  {
    id: "corretor",
    label: "Corretor",
    description: "Gerencie e apresente propriedades exclusivas",
    icon: Building2,
  },
  {
    id: "admin",
    label: "Administrativo",
    description: "Acesso completo à plataforma Gávea",
    icon: ShieldCheck,
  },
];

const FEATURES = [
  "Curadoria inteligente de imóveis",
  "IA especialista em estilo de vida",
  "Corretores certificados Gávea",
];

type Tab = "signin" | "signup";

export default function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("usuario");
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const field = (key: keyof typeof formData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData((p) => ({ ...p, [key]: e.target.value })),
  });

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (tab === "signup") {
      if (formData.password !== formData.confirm) {
        setError("As senhas não coincidem.");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        setLoading(false);
        return;
      }
      const { error } = await signUp(formData.email, formData.password, formData.fullName, role);
      if (error) {
        setError(translateError(error.message));
      } else {
        setSuccess("Conta criada! Verifique seu email para confirmar o cadastro.");
      }
    } else {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setError("Email ou senha inválidos.");
      } else {
        navigate("/");
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-brand-blue">
      {/* ── Left panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-16 overflow-hidden">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.18]"
        >
          <source src="/videoimovel.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-blue/95 to-brand-accent/15" />

        {/* Back link */}
        <div className="relative z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white/35 hover:text-white/65 text-[10px] uppercase tracking-[0.2em] font-semibold transition-colors duration-300"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <ArrowLeft size={13} />
            Voltar ao site
          </Link>
        </div>

        {/* Branding */}
        <div className="relative z-10">
          <img src="/logo gavea.webp" alt="Gávea" className="h-11 mb-14 opacity-90" />
          <h2
            className="text-[2.6rem] font-black text-white leading-[1.1] mb-5 tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            O endereço certo <br />
            <span className="text-brand-accent font-light italic">começa aqui.</span>
          </h2>
          <p className="text-white/38 font-light text-base leading-relaxed max-w-[22rem]">
            Plataforma exclusiva de imóveis de alto padrão no Rio de Janeiro. Curadoria inteligente, experiência premium.
          </p>

          <div className="mt-12 space-y-4">
            {FEATURES.map((feat) => (
              <div key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-accent/15 border border-brand-accent/35 flex items-center justify-center flex-shrink-0">
                  <Check size={10} className="text-brand-accent" />
                </div>
                <span className="text-white/45 text-sm font-light">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/18 text-[10px] tracking-widest uppercase" style={{ fontFamily: "var(--font-heading)" }}>
          © 2025 Gávea Imobiliária
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-brand-bg min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo + back */}
          <div className="lg:hidden mb-10 flex flex-col items-center gap-4">
            <Link to="/">
              <img src="/logo gavea.webp" alt="Gávea" className="h-9" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-brand-blue/35 hover:text-brand-blue/60 text-[10px] uppercase tracking-widest transition-colors"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <ArrowLeft size={12} />
              Voltar ao site
            </Link>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-brand-slate rounded-2xl p-1 mb-8">
            {(["signin", "signup"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
                  tab === t
                    ? "bg-white shadow-sm text-brand-blue"
                    : "text-brand-blue/35 hover:text-brand-blue/60"
                )}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {t === "signin" ? "Entrar" : "Criar Conta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Sign-up only fields ── */}
            <AnimatePresence initial={false}>
              {tab === "signup" && (
                <motion.div
                  key="signup-extras"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="overflow-hidden space-y-4"
                >
                  {/* Full name */}
                  <Field label="Nome completo">
                    <input
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      {...field("fullName")}
                      className={inputClass}
                    />
                  </Field>

                  {/* Role cards */}
                  <div>
                    <Label>Tipo de conta</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {ROLES.map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setRole(id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 text-center transition-all duration-300",
                            role === id
                              ? "bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/20"
                              : "bg-white border-brand-blue/8 text-brand-blue/45 hover:border-brand-accent/30 hover:text-brand-blue/70"
                          )}
                        >
                          <Icon size={20} />
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider leading-tight"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                    {role !== "usuario" && (
                      <p className="text-[10px] text-brand-blue/35 mt-2 text-center">
                        Contas de {role === "admin" ? "administrativo" : "corretor"} precisam de aprovação interna.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                {...field("email")}
                className={inputClass}
              />
            </Field>

            {/* Password */}
            <Field label="Senha">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={tab === "signup" ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  minLength={6}
                  {...field("password")}
                  className={cn(inputClass, "pr-11")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-blue/30 hover:text-brand-blue/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {/* Confirm password — sign-up only */}
            <AnimatePresence initial={false}>
              {tab === "signup" && (
                <motion.div
                  key="confirm-pw"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="overflow-hidden"
                >
                  <Field label="Confirmar senha">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      {...field("confirm")}
                      className={inputClass}
                    />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error / success feedback */}
            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-3"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-emerald-600 text-xs bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3"
                >
                  {success}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-brand-blue text-white py-3.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-brand-accent transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/15 mt-1"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {loading
                ? "Aguarde..."
                : tab === "signin"
                ? "Entrar"
                : "Criar Conta"}
            </motion.button>
          </form>

          {/* Switch tab hint */}
          <p
            className="text-center text-brand-blue/35 text-xs mt-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {tab === "signin" ? (
              <>
                Não tem conta?{" "}
                <button
                  onClick={() => switchTab("signup")}
                  className="text-brand-accent hover:underline font-bold"
                >
                  Criar conta
                </button>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <button
                  onClick={() => switchTab("signin")}
                  className="text-brand-accent hover:underline font-bold"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-brand-slate border border-brand-blue/6 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent/30 transition-all placeholder:text-brand-blue/22";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/38 mb-1.5 block"
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function translateError(msg: string): string {
  if (msg.includes("already registered")) return "Este email já está cadastrado.";
  if (msg.includes("invalid email")) return "Email inválido.";
  if (msg.includes("weak password")) return "Senha muito fraca. Use pelo menos 6 caracteres.";
  return msg;
}
