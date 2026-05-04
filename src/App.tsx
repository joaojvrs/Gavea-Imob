/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Bed, Bath, Ruler, Search, ArrowRight } from "lucide-react";
import { cn } from "@/src/lib/utils";

const CARD_W = 280;   // card width px
const CARD_GAP = 16;  // gap px
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import GaveaAI from "./components/GaveaAI";
import Footer from "./components/Footer";
import PropertyPage from "./pages/PropertyPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ReelsPage from "./pages/ReelsPage";
import PropertiesPage from "./pages/PropertiesPage";
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
  const location = useLocation();

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

  useEffect(() => {
    supabase.from("properties").select("*").eq("status", "active")
      .then(({ data }) => {
        if (data) setDbProps((data as Record<string, unknown>[]).map(mapDbToProperty));
      });
  }, []);

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

  useEffect(() => { displayedLenRef.current = displayed.length; }, [displayed.length]);
  useEffect(() => { setActiveIdx(0); }, [activeType, sortBy]);

  const goTo = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(idx, displayedLenRef.current - 1));
    setActiveIdx(clamped);
    activeIdxRef.current = clamped;
  }, []);

  const prev = useCallback(() => {
    isPausedRef.current = true;
    goTo(activeIdxRef.current - 1);
    setTimeout(() => { isPausedRef.current = false; }, 6000);
  }, [goTo]);

  const next = useCallback(() => {
    isPausedRef.current = true;
    goTo(activeIdxRef.current + 1);
    setTimeout(() => { isPausedRef.current = false; }, 6000);
  }, [goTo]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      if (isPausedRef.current || displayedLenRef.current <= 1) return;
      const next = activeIdxRef.current >= displayedLenRef.current - 1 ? 0 : activeIdxRef.current + 1;
      setActiveIdx(next);
      activeIdxRef.current = next;
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // How many cards visible based on viewport (approx)
  // offset: slide track so activeIdx card starts at left edge of viewport
  const offset = -(activeIdx * (CARD_W + CARD_GAP));

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
                  "whitespace-nowrap px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex-shrink-0",
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
        <div className="px-5 md:px-12 pt-20 md:pt-28 pb-10 md:pb-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end md:justify-between gap-8 md:gap-16">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="text-brand-accent text-[9px] font-bold uppercase tracking-[0.32em] mb-5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Curation Selection · {displayed.length} {displayed.length === 1 ? 'imóvel' : 'imóveis'}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.07 }}
                className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-[-0.03em] text-white leading-[0.90]"
              >
                Residências<br />
                <span className="italic font-light text-brand-accent">de Destaque.</span>
              </motion.h2>
            </div>

            <div className="flex flex-col items-start md:items-end gap-5">
              <motion.p
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.15 }}
                className="text-white/30 max-w-[280px] text-sm font-light leading-relaxed"
              >
                Uma seleção rigorosa de propriedades que personificam o luxo moderno e a excelência arquitetônica.
              </motion.p>

              {/* ── Arrow controls ── */}
              <motion.div
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <button
                  onClick={prev}
                  disabled={activeIdx === 0}
                  className="w-11 h-11 rounded-full border border-white/15 text-white/50 flex items-center justify-center hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-white/25 text-[11px] font-mono tracking-widest tabular-nums w-16 text-center">
                  {String(activeIdx + 1).padStart(2, '0')} / {String(displayed.length).padStart(2, '0')}
                </span>
                <button
                  onClick={next}
                  disabled={activeIdx === displayed.length - 1}
                  className="w-11 h-11 rounded-full border border-white/15 text-white/50 flex items-center justify-center hover:border-brand-accent hover:text-brand-accent hover:bg-brand-accent/10 transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none active:scale-95"
                >
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Carousel track ── */}
        <div className="pb-10">
          {/* Viewport — clips the track */}
          <div className="overflow-hidden px-5 md:px-12">
            {/* Track — moves via transform */}
            <div
              className="flex gap-4"
              style={{
                transform: `translateX(${offset}px)`,
                transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform',
              }}
            >
              {displayed.map((property) => (
                  <div
                    key={property.id}
                    className="flex-shrink-0"
                    style={{ width: CARD_W }}
                  >
                    <Link to={`/property/${property.id}`} className="block group">
                      <div
                        className="flex flex-col overflow-hidden rounded-2xl bg-white"
                        style={{
                          height: 420,
                          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                        }}
                      >
                        {/* Image */}
                        <div className="relative overflow-hidden flex-shrink-0" style={{ height: 230 }}>
                          <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                            style={{ backgroundImage: `url(${property.image})` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                          <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                            <span className="bg-black/30 backdrop-blur-md border border-white/15 text-white/85 text-[7px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full" style={{ fontFamily: 'var(--font-heading)' }}>
                              {property.type}
                            </span>
                            <span className="bg-brand-accent text-white text-[7px] font-black tracking-widest px-2.5 py-1 rounded-full" style={{ fontFamily: 'var(--font-heading)' }}>
                              {property.matchScore}%
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col flex-1 p-5 justify-between">
                          <div>
                            <p className="text-brand-blue/30 text-[7px] font-bold uppercase tracking-[0.25em] mb-1.5 truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                              {property.neighborhood}{property.city ? ` · ${property.city}` : ''}
                            </p>
                            <h3 className="font-display font-bold text-brand-blue leading-tight tracking-tight text-[15px] line-clamp-2 mb-3">
                              {property.title}
                            </h3>
                            <div className="w-5 h-[1.5px] bg-brand-accent mb-3 transition-all duration-300 group-hover:w-10" />
                            <div className="flex items-center gap-2.5 text-brand-blue/35">
                              <span className="flex items-center gap-1"><Bed size={9} /><span className="text-[9px] font-medium">{property.bedrooms}</span></span>
                              <span className="text-brand-blue/15 text-[9px]">·</span>
                              <span className="flex items-center gap-1"><Bath size={9} /><span className="text-[9px] font-medium">{property.bathrooms}</span></span>
                              <span className="text-brand-blue/15 text-[9px]">·</span>
                              <span className="flex items-center gap-1"><Ruler size={9} /><span className="text-[9px] font-medium">{property.area}m²</span></span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            {property.price
                              ? <span className="font-display font-bold text-brand-blue text-[15px] leading-none">{property.price}</span>
                              : <span />}
                            <span className="text-brand-accent text-[8px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1" style={{ fontFamily: 'var(--font-heading)' }}>
                              Ver →
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
              ))}
            </div>
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
                    i === activeIdx ? "w-6 h-1.5 bg-brand-accent" : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── CTA: Não encontrou seu imóvel? ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          className="mx-5 md:mx-12 mb-14 md:mb-16"
        >
          <Link to="/imoveis" className="group block">
            <div
              className="relative overflow-hidden rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-7 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.05) 100%)',
                border: '1px solid rgba(201,169,110,0.25)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.5)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(201,169,110,0.18) 0%, rgba(201,169,110,0.08) 100%)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.25)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(201,169,110,0.05) 100%)'; }}
            >
              <div className="absolute right-0 top-0 w-56 h-full pointer-events-none opacity-15"
                style={{ background: 'radial-gradient(ellipse, #c9a96e 0%, transparent 70%)', transform: 'translate(25%, -10%)' }} />

              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.3)' }}>
                  <Search size={20} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-white font-bold text-[17px] leading-tight mb-1">
                    Não encontrou o imóvel ideal?
                  </p>
                  <p className="text-white/35 text-[13px] font-light">
                    Temos mais de 2.000 opções no Litoral Paulista.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-[12px] uppercase tracking-[0.15em] transition-all duration-200"
                style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)' }}>
                Ver todos os imóveis
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        </motion.div>
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
                    <Route path="/imoveis" element={<PropertiesPage />} />
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
