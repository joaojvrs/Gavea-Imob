/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Bed, Bath, Ruler } from "lucide-react";
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
import { PROPERTIES, Property } from "./data/properties";
import { supabase } from "./lib/supabase";

const PROPERTY_TYPES = ['Todos', 'Cobertura', 'Apartamento', 'Experiência 360'];

function mapDbToProperty(db: Record<string, unknown>): Property {
  return {
    id:             db.id as string,
    type:           (db.type as string)          ?? "Apartamento",
    title:          (db.title as string)         ?? "",
    location:       (db.location as string)      ?? "",
    neighborhood:   (db.neighborhood as string)  ?? "",
    city:           (db.city as string)          ?? "",
    state:          (db.state as string)         ?? "",
    area:           (db.area as number)          ?? 0,
    bedrooms:       (db.bedrooms as number)      ?? 0,
    bathrooms:      (db.bathrooms as number)     ?? 0,
    parking:        (db.parking as number)       ?? 0,
    suites:         (db.suites as number)        ?? 0,
    price:          (db.price as string)         ?? undefined,
    description:    (db.description as string)   ?? "",
    features:       (db.features as string[])        ?? [],
    infrastructure: (db.infrastructure as string[])  ?? [],
    lazer:          (db.lazer as string[])            ?? [],
    matchScore:     (db.match_score as number)        ?? 0,
    image:          (db.image_url as string)          ?? "",
    gallery:        (db.gallery_urls as string[])     ?? [],
    tour360:        (db.tour360_urls as string[])     ?? [],
    video_url:      (db.video_url as string)          ?? undefined,
  };
}

