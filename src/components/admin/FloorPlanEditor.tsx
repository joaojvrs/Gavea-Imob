import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Trash2, Check, Image as ImgIcon, PenTool, Loader2, X, Wand2, RotateCcw } from "lucide-react";
import { supabase } from "@/src/lib/supabase";
import { cn } from "@/src/lib/utils";

export interface PlanRoom {
  id: string;
  x: number; y: number;
  w: number; h: number;
  name: string;
  area: string;
}

export interface FloorPlanData {
  id?: string;
  type: "image" | "vector";
  image_url?: string;
  plan_data?: { rooms: PlanRoom[]; viewBox: string };
}

interface AutoGenSpecs {
  bedrooms: number;
  suites: number;
  bathrooms: number;
}

interface FloorPlanEditorProps {
  propertyId: string;
  value: FloorPlanData | null;
  onChange: (plan: FloorPlanData | null) => void;
  autoGenSpecs?: AutoGenSpecs;
}

// ── Layout generator ──────────────────────────────────────────

function generateLayout(specs: AutoGenSpecs): PlanRoom[] {
  const rooms: PlanRoom[] = [];
  const uid = () => crypto.randomUUID();
  const M = 20;

  // Left (social) zone
  const sX = M, sW = 205;
  rooms.push({ id: uid(), x: sX, y: M,       w: sW,  h: 160, name: "Sala de Estar",  area: "" });
  rooms.push({ id: uid(), x: sX, y: M + 165, w: 100, h: 115, name: "Sala de Jantar", area: "" });
  rooms.push({ id: uid(), x: sX + 105, y: M + 165, w: 100, h: 115, name: "Cozinha", area: "" });

  // Social bathrooms
  const socialBaths = Math.max(0, specs.bathrooms - specs.suites);
  if (socialBaths >= 1) {
    const bW = socialBaths >= 2 ? 100 : sW;
    rooms.push({ id: uid(), x: sX, y: M + 285, w: bW, h: 80, name: "Banheiro Social", area: "" });
    if (socialBaths >= 2) {
      rooms.push({ id: uid(), x: sX + 105, y: M + 285, w: 100, h: 80, name: "Lavabo", area: "" });
    }
  }

  // Corridor
  const cX = sX + sW + 10, cW = 35;
  rooms.push({ id: uid(), x: cX, y: M, w: cW, h: 510, name: "Corredor", area: "" });

  // Right (private) zone
  const pX = cX + cW + 10;
  const pW = 800 - pX - M;
  const bCount = Math.max(specs.bedrooms, 1);
  const bH = Math.floor(510 / bCount);
  const sBathW = 75;

  for (let i = 0; i < bCount; i++) {
    const isSuite = i < specs.suites;
    const bY = M + i * bH;
    const bRoomW = isSuite ? pW - sBathW - 5 : pW;
    const name = isSuite
      ? (specs.suites === 1 ? "Suíte Master" : `Suíte ${i + 1}`)
      : `Quarto ${i - specs.suites + 1}`;
    rooms.push({ id: uid(), x: pX, y: bY, w: bRoomW, h: bH - 5, name, area: "" });
    if (isSuite) {
      const sName = specs.suites === 1 ? "Banheiro Suíte" : `Banheiro Suíte ${i + 1}`;
      rooms.push({ id: uid(), x: pX + bRoomW + 5, y: bY, w: sBathW, h: bH - 5, name: sName, area: "" });
    }
  }

  return rooms;
}

// ── SVG Room Drawer ───────────────────────────────────────────

const VB_W = 800, VB_H = 550;

interface RoomDrawerProps {
  rooms: PlanRoom[];
  onChange: (rooms: PlanRoom[]) => void;
}

