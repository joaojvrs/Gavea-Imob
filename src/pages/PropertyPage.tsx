/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Maximize2, Shield, MapPin, Ruler, Bed, Bath, Sparkles, Car, Check, Video, Image as ImageIcon, X, Send, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/src/lib/utils";
import { PROPERTIES } from "../data/properties";

// Compact AI Chat for Property Page
function PropertyAIChat({ propertyTitle }: { propertyTitle: string }) {
  const [messages, setMessages] = useState<{id: string, type: 'user' | 'ai', text: string}[]>([
    { id: '1', type: 'ai', text: `Olá! Sou o especialista da Gávea AI para o ${propertyTitle}. Como posso ajudar você hoje?` }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll if there are more than the initial greeting message or it's loading
    if (messages.length > 1 || isLoading) {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text }]);
    setInput("");
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        type: 'ai', 
        text: `Excelente pergunta sobre o ${propertyTitle}. Este é um detalhe que nossa curadoria valoriza muito. Gostaria de agendar uma conversa com um consultor especializado para aprofundar este ponto?` 
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-brand-blue/5 shadow-xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-brand-blue/5 bg-brand-slate/30 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-accent" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Especialista Gávea AI</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={cn("flex", m.type === 'user' ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] px-4 py-2 rounded-2xl text-xs font-light leading-relaxed",
              m.type === 'user' ? "bg-brand-blue text-white rounded-tr-none" : "bg-brand-slate text-brand-blue rounded-tl-none shadow-sm"
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
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

export default function PropertyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState('Geral');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [isExpanded, setIsExpanded] = useState(false);
  const isFirstMount = useRef(true);

  const property = PROPERTIES.find(p => p.id === id);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    window.scrollTo(0, 0);
  }, [id]);

  if (!property) {
    return (
      <div className="pt-40 text-center">
        <h1 className="text-4xl font-display font-bold">Residência não encontrada.</h1>
        <Link to="/" className="text-brand-accent mt-4 inline-block">Voltar para a coleção</Link>
      </div>
    );
  }

  const roomsData = [
    { id: 'Geral', name: 'Vista Geral', path: 'M 50 50 L 450 50 L 450 350 L 50 350 Z', area: `${property.area}m²` },
    { id: 'Living', name: 'Living Room', path: 'M 50 50 L 250 50 L 250 200 L 50 200 Z', area: '120m²' },
    { id: 'Suite', name: 'Suíte Master', path: 'M 260 50 L 450 50 L 450 150 L 260 150 Z', area: '45m²' },
    { id: 'Gourmet', name: 'Área Gourmet', path: 'M 50 210 L 250 210 L 250 350 L 50 350 Z', area: '60m²' },
  ];

  const MediaContent = () => (
    mediaType === 'photo' ? (
      <img 
        src={property.image} 
        alt={property.title}
        className="h-full w-full object-cover grayscale-[0.2] brightness-[0.9] transition-transform duration-1000 group-hover:scale-105"
      />
    ) : (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover grayscale-[0.2] brightness-[0.9]"
      >
        <source src="/videoimovel.mp4" type="video/mp4" />
      </video>
    )
  );

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
              className="absolute top-8 right-8 text-white z-[110] hover:scale-110 transition-transform p-2 bg-white/10 rounded-full"
            >
              <X size={32} />
            </button>
            <div className="w-full h-full max-w-7xl max-h-[85vh] rounded-[2rem] overflow-hidden shadow-2xl relative">
              <MediaContent />
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
              className="text-5xl md:text-7xl font-display font-bold tracking-tighter mb-4"
            >
              {property.title}
            </motion.h1>
            <motion.div 
              layoutId={`property-location-${id}`}
              className="flex items-center gap-2 text-brand-blue/60"
            >
              <MapPin size={18} />
              <span className="font-light">{property.location}</span>
            </motion.div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-right"
          >
            <p className="text-4xl md:text-5xl font-display font-bold text-brand-blue tracking-tighter">
              {property.price || "Sob Consulta"}
            </p>
            <p className="text-brand-blue/40 font-light text-[10px] mt-2 font-mono uppercase tracking-[0.3em]">
              BRL • Luxury Collection
            </p>
          </motion.div>
        </div>
      </section>

      {/* Immersive Viewer Section */}
      <section className="px-6 md:px-12 mb-24">
        <motion.div 
          layoutId={`property-card-${id}`}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-7xl mx-auto aspect-[21/9] bg-brand-slate rounded-[2.5rem] overflow-hidden relative group shadow-2xl"
        >
          <div className="absolute inset-0 z-0">
            <MediaContent />
            
            {/* Visual Tour HUD Overlay */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 z-10 pointer-events-none">
                <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-4">
                      <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full inline-flex items-center gap-2 pointer-events-auto">
                          <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Vision 8K Experience</span>
                      </div>
                      
                      <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1 self-start pointer-events-auto">
                        <button 
                          onClick={() => setMediaType('photo')}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                            mediaType === 'photo' ? "bg-white text-brand-blue shadow-lg" : "text-white/60 hover:text-white"
                          )}
                        >
                          <ImageIcon size={14} /> Fotos
                        </button>
                        <button 
                          onClick={() => setMediaType('video')}
                          className={cn(
                            "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                            mediaType === 'video' ? "bg-white text-brand-blue shadow-lg" : "text-white/60 hover:text-white"
                          )}
                        >
                          <Video size={14} /> Vídeos
                        </button>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setIsExpanded(true)}
                      className="bg-black/20 backdrop-blur-xl border border-white/10 p-3 rounded-full text-white pointer-events-auto hover:bg-white hover:text-brand-blue transition-all active:scale-95"
                    >
                        <Maximize2 size={24} />
                    </button>
                </div>
                
                <div className="flex justify-center">
                    <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-1 md:p-1.5 rounded-full flex gap-1 pointer-events-auto shadow-2xl overflow-x-auto no-scrollbar max-w-full">
                        {roomsData.map(room => (
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
            </div>
          </div>
        </motion.div>
      </section>

      {/* Property Details Grid */}
      <section className="px-6 md:px-12 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2 space-y-16">
          {/* Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-brand-blue/5 shadow-sm space-y-2">
              <span className="text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Metragem</span>
              <div className="flex items-center gap-2 text-2xl font-display font-medium">
                <Ruler size={24} className="text-brand-accent" />
                {property.area}m²
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-brand-blue/5 shadow-sm space-y-2">
              <span className="text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Dormitórios</span>
              <div className="flex items-center gap-2 text-2xl font-display font-medium">
                <Bed size={24} className="text-brand-accent" />
                {property.bedrooms} QD
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-brand-blue/5 shadow-sm space-y-2">
              <span className="text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Banheiros</span>
              <div className="flex items-center gap-2 text-2xl font-display font-medium">
                <Bath size={24} className="text-brand-accent" />
                {property.bathrooms} WC
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-brand-blue/5 shadow-sm space-y-2">
              <span className="text-[10px] text-brand-blue/40 uppercase tracking-widest font-bold">Vagas</span>
              <div className="flex items-center gap-2 text-2xl font-display font-medium">
                <Car size={24} className="text-brand-accent" />
                {property.parking} VG
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-blue/5" />

          {/* Narrative Description */}
          <div className="prose prose-brand-blue max-w-none">
            <h2 className="text-4xl font-display font-bold tracking-tight mb-8">Curadoria {property.neighborhood}.</h2>
            <p className="text-brand-blue/70 text-xl font-light leading-relaxed mb-8">
              {property.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
              <div className="space-y-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/40 border-l-2 border-brand-accent pl-4">Atributos Exclusivos</h3>
                <ul className="space-y-5">
                  {property.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-4 text-brand-blue/70 font-light text-base group">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 group-hover:scale-150 transition-transform" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-brand-blue/40 border-l-2 border-brand-accent pl-4">Lazer & Atmosfera</h3>
                <ul className="space-y-5">
                  {property.lazer.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-brand-blue/70 font-light text-base group">
                      <Sparkles size={16} className="text-brand-accent/50 group-hover:text-brand-accent mt-1 transition-colors" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="h-px bg-brand-blue/5" />

          {/* Interactive Floor Plan */}
          <div className="space-y-10">
            <h3 className="text-3xl font-display font-bold tracking-tight">Cartografia Espacial</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center bg-white p-10 rounded-[3rem] border border-brand-blue/5 shadow-[0_40px_100px_rgba(10,37,64,0.03)]">
              <div className="relative group/svg">
                <svg viewBox="0 0 500 400" className="w-full h-auto drop-shadow-2xl">
                  {roomsData.map(room => (
                    <motion.path
                      key={room.id}
                      d={room.path}
                      onClick={() => setSelectedRoom(room.id)}
                      initial={{ fill: "#F8FAFC" }}
                      animate={{ 
                        fill: selectedRoom === room.id ? "#0A2540" : "#F8FAFC",
                        fillOpacity: selectedRoom === room.id ? 0.9 : 1,
                        stroke: selectedRoom === room.id ? "#0A2540" : "#E2E8F0"
                      }}
                      whileHover={{ fillOpacity: 0.8, cursor: 'pointer' }}
                      transition={{ duration: 0.4 }}
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-[0.5em] text-brand-blue/20">Spatial Layout Ref: {property.id}</div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3 flex items-center gap-2">
                    <Sparkles size={12} /> Unidade Espacial
                  </h4>
                  <p className="text-4xl font-display font-bold tracking-tight">{roomsData.find(r => r.id === selectedRoom)?.name}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-brand-blue/40 tracking-[0.2em]">Cotação M²</p>
                    <p className="text-2xl font-display font-medium border-b border-brand-accent/20 pb-2">{roomsData.find(r => r.id === selectedRoom)?.area}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-brand-blue/40 tracking-[0.2em]">Status</p>
                    <p className="text-2xl font-display font-medium border-b border-brand-accent/20 pb-2">Auditado</p>
                  </div>
                </div>

                <p className="text-brand-blue/70 text-base font-light leading-relaxed italic">
                   "Este ambiente foi validado pela Gávea Heritage como uma zona de alta performance sensorial, projetada para a fluidez da vida moderna."
                </p>
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

            {/* AI Advisor Chat */}
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
