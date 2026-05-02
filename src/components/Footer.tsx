/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export default function Footer() {
  return (
    <footer className="py-16 px-6 md:px-12 border-t border-brand-blue/5 bg-white text-brand-blue/40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo gavea.webp" alt="Gávea AI Logo" className="w-8 h-8 opacity-70" />
            <span className="text-xl font-display font-bold tracking-tighter text-brand-blue">GÁVEA AI</span>
          </div>
          <p className="text-sm font-light max-w-xs text-center md:text-left">
            Redefinindo o padrão da moradia ultra-premium através de curadoria inteligente e design atemporal.
          </p>
        </div>
        
        <div className="flex gap-8 text-sm font-medium">
          <a href="#" className="hover:text-brand-accent transition-colors">Privacidade</a>
          <a href="#" className="hover:text-brand-accent transition-colors">Termos</a>
          <a href="#" className="hover:text-brand-accent transition-colors">Contato</a>
        </div>
        
        <div className="text-xs font-mono uppercase tracking-[0.3em] text-white/30">
          © 2026 Gávea Heritage. Real Estate Intelligence.
        </div>
      </div>
    </footer>
  );
}
