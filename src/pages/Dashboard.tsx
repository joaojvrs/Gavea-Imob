import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Building2, CheckCircle, XCircle, Clock, ShieldCheck,
  UserCircle, Plus, X, ChevronRight, AlertTriangle, Pencil,
  ArchiveX, Loader2, ChevronLeft, MapPin, Ruler, Bed, Bath, Car,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { useAuth, Profile, UserRole, UserStatus } from "@/src/context/AuthContext";
import { cn } from "@/src/lib/utils";
import MediaManager, { MediaItem } from "@/src/components/admin/MediaManager";
import TourScenesManager, { TourSceneItem } from "@/src/components/admin/TourScenesManager";
import FloorPlanEditor, { FloorPlanData } from "@/src/components/admin/FloorPlanEditor";

// ── Types ─────────────────────────────────────────────────────

interface DBProfile extends Profile { email?: string; }

interface DBProperty {
  id: string; title: string; type: string;
  location: string; neighborhood: string | null;
  city: string | null; state: string | null;
  area: number | null; bedrooms: number | null;
  bathrooms: number | null; parking: number | null;
  suites: number | null; price: string | null;
  description: string | null; image_url: string | null;
  gallery_urls: string[] | null; tour360_urls: string[] | null;
  video_url: string | null; match_score: number | null;
  status: string; created_by: string | null; created_at: string;
}

type Tab = "users" | "properties";
type WizardStep = "dados" | "midia" | "tour" | "planta" | "publicar";

const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: "dados",    label: "Dados"    },
  { key: "midia",    label: "Fotos"    },
  { key: "tour",     label: "Tour 360" },
  { key: "planta",   label: "Planta"   },
  { key: "publicar", label: "Publicar" },
];

const EASE = [0.16, 1, 0.3, 1] as const;
const ROLE_LABEL: Record<UserRole, string>     = { admin: "Administrativo", corretor: "Corretor", usuario: "Usuário" };
const STATUS_LABEL: Record<UserStatus, string> = { active: "Ativo", pending: "Pendente", revoked: "Revogado" };
const ROLE_ICON: Record<UserRole, React.ElementType> = { admin: ShieldCheck, corretor: Building2, usuario: UserCircle };
const PROPERTY_TYPES = ["Apartamento","Cobertura","Casa","Terreno","Comercial","Studio","Penthouse"];

// ── Dashboard ─────────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState<Tab>(isAdmin ? "users" : "properties");

  return (
    <div className="min-h-screen bg-brand-bg pt-20 md:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.8,ease:EASE }} className="mb-10">
          <span className="text-brand-accent text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block">{ROLE_LABEL[profile?.role ?? "usuario"]}</span>
          <h1 className="text-4xl md:text-5xl font-black text-brand-blue tracking-tight">Painel Gávea</h1>
          <p className="text-brand-blue/40 mt-2 font-light">Olá, {profile?.full_name?.split(" ")[0]}. Gerencie sua plataforma abaixo.</p>
        </motion.div>

        {profile?.status === "pending" && (
          <motion.div initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }}
            className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-semibold text-sm">Conta aguardando aprovação</p>
              <p className="text-amber-600 text-xs mt-0.5">Um administrador precisa aprovar seu acesso.</p>
            </div>
          </motion.div>
        )}

        <div className="flex gap-1 bg-brand-slate rounded-2xl p-1 w-fit mb-8">
          {isAdmin && <TabBtn active={tab==="users"} onClick={() => setTab("users")} icon={Users}>Usuários</TabBtn>}
          <TabBtn active={tab==="properties"} onClick={() => setTab("properties")} icon={Building2}>Imóveis</TabBtn>
        </div>

        <AnimatePresence mode="wait">
          {tab==="users" && isAdmin && (
            <motion.div key="users" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.4,ease:EASE}}>
              <UsersPanel />
            </motion.div>
          )}
          {tab==="properties" && (
            <motion.div key="properties" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.4,ease:EASE}}>
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Users Panel ───────────────────────────────────────────────

