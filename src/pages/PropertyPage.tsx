/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, Shield, MapPin, Ruler, Bed, Bath, Sparkles, Car, Check, Video, Image as ImageIcon, X, Send, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { cn } from "@/src/lib/utils";
import { PROPERTIES, Property, TourScene } from "../data/properties";
import PanoramaViewer from "@/src/components/PanoramaViewer";
import VirtualTour from "@/src/components/VirtualTour";
import { supabase } from "@/src/lib/supabase";

// ── DB types ─────────────────────────────────────────────────────────────────

interface DBMediaRow {
  id: string;
  type: "photo" | "video" | "tour_360" | "floor_plan_image";
  url: string;
  order_index: number;
  is_cover: boolean;
  metadata: {
    room_name?: string;
    hotspots?: Array<{ yaw: number; pitch: number; target_media_id: string; label?: string }>;
  };
}

interface DBFloorPlan {
  id: string;
  type: "image" | "vector";
  image_url?: string;
  plan_data?: {
    rooms: Array<{ id: string; x: number; y: number; w: number; h: number; name: string; area: string }>;
    viewBox: string;
  };
}

// ── MediaContent ──────────────────────────────────────────────────────────────

interface MediaContentProps {
  mediaType: "photo" | "video" | "tour";
  tourScenes?: TourScene[];
  tourImages: string[];
  tourIndex: number;
  setTourIndex: Dispatch<SetStateAction<number>>;
  photos: string[];
  photoIndex: number;
  setPhotoIndex: Dispatch<SetStateAction<number>>;
  videoUrl?: string;
  propertyTitle: string;
}

