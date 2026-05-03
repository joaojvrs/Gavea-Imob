import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users, Building2, CheckCircle, XCircle, Clock, ShieldCheck,
  UserCircle, Plus, X, ChevronRight, AlertTriangle, Pencil,
  ArchiveX, Loader2, Upload,
} from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { useAuth, Profile, UserRole, UserStatus } from "@/src/context/AuthContext";
import { cn } from "@/src/lib/utils";

// ── Types ────────────────────────────────────────────────────

interface DBProfile extends Profile {
  email?: string;
}

interface DBProperty {
  id:            string;
  title:         string;
  type:          string;
  location:      string;
  neighborhood:  string | null;
  city:          string | null;
  state:         string | null;
  area:          number | null;
  bedrooms:      number | null;
  bathrooms:     number | null;
  parking:       number | null;
  suites:        number | null;
  price:         string | null;
  description:   string | null;
  image_url:     string | null;
  gallery_urls:  string[] | null;
  tour360_urls:  string[] | null;
  video_url:     string | null;
  match_score:   number | null;
  status:        string;
  created_by:    string | null;
  created_at:    string;
}

type Tab = "users" | "properties";

const EASE = [0.16, 1, 0.3, 1] as const;

const ROLE_LABEL: Record<UserRole, string>     = { admin: "Administrativo", corretor: "Corretor", usuario: "Usuário" };
const STATUS_LABEL: Record<UserStatus, string> = { active: "Ativo", pending: "Pendente", revoked: "Revogado" };

const ROLE_ICON: Record<UserRole, React.ElementType> = {
  admin: ShieldCheck, corretor: Building2, usuario: UserCircle,
};

// ── Main Dashboard ────────────────────────────────────────────

