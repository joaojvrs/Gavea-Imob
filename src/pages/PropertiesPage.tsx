import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, SlidersHorizontal, Bed, Bath, Car, Ruler, X, ChevronDown, ArrowUpDown, Grid3X3, LayoutList, Heart, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { PROPERTIES, Property } from "../data/properties";
import { supabase } from "../lib/supabase";

const CITIES = ["Todas as cidades", "Santos", "São Vicente", "Praia Grande", "Guarujá", "Bertioga"];
const NEIGHBORHOODS: Record<string, string[]> = {
  "Santos":       ["Gonzaga","Ponta da Praia","Boqueirão","Embaré","Pompéia","Marapé","Campo Grande","Vila Mathias"],
  "São Vicente":  ["Itararé","Centro","Vila Voturuá"],
  "Praia Grande": ["Aviação","Boqueirão","Vila Tupi","Guilhermina","Ocian"],
  "Guarujá":      ["Pitangueiras","Enseada","Astúrias","Perequê"],
  "Bertioga":     ["Centro","Riviera de São Lourenço","Boracéia"],
};
const TYPES = ["Apartamento","Casa","Cobertura","Terreno","Sala Comercial","Experiência 360"];
const SORT_OPTIONS = [
  { value: "relevance", label: "Mais relevantes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "area_desc", label: "Maior área" },
  { value: "newest", label: "Mais recentes" },
];

function formatPrice(p: string | undefined) {
  return p ?? "Consulte";
}

function PropertyCard({ property, index }: { property: Property; index: number }) {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ boxShadow: '0 2px 12px rgba(10,37,64,0.07)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: 210 }}>
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          style={{ backgroundImage: `url(${property.image})` }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />

        {/* Badges top-left */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md"
            style={{ background: 'rgba(10,37,64,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
            {property.type}
          </span>
          {property.listingType === 'aluguel' && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md"
              style={{ background: 'rgba(201,169,110,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Aluguel
            </span>
          )}
        </div>

        {/* Match score top-right */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-md"
            style={{ background: 'rgba(201,169,110,0.9)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <Sparkles size={9} className="text-white" />
            <span className="text-[10px] font-black text-white">{property.matchScore}%</span>
          </div>
        </div>

        {/* Like button */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(l => !l); }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110"
          style={{ background: 'rgba(255,255,255,0.9)' }}
        >
          <Heart size={14} className={cn("transition-all", liked ? "fill-red-500 text-red-500" : "text-gray-400")} />
        </button>

        {/* Price overlay on bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          <p className="text-white font-bold text-base leading-none" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            {formatPrice(property.price)}
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#c9a96e' }}>
          {property.neighborhood} · {property.city}
        </p>
        <h3 className="font-bold text-[#0a2540] text-[14px] leading-snug line-clamp-2 mb-3">
          {property.title}
        </h3>

        {/* Specs */}
        <div className="flex items-center gap-3 text-[#0a2540]/40 mt-auto mb-4">
          <div className="flex items-center gap-1.5">
            <Bed size={12} />
            <span className="text-[11px] font-semibold text-[#0a2540]/60">{property.bedrooms}</span>
          </div>
          <div className="w-px h-3 bg-[#0a2540]/10" />
          <div className="flex items-center gap-1.5">
            <Bath size={12} />
            <span className="text-[11px] font-semibold text-[#0a2540]/60">{property.bathrooms}</span>
          </div>
          <div className="w-px h-3 bg-[#0a2540]/10" />
          <div className="flex items-center gap-1.5">
            <Car size={12} />
            <span className="text-[11px] font-semibold text-[#0a2540]/60">{property.parking}</span>
          </div>
          <div className="w-px h-3 bg-[#0a2540]/10" />
          <div className="flex items-center gap-1.5">
            <Ruler size={12} />
            <span className="text-[11px] font-semibold text-[#0a2540]/60">{property.area}m²</span>
          </div>
        </div>

        {/* CTA */}
        <Link to={`/property/${property.id}`}
          className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] text-center transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, #0a2540 0%, #0d3060 100%)',
            color: 'white',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #c9a96e 0%, #e8c87a 100%)'; (e.currentTarget as HTMLElement).style.color = '#0a2540'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #0a2540 0%, #0d3060 100%)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
        >
          Ver imóvel →
        </Link>
      </div>
    </motion.div>
  );
}

// Filter pill/button helper
function NumberPicker({ value, onChange, options }: { value: number; onChange: (v: number) => void; options: { label: string; value: number }[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(value === o.value ? 0 : o.value)}
          className="w-9 h-9 rounded-xl text-[12px] font-semibold transition-all duration-200"
          style={value === o.value
            ? { background: '#c9a96e', color: '#071829', fontWeight: 700 }
            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.1)' }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-[0.35em] mb-3" style={{ color: '#c9a96e' }}>
      {children}
    </p>
  );
}

function Divider() {
  return <div className="h-px w-full my-5" style={{ background: 'rgba(255,255,255,0.07)' }} />;
}

export default function PropertiesPage() {
  const [dbProps, setDbProps] = useState<Property[]>([]);
  const [mode, setMode] = useState<'venda' | 'aluguel'>('venda');
  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState("Todas as cidades");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minBedrooms, setMinBedrooms] = useState(0);
  const [minBathrooms, setMinBathrooms] = useState(0);
  const [minParking, setMinParking] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("relevance");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.from("properties").select("*").eq("status", "active")
      .then(({ data }) => {
        if (data) setDbProps(data as unknown as Property[]);
      });
  }, []);

  const allProperties = useMemo(() => [
    ...PROPERTIES,
    ...dbProps.filter(dp => !PROPERTIES.find(p => p.id === dp.id)),
  ], [dbProps]);

  const filtered = useMemo(() => {
    let list = allProperties.filter(p => {
      if ((p.listingType ?? 'venda') !== mode) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!p.title.toLowerCase().includes(q) && !p.neighborhood.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q)) return false;
      }
      if (selectedCity !== "Todas as cidades" && p.city !== selectedCity) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(p.type)) return false;
      if (minBedrooms > 0 && p.bedrooms < minBedrooms) return false;
      if (minBathrooms > 0 && p.bathrooms < minBathrooms) return false;
      if (minParking > 0 && p.parking < minParking) return false;
      if (minPrice && p.priceNum && p.priceNum < parseInt(minPrice.replace(/\D/g, ''))) return false;
      if (maxPrice && p.priceNum && p.priceNum > parseInt(maxPrice.replace(/\D/g, ''))) return false;
      return true;
    });

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return (a.priceNum ?? 0) - (b.priceNum ?? 0);
      if (sortBy === 'price_desc') return (b.priceNum ?? 0) - (a.priceNum ?? 0);
      if (sortBy === 'area_desc') return b.area - a.area;
      return b.matchScore - a.matchScore;
    });
  }, [allProperties, mode, search, selectedCity, selectedTypes, minBedrooms, minBathrooms, minParking, minPrice, maxPrice, sortBy]);

  const toggleType = (t: string) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const clearFilters = () => { setSelectedCity("Todas as cidades"); setSelectedTypes([]); setMinBedrooms(0); setMinBathrooms(0); setMinParking(0); setMinPrice(""); setMaxPrice(""); };
  const hasFilters = selectedCity !== "Todas as cidades" || selectedTypes.length > 0 || minBedrooms > 0 || minBathrooms > 0 || minParking > 0 || minPrice || maxPrice;

  // ── SIDEBAR ──
  const Sidebar = () => (
    <aside className="flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{ background: 'linear-gradient(180deg, #071829 0%, #050f1a 100%)' }}>

      {/* Logo */}
      <div className="px-6 pt-7 pb-6 flex items-center gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <img src="/logo gavea.webp" alt="Gávea" className="w-8 h-8 object-contain" />
        <div>
          <p className="text-white font-bold text-[13px] leading-tight">Gávea Imobiliária</p>
          <p className="text-[9px] font-semibold tracking-[0.2em] uppercase" style={{ color: '#c9a96e' }}>Filtros de busca</p>
        </div>
      </div>

      <div className="px-6 py-6 flex flex-col gap-0">

        {/* Venda / Aluguel */}
        <div className="flex rounded-xl overflow-hidden border mb-6" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {(['venda','aluguel'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className="flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200"
              style={mode === m
                ? { background: 'linear-gradient(135deg, #c9a96e, #e8c87a)', color: '#071829' }
                : { color: 'rgba(255,255,255,0.35)', background: 'transparent' }
              }>
              {m === 'venda' ? 'Comprar' : 'Alugar'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Bairro, cidade ou título..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-[12px] font-light focus:outline-none transition-all placeholder:text-white/20 text-white"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
        </div>

        <Divider />

        {/* Cidade */}
        <FilterLabel>Cidade</FilterLabel>
        <div className="relative mb-1">
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="w-full py-2.5 pl-3.5 pr-8 rounded-xl text-[12px] font-light focus:outline-none appearance-none text-white cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {CITIES.map(c => <option key={c} value={c} style={{ background: '#071829' }}>{c}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#c9a96e' }} />
        </div>

        <Divider />

        {/* Tipo */}
        <FilterLabel>Tipo de imóvel</FilterLabel>
        <div className="flex flex-wrap gap-1.5 mb-1">
          {TYPES.map(t => (
            <button key={t} onClick={() => toggleType(t)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-200"
              style={selectedTypes.includes(t)
                ? { background: '#c9a96e', color: '#071829' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }
              }>
              {t}
            </button>
          ))}
        </div>

        <Divider />

        {/* Quartos */}
        <FilterLabel>Quartos (mín.)</FilterLabel>
        <NumberPicker value={minBedrooms} onChange={setMinBedrooms}
          options={[{label:'1',value:1},{label:'2',value:2},{label:'3',value:3},{label:'4+',value:4}]} />

        <Divider />

        {/* Banheiros */}
        <FilterLabel>Banheiros (mín.)</FilterLabel>
        <NumberPicker value={minBathrooms} onChange={setMinBathrooms}
          options={[{label:'1',value:1},{label:'2',value:2},{label:'3',value:3},{label:'4+',value:4}]} />

        <Divider />

        {/* Vagas */}
        <FilterLabel>Vagas (mín.)</FilterLabel>
        <NumberPicker value={minParking} onChange={setMinParking}
          options={[{label:'1',value:1},{label:'2',value:2},{label:'3',value:3}]} />

        <Divider />

        {/* Preço */}
        <FilterLabel>Faixa de preço</FilterLabel>
        <div className="flex gap-2 mb-1">
          <input type="text" value={minPrice} onChange={e => setMinPrice(e.target.value)}
            placeholder="Mínimo" className="w-full py-2.5 px-3 rounded-xl text-[11px] font-light focus:outline-none text-white placeholder:text-white/20"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          <input type="text" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
            placeholder="Máximo" className="w-full py-2.5 px-3 rounded-xl text-[11px] font-light focus:outline-none text-white placeholder:text-white/20"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
        </div>

        <Divider />

        {/* Clear */}
        {hasFilters && (
          <button onClick={clearFilters}
            className="w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] transition-all duration-200 flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#e57373'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(229,115,115,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}
          >
            <X size={11} /> Limpar filtros
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#f2f3f6' }}>

      {/* ── SIDEBAR DESKTOP ── */}
      <div className="hidden lg:flex flex-col flex-shrink-0 sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto" style={{ width: 280 }}>
        <Sidebar />
      </div>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.div initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[280px] overflow-y-auto lg:hidden"
              style={{ background: '#071829' }}>
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <p className="text-white font-bold text-sm">Filtros</p>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <div className="sticky top-[80px] z-30 bg-white/95 backdrop-blur-xl border-b px-5 md:px-8 py-4 flex items-center justify-between gap-4"
          style={{ borderColor: 'rgba(10,37,64,0.08)', boxShadow: '0 2px 20px rgba(10,37,64,0.06)' }}>
          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all"
              style={{ background: '#0a2540', color: 'white' }}>
              <SlidersHorizontal size={13} /> Filtros
              {hasFilters && <span className="w-4 h-4 rounded-full bg-[#c9a96e] text-[#071829] text-[8px] font-black flex items-center justify-center">!</span>}
            </button>
            <div>
              <p className="text-[#0a2540] font-bold text-[22px] leading-tight">
                {filtered.length} <span className="text-[#0a2540]/40 font-light">imóveis</span>
              </p>
              <p className="text-[#0a2540]/35 text-[11px] font-light">
                {mode === 'venda' ? 'à venda' : 'para alugar'} · {selectedCity === "Todas as cidades" ? "Litoral Paulista" : selectedCity}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative hidden sm:flex items-center">
              <ArrowUpDown size={12} className="absolute left-3 text-[#0a2540]/30 pointer-events-none" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl text-[11px] font-semibold focus:outline-none appearance-none cursor-pointer text-[#0a2540]/60"
                style={{ background: 'rgba(10,37,64,0.05)', border: '1px solid rgba(10,37,64,0.08)' }}>
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 text-[#0a2540]/30 pointer-events-none" />
            </div>

            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(10,37,64,0.1)' }}>
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className="w-9 h-9 flex items-center justify-center transition-all"
                  style={viewMode === v
                    ? { background: '#0a2540', color: 'white' }
                    : { background: 'transparent', color: 'rgba(10,37,64,0.3)' }
                  }>
                  {v === 'grid' ? <Grid3X3 size={14} /> : <LayoutList size={14} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active filter chips */}
        {hasFilters && (
          <div className="px-5 md:px-8 pt-4 pb-0 flex flex-wrap gap-2">
            {selectedCity !== "Todas as cidades" && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(10,37,64,0.08)', color: '#0a2540' }}>
                {selectedCity} <button onClick={() => setSelectedCity("Todas as cidades")}><X size={10} /></button>
              </span>
            )}
            {selectedTypes.map(t => (
              <span key={t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e' }}>
                {t} <button onClick={() => toggleType(t)}><X size={10} /></button>
              </span>
            ))}
            {minBedrooms > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
                style={{ background: 'rgba(10,37,64,0.08)', color: '#0a2540' }}>
                {minBedrooms}+ quartos <button onClick={() => setMinBedrooms(0)}><X size={10} /></button>
              </span>
            )}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 p-5 md:p-8">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(10,37,64,0.06)' }}>
                <Search size={24} className="text-[#0a2540]/25" />
              </div>
              <p className="text-[#0a2540]/40 text-center font-light">Nenhum imóvel encontrado com esses filtros.</p>
              <button onClick={clearFilters}
                className="px-6 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-wide text-white"
                style={{ background: '#0a2540' }}>
                Limpar filtros
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p, i) => <PropertyCard key={p.id} property={p} index={i} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.3) }}
                  className="group bg-white rounded-2xl overflow-hidden flex flex-row"
                  style={{ boxShadow: '0 2px 12px rgba(10,37,64,0.07)' }}>
                  <div className="relative flex-shrink-0 overflow-hidden" style={{ width: 240, minHeight: 160 }}>
                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.04]"
                      style={{ backgroundImage: `url(${p.image})` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white"
                        style={{ background: 'rgba(10,37,64,0.75)', backdropFilter: 'blur(8px)' }}>{p.type}</span>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 p-5 justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#c9a96e' }}>
                        {p.neighborhood} · {p.city}
                      </p>
                      <h3 className="font-bold text-[#0a2540] text-[15px] leading-snug mb-2">{p.title}</h3>
                      <p className="text-[#0a2540]/40 text-[12px] font-light line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-[#0a2540]/40">
                        <span className="flex items-center gap-1"><Bed size={12} /><span className="text-[11px] font-semibold">{p.bedrooms}</span></span>
                        <span className="flex items-center gap-1"><Bath size={12} /><span className="text-[11px] font-semibold">{p.bathrooms}</span></span>
                        <span className="flex items-center gap-1"><Ruler size={12} /><span className="text-[11px] font-semibold">{p.area}m²</span></span>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-[#0a2540] text-[15px]">{formatPrice(p.price)}</p>
                        <Link to={`/property/${p.id}`}
                          className="px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide text-white transition-all"
                          style={{ background: '#0a2540' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#c9a96e'; (e.currentTarget as HTMLElement).style.color = '#071829'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#0a2540'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
                        >
                          Ver →
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