function MediaContent({
  mediaType, tourScenes, tourImages, tourIndex, setTourIndex,
  photos, photoIndex, setPhotoIndex, videoUrl, propertyTitle,
}: MediaContentProps) {
  if (mediaType === "video") {
    return (
      <video
        autoPlay loop muted playsInline
        className="h-full w-full object-cover grayscale-[0.2] brightness-[0.9] absolute inset-0 z-0"
      >
        <source src={videoUrl ?? "/videoimovel.mp4"} type="video/mp4" />
      </video>
    );
  }

  if (mediaType === "tour") {
    if (tourScenes && tourScenes.length > 0) {
      return (
        <div className="absolute inset-0 z-0 bg-black">
          <VirtualTour scenes={tourScenes} />
        </div>
      );
    }

    if (tourImages.length > 0) {
      return (
        <div className="absolute inset-0 z-0 bg-black overflow-hidden">
          <div className="w-full h-full cursor-grab active:cursor-grabbing">
            <PanoramaViewer images={tourImages} activeIndex={tourIndex} />
          </div>

          <div className="absolute inset-x-0 top-6 flex items-center justify-between px-4 md:px-8 pointer-events-none z-10">
            <span className="bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full">Tour 360</span>
            <span className="bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-[0.3em] font-bold px-3 py-1 rounded-full">{tourIndex + 1}/{tourImages.length}</span>
          </div>

          {tourImages.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setTourIndex(p => (p - 1 + tourImages.length) % tourImages.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-3 text-white hover:bg-black/80 transition shadow-lg backdrop-blur-sm cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setTourIndex(p => (p + 1) % tourImages.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-3 text-white hover:bg-black/80 transition shadow-lg backdrop-blur-sm cursor-pointer"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>
      );
    }
  }

  // Photo mode
  const src = photos[photoIndex] ?? photos[0] ?? "";
  return (
    <>
      <img
        src={src}
        alt={propertyTitle}
        className="absolute inset-0 z-0 h-full w-full object-cover grayscale-[0.2] brightness-[0.9] transition-transform duration-1000 group-hover:scale-105"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setPhotoIndex(p => (p - 1 + photos.length) % photos.length); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-3 text-white hover:bg-black/80 transition shadow-lg backdrop-blur-sm cursor-pointer pointer-events-auto"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setPhotoIndex(p => (p + 1) % photos.length); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-black/40 p-3 text-white hover:bg-black/80 transition shadow-lg backdrop-blur-sm cursor-pointer pointer-events-auto"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1 rounded-full pointer-events-none">
            {photoIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </>
  );
}

// ── mapDbToProperty ───────────────────────────────────────────────────────────

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
    tourScenes:     (db.tour_scenes as TourScene[])   ?? undefined,
    video_url:      (db.video_url as string)          ?? undefined,
  };
}

// ── AI Chat ───────────────────────────────────────────────────────────────────

function PropertyAIChat({ propertyTitle }: { propertyTitle: string }) {
  const [messages, setMessages] = useState<{ id: string; type: "user" | "ai"; text: string }[]>([
    { id: "1", type: "ai", text: `Olá! Sou o especialista da Gávea AI para o ${propertyTitle}. Como posso ajudar você hoje?` },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1 || isLoading) scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: "user", text }]);
    setInput("");
    setIsLoading(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: "ai",
        text: `Excelente pergunta sobre o ${propertyTitle}. Este é um detalhe que nossa curadoria valoriza muito. Gostaria de agendar uma conversa com um consultor especializado para aprofundar este ponto?`,
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-brand-blue/5 shadow-xl overflow-hidden flex flex-col h-[400px] md:h-[500px]">
      <div className="p-4 border-b border-brand-blue/5 bg-brand-slate/30 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Especialista Gávea AI</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={cn("flex", m.type === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] px-4 py-2 rounded-2xl text-xs font-light leading-relaxed",
              m.type === "user" ? "bg-brand-blue text-white rounded-tr-none" : "bg-brand-slate text-brand-blue rounded-tl-none shadow-sm"
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-brand-slate px-4 py-2 rounded-2xl rounded-tl-none flex gap-1 shadow-sm">
              <span className="w-1 h-1 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 bg-brand-accent rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
      <div className="p-4 border-t border-brand-blue/5 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend(input)}
            placeholder="Tire suas dúvidas específicas..."
            className="w-full bg-brand-slate border-none rounded-full py-3 pl-5 pr-12 text-[10px] font-light focus:outline-none focus:ring-1 focus:ring-brand-accent/20"
          />
          <button
            onClick={() => handleSend(input)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-brand-blue text-white p-2 rounded-full hover:bg-brand-accent transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState("Geral");
  const [mediaType, setMediaType] = useState<"photo" | "video" | "tour">("photo");
  const [tourIndex, setTourIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dbProperty, setDbProperty] = useState<Property | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMedia, setDbMedia] = useState<DBMediaRow[]>([]);
  const [dbFloorPlan, setDbFloorPlan] = useState<DBFloorPlan | null>(null);
  const isFirstMount = useRef(true);

  const mockProperty = PROPERTIES.find(p => p.id === id);
  const property = mockProperty ?? dbProperty;

  // Load property from DB
  useEffect(() => {
    if (!mockProperty && id) {
      setDbLoading(true);
      supabase.from("properties").select("*").eq("id", id).single()
        .then(({ data }) => {
          if (data) setDbProperty(mapDbToProperty(data as Record<string, unknown>));
          setDbLoading(false);
        });
    }
  }, [id, mockProperty]);

  // Load media and floor plan from DB for UUID-based properties
  useEffect(() => {
    if (!id || !UUID_RE.test(id)) return;
    Promise.all([
      supabase.from("property_media").select("*").eq("property_id", id).order("order_index"),
      supabase.from("property_floor_plans").select("*").eq("property_id", id).maybeSingle(),
    ]).then(([mediaRes, planRes]) => {
      if (mediaRes.data) setDbMedia(mediaRes.data as DBMediaRow[]);
      if (planRes.data) setDbFloorPlan(planRes.data as DBFloorPlan);
    });
  }, [id]);

  useEffect(() => {
    if (property?.tour360?.length) setTourIndex(0);
  }, [property?.id]);

  useEffect(() => {
    setPhotoIndex(0);
  }, [id]);

  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    window.scrollTo(0, 0);
  }, [id]);

  if (dbLoading) {
    return (
      <div className="pt-40 flex justify-center">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-brand-accent animate-bounce" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="pt-40 text-center">
        <h1 className="text-4xl font-display font-bold">Residência não encontrada.</h1>
        <Link to="/" className="text-brand-accent mt-4 inline-block">Voltar para a coleção</Link>
      </div>
    );
  }

  // ── Computed media ──────────────────────────────────────────────────────────

  const dbPhotos = dbMedia.filter(m => m.type === "photo").sort((a, b) => a.order_index - b.order_index);
  const dbVideos = dbMedia.filter(m => m.type === "video");
  const rawTour360 = dbMedia.filter(m => m.type === "tour_360").sort((a, b) => a.order_index - b.order_index);

  // Resolve UUID-based hotspot targets to array indices
  const idToIdx: Record<string, number> = Object.fromEntries(rawTour360.map((s, i) => [s.id, i]));
  const resolvedTourScenes: TourScene[] = rawTour360.length > 0
    ? rawTour360.map((scene, idx) => {
        const meta = scene.metadata || {};
        return {
          image: scene.url,
          roomName: meta.room_name ?? `Cena ${idx + 1}`,
          hotspots: (meta.hotspots ?? []).map(h => ({
            yaw: h.yaw,
            pitch: h.pitch,
            targetIndex: idToIdx[h.target_media_id] ?? 0,
            label: h.label ?? "",
          })),
        };
      })
    : (property.tourScenes ?? []);

  const effectivePhotos = dbPhotos.length > 0
    ? dbPhotos.map(p => p.url)
    : [property.gallery?.[0] ?? property.image].filter(Boolean) as string[];

  const effectiveVideoUrl = dbVideos.length > 0 ? dbVideos[0].url : property.video_url;
  const tourImages = property.tour360 ?? [];

  const hasVideo = !!(effectiveVideoUrl);
  const hasTour = resolvedTourScenes.length > 0 || tourImages.length > 0;

  // Floor plan: prefer DB, fall back to hardcoded
  const fallbackRooms = [
    { id: "Geral",   name: "Vista Geral",   x: 50,  y: 50,  w: 400, h: 300, path: "M 50 50 L 450 50 L 450 350 L 50 350 Z",   area: `${property.area}m²` },
    { id: "Living",  name: "Living Room",   x: 50,  y: 50,  w: 200, h: 150, path: "M 50 50 L 250 50 L 250 200 L 50 200 Z",   area: "120m²" },
    { id: "Suite",   name: "Suíte Master",  x: 260, y: 50,  w: 190, h: 100, path: "M 260 50 L 450 50 L 450 150 L 260 150 Z", area: "45m²" },
    { id: "Gourmet", name: "Área Gourmet",  x: 50,  y: 210, w: 200, h: 140, path: "M 50 210 L 250 210 L 250 350 L 50 350 Z", area: "60m²" },
  ];
  const dynamicRooms = dbFloorPlan?.type === "vector" && dbFloorPlan.plan_data?.rooms?.length
    ? dbFloorPlan.plan_data.rooms
    : null;

  const mediaProps: MediaContentProps = {
    mediaType,
    tourScenes: resolvedTourScenes.length > 0 ? resolvedTourScenes : undefined,
    tourImages,
    tourIndex,
    setTourIndex,
    photos: effectivePhotos,
    photoIndex,
    setPhotoIndex,
    videoUrl: effectiveVideoUrl,
    propertyTitle: property.title,
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="pb-24 overflow-x-hidden min-h-screen bg-brand-bg text-brand-blue"
    >
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12 backdrop-blur-3xl"
          >
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-8 right-8 text-white z-[120] hover:scale-110 transition-transform p-2 bg-white/10 rounded-full cursor-pointer"
            >
              <X size={32} />
            </button>
            <div className="w-full h-full max-w-7xl max-h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl relative">
              <MediaContent {...mediaProps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Property Header */}
      <section className="pt-32 px-6 md:px-12 pb-8 max-w-7xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-blue/50 hover:text-brand-accent transition-colors mb-12 group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Voltar para Coleção
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="inline-block px-3 py-1 bg-brand-accent/10 text-brand-accent rounded-full text-[10px] font-bold mb-4 uppercase tracking-[0.2em]">
              Imóvel em Destaque
            </span>
            <motion.h1
              layoutId={`property-title-${id}`}
              className="text-4xl sm:text-5xl md:text-7xl font-display font-bold tracking-tighter mb-4"
            >
              {property.title}
            </motion.h1>
            <motion.div
              layoutId={`property-location-${id}`}
              className="flex items-center gap-2 text-brand-blue/60 text-sm md:text-base"
            >
              <MapPin size={18} />
              <span className="font-light">{property.location}</span>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="md:text-right"
          >
            <p className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-brand-blue tracking-tighter">
              {property.price || "Sob Consulta"}
            </p>
            <p className="text-brand-blue/40 font-light text-[9px] md:text-[10px] mt-1 md:mt-2 font-mono uppercase tracking-[0.3em]">
              BRL • Luxury Collection
            </p>
          </motion.div>
        </div>
      </section>

      {/* Immersive Viewer Section */}
      <section className="px-4 md:px-12 mb-16 md:mb-24">
        <motion.div
          layoutId={`property-card-${id}`}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto aspect-[4/5] sm:aspect-video md:aspect-[21/9] bg-brand-slate rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative group shadow-2xl"
        >
          <MediaContent {...mediaProps} />

          {/* HUD Overlay */}
          <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-10 pointer-events-none z-30">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-3 md:gap-4">
                <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full inline-flex items-center gap-2 pointer-events-auto shadow-lg">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-brand-accent rounded-full animate-pulse" />
                  <span className="text-[8px] md:text-[10px] font-bold text-white uppercase tracking-widest">Vision 8K Experience</span>
                </div>

                {/* Media type tabs */}
                <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-0.5 md:p-1 self-start pointer-events-auto shadow-lg">
                  <button
                    onClick={() => setMediaType("photo")}
                    className={cn(
                      "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2",
                      mediaType === "photo" ? "bg-white text-brand-blue shadow-lg" : "text-white/60 hover:text-white"
                    )}
                  >
                    <ImageIcon size={12} className="md:w-[14px] md:h-[14px]" /> Fotos
                  </button>
                  {hasVideo && (
                    <button
                      onClick={() => setMediaType("video")}
                      className={cn(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2",
                        mediaType === "video" ? "bg-white text-brand-blue shadow-lg" : "text-white/60 hover:text-white"
                      )}
                    >
                      <Video size={12} className="md:w-[14px] md:h-[14px]" /> Vídeo
                    </button>
                  )}
                  {hasTour && (
                    <button
                      onClick={() => setMediaType("tour")}
                      className={cn(
                        "px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 md:gap-2",
                        mediaType === "tour" ? "bg-white text-brand-blue shadow-lg" : "text-white/60 hover:text-white"
                      )}
                    >
                      <ImageIcon size={12} className="md:w-[14px] md:h-[14px]" /> Tour 360
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsExpanded(true)}
                className="bg-black/20 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-full text-white pointer-events-auto hover:bg-white hover:text-brand-blue transition-all active:scale-95 shadow-lg"
              >
                <Maximize2 size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            {/* Room nav bar — only when we have floor plan rooms */}
            {(dynamicRooms ?? fallbackRooms).length > 0 && (
              <div className="flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-1 md:p-1.5 rounded-full flex gap-1 pointer-events-auto shadow-2xl overflow-x-auto no-scrollbar max-w-full px-2 md:px-1.5">
                  {(dynamicRooms ?? fallbackRooms).map(room => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id)}
                      className={cn(
                        "px-4 md:px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all font-mono whitespace-nowrap",
                        selectedRoom === room.id
                          ? "bg-brand-accent text-white shadow-lg"
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {room.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Property Details Grid */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          {/* Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-brand-blue/5 shadow-sm space-y-1 md:space-y-2">
              <span className="text-[9px] md:text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Metragem</span>
              <div className="flex items-center gap-2 text-xl md:text-2xl font-display font-medium">
                <Ruler size={20} className="text-brand-accent md:w-6 md:h-6" />
                {property.area}m²
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-brand-blue/5 shadow-sm space-y-1 md:space-y-2">
              <span className="text-[9px] md:text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Dormitórios</span>
              <div className="flex items-center gap-2 text-xl md:text-2xl font-display font-medium">
                <Bed size={20} className="text-brand-accent md:w-6 md:h-6" />
                {property.bedrooms} QD
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-brand-blue/5 shadow-sm space-y-1 md:space-y-2">
              <span className="text-[9px] md:text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Banheiros</span>
              <div className="flex items-center gap-2 text-xl md:text-2xl font-display font-medium">
                <Bath size={20} className="text-brand-accent md:w-6 md:h-6" />
                {property.bathrooms} WC
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-brand-blue/5 shadow-sm space-y-1 md:space-y-2">
              <span className="text-[9px] md:text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Vagas</span>
              <div className="flex items-center gap-2 text-xl md:text-2xl font-display font-medium">
                <Car size={20} className="text-brand-accent md:w-6 md:h-6" />
                {property.parking} VG
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-blue/5" />

          {/* Narrative Description */}
          <div className="prose prose-brand-blue max-w-none">
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-6 md:mb-8">Curadoria {property.neighborhood}.</h2>
            <p className="text-brand-blue/70 text-lg md:text-xl font-light leading-relaxed mb-8">
              {property.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 mt-12 md:mt-16">
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/40 border-l-2 border-brand-accent pl-4">Atributos Exclusivos</h3>
                <ul className="space-y-4 md:space-y-5">
                  {property.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4 text-brand-blue/70 font-light text-sm md:text-base group">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 group-hover:scale-150 transition-transform flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6 md:space-y-8">
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/40 border-l-2 border-brand-accent pl-4">Lazer & Atmosfera</h3>
                <ul className="space-y-4 md:space-y-5">
                  {property.lazer.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 md:gap-4 text-brand-blue/70 font-light text-sm md:text-base group">
                      <Sparkles size={14} className="text-brand-accent/50 group-hover:text-brand-accent mt-1 transition-colors flex-shrink-0 md:w-4 md:h-4" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-blue/5" />

          {/* Floor Plan */}
          <div className="space-y-10">
            <h3 className="text-3xl font-display font-bold tracking-tight">Cartografia Espacial</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center bg-white p-10 rounded-[3rem] border border-brand-blue/5 shadow-[0_40px_100px_rgba(10,37,64,0.03)]">

              {/* Floor plan render */}
              <div className="relative group/svg">
                {dbFloorPlan?.type === "image" && dbFloorPlan.image_url ? (
                  <img
                    src={dbFloorPlan.image_url}
                    alt="Planta baixa"
                    className="w-full h-auto rounded-2xl drop-shadow-2xl"
                  />
                ) : dynamicRooms ? (
                  <svg
                    viewBox={dbFloorPlan?.plan_data?.viewBox ?? "0 0 800 550"}
                    className="w-full h-auto drop-shadow-2xl"
                  >
                    <defs>
                      <pattern id="fp-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#fp-grid)" />
                    {dynamicRooms.map(r => (
                      <g key={r.id} onClick={() => setSelectedRoom(r.id)} className="cursor-pointer">
                        <rect
                          x={r.x} y={r.y} width={r.w} height={r.h}
                          fill={selectedRoom === r.id ? "#0A2540" : "#F8FAFC"}
                          fillOpacity={selectedRoom === r.id ? 0.9 : 1}
                          stroke={selectedRoom === r.id ? "#0A2540" : "#E2E8F0"}
                          strokeWidth={2}
                          rx={4}
                        />
                        <text
                          x={r.x + r.w / 2} y={r.y + r.h / 2 - (r.area ? 6 : 0)}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={Math.min(13, r.w / 8, r.h / 4)}
                          fill={selectedRoom === r.id ? "#fff" : "#0A2540"}
                          fontWeight="600" fontFamily="system-ui"
                        >
                          {r.name}
                        </text>
                        {r.area && (
                          <text
                            x={r.x + r.w / 2} y={r.y + r.h / 2 + 10}
                            textAnchor="middle" dominantBaseline="middle"
                            fontSize={Math.min(10, r.w / 10, r.h / 5)}
                            fill={selectedRoom === r.id ? "#ffffffcc" : "#0A254080"}
                            fontFamily="monospace"
                          >
                            {r.area}
                          </text>
                        )}
                      </g>
                    ))}
                  </svg>
                ) : (
                  /* Hardcoded fallback SVG */
                  <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl">
                    {fallbackRooms.map(room => (
                      <motion.path
                        key={room.id}
                        d={room.path}
                        onClick={() => setSelectedRoom(room.id)}
                        initial={{ fill: "#F8FAFC" }}
                        animate={{
                          fill: selectedRoom === room.id ? "#0A2540" : "#F8FAFC",
                          fillOpacity: selectedRoom === room.id ? 0.9 : 1,
                          stroke: selectedRoom === room.id ? "#0A2540" : "#E2E8F0",
                        }}
                        whileHover={{ fillOpacity: 0.8, cursor: "pointer" }}
                        transition={{ duration: 0.4 }}
                        strokeWidth="2"
                      />
                    ))}
                  </svg>
                )}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-[0.5em] text-brand-blue/20">
                  Spatial Layout Ref: {property.id}
                </div>
              </div>

              <div className="space-y-8">
                {(() => {
                  const rooms = dynamicRooms ?? fallbackRooms;
                  const sel = rooms.find(r => r.id === selectedRoom) ?? rooms[0];
                  return (
                    <>
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3 flex items-center gap-2">
                          <Sparkles size={12} /> Unidade Espacial
                        </h4>
                        <p className="text-4xl font-display font-bold tracking-tight">{sel?.name ?? "—"}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-brand-blue/40 tracking-[0.2em]">Cotação M²</p>
                          <p className="text-2xl font-display font-medium border-b border-brand-accent/20 pb-2">
                            {sel?.area || `${property.area}m²`}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-bold text-brand-blue/40 tracking-[0.2em]">Status</p>
                          <p className="text-2xl font-display font-medium border-b border-brand-accent/20 pb-2">Auditado</p>
                        </div>
                      </div>

                      <p className="text-brand-blue/70 text-base font-light leading-relaxed italic">
                        "Este ambiente foi validado pela Gávea Heritage como uma zona de alta performance sensorial, projetada para a fluidez da vida moderna."
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <aside className="lg:col-span-1 space-y-10">
          <div className="bg-brand-blue rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-32 overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000" />

            <div className="relative z-10 space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} className="text-brand-accent" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Affinity Score</span>
                </div>
                <span className="text-3xl font-display font-bold text-brand-accent">{property.matchScore}%</span>
              </div>

              <p className="text-white/60 text-sm font-light leading-relaxed">
                Nossa inteligência algorítmica identificou uma compatibilidade excepcional entre a arquitetura desta residência e seu perfil de lifestyle.
              </p>

              <div className="space-y-4">
                <button className="w-full bg-white text-brand-blue py-5 rounded-full font-bold hover:bg-brand-accent hover:text-white transition-all duration-500 shadow-xl shadow-black/10 active:scale-95">
                  Solicitar Visita Privada
                </button>
                <button className="w-full bg-white/10 backdrop-blur-xl border border-white/10 text-white py-5 rounded-full font-bold hover:bg-white hover:text-brand-blue transition-all duration-500 active:scale-95 text-sm uppercase tracking-widest">
                  Agendar Call de Ativo
                </button>
              </div>

              <div className="pt-8 border-t border-white/10 flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-800 rounded-full flex-shrink-0 bg-[url('https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200')] bg-cover border-2 border-white/10" />
                <div>
                  <p className="text-sm font-bold">Consultor Gávea</p>
                  <p className="text-[10px] text-white/40 font-light uppercase tracking-widest">Especialista High-End</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-brand-blue/40 px-4">Gávea Neural Advisor</h3>
            <PropertyAIChat propertyTitle={property.title} />
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-brand-blue/5 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-brand-blue">Dossier de Inteligência</h3>
            <div className="space-y-3">
              <button className="w-full bg-brand-slate text-brand-blue border border-brand-blue/5 py-4 rounded-full font-medium hover:bg-brand-blue hover:text-white transition-all duration-300 text-xs">
                Download Property Dossier
              </button>
              <button className="w-full bg-brand-slate text-brand-blue border border-brand-blue/5 py-4 rounded-full font-medium hover:bg-brand-blue hover:text-white transition-all duration-300 text-xs">
                Planta Técnica (PDF)
              </button>
            </div>
          </div>
        </aside>
      </section>
    </motion.main>
  );
}