function UsersPanel() {
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("admin_get_profiles");
    setProfiles((data as DBProfile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: UserStatus) => {
    setBusy(id);
    await supabase.rpc("admin_set_profile_status", { p_target_id: id, p_status: status });
    await load();
    setBusy(null);
  };

  const pending = profiles.filter(p => p.status==="pending" && p.role!=="usuario");
  const active  = profiles.filter(p => p.status==="active"  && p.role!=="usuario");
  const revoked = profiles.filter(p => p.status==="revoked" && p.role!=="usuario");

  if (loading) return <LoadingDots />;

  return (
    <div className="space-y-10">
      <Section title="Aguardando Aprovação" count={pending.length} accent="amber" icon={Clock} empty="Nenhuma solicitação pendente.">
        {pending.map(p => (
          <UserCard key={p.id} profile={p} busy={busy===p.id}>
            <ActionBtn color="green" icon={CheckCircle} disabled={!!busy} onClick={() => setStatus(p.id,"active")}>Aprovar</ActionBtn>
            <ActionBtn color="red"   icon={XCircle}     disabled={!!busy} onClick={() => setStatus(p.id,"revoked")}>Recusar</ActionBtn>
          </UserCard>
        ))}
      </Section>
      <Section title="Equipe Ativa" count={active.length} accent="brand" icon={CheckCircle} empty="Nenhum corretor ativo.">
        {active.map(p => (
          <UserCard key={p.id} profile={p} busy={busy===p.id}>
            <ActionBtn color="red" icon={XCircle} disabled={!!busy} onClick={() => setStatus(p.id,"revoked")}>Revogar Acesso</ActionBtn>
          </UserCard>
        ))}
      </Section>
      {revoked.length > 0 && (
        <Section title="Acesso Revogado" count={revoked.length} accent="gray" icon={ArchiveX} empty="">
          {revoked.map(p => (
            <UserCard key={p.id} profile={p} busy={busy===p.id}>
              <ActionBtn color="green" icon={CheckCircle} disabled={!!busy} onClick={() => setStatus(p.id,"active")}>Reativar</ActionBtn>
            </UserCard>
          ))}
        </Section>
      )}
    </div>
  );
}

// ── Properties Panel ──────────────────────────────────────────

function PropertiesPanel() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [properties, setProperties] = useState<DBProperty[]>([]);
  const [loading, setLoading]        = useState(true);
  const [showForm, setShowForm]      = useState(false);
  const [editing, setEditing]        = useState<DBProperty | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("properties").select("*").order("created_at",{ascending:false});
    if (!isAdmin) q = q.eq("created_by", user!.id);
    const { data } = await q;
    setProperties((data as DBProperty[]) ?? []);
    setLoading(false);
  }, [isAdmin, user]);

  useEffect(() => { load(); }, [load]);

  const archive = async (id: string) => {
    await supabase.from("properties").update({ status:"sold" }).eq("id",id);
    await load();
  };

  if (loading) return <LoadingDots />;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-brand-blue/40 text-sm">{properties.length} imóv{properties.length!==1?"eis":"el"}</p>
        {profile?.status==="active" && (
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={() => { setEditing(null); setShowForm(true); }}
            className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400 shadow-lg shadow-brand-blue/15">
            <Plus size={14} /> Novo Imóvel
          </motion.button>
        )}
      </div>

      {properties.length === 0 ? (
        <EmptyState message="Nenhum imóvel cadastrado ainda." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <motion.div key={p.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
              className="bg-white rounded-2xl border border-brand-blue/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="aspect-video bg-brand-slate relative overflow-hidden">
                {p.image_url
                  ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-brand-blue/20"><Building2 size={32}/></div>}
                <span className={cn(
                  "absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                  p.status==="active" ? "bg-emerald-100 text-emerald-700"
                  : p.status==="draft" ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
                )}>
                  {p.status==="active"?"Ativo":p.status==="draft"?"Rascunho":"Vendido"}
                </span>
                {/* Media badges */}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {p.tour360_urls?.length ? (
                    <span className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">360°</span>
                  ) : null}
                  {p.video_url ? (
                    <span className="bg-black/60 text-white text-[8px] px-2 py-0.5 rounded-full font-bold">▶ Vídeo</span>
                  ) : null}
                </div>
              </div>
              <div className="p-4">
                <p className="text-brand-blue/40 text-[9px] uppercase tracking-widest font-bold mb-1">{p.type}</p>
                <h3 className="text-brand-blue font-bold text-sm leading-snug mb-1">{p.title}</h3>
                <p className="text-brand-blue/40 text-xs mb-3 flex items-center gap-1"><MapPin size={9}/>{p.location}</p>
                <div className="flex gap-3 text-[10px] text-brand-blue/40 font-mono mb-4">
                  {p.bedrooms && <span className="flex items-center gap-1"><Bed size={9}/>{p.bedrooms}</span>}
                  {p.area     && <span className="flex items-center gap-1"><Ruler size={9}/>{p.area}m²</span>}
                  {p.price    && <span className="text-brand-blue/60 font-semibold">{p.price}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setShowForm(true); }}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-brand-blue/10 hover:border-brand-accent/40 text-brand-blue/50 hover:text-brand-accent py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all">
                    <Pencil size={12}/> Editar
                  </button>
                  {p.status!=="sold" && (
                    <button onClick={() => archive(p.id)}
                      className="flex items-center justify-center gap-1.5 border border-brand-blue/10 hover:border-red-300 text-brand-blue/40 hover:text-red-400 px-3 py-2 rounded-xl text-[10px] transition-all">
                      <ArchiveX size={12}/>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <PropertyWizard
            initial={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { setShowForm(false); setEditing(null); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Property Wizard (multi-step modal) ────────────────────────

interface WizardProps {
  initial: DBProperty | null;
  onClose: () => void;
  onSaved: () => void;
}

function buildRoomSuggestions(bedrooms: number, suites: number, bathrooms: number): string[] {
  const list = ["Sala de Estar", "Sala de Jantar", "Cozinha", "Hall de Entrada", "Varanda", "Área Gourmet"];
  for (let i = 0; i < suites; i++) {
    list.push(suites === 1 ? "Suíte Master" : `Suíte ${i + 1}`);
    list.push(suites === 1 ? "Banheiro Suíte" : `Banheiro Suíte ${i + 1}`);
  }
  const regular = bedrooms - suites;
  for (let i = 0; i < regular; i++) list.push(`Quarto ${i + 1}`);
  const socialBaths = Math.max(0, bathrooms - suites);
  if (socialBaths >= 1) list.push("Banheiro Social");
  if (socialBaths >= 2) list.push("Lavabo");
  list.push("Corredor", "Área de Serviço", "Lavanderia", "Closet", "Escritório");
  return list;
}

function PropertyWizard({ initial, onClose, onSaved }: WizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<WizardStep>("dados");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // Property id — generated upfront so media can reference it immediately
  const [propertyId] = useState<string>(initial?.id ?? crypto.randomUUID());
  const [savedToDb, setSavedToDb] = useState(!!initial);

  // Dados form
  const [form, setForm] = useState({
    title:        initial?.title        ?? "",
    type:         initial?.type         ?? "Apartamento",
    location:     initial?.location     ?? "",
    neighborhood: initial?.neighborhood ?? "",
    city:         initial?.city         ?? "",
    state:        initial?.state        ?? "",
    price:        initial?.price        ?? "",
    area:         String(initial?.area      ?? ""),
    bedrooms:     String(initial?.bedrooms  ?? ""),
    bathrooms:    String(initial?.bathrooms ?? ""),
    parking:      String(initial?.parking   ?? ""),
    suites:       String(initial?.suites    ?? ""),
    description:  initial?.description  ?? "",
    features:     (initial as unknown as { features?: string[] })?.features?.join("\n") ?? "",
    infrastructure: (initial as unknown as { infrastructure?: string[] })?.infrastructure?.join("\n") ?? "",
    lazer:        (initial as unknown as { lazer?: string[] })?.lazer?.join("\n") ?? "",
    status:       initial?.status       ?? "draft",
    match_score:  String((initial as unknown as { match_score?: number })?.match_score ?? ""),
  });

  // Media state (loaded from DB)
  const [media, setMedia]         = useState<MediaItem[]>([]);
  const [tourScenes, setTourScenes] = useState<TourSceneItem[]>([]);
  const [floorPlan, setFloorPlan]  = useState<FloorPlanData | null>(null);
  const [mediaLoaded, setMediaLoaded] = useState(false);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  // Load existing media when opening an existing property
  useEffect(() => {
    if (!initial || mediaLoaded) return;
    const load = async () => {
      const [{ data: mediaData }, { data: planData }] = await Promise.all([
        supabase.from("property_media").select("*").eq("property_id", propertyId).order("order_index"),
        supabase.from("property_floor_plans").select("*").eq("property_id", propertyId).single(),
      ]);
      if (mediaData) {
        setMedia((mediaData as MediaItem[]).filter(m => m.type === "photo" || m.type === "video"));
        setTourScenes((mediaData as Array<TourSceneItem & { type: string }>).filter(m => m.type === "tour_360"));
      }
      if (planData) setFloorPlan(planData as FloorPlanData);
      setMediaLoaded(true);
    };
    load();
  }, [initial, propertyId, mediaLoaded]);

  // Save / update basic data in DB
  const saveData = async (nextStep: WizardStep) => {
    if (!form.title.trim() || !form.location.trim()) {
      setError("Título e localização são obrigatórios.");
      return;
    }
    setSaving(true); setError(null);

    const payload = {
      title:        form.title,
      type:         form.type,
      location:     form.location,
      neighborhood: form.neighborhood || null,
      city:         form.city         || null,
      state:        form.state        || null,
      price:        form.price        || null,
      area:         form.area         ? Number(form.area)      : null,
      bedrooms:     form.bedrooms     ? Number(form.bedrooms)  : null,
      bathrooms:    form.bathrooms    ? Number(form.bathrooms) : null,
      parking:      form.parking      ? Number(form.parking)   : null,
      suites:       form.suites       ? Number(form.suites)    : null,
      description:  form.description  || null,
      features:     form.features     ? form.features.split("\n").map(s=>s.trim()).filter(Boolean) : [],
      infrastructure: form.infrastructure ? form.infrastructure.split("\n").map(s=>s.trim()).filter(Boolean) : [],
      lazer:        form.lazer        ? form.lazer.split("\n").map(s=>s.trim()).filter(Boolean) : [],
      status:       form.status,
      match_score:  form.match_score  ? Number(form.match_score) : null,
    };

    let err;
    if (savedToDb) {
      ({ error: err } = await supabase.from("properties").update(payload).eq("id", propertyId));
    } else {
      ({ error: err } = await supabase.from("properties").insert({ id: propertyId, ...payload, created_by: user?.id }));
      if (!err) setSavedToDb(true);
    }

    setSaving(false);
    if (err) { setError(err.message); return; }
    setStep(nextStep);
  };

  // Sync cover image from media to properties.image_url
  const syncCoverImage = async () => {
    const cover = media.find(m => m.is_cover && m.type === "photo") ?? media.find(m => m.type === "photo");
    if (cover) await supabase.from("properties").update({ image_url: cover.url }).eq("id", propertyId);
    // Sync first video
    const video = media.find(m => m.type === "video");
    if (video) await supabase.from("properties").update({ video_url: video.url }).eq("id", propertyId);
    // Sync tour360_urls for backward compat
    const t360Urls = tourScenes.map(s => s.url);
    if (t360Urls.length) await supabase.from("properties").update({ tour360_urls: t360Urls }).eq("id", propertyId);
  };

  const publish = async () => {
    setSaving(true);
    await syncCoverImage();
    await supabase.from("properties").update({ status: "active" }).eq("id", propertyId);
    setSaving(false);
    onSaved();
  };

  const saveDraft = async () => {
    setSaving(true);
    await syncCoverImage();
    setSaving(false);
    onSaved();
  };

  const stepIdx  = WIZARD_STEPS.findIndex(s => s.key === step);
  const isFirst  = stepIdx === 0;
  const isLast   = stepIdx === WIZARD_STEPS.length - 1;

  return (
    <motion.div key="wizard-overlay" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      className="fixed inset-0 z-[200] bg-brand-blue/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
        transition={{duration:0.45,ease:EASE}}
        className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="flex-shrink-0 border-b border-brand-blue/5 px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-brand-blue font-black text-lg">{initial ? "Editar Imóvel" : "Novo Imóvel"}</h2>
            <button onClick={onClose} className="p-2 text-brand-blue/30 hover:text-brand-blue/60 transition-colors rounded-xl"><X size={20}/></button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-0">
            {WIZARD_STEPS.map((s, i) => (
              <button key={s.key} type="button"
                onClick={() => savedToDb && i <= stepIdx + 1 ? setStep(s.key) : undefined}
                disabled={!savedToDb && i > 0}
                className={cn(
                  "flex-1 pb-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all",
                  s.key === step
                    ? "border-brand-accent text-brand-accent"
                    : i < stepIdx
                    ? "border-brand-blue/20 text-brand-blue/40 hover:text-brand-blue/60 cursor-pointer"
                    : "border-transparent text-brand-blue/20 cursor-default"
                )}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.25}}>

              {step === "dados" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Tipo">
                      <select value={form.type} onChange={set("type")} className={selectClass}>
                        {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </FormField>
                    <FormField label="Status">
                      <select value={form.status} onChange={set("status")} className={selectClass}>
                        <option value="draft">Rascunho</option>
                        <option value="active">Ativo</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Título *">
                    <input required type="text" value={form.title} onChange={set("title")} placeholder="Ex: Cobertura Duplex Frente Mar" className={inputClass}/>
                  </FormField>
                  <FormField label="Localização *">
                    <input required type="text" value={form.location} onChange={set("location")} placeholder="Ex: Gonzaga - Santos/SP" className={inputClass}/>
                  </FormField>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Bairro"><input type="text" value={form.neighborhood} onChange={set("neighborhood")} placeholder="Gonzaga" className={inputClass}/></FormField>
                    <FormField label="Cidade"><input type="text" value={form.city} onChange={set("city")} placeholder="Santos" className={inputClass}/></FormField>
                    <FormField label="UF"><input type="text" value={form.state} onChange={set("state")} placeholder="SP" maxLength={2} className={inputClass}/></FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Preço"><input type="text" value={form.price} onChange={set("price")} placeholder="R$ 4.500.000" className={inputClass}/></FormField>
                    <FormField label="Área (m²)"><input type="number" min={0} value={form.area} onChange={set("area")} placeholder="302" className={inputClass}/></FormField>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {(["bedrooms","bathrooms","parking","suites"] as const).map(k => (
                      <FormField key={k} label={k==="bedrooms"?"Quartos":k==="bathrooms"?"Banheiros":k==="parking"?"Vagas":"Suítes"}>
                        <input type="number" min={0} value={form[k]} onChange={set(k)} placeholder="0" className={inputClass}/>
                      </FormField>
                    ))}
                  </div>
                  <FormField label="Affinity Score (%)">
                    <input type="number" min={0} max={100} step={0.1} value={form.match_score} onChange={set("match_score")} placeholder="98.5" className={inputClass}/>
                  </FormField>
                  <FormField label="Descrição">
                    <textarea value={form.description} onChange={set("description")} rows={3} placeholder="Diferenciais do imóvel..." className={cn(inputClass,"resize-none")}/>
                  </FormField>
                  <Divider label="Atributos (um por linha)" />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FormField label="Features">
                      <textarea value={form.features} onChange={set("features")} rows={4} placeholder={"Vista para o mar\nVaranda gourmet"} className={cn(inputClass,"resize-none text-xs")}/>
                    </FormField>
                    <FormField label="Infraestrutura">
                      <textarea value={form.infrastructure} onChange={set("infrastructure")} rows={4} placeholder={"Portaria 24h\nElevador"} className={cn(inputClass,"resize-none text-xs")}/>
                    </FormField>
                    <FormField label="Lazer">
                      <textarea value={form.lazer} onChange={set("lazer")} rows={4} placeholder={"Piscina\nSauna"} className={cn(inputClass,"resize-none text-xs")}/>
                    </FormField>
                  </div>
                </div>
              )}

              {step === "midia" && savedToDb && (
                <MediaManager propertyId={propertyId} items={media} onChange={setMedia} />
              )}

              {step === "tour" && savedToDb && (
                <TourScenesManager
                  propertyId={propertyId}
                  scenes={tourScenes}
                  onChange={setTourScenes}
                  roomSuggestions={buildRoomSuggestions(
                    Number(form.bedrooms) || 0,
                    Number(form.suites) || 0,
                    Number(form.bathrooms) || 0,
                  )}
                />
              )}

              {step === "planta" && savedToDb && (
                <FloorPlanEditor
                  propertyId={propertyId}
                  value={floorPlan}
                  onChange={setFloorPlan}
                  autoGenSpecs={{
                    bedrooms:  Number(form.bedrooms)  || 0,
                    suites:    Number(form.suites)    || 0,
                    bathrooms: Number(form.bathrooms) || 0,
                  }}
                />
              )}

              {step === "publicar" && (
                <div className="space-y-6 py-4">
                  {/* Summary */}
                  <div className="bg-brand-slate rounded-2xl p-5 space-y-4">
                    <h3 className="font-bold text-brand-blue text-sm">Resumo do Imóvel</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div><span className="text-brand-blue/40 block text-[9px] uppercase tracking-widest font-bold">Título</span><span className="text-brand-blue font-medium">{form.title}</span></div>
                      <div><span className="text-brand-blue/40 block text-[9px] uppercase tracking-widest font-bold">Tipo</span><span className="text-brand-blue font-medium">{form.type}</span></div>
                      <div><span className="text-brand-blue/40 block text-[9px] uppercase tracking-widest font-bold">Localização</span><span className="text-brand-blue font-medium">{form.location}</span></div>
                      <div><span className="text-brand-blue/40 block text-[9px] uppercase tracking-widest font-bold">Preço</span><span className="text-brand-blue font-medium">{form.price || "Sob consulta"}</span></div>
                    </div>
                    <div className="flex gap-3 text-[10px] pt-1 border-t border-brand-blue/5">
                      <span className={cn("px-2.5 py-1 rounded-full font-bold", media.filter(m=>m.type==="photo").length>0?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400")}>
                        {media.filter(m=>m.type==="photo").length} foto{media.filter(m=>m.type==="photo").length!==1?"s":""}
                      </span>
                      <span className={cn("px-2.5 py-1 rounded-full font-bold", media.some(m=>m.type==="video")?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400")}>
                        {media.some(m=>m.type==="video")?"Vídeo ✓":"Sem vídeo"}
                      </span>
                      <span className={cn("px-2.5 py-1 rounded-full font-bold", tourScenes.length>0?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400")}>
                        {tourScenes.length>0?`Tour 360 · ${tourScenes.length} cena${tourScenes.length!==1?"s":""}` :"Sem tour 360"}
                      </span>
                      <span className={cn("px-2.5 py-1 rounded-full font-bold", floorPlan?"bg-emerald-100 text-emerald-700":"bg-gray-100 text-gray-400")}>
                        {floorPlan?"Planta ✓":"Sem planta"}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={saveDraft} disabled={saving}
                      className="py-4 rounded-2xl border border-brand-blue/10 text-brand-blue/60 hover:text-brand-blue/80 text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40">
                      {saving ? <Loader2 size={14} className="animate-spin mx-auto"/> : "Salvar Rascunho"}
                    </button>
                    <button type="button" onClick={publish} disabled={saving}
                      className="py-4 rounded-2xl bg-brand-blue text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400 disabled:opacity-40 flex items-center justify-center gap-2">
                      {saving ? <Loader2 size={14} className="animate-spin"/> : <><CheckCircle size={14}/> Publicar Imóvel</>}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-3 text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer navigation */}
        <div className="flex-shrink-0 border-t border-brand-blue/5 px-6 py-4 flex gap-3">
          {!isFirst && (
            <button type="button" onClick={() => setStep(WIZARD_STEPS[stepIdx-1].key)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-brand-blue/10 text-brand-blue/50 hover:text-brand-blue/70 text-xs font-bold uppercase tracking-widest transition-all">
              <ChevronLeft size={14}/> Voltar
            </button>
          )}
          {step === "dados" && (
            <button type="button" onClick={() => saveData("midia")} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-blue text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all disabled:opacity-40">
              {saving ? <Loader2 size={14} className="animate-spin"/> : <>{savedToDb?"Salvar e Avançar":"Criar e Avançar"} <ChevronRight size={14}/></>}
            </button>
          )}
          {step !== "dados" && !isLast && (
            <button type="button" onClick={() => setStep(WIZARD_STEPS[stepIdx+1].key)}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-blue text-white py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all">
              Próximo <ChevronRight size={14}/>
            </button>
          )}
          {isLast && (
            <span className="flex-1 text-center text-xs text-brand-blue/30 py-2.5">Use os botões acima para publicar ou salvar rascunho</span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Shared sub-components ─────────────────────────────────────

function TabBtn({ active, onClick, icon: Icon, children }: { active:boolean; onClick:()=>void; icon:React.ElementType; children:React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300", active?"bg-white shadow text-brand-blue":"text-brand-blue/40 hover:text-brand-blue/60")}>
      <Icon size={14}/>{children}
    </button>
  );
}

function Section({ title,count,accent,icon:Icon,empty,children }: { title:string;count:number;accent:string;icon:React.ElementType;empty:string;children:React.ReactNode }) {
  const cls = accent==="amber"?"text-amber-500 bg-amber-50 border-amber-200":accent==="brand"?"text-brand-accent bg-brand-accent/8 border-brand-accent/20":"text-gray-400 bg-gray-50 border-gray-200";
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold",cls)}><Icon size={13}/>{title}</div>
        <span className="text-brand-blue/30 text-xs font-mono">{count}</span>
      </div>
      {count===0 ? <EmptyState message={empty}/> : <div className="space-y-3">{children}</div>}
    </div>
  );
}

function UserCard({ profile,busy,children }: { profile:DBProfile;busy:boolean;children:React.ReactNode }) {
  const Icon = ROLE_ICON[profile.role];
  return (
    <div className={cn("bg-white rounded-2xl border border-brand-blue/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm",busy&&"opacity-60 pointer-events-none")}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-slate flex items-center justify-center flex-shrink-0"><Icon size={18} className="text-brand-blue/40"/></div>
        <div>
          <p className="text-brand-blue font-bold text-sm">{profile.full_name ?? "—"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-brand-blue/35 text-[10px] uppercase tracking-widest">{ROLE_LABEL[profile.role]}</span>
            <span className="text-brand-blue/20 text-[10px]">·</span>
            <span className={cn("text-[10px] font-bold uppercase tracking-widest",profile.status==="active"&&"text-emerald-500",profile.status==="pending"&&"text-amber-500",profile.status==="revoked"&&"text-red-400")}>{STATUS_LABEL[profile.status]}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">{busy?<Loader2 size={16} className="animate-spin text-brand-blue/40"/>:children}</div>
    </div>
  );
}

function ActionBtn({ color,icon:Icon,onClick,disabled,children }: { color:"green"|"red";icon:React.ElementType;onClick:()=>void;disabled:boolean;children:React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all disabled:opacity-50",color==="green"?"border-emerald-200 text-emerald-600 hover:bg-emerald-50":"border-red-200 text-red-500 hover:bg-red-50")}>
      <Icon size={12}/>{children}
    </button>
  );
}

function FormField({ label,children }: { label:string;children:React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/38 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="flex-1 h-px bg-brand-blue/5"/>
      <span className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/25">{label}</span>
      <div className="flex-1 h-px bg-brand-blue/5"/>
    </div>
  );
}

function EmptyState({ message }: { message:string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-brand-blue/25">
      <ChevronRight size={24} className="mb-2"/>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex justify-center py-16">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.3s]"/>
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.15s]"/>
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce"/>
      </div>
    </div>
  );
}

const inputClass  = "w-full bg-brand-slate border border-brand-blue/6 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent/30 transition-all placeholder:text-brand-blue/22";
const selectClass = "w-full bg-brand-slate border border-brand-blue/6 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all appearance-none cursor-pointer";
