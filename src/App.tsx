/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, Bed, Bath, Ruler } from "lucide-react";
import { cn } from "@/src/lib/utils";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import GaveaAI from "./components/GaveaAI";
import Footer from "./components/Footer";
import PropertyPage from "./pages/PropertyPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ReelsPage from "./pages/ReelsPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { PROPERTIES } from "./data/properties";

const PROPERTY_TYPES = ['Todos', 'Cobertura', 'Apartamento', 'Experiência 360'];

function HomePage() {
  const [sortBy, setSortBy] = useState('newest');
  const [activeType, setActiveType] = useState('Todos');
  const location = useLocation();

  useEffect(() => {
    if (location.state && (location.state as any).scrollTo) {
      const id = (location.state as any).scrollTo;
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const displayed = [...PROPERTIES]
    .filter(p => activeType === 'Todos' || p.type === activeType)
    .sort((a, b) => {
      if (sortBy === 'area') return b.area - a.area;
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      return 0;
    });

  return (
    <>
      <Hero />

      {/* ── Sticky type filter strip ── */}
      <div className="sticky top-[64px] md:top-[80px] z-40 bg-white/95 backdrop-blur-2xl border-b border-brand-blue/8 shadow-[0_2px_20px_rgba(10,37,64,0.05)]">
        <div className="max-w-7xl mx-auto px-5 md:px-12 flex items-center justify-between h-[50px]">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {PROPERTY_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setActiveType(t)}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-300 flex-shrink-0",
                  activeType === t
                    ? "bg-brand-blue text-white"
                    : "text-brand-blue/35 hover:text-brand-blue hover:bg-brand-blue/5"
                )}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 pl-4">
            <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-blue/25 hidden sm:block" style={{ fontFamily: 'var(--font-heading)' }}>
              Ordenar
            </span>
            <div className="relative flex items-center">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-[9px] font-bold text-brand-blue/55 bg-transparent border-none focus:ring-0 cursor-pointer appearance-none pr-5 uppercase tracking-[0.12em]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <option value="newest">Recentes</option>
                <option value="match">Maior Match</option>
                <option value="area">Maior Área</option>
              </select>
              <ChevronDown size={11} className="absolute right-0 text-brand-accent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Portfolio collection ── */}
      <section id="collection">

        {/* Dark editorial header */}
        <div className="bg-brand-blue px-5 md:px-12 pt-20 md:pt-28 pb-20 md:pb-24">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-brand-accent text-[9px] font-bold uppercase tracking-[0.32em] mb-5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Curation Selection · {displayed.length} {displayed.length === 1 ? 'imóvel' : 'imóveis'}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.08 }}
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-[-0.03em] text-white leading-[0.90]"
              >
                Residências<br />
                <span className="italic font-light text-brand-accent">de Destaque.</span>
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
              className="text-white/30 max-w-[280px] text-sm font-light leading-relaxed"
            >
              Uma seleção rigorosa de propriedades que personificam o luxo moderno e a excelência arquitetônica.
            </motion.p>
          </div>
        </div>

        {/* Cards — editorial alternating grid */}
        <div className="bg-[#F7F9FB] px-5 md:px-12 py-12 md:py-16">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {displayed.map((property, index) => {
              const isWide = index % 3 === 0;
              return (
                <motion.div
                  key={property.id}
                  layoutId={`property-card-${property.id}`}
                  initial={{ opacity: 0, y: 36 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{
                    duration: 1.2,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: Math.min(index, 3) * 0.1,
                  }}
                  className={cn("group relative", isWide && "md:col-span-2")}
                >
                  <Link to={`/property/${property.id}`} className="block">
                    <div className={cn(
                      "relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] cursor-pointer h-[340px] md:h-[480px]",
                      "shadow-[0_4px_28px_rgba(10,37,64,0.07)]",
                      "transition-shadow duration-700 group-hover:shadow-[0_20px_60px_rgba(10,37,64,0.16)]"
                    )}>

                      {/* Photo */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[1100ms] ease-out group-hover:scale-[1.05]"
                        style={{ backgroundImage: `url(${property.image})` }}
                      />

                      {/* Permanent gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/22 to-transparent" />

                      {/* Top: type + match */}
                      <div className="absolute top-5 left-5 right-5 flex items-center justify-between z-10">
                        <span
                          className="bg-black/25 backdrop-blur-lg border border-white/10 text-white/70 text-[8px] font-bold uppercase tracking-[0.22em] px-3.5 py-1.5 rounded-full"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.type}
                        </span>
                        <span
                          className="bg-brand-accent text-white text-[8px] font-black tracking-widest px-3 py-1.5 rounded-full"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.matchScore}%
                        </span>
                      </div>

                      {/* Bottom info block */}
                      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                        <p
                          className="text-white/35 text-[8px] font-bold uppercase tracking-[0.28em] mb-2"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.neighborhood} · {property.city}
                        </p>

                        <motion.h3
                          layoutId={`property-title-${property.id}`}
                          className={cn(
                            "font-display font-bold text-white leading-tight tracking-tight mb-3",
                            isWide ? "text-2xl md:text-3xl lg:text-4xl" : "text-xl md:text-2xl"
                          )}
                        >
                          {property.title}
                        </motion.h3>

                        {/* Accent divider — grows on hover */}
                        <div className="w-6 h-[1.5px] bg-brand-accent mb-4 transition-all duration-500 ease-out group-hover:w-12" />

                        {/* Stats row */}
                        <div className="flex items-center gap-4 md:gap-5 flex-wrap">
                          <div className="flex items-center gap-1.5 text-white/45">
                            <Bed size={10} />
                            <span className="text-[10px] font-medium">{property.bedrooms} quartos</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/45">
                            <Bath size={10} />
                            <span className="text-[10px] font-medium">{property.bathrooms} banheiros</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/45">
                            <Ruler size={10} />
                            <span className="text-[10px] font-medium">{property.area} m²</span>
                          </div>
                          {property.price && (
                            <span className="ml-auto font-display font-bold text-white text-lg md:text-2xl">
                              {property.price}
                            </span>
                          )}
                        </div>

                        {/* CTA — slides in on hover */}
                        <div className="flex items-center gap-2 mt-4 text-brand-accent opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
                          <span className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ fontFamily: 'var(--font-heading)' }}>
                            Ver propriedade
                          </span>
                          <span className="text-sm">→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <GaveaAI />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth page — sem Navbar/Footer */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Reels — fullscreen, sem Navbar/Footer */}
          <Route path="/reels" element={<ReelsPage />} />

          {/* Todas as outras rotas com layout padrão */}
          <Route
            path="*"
            element={
              <main className="bg-brand-bg min-h-screen">
                <Navbar />
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/property/:id" element={<PropertyPage />} />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["admin", "corretor"]}>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </AnimatePresence>
                <Footer />
              </main>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