export default function Dashboard() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const [tab, setTab] = useState<Tab>(isAdmin ? "users" : "properties");

  return (
    <div className="min-h-screen bg-brand-bg pt-20 md:pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mb-10"
        >
          <span className="text-brand-accent text-[10px] uppercase tracking-[0.25em] font-bold mb-2 block"
            style={{ fontFamily: "var(--font-heading)" }}>
            {ROLE_LABEL[profile?.role ?? "usuario"]}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-brand-blue tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}>
            Painel Gávea
          </h1>
          <p className="text-brand-blue/40 mt-2 font-light">
            Olá, {profile?.full_name?.split(" ")[0]}. Gerencie sua plataforma abaixo.
          </p>
        </motion.div>

        {/* Status de conta pendente */}
        {profile?.status === "pending" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4"
          >
            <AlertTriangle size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800 font-semibold text-sm">Conta aguardando aprovação</p>
              <p className="text-amber-600 text-xs mt-0.5">
                Um administrador precisa aprovar seu acesso. Você será notificado assim que aprovado.
              </p>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-brand-slate rounded-2xl p-1 w-fit mb-8">
          {isAdmin && (
            <TabBtn active={tab === "users"} onClick={() => setTab("users")} icon={Users}>
              Usuários
            </TabBtn>
          )}
          <TabBtn active={tab === "properties"} onClick={() => setTab("properties")} icon={Building2}>
            Imóveis
          </TabBtn>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === "users" && isAdmin && (
            <motion.div key="users"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <UsersPanel />
            </motion.div>
          )}
          {tab === "properties" && (
            <motion.div key="properties"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              <PropertiesPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Users Panel (admin only) ─────────────────────────────────

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

  const pending  = profiles.filter(p => p.status === "pending"  && p.role !== "usuario");
  const active   = profiles.filter(p => p.status === "active"   && p.role !== "usuario");
  const revoked  = profiles.filter(p => p.status === "revoked"  && p.role !== "usuario");

  if (loading) return <LoadingDots />;

  return (
    <div className="space-y-10">

      {/* Pendentes */}
      <Section
        title="Aguardando Aprovação"
        count={pending.length}
        accent="amber"
        icon={Clock}
        empty="Nenhuma solicitação pendente."
      >
        {pending.map(p => (
          <UserCard key={p.id} profile={p} busy={busy === p.id}>
            <ActionBtn color="green" icon={CheckCircle} disabled={!!busy}
              onClick={() => setStatus(p.id, "active")}>
              Aprovar
            </ActionBtn>
            <ActionBtn color="red" icon={XCircle} disabled={!!busy}
              onClick={() => setStatus(p.id, "revoked")}>
              Recusar
            </ActionBtn>
          </UserCard>
        ))}
      </Section>

      {/* Equipe ativa */}
      <Section
        title="Equipe Ativa"
        count={active.length}
        accent="brand"
        icon={CheckCircle}
        empty="Nenhum corretor ou administrador ativo."
      >
        {active.map(p => (
          <UserCard key={p.id} profile={p} busy={busy === p.id}>
            <ActionBtn color="red" icon={XCircle} disabled={!!busy}
              onClick={() => setStatus(p.id, "revoked")}>
              Revogar Acesso
            </ActionBtn>
          </UserCard>
        ))}
      </Section>

      {/* Revogados */}
      {revoked.length > 0 && (
        <Section
          title="Acesso Revogado"
          count={revoked.length}
          accent="gray"
          icon={ArchiveX}
          empty=""
        >
          {revoked.map(p => (
            <UserCard key={p.id} profile={p} busy={busy === p.id}>
              <ActionBtn color="green" icon={CheckCircle} disabled={!!busy}
                onClick={() => setStatus(p.id, "active")}>
                Reativar
              </ActionBtn>
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
    let q = supabase.from("properties").select("*").order("created_at", { ascending: false });
    if (!isAdmin) q = q.eq("created_by", user!.id);
    const { data } = await q;
    setProperties((data as DBProperty[]) ?? []);
    setLoading(false);
  }, [isAdmin, user]);

  useEffect(() => { load(); }, [load]);

  const archive = async (id: string) => {
    await supabase.from("properties").update({ status: "sold" }).eq("id", id);
    await load();
  };

  const openEdit = (p: DBProperty) => { setEditing(p); setShowForm(true); };
  const openNew  = () => { setEditing(null); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  if (loading) return <LoadingDots />;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-brand-blue/40 text-sm">{properties.length} imóv{properties.length !== 1 ? "eis" : "el"}</p>
        {profile?.status === "active" && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={openNew}
            className="flex items-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400 shadow-lg shadow-brand-blue/15"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            <Plus size={14} />
            Novo Imóvel
          </motion.button>
        )}
      </div>

      {properties.length === 0 ? (
        <EmptyState message="Nenhum imóvel cadastrado ainda." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-brand-blue/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className="aspect-video bg-brand-slate relative overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-blue/20">
                    <Building2 size={32} />
                  </div>
                )}
                <span className={cn(
                  "absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest",
                  p.status === "active" ? "bg-emerald-100 text-emerald-700"
                  : p.status === "draft" ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-500"
                )}>
                  {p.status === "active" ? "Ativo" : p.status === "draft" ? "Rascunho" : "Vendido"}
                </span>
              </div>
              <div className="p-4">
                <p className="text-brand-blue/40 text-[9px] uppercase tracking-widest font-bold mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}>{p.type}</p>
                <h3 className="text-brand-blue font-bold text-sm leading-snug mb-1">{p.title}</h3>
                <p className="text-brand-blue/40 text-xs mb-3">{p.location}</p>
                <div className="flex gap-3 text-[10px] text-brand-blue/40 font-mono mb-4">
                  {p.bedrooms && <span>{p.bedrooms} qts</span>}
                  {p.area     && <span>{p.area} m²</span>}
                  {p.price    && <span className="text-brand-blue/60 font-semibold">{p.price}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-brand-blue/10 hover:border-brand-accent/40 text-brand-blue/50 hover:text-brand-accent py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200"
                    style={{ fontFamily: "var(--font-heading)" }}>
                    <Pencil size={12} /> Editar
                  </button>
                  {p.status !== "sold" && (
                    <button onClick={() => archive(p.id)}
                      className="flex items-center justify-center gap-1.5 border border-brand-blue/10 hover:border-red-300 text-brand-blue/40 hover:text-red-400 px-3 py-2 rounded-xl text-[10px] transition-all duration-200">
                      <ArchiveX size={12} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Property Form Modal */}
      <AnimatePresence>
        {showForm && (
          <PropertyFormModal
            initial={editing}
            onClose={closeForm}
            onSaved={() => { closeForm(); load(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Property Form Modal ───────────────────────────────────────

interface PropertyFormModalProps {
  initial:  DBProperty | null;
  onClose:  () => void;
  onSaved:  () => void;
}

const PROPERTY_TYPES = ["Apartamento", "Cobertura", "Casa", "Terreno", "Comercial", "Studio", "Penthouse"];

function PropertyFormModal({ initial, onClose, onSaved }: PropertyFormModalProps) {
  const { user } = useAuth();
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");

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
    image_url:    initial?.image_url    ?? "",
    status:       initial?.status       ?? "active",
  });

  const [mediaFiles, setMediaFiles] = useState<{
    mainImage: File | null;
    gallery:   File[];
    tour360:   File[];
    video:     File | null;
  }>({ mainImage: null, gallery: [], tour360: [], video: null });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const uploadToStorage = async (propertyId: string) => {
    const bucket = supabase.storage.from("properties");
    let imageUrl: string | null        = form.image_url || null;
    let galleryUrls: string[]          = initial?.gallery_urls  ?? [];
    let tour360Urls: string[]          = initial?.tour360_urls  ?? [];
    let videoUrl:    string | null     = initial?.video_url     ?? null;

    if (mediaFiles.mainImage) {
      setUploadMsg("Enviando foto principal...");
      const path = `${propertyId}/main/${mediaFiles.mainImage.name}`;
      const { error: e } = await bucket.upload(path, mediaFiles.mainImage, { upsert: true });
      if (!e) imageUrl = bucket.getPublicUrl(path).data.publicUrl;
    }

    if (mediaFiles.gallery.length > 0) {
      setUploadMsg(`Enviando galeria (${mediaFiles.gallery.length} foto${mediaFiles.gallery.length !== 1 ? "s" : ""})...`);
      const newUrls = await Promise.all(
        mediaFiles.gallery.map(async (file, i) => {
          const path = `${propertyId}/gallery/${Date.now()}_${i}_${file.name}`;
          const { error: e } = await bucket.upload(path, file, { upsert: true });
          if (e) return null;
          return bucket.getPublicUrl(path).data.publicUrl;
        })
      );
      galleryUrls = [...galleryUrls, ...(newUrls.filter(Boolean) as string[])];
    }

    if (mediaFiles.tour360.length > 0) {
      setUploadMsg(`Enviando tour 360° (${mediaFiles.tour360.length} foto${mediaFiles.tour360.length !== 1 ? "s" : ""})...`);
      const newUrls = await Promise.all(
        mediaFiles.tour360.map(async (file, i) => {
          const path = `${propertyId}/360/${Date.now()}_${i}_${file.name}`;
          const { error: e } = await bucket.upload(path, file, { upsert: true });
          if (e) return null;
          return bucket.getPublicUrl(path).data.publicUrl;
        })
      );
      tour360Urls = [...tour360Urls, ...(newUrls.filter(Boolean) as string[])];
    }

    if (mediaFiles.video) {
      setUploadMsg("Enviando vídeo...");
      const path = `${propertyId}/video/${mediaFiles.video.name}`;
      const { error: e } = await bucket.upload(path, mediaFiles.video, { upsert: true });
      if (!e) videoUrl = bucket.getPublicUrl(path).data.publicUrl;
    }

    return { imageUrl, galleryUrls, tour360Urls, videoUrl };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const propertyId = initial?.id ?? crypto.randomUUID();
      const { imageUrl, galleryUrls, tour360Urls, videoUrl } = await uploadToStorage(propertyId);

      setUploadMsg("Salvando imóvel...");

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
        image_url:    imageUrl,
        gallery_urls: galleryUrls.length  > 0 ? galleryUrls  : null,
        tour360_urls: tour360Urls.length  > 0 ? tour360Urls  : null,
        video_url:    videoUrl,
        status:       form.status,
      };

      let err;
      if (initial) {
        ({ error: err } = await supabase.from("properties").update(payload).eq("id", initial.id));
      } else {
        ({ error: err } = await supabase.from("properties").insert({ id: propertyId, ...payload, created_by: user?.id }));
      }

      if (err) { setError(err.message); setSaving(false); setUploadMsg(""); return; }
      onSaved();
    } catch {
      setError("Erro ao fazer upload das mídias. Verifique o bucket 'properties' no Supabase.");
      setSaving(false);
      setUploadMsg("");
    }
  };

  const mediaDropClass = "flex items-center gap-3 w-full border-2 border-dashed border-brand-blue/10 rounded-xl px-4 py-3 cursor-pointer hover:border-brand-accent/30 hover:bg-white transition-colors bg-brand-slate";

  return (
    <motion.div
      key="form-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-brand-blue/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Modal header */}
        <div className="sticky top-0 bg-white border-b border-brand-blue/5 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="text-brand-blue font-black text-lg" style={{ fontFamily: "var(--font-heading)" }}>
            {initial ? "Editar Imóvel" : "Novo Imóvel"}
          </h2>
          <button onClick={onClose} className="p-2 text-brand-blue/30 hover:text-brand-blue/60 transition-colors rounded-xl">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Tipo + Status */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <select value={form.type} onChange={set("type")} className={selectClass}>
                {PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={set("status")} className={selectClass}>
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
              </select>
            </FormField>
          </div>

          {/* Título */}
          <FormField label="Título *">
            <input required type="text" value={form.title} onChange={set("title")}
              placeholder="Ex: Cobertura Duplex Frente Mar" className={inputClass} />
          </FormField>

          {/* Localização */}
          <FormField label="Localização *">
            <input required type="text" value={form.location} onChange={set("location")}
              placeholder="Ex: Gávea - Rio de Janeiro/RJ" className={inputClass} />
          </FormField>

          {/* Bairro + Cidade + Estado */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Bairro">
              <input type="text" value={form.neighborhood} onChange={set("neighborhood")}
                placeholder="Gávea" className={inputClass} />
            </FormField>
            <FormField label="Cidade">
              <input type="text" value={form.city} onChange={set("city")}
                placeholder="Rio de Janeiro" className={inputClass} />
            </FormField>
            <FormField label="Estado">
              <input type="text" value={form.state} onChange={set("state")}
                placeholder="RJ" maxLength={2} className={inputClass} />
            </FormField>
          </div>

          {/* Preço + Área */}
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Preço">
              <input type="text" value={form.price} onChange={set("price")}
                placeholder="Ex: R$ 4.500.000" className={inputClass} />
            </FormField>
            <FormField label="Área (m²)">
              <input type="number" min={0} value={form.area} onChange={set("area")}
                placeholder="302" className={inputClass} />
            </FormField>
          </div>

          {/* Quartos + Banheiros + Vagas + Suítes */}
          <div className="grid grid-cols-4 gap-3">
            {([
              ["Quartos",   "bedrooms",  "3"],
              ["Banheiros", "bathrooms", "4"],
              ["Vagas",     "parking",   "2"],
              ["Suítes",    "suites",    "2"],
            ] as [string, keyof typeof form, string][]).map(([label, key, ph]) => (
              <FormField key={key} label={label}>
                <input type="number" min={0} value={form[key]} onChange={set(key)}
                  placeholder={ph} className={inputClass} />
              </FormField>
            ))}
          </div>

          {/* Descrição */}
          <FormField label="Descrição">
            <textarea value={form.description} onChange={set("description")}
              rows={4} placeholder="Descreva os diferenciais do imóvel..."
              className={cn(inputClass, "resize-none")} />
          </FormField>

          {/* ── Mídia ───────────────────────────────────────── */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-brand-blue/5" />
            <span className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/25"
              style={{ fontFamily: "var(--font-heading)" }}>Mídia</span>
            <div className="flex-1 h-px bg-brand-blue/5" />
          </div>

          {/* Foto principal */}
          <FormField label="Foto Principal">
            <label className={mediaDropClass}>
              <input type="file" accept="image/*" className="hidden"
                onChange={e => setMediaFiles(p => ({ ...p, mainImage: e.target.files?.[0] ?? null }))} />
              <Upload size={14} className="text-brand-blue/30 flex-shrink-0" />
              <span className="text-xs text-brand-blue/45 truncate">
                {mediaFiles.mainImage ? mediaFiles.mainImage.name : "Selecionar imagem principal"}
              </span>
            </label>
            <input type="url" value={form.image_url} onChange={set("image_url")}
              placeholder="Ou cole uma URL de imagem..."
              className={cn(inputClass, "mt-2 text-xs")} />
          </FormField>

          {/* Galeria */}
          <FormField label={`Galeria de Fotos${initial?.gallery_urls?.length ? ` · ${initial.gallery_urls.length} existente${initial.gallery_urls.length !== 1 ? "s" : ""}` : ""}`}>
            <label className={mediaDropClass}>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => setMediaFiles(p => ({ ...p, gallery: Array.from(e.target.files ?? []) }))} />
              <Upload size={14} className="text-brand-blue/30 flex-shrink-0" />
              <span className="text-xs text-brand-blue/45">
                {mediaFiles.gallery.length > 0
                  ? `${mediaFiles.gallery.length} foto${mediaFiles.gallery.length !== 1 ? "s" : ""} selecionada${mediaFiles.gallery.length !== 1 ? "s" : ""}`
                  : "Selecionar fotos da galeria"}
              </span>
            </label>
          </FormField>

          {/* Tour 360 */}
          <FormField label={`Tour Virtual 360°${initial?.tour360_urls?.length ? ` · ${initial.tour360_urls.length} existente${initial.tour360_urls.length !== 1 ? "s" : ""}` : ""}`}>
            <label className={mediaDropClass}>
              <input type="file" accept="image/*" multiple className="hidden"
                onChange={e => setMediaFiles(p => ({ ...p, tour360: Array.from(e.target.files ?? []) }))} />
              <Upload size={14} className="text-brand-blue/30 flex-shrink-0" />
              <span className="text-xs text-brand-blue/45">
                {mediaFiles.tour360.length > 0
                  ? `${mediaFiles.tour360.length} foto${mediaFiles.tour360.length !== 1 ? "s" : ""} 360° selecionada${mediaFiles.tour360.length !== 1 ? "s" : ""}`
                  : "Selecionar fotos panorâmicas 360°"}
              </span>
            </label>
          </FormField>

          {/* Vídeo */}
          <FormField label={`Vídeo do Imóvel${initial?.video_url ? " · 1 existente" : ""}`}>
            <label className={mediaDropClass}>
              <input type="file" accept="video/*" className="hidden"
                onChange={e => setMediaFiles(p => ({ ...p, video: e.target.files?.[0] ?? null }))} />
              <Upload size={14} className="text-brand-blue/30 flex-shrink-0" />
              <span className="text-xs text-brand-blue/45 truncate">
                {mediaFiles.video ? mediaFiles.video.name : "Selecionar vídeo do imóvel"}
              </span>
            </label>
          </FormField>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-brand-blue/10 text-brand-blue/50 hover:text-brand-blue/70 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              style={{ fontFamily: "var(--font-heading)" }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={saving}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-blue text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400 disabled:opacity-50"
              style={{ fontFamily: "var(--font-heading)" }}>
              {saving
                ? <><Loader2 size={14} className="animate-spin" />{uploadMsg || "Salvando..."}</>
                : "Salvar Imóvel"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Shared sub-components ─────────────────────────────────────

function TabBtn({ active, onClick, icon: Icon, children }: {
  active: boolean; onClick: () => void; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all duration-300",
        active ? "bg-white shadow text-brand-blue" : "text-brand-blue/40 hover:text-brand-blue/60"
      )}
      style={{ fontFamily: "var(--font-heading)" }}>
      <Icon size={14} />{children}
    </button>
  );
}

function Section({ title, count, accent, icon: Icon, empty, children }: {
  title: string; count: number; accent: string; icon: React.ElementType;
  empty: string; children: React.ReactNode;
}) {
  const accentColor = accent === "amber"  ? "text-amber-500 bg-amber-50 border-amber-200"
                    : accent === "brand"  ? "text-brand-accent bg-brand-accent/8 border-brand-accent/20"
                    : "text-gray-400 bg-gray-50 border-gray-200";
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold", accentColor)}>
          <Icon size={13} />{title}
        </div>
        <span className="text-brand-blue/30 text-xs font-mono">{count}</span>
      </div>
      {count === 0
        ? <EmptyState message={empty} />
        : <div className="space-y-3">{children}</div>
      }
    </div>
  );
}

function UserCard({ profile, busy, children }: {
  profile: DBProfile; busy: boolean; children: React.ReactNode;
}) {
  const Icon = ROLE_ICON[profile.role];
  return (
    <div className={cn(
      "bg-white rounded-2xl border border-brand-blue/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm",
      busy && "opacity-60 pointer-events-none"
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-slate flex items-center justify-center flex-shrink-0">
          <Icon size={18} className="text-brand-blue/40" />
        </div>
        <div>
          <p className="text-brand-blue font-bold text-sm">{profile.full_name ?? "—"}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-brand-blue/35 text-[10px] uppercase tracking-widest"
              style={{ fontFamily: "var(--font-heading)" }}>{ROLE_LABEL[profile.role]}</span>
            <span className="text-brand-blue/20 text-[10px]">·</span>
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              profile.status === "active"  && "text-emerald-500",
              profile.status === "pending" && "text-amber-500",
              profile.status === "revoked" && "text-red-400",
            )}>{STATUS_LABEL[profile.status]}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {busy ? <Loader2 size={16} className="animate-spin text-brand-blue/40" /> : children}
      </div>
    </div>
  );
}

function ActionBtn({ color, icon: Icon, onClick, disabled, children }: {
  color: "green" | "red"; icon: React.ElementType;
  onClick: () => void; disabled: boolean; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-200 disabled:opacity-50",
        color === "green"
          ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
          : "border-red-200 text-red-500 hover:bg-red-50"
      )}
      style={{ fontFamily: "var(--font-heading)" }}>
      <Icon size={12} />{children}
    </button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/38 mb-1.5 block"
        style={{ fontFamily: "var(--font-heading)" }}>{label}</label>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-brand-blue/25">
      <ChevronRight size={24} className="mb-2" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex justify-center py-16">
      <div className="flex gap-1.5">
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" />
      </div>
    </div>
  );
}

const inputClass  = "w-full bg-brand-slate border border-brand-blue/6 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent/30 transition-all placeholder:text-brand-blue/22";
const selectClass = "w-full bg-brand-slate border border-brand-blue/6 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all appearance-none cursor-pointer";