function HomePage() {
  const [sortBy, setSortBy] = useState('newest');
  const [activeType, setActiveType] = useState('Todos');
  const [activeIdx, setActiveIdx] = useState(0);
  const [dbProps, setDbProps] = useState<Property[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Refs so the interval never has stale closures
  const activeIdxRef = useRef(0);
  const displayedLenRef = useRef(0);
  const isPausedRef = useRef(false);

  useEffect(() => { activeIdxRef.current = activeIdx; }, [activeIdx]);

  useEffect(() => {
    if (location.state && (location.state as { scrollTo?: string }).scrollTo) {
      const id = (location.state as { scrollTo: string }).scrollTo;
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Load active DB properties
  useEffect(() => {
    supabase.from("properties").select("*").eq("status", "active")
      .then(({ data }) => {
        if (data) setDbProps((data as Record<string, unknown>[]).map(mapDbToProperty));
      });
  }, []);

  // Merge mock + DB (avoid duplicates)
  const allProperties = [
    ...PROPERTIES,
    ...dbProps.filter(dp => !PROPERTIES.find(p => p.id === dp.id)),
  ];

  const displayed = [...allProperties]
    .filter(p => activeType === 'Todos' || p.type === activeType)
    .sort((a, b) => {
      if (sortBy === 'area') return b.area - a.area;
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      return 0;
    });

  // Keep len ref in sync
  useEffect(() => { displayedLenRef.current = displayed.length; }, [displayed.length]);

  // Reset to first card when filter changes
  useEffect(() => {
    setActiveIdx(0);
    scrollRef.current?.scrollTo({ left: 0 });
  }, [activeType, sortBy]);

  // Scroll helper — used by nav buttons and interval
  const goTo = useCallback((idx: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const card = container.querySelector(`[data-card="${idx}"]`) as HTMLElement;
    if (!card) return;
    container.scrollTo({
      left: Math.max(0, card.offsetLeft - (container.offsetWidth - card.offsetWidth) / 2),
      behavior: 'smooth',
    });
    setActiveIdx(idx);
  }, []);

  // Stable auto-advance interval — reads refs, never stale
  useEffect(() => {
    const id = setInterval(() => {
      if (isPausedRef.current || displayedLenRef.current <= 1) return;
      const next = activeIdxRef.current >= displayedLenRef.current - 1
        ? 0
        : activeIdxRef.current + 1;
      goTo(next);
    }, 3500);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // runs once — state is read via refs inside

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
                  activeType === t ? "bg-brand-blue text-white" : "text-brand-blue/35 hover:text-brand-blue hover:bg-brand-blue/5"
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

      {/* ── Collection ── */}
      <section id="collection" className="bg-brand-blue overflow-hidden">
        {/* Header */}
        <div className="px-5 md:px-12 pt-20 md:pt-28 pb-12 md:pb-14">
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
            <div className="flex flex-col items-start md:items-end gap-5">
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.0, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
                className="text-white/30 max-w-[280px] text-sm font-light leading-relaxed"
              >
                Uma seleção rigorosa de propriedades que personificam o luxo moderno e a excelência arquitetônica.
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={() => { isPausedRef.current = true; goTo(Math.max(0, activeIdx - 1)); setTimeout(() => { isPausedRef.current = false; }, 6000); }}
                  disabled={activeIdx === 0}
                  className="w-10 h-10 rounded-full border border-white/15 text-white/50 flex items-center justify-center hover:border-brand-accent hover:text-brand-accent transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-white/20 text-[10px] font-mono tracking-widest">
                  {String(activeIdx + 1).padStart(2, '0')} / {String(displayed.length).padStart(2, '0')}
                </span>
                <button
                  onClick={() => { isPausedRef.current = true; goTo(Math.min(displayed.length - 1, activeIdx + 1)); setTimeout(() => { isPausedRef.current = false; }, 6000); }}
                  disabled={activeIdx === displayed.length - 1}
                  className="w-10 h-10 rounded-full border border-white/15 text-white/50 flex items-center justify-center hover:border-brand-accent hover:text-brand-accent transition-all duration-300 disabled:opacity-20 disabled:pointer-events-none"
                  aria-label="Próximo"
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Carousel ── */}
        <div className="pb-14 md:pb-16">
          {/* Track — scrollbar hidden via inline style + class */}
          <div
            ref={scrollRef}
            onMouseEnter={() => { isPausedRef.current = true; }}
            onMouseLeave={() => { isPausedRef.current = false; }}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-5 px-5 md:px-12"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollPaddingLeft: '20px' } as React.CSSProperties}
          >
            {displayed.map((property, index) => (
              <div
                key={property.id}
                data-card={index}
                className="snap-start flex-shrink-0 w-[260px]"
              >
                <Link to={`/property/${property.id}`} className="block group">
                  {/* Card: fixed total height via flex-col */}
                  <div className="flex flex-col h-[400px] overflow-hidden rounded-2xl bg-white shadow-[0_4px_28px_rgba(0,0,0,0.3)] transition-shadow duration-500 group-hover:shadow-[0_12px_48px_rgba(0,0,0,0.45)]">

                    {/* Image — fixed height */}
                    <div className="relative overflow-hidden h-[220px] flex-shrink-0">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                        style={{ backgroundImage: `url(${property.image})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span
                          className="bg-black/25 backdrop-blur-md border border-white/15 text-white/80 text-[7px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.type}
                        </span>
                        <span
                          className="bg-brand-accent text-white text-[7px] font-black tracking-widest px-2.5 py-1 rounded-full"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.matchScore}%
                        </span>
                      </div>
                    </div>

                    {/* Info panel — fills remaining height */}
                    <div className="flex flex-col flex-1 p-5 justify-between">
                      <div>
                        <p
                          className="text-brand-blue/30 text-[7px] font-bold uppercase tracking-[0.25em] mb-1.5 truncate"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {property.neighborhood}{property.city ? ` · ${property.city}` : ''}
                        </p>
                        <h3 className="font-display font-bold text-brand-blue leading-tight tracking-tight text-base line-clamp-2 mb-3">
                          {property.title}
                        </h3>
                        <div className="w-5 h-[1.5px] bg-brand-accent mb-3 transition-all duration-500 ease-out group-hover:w-10" />
                        <div className="flex items-center gap-2.5 text-brand-blue/35">
                          <div className="flex items-center gap-1">
                            <Bed size={9} />
                            <span className="text-[9px] font-medium">{property.bedrooms}</span>
                          </div>
                          <span className="text-brand-blue/15 text-[9px]">·</span>
                          <div className="flex items-center gap-1">
                            <Bath size={9} />
                            <span className="text-[9px] font-medium">{property.bathrooms}</span>
                          </div>
                          <span className="text-brand-blue/15 text-[9px]">·</span>
                          <div className="flex items-center gap-1">
                            <Ruler size={9} />
                            <span className="text-[9px] font-medium">{property.area}m²</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        {property.price ? (
                          <span className="font-display font-bold text-brand-blue text-base leading-none">
                            {property.price}
                          </span>
                        ) : <span />}
                        <span
                          className="text-brand-accent text-[8px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Ver <span className="text-xs">→</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Dots */}
          {displayed.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-8">
              {displayed.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { isPausedRef.current = true; goTo(i); setTimeout(() => { isPausedRef.current = false; }, 6000); }}
                  className={cn(
                    "rounded-full transition-all duration-300",
                    i === activeIdx
                      ? "w-5 h-1.5 bg-brand-accent"
                      : "w-1.5 h-1.5 bg-white/15 hover:bg-white/30"
                  )}
                  aria-label={`Ir para imóvel ${i + 1}`}
                />
              ))}
            </div>
          )}
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
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reels" element={<ReelsPage />} />
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
