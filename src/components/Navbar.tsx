/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { Menu, X, LogOut, ChevronDown, UserCircle, Building2, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { useAuth, UserRole } from "@/src/context/AuthContext";

const NAV_LINKS = [
  { label: "Portfólio", id: "collection", to: null },
  { label: "Gávea AI", id: "visionary", to: null },
  { label: "Reels", id: "reels", to: "/reels" },
  { label: "Sobre", id: "about", to: null },
];

const ROLE_ICON: Record<UserRole, React.ElementType> = {
  admin: ShieldCheck,
  corretor: Building2,
  usuario: UserCircle,
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrativo",
  corretor: "Corretor",
  usuario: "Usuário",
};

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, signOut } = useAuth();

  // Verifica se o usuário está na página inicial
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: { id: string; to: string | null }
  ) => {
    e.preventDefault();
    setMobileOpen(false);
    if (item.to) {
      navigate(item.to);
      return;
    }
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: item.id } });
    } else {
      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignOut = async () => {
    setUserMenuOpen(false);
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const RoleIcon = profile ? ROLE_ICON[profile.role] : (user ? UserCircle : UserCircle);

  // A navbar deve ser escura se rolar a página OU se não estiver na página inicial
  const shouldBeDark = scrolled || !isHome;

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={cn(
          "fixed top-0 left-0 right-0 z-[999] transition-all duration-700",
          shouldBeDark
            ? "bg-brand-blue/95 backdrop-blur-2xl border-b border-white/5 shadow-[0_1px_50px_rgba(10,37,64,0.5)]"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0">
            <motion.img
              src="/logo gavea.webp"
              alt="Gávea"
              animate={{ height: shouldBeDark ? 44 : 52 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-auto object-contain transition-opacity group-hover:opacity-80"
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((item) => (
              <a
                key={item.id}
                href={item.to ?? `#${item.id}`}
                onClick={(e) => handleLinkClick(e, item)}
                className="relative group text-white/55 hover:text-white text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {item.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-brand-accent group-hover:w-full transition-all duration-400 rounded-full" />
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* ── Usuário logado (só renderiza após loading) ── */}
            {!loading && user && (
              <>
                {/* Botão Painel — admin/corretor */}
                {profile && ["admin", "corretor"].includes(profile.role) && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/dashboard")}
                    className="hidden md:flex items-center gap-2 bg-brand-accent/15 hover:bg-brand-accent text-brand-accent hover:text-white border border-brand-accent/30 hover:border-brand-accent text-[10px] font-bold uppercase tracking-[0.15em] px-5 py-2.5 rounded-full transition-all duration-300"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <LayoutDashboard size={13} />
                    Painel
                  </motion.button>
                )}

                {/* Dropdown de perfil */}
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setUserMenuOpen((p) => !p)}
                    className="flex items-center gap-2 border border-white/20 hover:border-white/35 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-bold uppercase tracking-[0.12em] px-4 py-2.5 rounded-full transition-all duration-300 backdrop-blur-sm"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <RoleIcon size={13} />
                    <span className="max-w-[100px] truncate">
                      {profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Perfil"}
                    </span>
                    <ChevronDown size={11} className={cn("transition-transform duration-300", userMenuOpen && "rotate-180")} />
                  </motion.button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-brand-blue/12 border border-brand-blue/6 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-brand-blue/5">
                          <p className="text-brand-blue text-xs font-bold truncate">{profile?.full_name ?? user.email}</p>
                          <p className="text-brand-blue/40 text-[10px] uppercase tracking-widest mt-0.5"
                            style={{ fontFamily: "var(--font-heading)" }}>
                            {profile ? ROLE_LABEL[profile.role] : "Usuário"}
                          </p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-brand-blue/60 hover:text-red-500 hover:bg-red-50 text-xs font-medium transition-all duration-200"
                        >
                          <LogOut size={14} />
                          Sair da conta
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* ── Não logado: aparece assim que loading termina ── */}
            {!loading && !user && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/auth")}
                className="hidden md:flex items-center gap-2 border border-white/20 hover:border-brand-accent/60 hover:bg-brand-accent/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-[0.15em] px-6 py-2.5 rounded-full transition-all duration-400 backdrop-blur-sm"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Seja Exclusivo
              </motion.button>
            )}

            {/* ── Loading: placeholder para não piscar ── */}
            {loading && (
              <div className="hidden md:block w-32 h-9 rounded-full bg-white/8 animate-pulse" />
            )}

            {/* ── Hambúrguer mobile — sempre visível ── */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile full-screen overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            animate={{ opacity: 1, clipPath: "circle(150% at calc(100% - 40px) 40px)" }}
            exit={{ opacity: 0, clipPath: "circle(0% at calc(100% - 40px) 40px)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[1000] bg-brand-blue flex flex-col items-center justify-center"
          >
            {/* Close */}
            <motion.button
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X size={26} />
            </motion.button>

            {/* User info (mobile) */}
            {user && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="absolute top-6 left-6 flex items-center gap-2"
              >
                <RoleIcon size={14} className="text-white/40" />
                <span className="text-white/40 text-[10px] uppercase tracking-widest" style={{ fontFamily: "var(--font-heading)" }}>
                  {profile?.full_name?.split(" ")[0] ?? user.email?.split("@")[0]}
                </span>
              </motion.div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((item, i) => (
                <motion.a
                  key={item.id}
                  href={item.to ?? `#${item.id}`}
                  onClick={(e) => handleLinkClick(e, item)}
                  initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="text-white text-5xl font-black tracking-tight hover:text-brand-accent transition-colors duration-300"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {item.label}
                </motion.a>
              ))}
            </nav>

            {/* Bottom action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="absolute bottom-12 flex flex-col items-center gap-3"
            >
              {user ? (
                <>
                  {profile && ["admin", "corretor"].includes(profile.role) && profile.status === "active" && (
                    <button
                      onClick={() => { setMobileOpen(false); navigate("/dashboard"); }}
                      className="flex items-center gap-2 border border-brand-accent/40 text-brand-accent text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-full hover:bg-brand-accent/10 transition-all duration-300"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      <LayoutDashboard size={13} />
                      Painel
                    </button>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 border border-white/20 text-white/50 hover:text-red-400 hover:border-red-400/40 text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-full transition-all duration-300"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    <LogOut size={13} />
                    Sair
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setMobileOpen(false); navigate("/auth"); }}
                  className="border border-white/20 text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-full hover:border-brand-accent/50 hover:text-white transition-all duration-300"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Seja Exclusivo
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}