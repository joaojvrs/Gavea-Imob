/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Mic, MicOff, Search } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";

// 7 000ms: chars start exiting + title wrapper starts collapsing (0.3s delay on collapse)
// 8 000ms: wrapper fully gone → small label appears + CTAs swap
const INTRO_EXIT_MS   = 7000;
const INTRO_REMOVE_MS = 8000;

const EASE = [0.16, 1, 0.3, 1] as const;

function SplitChars({
  text, className,
  baseDelay = 0, charInterval = 0.08,
  isExiting = false, exitBaseDelay = 0, exitCharInterval = 0.04,
}: {
  text: string; className?: string;
  baseDelay?: number; charInterval?: number;
  isExiting?: boolean; exitBaseDelay?: number; exitCharInterval?: number;
}) {
  const chars = text.split("");
  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => {
        const rev = chars.length - 1 - i;
        return (
          <motion.span key={i} style={{ display: "inline-block" }}
            initial={{ opacity: 0, y: 18, filter: "blur(18px)" }}
            animate={isExiting
              ? { opacity: 0, y: -10, filter: "blur(14px)" }
              : { opacity: 1,  y: 0,  filter: "blur(0px)"  }}
            transition={isExiting
              ? { duration: 0.35, delay: exitBaseDelay + rev * exitCharInterval, ease: [0.4, 0, 1, 1] }
              : { duration: 0.9,  delay: baseDelay + i * charInterval,           ease: EASE }}
          >
            {char === " " ? " " : char}
          </motion.span>
        );
      })}
    </span>
  );
}

const SUGGESTIONS = [
  "Apartamento frente ao mar com 3 quartos",
  "Cobertura com terraço em São Conrado",
  "Casa com piscina até R$ 3 milhões",
  "Studio moderno na Gávea",
];

