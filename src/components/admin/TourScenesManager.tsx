import { useState, useRef, useCallback } from "react";
import { Upload, X, Plus, Loader2, Crosshair, ArrowUp, ArrowDown, ChevronRight, AlertCircle } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

export interface TourHotspotDB {
  yaw: number;
  pitch: number;
  target_media_id: string;
  label: string;
}

export interface TourSceneItem {
  id: string;
  url: string;
  order_index: number;
  metadata: {
    room_name?: string;
    hotspots?: TourHotspotDB[];
  };
}

interface TourScenesManagerProps {
  propertyId: string;
  scenes: TourSceneItem[];
  onChange: (scenes: TourSceneItem[]) => void;
  roomSuggestions?: string[];
}

// ── Hotspot editor overlay ────────────────────────────────────

interface HotspotEditorProps {
  scene: TourSceneItem;
  allScenes: TourSceneItem[];
  onClose: () => void;
  onSave: (hotspots: TourHotspotDB[]) => void;
}

function HotspotEditor({ scene, allScenes, onClose, onSave }: HotspotEditorProps) {
  const [hotspots, setHotspots] = useState<TourHotspotDB[]>(scene.metadata.hotspots ?? []);
  const [selected, setSelected] = useState<number | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);
  const otherScenes = allScenes.filter(s => s.id !== scene.id);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const yaw   = Math.round(relX * 360);
    const pitch = Math.round(90 - relY * 180);
    const defaultTarget = otherScenes[0]?.id ?? "";
    const next = [...hotspots, { yaw, pitch, target_media_id: defaultTarget, label: "" }];
    setHotspots(next);
    setSelected(next.length - 1);
  }, [hotspots, otherScenes]);

  const update = (idx: number, patch: Partial<TourHotspotDB>) =>
    setHotspots(h => h.map((hs, i) => i === idx ? { ...hs, ...patch } : hs));

  const remove = (idx: number) => {
    setHotspots(h => h.filter((_, i) => i !== idx));
    setSelected(null);
  };

  const toImagePos = (yaw: number, pitch: number) => ({
    x: (yaw / 360) * 100,
    y: ((90 - pitch) / 180) * 100,
  });

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-brand-blue/5 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <h3 className="font-black text-brand-blue text-base">Editor de Setas</h3>
            <p className="text-xs text-brand-blue/40 mt-0.5">
              {scene.metadata.room_name ?? "Cena sem nome"} · Clique na imagem para adicionar seta de navegação
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-brand-blue/30 hover:text-brand-blue/60 rounded-xl">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div
            ref={imgRef}
            className="relative w-full rounded-2xl overflow-hidden cursor-crosshair border border-brand-blue/10 select-none"
            onClick={handleImageClick}
          >
            <img src={scene.url} alt="" className="w-full object-cover pointer-events-none" draggable={false} />
            {hotspots.map((h, i) => {
              const pos = toImagePos(h.yaw, h.pitch);
              return (
                <button key={i} type="button"
                  onClick={e => { e.stopPropagation(); setSelected(i === selected ? null : i); }}
                  className={cn(
                    "absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all",
                    i === selected
                      ? "bg-brand-accent border-white text-white scale-125 shadow-lg"
                      : "bg-white/80 border-brand-accent text-brand-accent hover:scale-110 shadow-md"
                  )}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  {i + 1}
                </button>
              );
            })}
            {hotspots.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2">
                  <Crosshair size={12} /> Clique para posicionar seta
                </div>
              </div>
            )}
          </div>

          {hotspots.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/40">
                Setas ({hotspots.length})
              </p>
              {hotspots.map((h, i) => (
                <div key={i} className={cn(
                  "border rounded-2xl p-4 space-y-3 transition-all",
                  i === selected ? "border-brand-accent/30 bg-brand-accent/5" : "border-brand-blue/8 bg-brand-slate"
                )}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-brand-accent text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-xs text-brand-blue/50 font-mono">Yaw {h.yaw}° · Pitch {h.pitch}°</span>
                    <button type="button" onClick={() => remove(i)} className="ml-auto text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Destino</label>
                      <select value={h.target_media_id} onChange={e => update(i, { target_media_id: e.target.value })}
                        className="w-full bg-white border border-brand-blue/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20">
                        <option value="">Selecionar cena...</option>
                        {otherScenes.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.metadata.room_name ?? `Foto ${allScenes.findIndex(a => a.id === s.id) + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Label</label>
                      <input type="text" value={h.label} onChange={e => update(i, { label: e.target.value })}
                        placeholder="Ex: Entrar na Cozinha"
                        className="w-full bg-white border border-brand-blue/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 placeholder:text-brand-blue/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Yaw (0–360°)</label>
                      <input type="range" min={0} max={360} value={h.yaw}
                        onChange={e => update(i, { yaw: Number(e.target.value) })}
                        className="w-full accent-brand-accent" />
                      <span className="text-[9px] text-brand-blue/40 font-mono">{h.yaw}°</span>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Pitch (−60 a 60°)</label>
                      <input type="range" min={-60} max={60} value={h.pitch}
                        onChange={e => update(i, { pitch: Number(e.target.value) })}
                        className="w-full accent-brand-accent" />
                      <span className="text-[9px] text-brand-blue/40 font-mono">{h.pitch}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-brand-blue/10 text-brand-blue/50 hover:text-brand-blue/70 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
              Cancelar
            </button>
            <button type="button" onClick={() => { onSave(hotspots); onClose(); }}
              className="flex-1 bg-brand-blue text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400">
              Salvar Setas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

const DATALIST_ID = "room-suggestions";

export default function TourScenesManager({ propertyId, scenes, onChange, roomSuggestions }: TourScenesManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [editingScene, setEditingScene] = useState<TourSceneItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sorted = [...scenes].sort((a, b) => a.order_index - b.order_index);
  const unnamed = sorted.filter(s => !s.metadata.room_name?.trim());

  const uploadScenes = useCallback(async (files: File[]) => {
    setUploading(true);
    const bucket = supabase.storage.from("properties");
    const newScenes: TourSceneItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const path = `${propertyId}/tour360/${Date.now()}_${i}_${files[i].name}`;
      const { error } = await bucket.upload(path, files[i], { upsert: true });
      if (error) continue;
      const url = bucket.getPublicUrl(path).data.publicUrl;
      const metadata = { room_name: "", hotspots: [] };
      const { data } = await supabase.from("property_media").insert({
        property_id: propertyId, type: "tour_360", url,
        order_index: scenes.length + i, metadata,
      }).select().single();
      if (data) newScenes.push(data as TourSceneItem);
    }

    onChange([...scenes, ...newScenes]);
    setUploading(false);
  }, [propertyId, scenes, onChange]);

  const updateRoomName = useCallback(async (id: string, room_name: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;
    const newMeta = { ...scene.metadata, room_name };
    await supabase.from("property_media").update({ metadata: newMeta }).eq("id", id);
    onChange(scenes.map(s => s.id === id ? { ...s, metadata: newMeta } : s));
  }, [scenes, onChange]);

  const saveHotspots = useCallback(async (id: string, hotspots: TourHotspotDB[]) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;
    const newMeta = { ...scene.metadata, hotspots };
    await supabase.from("property_media").update({ metadata: newMeta }).eq("id", id);
    onChange(scenes.map(s => s.id === id ? { ...s, metadata: newMeta } : s));
  }, [scenes, onChange]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("property_media").delete().eq("id", id);
    onChange(scenes.filter(s => s.id !== id));
  }, [scenes, onChange]);

  const reorder = useCallback(async (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex(s => s.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from("property_media").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("property_media").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    onChange(scenes.map(s => {
      if (s.id === a.id) return { ...s, order_index: b.order_index };
      if (s.id === b.id) return { ...s, order_index: a.order_index };
      return s;
    }));
  }, [sorted, scenes, onChange]);

  return (
    <div className="space-y-4">
      {/* Suggestions datalist */}
      {roomSuggestions && roomSuggestions.length > 0 && (
        <datalist id={DATALIST_ID}>
          {roomSuggestions.map(s => <option key={s} value={s} />)}
        </datalist>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-brand-blue/60">
            {sorted.length} foto{sorted.length !== 1 ? "s" : ""} · navegação sequencial
          </p>
          {unnamed.length > 0 && (
            <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-0.5">
              <AlertCircle size={10} />
              {unnamed.length} foto{unnamed.length !== 1 ? "s" : ""} sem ambiente definido
            </p>
          )}
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:text-brand-blue transition-colors disabled:opacity-40">
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
          {uploading ? "Enviando..." : "Adicionar fotos"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadScenes(f); e.target.value = ""; }} />
      </div>

      {sorted.length === 0 ? (
        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-brand-blue/10 rounded-2xl py-12 cursor-pointer hover:border-brand-accent/30 hover:bg-brand-slate/50 transition-all">
          <input type="file" accept="image/*" multiple className="hidden"
            onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadScenes(f); e.target.value = ""; }} />
          <Upload size={24} className="text-brand-blue/20" />
          <span className="text-sm font-medium text-brand-blue/30">Upload das fotos 360°</span>
          <span className="text-xs text-brand-blue/20">JPG · Formato equiretangular · múltiplos arquivos</span>
        </label>
      ) : (
        <div className="space-y-1">
          {sorted.map((scene, idx) => {
            const hasName = !!scene.metadata.room_name?.trim();
            const hasHotspots = (scene.metadata.hotspots?.length ?? 0) > 0;
            const isLast = idx === sorted.length - 1;

            return (
              <div key={scene.id}>
                {/* Scene card */}
                <div className={cn(
                  "group flex items-center gap-3 rounded-2xl p-3 border transition-all",
                  hasName
                    ? "bg-brand-slate border-brand-blue/5"
                    : "bg-amber-50/60 border-amber-200/60"
                )}>
                  {/* Number badge */}
                  <div className="relative flex-shrink-0">
                    <div className="w-16 h-11 rounded-xl overflow-hidden bg-brand-blue/10">
                      <img src={scene.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-brand-blue text-white text-[9px] font-bold flex items-center justify-center shadow">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Room name input — required */}
                  <div className="flex-1 min-w-0">
                    <label className="text-[8px] uppercase tracking-widest font-bold text-brand-blue/30 flex items-center gap-1 mb-0.5">
                      Ambiente <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      list={roomSuggestions?.length ? DATALIST_ID : undefined}
                      value={scene.metadata.room_name ?? ""}
                      onChange={e => updateRoomName(scene.id, e.target.value)}
                      placeholder="Ex: Sala de Estar, Suíte Master..."
                      className={cn(
                        "w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-brand-blue/20 transition-colors",
                        hasName ? "text-brand-blue" : "text-amber-700 placeholder:text-amber-400/60"
                      )}
                    />
                  </div>

                  {/* Hotspot badge */}
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0 whitespace-nowrap",
                    hasHotspots ? "bg-brand-accent/10 text-brand-accent" : "bg-brand-blue/5 text-brand-blue/25"
                  )}>
                    {hasHotspots ? `${scene.metadata.hotspots!.length} seta${scene.metadata.hotspots!.length !== 1 ? "s" : ""}` : "sem setas"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button type="button" title="Editar setas de navegação" onClick={() => setEditingScene(scene)}
                      className="p-1.5 text-brand-blue/40 hover:text-brand-accent rounded-lg transition-colors">
                      <Crosshair size={13} />
                    </button>
                    <button type="button" onClick={() => reorder(scene.id, -1)} disabled={idx === 0}
                      className="p-1.5 text-brand-blue/30 hover:text-brand-blue/60 rounded-lg transition-colors disabled:opacity-20">
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" onClick={() => reorder(scene.id, 1)} disabled={isLast}
                      className="p-1.5 text-brand-blue/30 hover:text-brand-blue/60 rounded-lg transition-colors disabled:opacity-20">
                      <ArrowDown size={13} />
                    </button>
                    <button type="button" onClick={() => remove(scene.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 rounded-lg transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                </div>

                {/* Sequential connector */}
                {!isLast && (
                  <div className="flex items-center gap-2 px-5 py-1">
                    <div className="w-px h-4 bg-brand-blue/10 mx-2" />
                    <ChevronRight size={10} className="text-brand-blue/20" />
                    <span className="text-[9px] text-brand-blue/20 font-mono">
                      {sorted[idx + 1]?.metadata.room_name || `Foto ${idx + 2}`}
                    </span>
                  </div>
                )}

                {/* Last scene loops back */}
                {isLast && sorted.length > 1 && (
                  <div className="flex items-center gap-2 px-5 py-1">
                    <div className="w-px h-3 bg-brand-blue/10 mx-2" />
                    <span className="text-[9px] text-brand-blue/15 font-mono italic">↻ retorna ao início</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Validation warning */}
      {unnamed.length > 0 && sorted.length > 0 && (
        <div className="bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            Preencha o campo <strong>Ambiente</strong> em todas as fotos antes de publicar.
            {roomSuggestions?.length ? " Sugestões baseadas nos dados do imóvel estão disponíveis ao digitar." : ""}
          </p>
        </div>
      )}

      {/* Hotspot tip */}
      {sorted.length > 0 && unnamed.length === 0 && (
        <div className="bg-brand-slate border border-brand-blue/5 rounded-2xl px-4 py-3 text-xs text-brand-blue/40 leading-relaxed">
          Setas de navegação são opcionais — o visitante já pode navegar pelos pontos na parte inferior do tour.
          Use setas para criar atalhos entre ambientes não adjacentes.
        </div>
      )}

      {editingScene && (
        <HotspotEditor
          scene={editingScene}
          allScenes={sorted}
          onClose={() => setEditingScene(null)}
          onSave={hotspots => saveHotspots(editingScene.id, hotspots)}
        />
      )}
    </div>
  );
}
