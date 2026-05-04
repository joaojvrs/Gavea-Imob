import { useState, useCallback, useRef } from "react";
import { Upload, X, Star, ArrowUp, ArrowDown, Loader2, Film, Image as ImgIcon } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

export interface MediaItem {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail_url?: string;
  order_index: number;
  is_cover: boolean;
}

interface MediaManagerProps {
  propertyId: string;
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

export default function MediaManager({ propertyId, items, onChange }: MediaManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const photos = items.filter(i => i.type === "photo").sort((a, b) => a.order_index - b.order_index);
  const videos = items.filter(i => i.type === "video").sort((a, b) => a.order_index - b.order_index);

  const uploadFiles = useCallback(async (files: File[], type: "photo" | "video") => {
    setUploading(true);
    const newItems: MediaItem[] = [];
    const bucket = supabase.storage.from("properties");
    const base = type === "photo" ? "gallery" : "video";
    const existingOfType = items.filter(i => i.type === type);

    for (let i = 0; i < files.length; i++) {
      setUploadMsg(`Enviando ${i + 1}/${files.length}...`);
      const path = `${propertyId}/${base}/${Date.now()}_${i}_${files[i].name}`;
      const { error } = await bucket.upload(path, files[i], { upsert: true });
      if (error) continue;
      const url = bucket.getPublicUrl(path).data.publicUrl;
      const { data } = await supabase.from("property_media").insert({
        property_id: propertyId,
        type,
        url,
        order_index: existingOfType.length + i,
        is_cover: type === "photo" && existingOfType.length === 0 && i === 0,
      }).select().single();
      if (data) newItems.push(data as MediaItem);
    }

    onChange([...items, ...newItems]);
    setUploading(false);
    setUploadMsg("");
  }, [propertyId, items, onChange]);

  const setCover = useCallback(async (id: string) => {
    await supabase.from("property_media")
      .update({ is_cover: false })
      .eq("property_id", propertyId).eq("type", "photo");
    await supabase.from("property_media")
      .update({ is_cover: true }).eq("id", id);
    onChange(items.map(it => ({ ...it, is_cover: it.id === id && it.type === "photo" })));
  }, [propertyId, items, onChange]);

  const remove = useCallback(async (id: string) => {
    await supabase.from("property_media").delete().eq("id", id);
    const next = items.filter(it => it.id !== id);
    onChange(next);
  }, [items, onChange]);

  const reorder = useCallback(async (id: string, dir: -1 | 1) => {
    const type = items.find(i => i.id === id)?.type;
    const group = items.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);
    const idx = group.findIndex(i => i.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= group.length) return;
    const a = group[idx], b = group[swapIdx];
    await Promise.all([
      supabase.from("property_media").update({ order_index: b.order_index }).eq("id", a.id),
      supabase.from("property_media").update({ order_index: a.order_index }).eq("id", b.id),
    ]);
    onChange(items.map(it => {
      if (it.id === a.id) return { ...it, order_index: b.order_index };
      if (it.id === b.id) return { ...it, order_index: a.order_index };
      return it;
    }));
  }, [items, onChange]);

  return (
    <div className="space-y-6">
      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/40 flex items-center gap-1.5">
            <ImgIcon size={11} /> Fotos
            <span className="font-mono text-brand-blue/25 ml-1">({photos.length})</span>
          </span>
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:text-brand-blue transition-colors disabled:opacity-40"
          >
            <Upload size={11} /> Adicionar
          </button>
          <input ref={photoRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadFiles(f, "photo"); e.target.value = ""; }} />
        </div>

        {photos.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-blue/10 rounded-2xl py-8 cursor-pointer hover:border-brand-accent/30 hover:bg-brand-slate/50 transition-all">
            <input type="file" accept="image/*" multiple className="hidden"
              onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadFiles(f, "photo"); e.target.value = ""; }} />
            <ImgIcon size={22} className="text-brand-blue/20" />
            <span className="text-xs text-brand-blue/30">Arraste fotos ou clique para selecionar</span>
          </label>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((item, idx) => (
              <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-brand-slate border border-brand-blue/5">
                <img src={item.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                {item.is_cover && (
                  <span className="absolute top-1.5 left-1.5 bg-brand-accent text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                    Capa
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                  {!item.is_cover && (
                    <button type="button" onClick={() => setCover(item.id)}
                      title="Definir como capa"
                      className="p-1.5 bg-brand-accent rounded-full text-white hover:scale-110 transition-transform">
                      <Star size={10} />
                    </button>
                  )}
                  <button type="button" onClick={() => reorder(item.id, -1)} disabled={idx === 0}
                    className="p-1.5 bg-white/20 rounded-full text-white hover:scale-110 transition-transform disabled:opacity-30">
                    <ArrowUp size={10} />
                  </button>
                  <button type="button" onClick={() => reorder(item.id, 1)} disabled={idx === photos.length - 1}
                    className="p-1.5 bg-white/20 rounded-full text-white hover:scale-110 transition-transform disabled:opacity-30">
                    <ArrowDown size={10} />
                  </button>
                  <button type="button" onClick={() => remove(item.id)}
                    className="p-1.5 bg-red-500 rounded-full text-white hover:scale-110 transition-transform">
                    <X size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-brand-blue/40 flex items-center gap-1.5">
            <Film size={11} /> Vídeo
            <span className="font-mono text-brand-blue/25 ml-1">({videos.length})</span>
          </span>
          {videos.length === 0 && (
            <button type="button" onClick={() => videoRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-brand-accent hover:text-brand-blue transition-colors disabled:opacity-40">
              <Upload size={11} /> Adicionar
            </button>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadFiles(f, "video"); e.target.value = ""; }} />
        </div>

        {videos.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-brand-blue/10 rounded-2xl py-6 cursor-pointer hover:border-brand-accent/30 hover:bg-brand-slate/50 transition-all">
            <input type="file" accept="video/*" className="hidden"
              onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) uploadFiles(f, "video"); e.target.value = ""; }} />
            <Film size={22} className="text-brand-blue/20" />
            <span className="text-xs text-brand-blue/30">Selecionar vídeo do imóvel</span>
          </label>
        ) : (
          <div className="space-y-2">
            {videos.map(v => (
              <div key={v.id} className="flex items-center gap-3 bg-brand-slate rounded-xl px-4 py-3 border border-brand-blue/5">
                <Film size={16} className="text-brand-blue/40 flex-shrink-0" />
                <span className="text-xs text-brand-blue/60 truncate flex-1">{v.url.split("/").pop()}</span>
                <button type="button" onClick={() => remove(v.id)}
                  className="text-red-400 hover:text-red-600 transition-colors p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-xs text-brand-blue/50">
          <Loader2 size={12} className="animate-spin" />
          {uploadMsg}
        </div>
      )}
    </div>
  );
}
