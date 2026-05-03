/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SlidersHorizontal, ChevronDown, DollarSign, Bed, Bath, Ruler } from "lucide-react";
import { cn } from "@/src/lib/utils";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import GaveaAI from "./components/GaveaAI";
import Footer from "./components/Footer";
import PropertyPage from "./pages/PropertyPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { PROPERTIES } from "./data/properties";

function HomePage() {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const location = useLocation();

  useEffect(() => {
    // Handling scroll from navigation state
    if (location.state && (location.state as any).scrollTo) {
      const id = (location.state as any).scrollTo;
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      // Clear state to avoid scrolling on subsequent refreshes
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <>
      <Hero />
      
      {/* Search & Filter Bar */}
      <section className="px-4 md:px-12 py-4 bg-white/40 backdrop-blur-md border-b border-brand-blue/5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 md:gap-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <button 
              onClick={() => setFilterOpen(!filterOpen)}
              className={cn(
                "flex items-center gap-2 px-5 md:px-6 py-2.5 rounded-full border border-brand-blue/10 bg-white transition-all hover:border-brand-accent group",
                filterOpen && "bg-brand-blue text-white"
              )}
            >
              <SlidersHorizontal size={16} className={cn("text-brand-accent md:w-[18px] md:h-[18px]", filterOpen && "text-white")} />
              <span className="text-xs md:text-sm font-bold uppercase tracking-widest leading-none">Filtros</span>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-blue/30 hidden sm:block">Ordenar por</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-[12px] md:text-sm font-bold text-brand-blue/80 focus:ring-0 cursor-pointer appearance-none"
            >
              <option value="newest">Lançamentos</option>
              <option value="price-desc">Maior Valor</option>
              <option value="price-asc">Menor Valor</option>
              <option value="area">Maior Metragem</option>
            </select>
            <ChevronDown size={14} className="text-brand-accent -ml-2 pointer-events-none" />
          </div>
        </div>

        {/* Expanded Filters Pane */}
        <AnimatePresence>
          {filterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="max-w-7xl mx-auto py-6 md:py-8 grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-blue/40 flex items-center gap-2">
                    <DollarSign size={12} /> Faixa de Preço
                  </label>
                  <div className="flex items-center gap-3">
                    <input type="text" placeholder="Min" className="w-full bg-brand-slate/50 border border-brand-blue/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-accent" />
                    <span className="text-brand-blue/20">—</span>
                    <input type="text" placeholder="Max" className="w-full bg-brand-slate/50 border border-brand-blue/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-accent" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-blue/40 flex items-center gap-2">
                    <Bed size={12} /> Dormitórios
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, '5+'].map(num => (
                      <button key={num} className="w-10 h-10 rounded-xl border border-brand-blue/5 flex items-center justify-center text-sm font-bold hover:bg-brand-blue hover:text-white transition-all">
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-blue/40 flex items-center gap-2">
                    <Bath size={12} /> Banheiros
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, '5+'].map(num => (
                      <button key={num} className="w-10 h-10 rounded-xl border border-brand-blue/5 flex items-center justify-center text-sm font-bold hover:bg-brand-blue hover:text-white transition-all">
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-blue/40 flex items-center gap-2">
                    <Ruler size={12} /> Área mínima (m²)
                  </label>
                  <input type="range" min="50" max="2000" className="w-full h-1 bg-brand-slate rounded-lg appearance-none cursor-pointer accent-brand-accent" />
                  <div className="flex justify-between text-[10px] font-mono text-brand-blue/40">
                    <span>50m²</span>
                    <span>2000m²</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Feature Sections Collection */}
      <section id="collection" className="py-16 md:py-24 px-4 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 md:gap-8 mb-12 md:mb-20">
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-brand-accent font-display tracking-[0.2em] uppercase text-xs mb-3 md:mb-4 block font-bold"
              >
                Curation Selection
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.12 }}
                className="text-3xl md:text-6xl font-display font-bold tracking-tighter text-brand-blue leading-[1.1]"
              >
                Residências de <br className="hidden md:block" /> <span className="text-brand-accent italic font-light font-sans">Destaque.</span>
              </motion.h2>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.24 }}
              className="text-brand-blue/50 max-w-md font-light text-base md:text-lg italic leading-relaxed"
            >
              "Uma seleção rigorosa de propriedades que personificam o luxo moderno e a excelência arquitetônica."
            </motion.p>
          </div>
          
          {/* Collection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {PROPERTIES.map((property, index) => (
              <motion.div
                key={property.id}
                layoutId={`property-card-${property.id}`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{
                  opacity: 1, y: 0,
                  transition: {
                    duration: 1.4,
                    ease: [0.25, 0.46, 0.45, 0.94],
                    delay: (index % 3) * 0.13,
                  },
                }}
                viewport={{ once: true, margin: "-80px" }}
                whileHover={{
                  y: -10, scale: 1.01,
                  transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                }}
                className="group relative"
              >
                <Link 
                  to={`/property/${property.id}`}
                  className="block"
                >
                  <div className="aspect-[4/5] bg-brand-slate rounded-[2rem] md:rounded-[2.5rem] border border-brand-blue/5 overflow-hidden group relative cursor-pointer shadow-[0_10px_40px_rgba(10,37,64,0.02)] transition-all duration-700 group-hover:shadow-[0_40px_100px_rgba(10,37,64,0.12)]">
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10" />
                    
                    <div 
                      className="w-full h-full bg-brand-slate bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                      style={{ backgroundImage: `url(${property.image})` }}
                    />
                    
                    <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-20 transition-transform duration-500 group-hover:translate-x-2">
                      <motion.h3 
                        layoutId={`property-title-${property.id}`}
                        className="text-xl md:text-2xl font-display font-bold text-white drop-shadow-md"
                      >
                        {property.title}
                      </motion.h3>
                      <motion.p 
                        layoutId={`property-location-${property.id}`}
                        className="text-white/80 text-xs md:text-sm font-light uppercase tracking-widest mt-1"
                      >
                        {property.location}
                      </motion.p>
                      <div className="flex gap-4 mt-3 text-[10px] text-white/60 font-mono tracking-widest">
                        <span className="flex items-center gap-1"><Bed size={12} /> {property.bedrooms} QD</span>
                        <span className="flex items-center gap-1"><Ruler size={12} /> {property.area}M²</span>
                      </div>
                    </div>
                    
                    <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20 bg-white/20 backdrop-blur-xl border border-white/30 px-3 py-1 md:px-4 md:py-1.5 rounded-full shadow-2xl transition-all duration-500 group-hover:bg-brand-accent group-hover:border-brand-accent">
                      <span className="text-white text-[9px] md:text-[10px] font-bold font-mono uppercase tracking-widest leading-none">{property.matchScore}% STYLE MATCH</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Finder Section */}
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
