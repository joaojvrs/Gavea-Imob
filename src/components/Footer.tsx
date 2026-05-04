import { Mail, Phone, MessageCircle, Clock, MapPin } from "lucide-react";

const GOLD = "#c9a96e";
const NAV_LINK = "text-white/40 text-[13px] font-light hover:text-white transition-colors duration-200 w-fit leading-relaxed";
const COL_TITLE = "text-[9px] font-bold uppercase tracking-[0.35em] mb-5";

export default function Footer() {
  return (
    <footer id="about" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #071829 0%, #050f1a 100%)' }}>

      {/* Top accent line */}
      <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, #c9a96e55 20%, #c9a96e 50%, #c9a96e55 80%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto px-6 md:px-16">

        {/* ══ MAIN BODY ══ */}
        <div className="pt-16 pb-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_2fr] gap-12 lg:gap-0">

          {/* ── LEFT: Brand block ── */}
          <div className="flex flex-col gap-7 pr-0 lg:pr-16">

            {/* Logo image */}
            <div>
              <img
                src="https://cdn.imoview.com.br/gavea/Site/imagens/logo.png"
                alt="Gávea Imobiliária"
                className="h-14 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1) opacity(0.85)' }}
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = 'none';
                  const fallback = el.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback text logo */}
              <div className="hidden items-center gap-3">
                <img src="/logo gavea.webp" alt="Gávea" className="w-10 h-10 object-contain" />
                <div>
                  <p className="text-white font-bold text-[17px] tracking-tight leading-tight">Gávea Imobiliária</p>
                  <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mt-0.5" style={{ color: GOLD }}>Sua Imobiliária</p>
                </div>
              </div>
            </div>

            <p className="text-white/30 text-[13px] font-light leading-[1.8] max-w-[280px]">
              Imóveis à Venda e Aluguel em Santos, São Vicente, Praia Grande e Litoral Norte.
            </p>

            {/* Contact */}
            <div className="flex flex-col gap-3">
              <a href="mailto:contato@gaveaimobi.com.br" className="flex items-center gap-2.5 group">
                <Mail size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                <span className="text-white/35 text-[12px] font-light group-hover:text-white transition-colors">contato@gaveaimobi.com.br</span>
              </a>
              <a href="tel:+551333275649" className="flex items-center gap-2.5 group">
                <Phone size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                <span className="text-white/35 text-[12px] font-light group-hover:text-white transition-colors">(13) 3327-5649</span>
              </a>
              <a href="https://wa.me/5513974182351" className="flex items-center gap-2.5 group">
                <MessageCircle size={13} style={{ color: GOLD }} className="flex-shrink-0" />
                <span className="text-white/35 text-[12px] font-light group-hover:text-white transition-colors">(13) 9 7418-2351</span>
              </a>
              <div className="flex items-start gap-2.5">
                <Clock size={13} style={{ color: GOLD }} className="flex-shrink-0 mt-0.5" />
                <p className="text-white/25 text-[11px] font-light leading-[1.7]">
                  Seg–Sex: 9h às 19h · Sáb–Dom: 9h às 18h
                </p>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2.5 pt-1">
              {[
                { src: "https://cdn.imoview.com.br/gavea/Site/imagens/da1i236r.png", label: "Instagram" },
                { src: "https://cdn.imoview.com.br/gavea/Site/imagens/ls5r96rr.png", label: "Facebook" },
                { src: "https://cdn.imoview.com.br/gavea/Site/imagens/l61heu3f.png", label: "YouTube" },
              ].map(({ src, label }) => (
                <a key={label} href="#" aria-label={label}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ background: 'rgba(201,169,110,0.08)', border: '1px solid rgba(201,169,110,0.2)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.18)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.08)'; }}
                >
                  <img src={src} alt={label} className="w-4 h-4 object-contain" style={{ filter: 'brightness(0) invert(1) opacity(0.55)' }} />
                </a>
              ))}
            </div>
          </div>

          {/* ── VERTICAL DIVIDER ── */}
          <div className="hidden lg:block w-[1px] self-stretch mx-4"
            style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(201,169,110,0.25) 20%, rgba(201,169,110,0.25) 80%, transparent 100%)' }} />

          {/* ── RIGHT: Navigation columns ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-10 pl-0 lg:pl-16">

            {/* Col A */}
            <div>
              <p className={COL_TITLE} style={{ color: GOLD }}>A Gávea Imobiliária</p>
              <nav className="flex flex-col gap-2.5">
                {["Quem Somos","Fale Conosco","Documentos","Política de Privacidade","Blog","Nossa equipe","Ouvidoria"].map(l => (
                  <a key={l} href="#" className={NAV_LINK}>{l}</a>
                ))}
                <span className="text-white/20 text-[11px] font-light pt-1">CRECI: 034996-J</span>
              </nav>
            </div>

            {/* Col B */}
            <div className="flex flex-col gap-8">
              <div>
                <p className={COL_TITLE} style={{ color: GOLD }}>Imóveis</p>
                <nav className="flex flex-col gap-2.5">
                  {["Imóveis para comprar","Imóveis para alugar","Condomínios","Anunciar seu imóvel","Favoritos"].map(l => (
                    <a key={l} href="#" className={NAV_LINK}>{l}</a>
                  ))}
                </nav>
              </div>
              <div>
                <p className={COL_TITLE} style={{ color: GOLD }}>Cliente</p>
                <a href="#" className={NAV_LINK}>Área do cliente</a>
              </div>
            </div>

            {/* Col C */}
            <div>
              <p className={COL_TITLE} style={{ color: GOLD }}>Nossas Lojas</p>
              <div className="flex flex-col gap-6">
                {[
                  { name: "Loja 1 · Santos", addr: "Rua Jose Caballero, 69\nGonzaga, Santos" },
                  { name: "Loja 2 · São Vicente", addr: "Rua Messia Assú, 151\nItararé, São Vicente" },
                ].map(({ name, addr }) => (
                  <div key={name} className="flex gap-2.5">
                    <MapPin size={13} className="flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                    <div>
                      <p className="text-white/55 text-[12px] font-semibold mb-0.5">{name}</p>
                      <p className="text-white/25 text-[11px] font-light leading-[1.7] whitespace-pre-line">{addr}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══ BOTTOM BAR ══ */}
        <div className="py-6 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.18)' }}>
            © 2026 | Gávea Imobiliária | CRECI: 034466-J
          </p>
          <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.12)' }}>
            Desenvolvido por <span style={{ color: 'rgba(201,169,110,0.5)' }}>FlyTech Consulting</span>
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="h-[1px] w-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.2) 50%, transparent 100%)' }} />
    </footer>
  );
}