export default function Hero() {
  const [query,       setQuery]       = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isFocused,   setIsFocused]   = useState(false);
  const [showIntro,   setShowIntro]   = useState(true);
  const [isExiting,   setIsExiting]   = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setIsExiting(true),  INTRO_EXIT_MS);
    const t2 = setTimeout(() => setShowIntro(false), INTRO_REMOVE_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const startRecording = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "pt-BR"; r.continuous = false; r.interimResults = true;
    r.onresult = (e: any) => setQuery(
      Array.from(e.results as SpeechRecognitionResultList)
        .map((x: SpeechRecognitionResult) => x[0].transcript).join("")
    );
    r.onend  = () => setIsRecording(false);
    r.onerror= () => setIsRecording(false);
    recognitionRef.current = r; r.start(); setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop(); setIsRecording(false);
  }, []);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" });
  }, [query]);

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-brand-bg">
      <div className="absolute inset-0 z-0">
        <video autoPlay loop muted playsInline className="h-full w-full object-cover scale-105">
          <source src="/videoimovel.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/80 via-brand-blue/40 to-brand-bg backdrop-brightness-[0.6] backdrop-saturate-[0.9]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-5xl">

        {/*
          TITLE WRAPPER — nunca sai do DOM.
          Colapsa height: "auto" → 0 gradualmente (delay 0.3s após isExiting).
          O campo de busca sobe JUNTO com o colapso, sem nenhum salto.
        */}
        <motion.div
          animate={isExiting
            ? { height: 0, marginBottom: 0 }
            : { height: "auto", marginBottom: 32 }}
          initial={{ height: "auto", marginBottom: 32 }}
          transition={{ duration: 0.75, ease: EASE, delay: 0.3 }}
          style={{ overflow: "hidden", width: "100%" }}
        >
          {/* Overline */}
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.6em" }}
            animate={isExiting
              ? { opacity: 0, y: -8, filter: "blur(8px)", letterSpacing: "0.6em",
                  transition: { duration: 0.3, delay: 0.65, ease: [0.4, 0, 1, 1] } }
              : { opacity: 1, letterSpacing: "0.35em" }}
            transition={{ duration: 2.2, ease: EASE, delay: 0.3 }}
            className="inline-block text-brand-accent/70 tracking-[0.35em] uppercase text-[9px] md:text-[11px] mb-8 font-medium"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Gávea Imobiliária
          </motion.span>

          <h1 className="mb-3 leading-none">
            <div className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white/55 tracking-tight mb-1"
              style={{ fontFamily: "var(--font-heading)" }}>
              <SplitChars text="Bem-vindo à" baseDelay={1.1} charInterval={0.08}
                isExiting={isExiting} exitBaseDelay={0.25} exitCharInterval={0.04} />
            </div>
            <div className="block text-6xl sm:text-8xl md:text-[7rem] lg:text-[9rem] font-black text-white tracking-tighter leading-none"
              style={{ fontFamily: "var(--font-heading)" }}>
              <SplitChars text="Gávea" baseDelay={2.2} charInterval={0.16}
                isExiting={isExiting} exitBaseDelay={0.1} exitCharInterval={0.05} />
            </div>
          </h1>

          <div className="overflow-hidden max-w-sm mx-auto mb-7 mt-5">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isExiting
                ? { scaleX: 0, opacity: 0, transition: { duration: 0.3, delay: 0.08, ease: [0.4, 0, 1, 1] } }
                : { scaleX: 1 }}
              transition={{ duration: 1.4, ease: [0.4, 0, 0.2, 1], delay: 3.3 }}
              style={{ transformOrigin: "right" }}
              className="h-px bg-gradient-to-r from-transparent via-brand-accent/60 to-transparent w-full"
            />
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isExiting
              ? { opacity: 0, y: -8, transition: { duration: 0.25, delay: 0, ease: [0.4, 0, 1, 1] } }
              : { opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE, delay: 4.2 }}
            className="text-white/55 text-sm md:text-base max-w-xs mx-auto mb-2 font-light tracking-widest uppercase"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Imóveis de alto padrão
          </motion.p>
        </motion.div>

        {/* Small label — aparece quando o bloco colapsou */}
        <AnimatePresence>
          {!showIntro && (
            <motion.div
              key="small-label"
              initial={{ opacity: 0, y: -6, filter: "blur(6px)" }}
              animate={{ opacity: 1,  y: 0,  filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mb-5"
            >
              <span className="text-white/30 text-[9px] tracking-[0.4em] uppercase font-semibold"
                style={{ fontFamily: "var(--font-heading)" }}>
                Gávea · Imobiliária
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/*
          SEARCH WRAPPER — `layout` para expandir width quando isExiting.
          Como o título colapsa gradualmente (não sai do DOM de repente),
          o reposicionamento vertical acontece em sincronia, sem jumps.
        */}
        <motion.div
          layout
          transition={{ layout: { duration: 1.0, ease: EASE } }}
          className={`w-full mx-auto ${isExiting ? "max-w-4xl" : "max-w-2xl"}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.4, ease: EASE, delay: 5.0 }}
          >
            {/* Input row */}
            <motion.div
              animate={{
                boxShadow: isFocused
                  ? "0 0 0 1px rgba(59,130,246,0.5), 0 24px 70px rgba(10,37,64,0.5)"
                  : isExiting
                  ? "0 20px 70px rgba(10,37,64,0.55)"
                  : "0 8px 40px rgba(10,37,64,0.3)",
              }}
              transition={{ duration: 0.6 }}
              className="relative flex items-center bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden"
            >
              <button onClick={isRecording ? stopRecording : startRecording}
                className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center group"
                aria-label={isRecording ? "Parar gravação" : "Buscar por voz"}>
                <AnimatePresence mode="wait">
                  {isRecording ? (
                    <motion.span key="rec"
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="relative flex items-center justify-center">
                      <span className="absolute w-8 h-8 rounded-full bg-red-500/25 animate-ping" />
                      <MicOff size={17} className="text-red-400 relative z-10" />
                    </motion.span>
                  ) : (
                    <motion.span key="idle"
                      initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <Mic size={17} className="text-white/45 group-hover:text-brand-accent transition-colors duration-200" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <div className="w-px h-5 bg-white/15 flex-shrink-0" />

              <input ref={inputRef} type="text" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Ex: apartamento frente ao mar com 2 quartos..."
                className="flex-1 bg-transparent px-4 py-4 text-white placeholder-white/28 text-sm md:text-base focus:outline-none font-light"
                style={{ fontFamily: "var(--font-heading)" }}
              />

              <button onClick={handleSearch} disabled={!query.trim()}
                className="flex-shrink-0 m-1.5 px-5 h-11 flex items-center gap-2 bg-brand-accent rounded-xl text-white text-[11px] font-bold uppercase tracking-wider hover:bg-blue-500 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95 transition-colors duration-300"
                style={{ fontFamily: "var(--font-heading)" }}>
                <Search size={14} />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </motion.div>

            {/* Suggestion chips */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 5.8 }}
              className="flex flex-wrap justify-center gap-2 mt-3"
            >
              {SUGGESTIONS.map((s) => (
                <button key={s}
                  onClick={() => { setQuery(s); inputRef.current?.focus(); }}
                  className="px-3 py-1 rounded-full border border-white/12 text-white/38 text-[10px] font-light hover:border-white/28 hover:text-white/65 transition-all duration-200 backdrop-blur-sm"
                  style={{ fontFamily: "var(--font-heading)" }}>
                  {s}
                </button>
              ))}
            </motion.div>

            {/* CTAs */}
            <AnimatePresence mode="wait">
              {showIntro ? (
                <motion.div key="cta-intro"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                  transition={{ duration: 1.2, ease: EASE, delay: 5.6 }}
                  className="flex justify-center mt-5">
                  <button
                    onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}
                    className="group flex items-center gap-2 text-white/40 text-[11px] font-light hover:text-white/70 transition-colors duration-300"
                    style={{ fontFamily: "var(--font-heading)" }}>
                    Ver toda a coleção
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="cta-search"
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.8, ease: EASE }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: "smooth" })}
                    className="group flex items-center gap-2.5 bg-white text-brand-blue px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] hover:bg-brand-accent hover:text-white transition-all duration-500 shadow-[0_10px_40px_rgba(0,0,0,0.3)] active:scale-95"
                    style={{ fontFamily: "var(--font-heading)" }}>
                    Explorar Coleção
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => document.getElementById("visionary")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2.5 border border-white/22 hover:border-white/40 text-white/65 hover:text-white px-8 py-3.5 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all duration-300 backdrop-blur-sm"
                    style={{ fontFamily: "var(--font-heading)" }}>
                    Falar com a Gávea AI
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 6.5, duration: 1.4 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <span className="text-white/35 text-[8px] tracking-[0.5em] uppercase font-medium"
          style={{ fontFamily: "var(--font-heading)" }}>
          Explorar
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-brand-accent/60 to-transparent" />
      </motion.div>
    </section>
  );
}
