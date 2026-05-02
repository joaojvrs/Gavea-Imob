/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-brand-bg">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover scale-105"
        >
          <source src="/videoimovel.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {/* Overlay for cinematic feel and contrast - Darker for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-blue/80 via-brand-blue/40 to-brand-bg backdrop-brightness-[0.6] backdrop-saturate-[0.9]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-5xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
                delayChildren: 0.3,
              },
            },
          }}
        >
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
              },
            }}
            className="inline-block text-brand-accent font-display tracking-[0.3em] uppercase text-xs mb-6 font-semibold"
          >
            Curadoria e Inteligência Imobiliária
          </motion.span>
          
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
              },
            }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white tracking-tighter leading-[1.1] md:leading-[0.9] mb-8 drop-shadow-2xl px-2"
          >
            Arquitetura e visão, <br />
            <span className="italic font-light text-brand-accent">em harmonia.</span>
          </motion.h1>
          
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 40 },
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
              },
            }}
            className="text-white/80 text-base md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed px-6 md:px-4 drop-shadow-md"
          >
            Descubra residências que transcendem o comum. Unimos design autoral e inteligência de dados para encontrar o seu próximo endereço icônico.
          </motion.p>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: { 
                opacity: 1, 
                y: 0, 
                transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } 
              },
            }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button 
              onClick={() => document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })}
              className="group bg-white text-brand-blue px-8 py-4 rounded-full text-lg font-medium flex items-center gap-2 hover:bg-brand-accent hover:text-white transition-all duration-500 shadow-[0_10px_30px_rgba(0,0,0,0.3)] active:scale-95"
            >
              Explorar Coleção
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => document.getElementById('visionary')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 text-white font-medium hover:bg-white hover:text-brand-blue transition-all duration-300 backdrop-blur-md border border-white/20 rounded-full active:scale-95"
            >
              Falar com a IA
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-white/50 text-[10px] tracking-[0.4em] uppercase font-bold">Explorar</span>
        <div className="w-px h-12 bg-gradient-to-b from-brand-accent to-transparent" />
      </motion.div>
    </section>
  );
}