function RoomDrawer({ rooms, onChange }: RoomDrawerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const svgPoint = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const t = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: Math.round(t.x), y: Math.round(t.y) };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).closest("[data-room]")) return;
    e.preventDefault();
    const pt = svgPoint(e);
    setDrawing(pt);
    setCurrent({ ...pt, w: 0, h: 0 });
    setSelected(null);
  }, [svgPoint]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawing) return;
    const pt = svgPoint(e);
    setCurrent({
      x: Math.min(drawing.x, pt.x),
      y: Math.min(drawing.y, pt.y),
      w: Math.abs(pt.x - drawing.x),
      h: Math.abs(pt.y - drawing.y),
    });
  }, [drawing, svgPoint]);

  const onMouseUp = useCallback(() => {
    if (!current || current.w < 20 || current.h < 20) {
      setDrawing(null); setCurrent(null); return;
    }
    const newRoom: PlanRoom = {
      id: crypto.randomUUID(), ...current,
      name: `Ambiente ${rooms.length + 1}`, area: "",
    };
    onChange([...rooms, newRoom]);
    setSelected(newRoom.id);
    setDrawing(null); setCurrent(null);
  }, [current, rooms, onChange]);

  const updateRoom = (id: string, patch: Partial<PlanRoom>) =>
    onChange(rooms.map(r => r.id === id ? { ...r, ...patch } : r));

  const deleteRoom = (id: string) => {
    onChange(rooms.filter(r => r.id !== id));
    setSelected(null);
  };

  const sel = rooms.find(r => r.id === selected);

  return (
    <div className="space-y-4">
      {rooms.length > 0 ? (
        <div className="text-xs text-brand-accent bg-brand-accent/5 border border-brand-accent/15 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <PenTool size={12} className="text-brand-accent flex-shrink-0" />
          Clique em qualquer cômodo para editar nome e metragem · Arraste na área em branco para criar novos cômodos
        </div>
      ) : (
        <div className="text-xs text-brand-blue/40 bg-brand-slate rounded-xl px-4 py-2.5 flex items-center gap-2">
          <PenTool size={12} className="text-brand-accent" />
          Clique e arraste na área branca para desenhar um cômodo · Clique num cômodo para editá-lo
        </div>
      )}

      <div className="border border-brand-blue/10 rounded-2xl overflow-hidden bg-white">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="w-full select-none cursor-crosshair"
          style={{ maxHeight: 360 }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={VB_W} height={VB_H} fill="url(#grid)" />

          {rooms.map(r => (
            <g key={r.id} data-room={r.id} onClick={e => { e.stopPropagation(); setSelected(r.id); }}>
              <rect
                x={r.x} y={r.y} width={r.w} height={r.h}
                fill={r.id === selected ? "rgba(212,165,116,0.18)" : "rgba(10,37,64,0.06)"}
                stroke={r.id === selected ? "#D4A574" : "#0A2540"}
                strokeWidth={r.id === selected ? 2 : 1}
                rx={4}
                className="cursor-pointer hover:fill-brand-accent/10 transition-colors"
              />
              <text
                x={r.x + r.w / 2} y={r.y + r.h / 2 - (r.area ? 6 : 0)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.min(13, r.w / 8, r.h / 4)}
                fill="#0A2540" fontWeight="600" fontFamily="system-ui"
                className="pointer-events-none"
              >
                {r.name}
              </text>
              {r.area && (
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 + 10}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={Math.min(10, r.w / 10, r.h / 5)}
                  fill="#0A254080" fontFamily="monospace"
                  className="pointer-events-none"
                >
                  {r.area}
                </text>
              )}
            </g>
          ))}

          {current && current.w > 5 && current.h > 5 && (
            <rect
              x={current.x} y={current.y} width={current.w} height={current.h}
              fill="rgba(212,165,116,0.12)" stroke="#D4A574" strokeWidth={1.5}
              strokeDasharray="6 3" rx={4}
            />
          )}
        </svg>
      </div>

      {sel && (
        <div className="bg-brand-slate border border-brand-accent/20 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-bold text-brand-accent">
              Editar: {sel.name}
            </span>
            <button type="button" onClick={() => deleteRoom(sel.id)}
              className="text-red-400 hover:text-red-600 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Nome</label>
              <input
                type="text" value={sel.name}
                onChange={e => updateRoom(sel.id, { name: e.target.value })}
                className="w-full bg-white border border-brand-blue/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest font-bold text-brand-blue/35 block mb-1">Metragem</label>
              <input
                type="text" value={sel.area}
                onChange={e => updateRoom(sel.id, { area: e.target.value })}
                placeholder="Ex: 45m²"
                className="w-full bg-white border border-brand-blue/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-accent/20 placeholder:text-brand-blue/20"
              />
            </div>
          </div>
        </div>
      )}

      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rooms.map(r => (
            <span key={r.id}
              onClick={() => setSelected(r.id)}
              className={cn(
                "text-[10px] px-3 py-1 rounded-full border cursor-pointer transition-all",
                r.id === selected
                  ? "bg-brand-accent text-white border-brand-accent"
                  : "bg-white border-brand-blue/10 text-brand-blue/50 hover:border-brand-accent/40"
              )}>
              {r.name}{r.area ? ` · ${r.area}` : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function FloorPlanEditor({ propertyId, value, onChange, autoGenSpecs }: FloorPlanEditorProps) {
  const [mode, setMode] = useState<"image" | "vector">(value?.type ?? "image");
  const [uploading, setUploading] = useState(false);
  const [rooms, setRooms] = useState<PlanRoom[]>(value?.plan_data?.rooms ?? []);
  const [showGenConfirm, setShowGenConfirm] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value?.type === "vector") setRooms(value.plan_data?.rooms ?? []);
  }, [value]);

  const canAutoGen = autoGenSpecs && autoGenSpecs.bedrooms > 0;

  const handleAutoGen = () => {
    if (rooms.length > 0) { setShowGenConfirm(true); return; }
    applyAutoGen();
  };

  const applyAutoGen = () => {
    if (!autoGenSpecs) return;
    setRooms(generateLayout(autoGenSpecs));
    setMode("vector");
    setShowGenConfirm(false);
  };

  const uploadImage = useCallback(async (file: File) => {
    setUploading(true);
    const path = `${propertyId}/floorplan/${Date.now()}_${file.name}`;
    const bucket = supabase.storage.from("properties");
    const { error } = await bucket.upload(path, file, { upsert: true });
    if (error) { setUploading(false); return; }
    const url = bucket.getPublicUrl(path).data.publicUrl;

    if (value?.id) {
      await supabase.from("property_floor_plans").update({ type: "image", image_url: url }).eq("id", value.id);
      onChange({ ...value, type: "image", image_url: url });
    } else {
      const { data } = await supabase.from("property_floor_plans").insert({
        property_id: propertyId, type: "image", image_url: url,
      }).select().single();
      if (data) onChange({ id: (data as FloorPlanData).id, type: "image", image_url: url });
    }
    setUploading(false);
  }, [propertyId, value, onChange]);

  const saveVector = useCallback(async () => {
    const plan_data = { rooms, viewBox: `0 0 ${VB_W} ${VB_H}` };
    if (value?.id) {
      await supabase.from("property_floor_plans").update({ type: "vector", plan_data }).eq("id", value.id);
      onChange({ ...value, type: "vector", plan_data });
    } else {
      const { data } = await supabase.from("property_floor_plans").insert({
        property_id: propertyId, type: "vector", plan_data,
      }).select().single();
      if (data) onChange({ id: (data as FloorPlanData).id, type: "vector", plan_data });
    }
  }, [propertyId, value, rooms, onChange]);

  const clear = useCallback(async () => {
    if (value?.id) await supabase.from("property_floor_plans").delete().eq("id", value.id);
    onChange(null);
    setRooms([]);
  }, [value, onChange]);

  return (
    <div className="space-y-4">
      {/* Mode selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-brand-slate rounded-xl p-1 w-fit">
          {(["image", "vector"] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                mode === m ? "bg-white shadow text-brand-blue" : "text-brand-blue/40 hover:text-brand-blue/60"
              )}>
              {m === "image" ? <><ImgIcon size={11} /> Imagem</> : <><PenTool size={11} /> Desenhar</>}
            </button>
          ))}
        </div>

        {/* Auto-generate button */}
        {canAutoGen && mode === "vector" && (
          <button type="button" onClick={handleAutoGen}
            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-accent hover:text-brand-blue transition-colors bg-brand-accent/8 hover:bg-brand-accent/15 px-3 py-2 rounded-xl">
            <Wand2 size={11} />
            Gerar automático
          </button>
        )}
      </div>

      {/* Auto-gen specs preview */}
      {canAutoGen && mode === "vector" && rooms.length === 0 && (
        <div className="bg-brand-accent/5 border border-brand-accent/15 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-0.5">Planta automática disponível</p>
            <p className="text-xs text-brand-blue/50">
              {autoGenSpecs!.bedrooms} quarto{autoGenSpecs!.bedrooms !== 1 ? "s" : ""}
              {autoGenSpecs!.suites > 0 ? ` · ${autoGenSpecs!.suites} suíte${autoGenSpecs!.suites !== 1 ? "s" : ""}` : ""}
              {autoGenSpecs!.bathrooms > 0 ? ` · ${autoGenSpecs!.bathrooms} banheiro${autoGenSpecs!.bathrooms !== 1 ? "s" : ""}` : ""}
              {" — "} sala, cozinha, corredor e cômodos gerados
            </p>
          </div>
          <button type="button" onClick={applyAutoGen}
            className="flex items-center gap-1.5 bg-brand-accent text-white text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl whitespace-nowrap hover:bg-brand-blue transition-colors">
            <Wand2 size={10} /> Gerar
          </button>
        </div>
      )}

      {/* Confirm overwrite modal */}
      {showGenConfirm && (
        <div className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowGenConfirm(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RotateCcw size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-brand-blue text-sm">Substituir planta atual?</p>
                <p className="text-xs text-brand-blue/40 mt-0.5">Os {rooms.length} cômodos existentes serão apagados.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowGenConfirm(false)}
                className="flex-1 border border-brand-blue/10 text-brand-blue/50 py-3 rounded-xl text-xs font-bold uppercase tracking-widest">
                Cancelar
              </button>
              <button type="button" onClick={applyAutoGen}
                className="flex-1 bg-brand-accent text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-blue transition-colors">
                Gerar
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "image" && (
        <div className="space-y-3">
          {value?.image_url ? (
            <div className="relative rounded-2xl overflow-hidden border border-brand-blue/10 bg-brand-slate">
              <img src={value.image_url} alt="Planta" className="w-full max-h-72 object-contain" />
              <button type="button" onClick={clear}
                className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:scale-110 transition-transform shadow">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-brand-blue/10 rounded-2xl py-12 cursor-pointer hover:border-brand-accent/30 hover:bg-brand-slate/50 transition-all">
              <input ref={imgRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              {uploading ? <Loader2 size={24} className="text-brand-accent animate-spin" /> : <Upload size={24} className="text-brand-blue/20" />}
              <span className="text-sm font-medium text-brand-blue/30">
                {uploading ? "Enviando..." : "Upload da planta baixa"}
              </span>
              <span className="text-xs text-brand-blue/20">JPG, PNG · Alta resolução</span>
            </label>
          )}
        </div>
      )}

      {mode === "vector" && (
        <div className="space-y-4">
          <RoomDrawer rooms={rooms} onChange={setRooms} />
          <div className="flex gap-3">
            {rooms.length > 0 && (
              <button type="button" onClick={clear}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 text-xs font-bold uppercase tracking-widest transition-all">
                <Trash2 size={12} /> Limpar
              </button>
            )}
            <button type="button" onClick={saveVector} disabled={rooms.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-brand-blue text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-accent transition-all duration-400 disabled:opacity-40">
              <Check size={12} /> Salvar Planta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
