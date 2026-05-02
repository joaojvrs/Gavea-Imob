# LUMIÈRE | PRODUCT SPECIFICATION & CREATIVE SCOPE

## 1. BRIEFING EXECUTIVO
**Lumière** não é um portal imobiliário; é um destino digital de alto luxo. O produto foi concebido para o investidor e o comprador de alto padrão que valoriza não apenas o imóvel, mas a curadoria, a tecnologia e a exclusividade. Inspirado na estética da Apple e na precisão da Tesla, o projeto combina **Narrative-Driven Design** com Inteligência Artificial de ponta para transformar o processo de busca em uma jornada cinematográfica.

---

## 2. CONCEITO CRIATIVO: "The Narrative of Light"
A luz é o elemento central. O nome "Lumière" remete ao cinema e à iluminação arquitetônica. O site utiliza contrastes profundos, tipografia editorial e interações fluidas para guiar o usuário através de propriedades que são verdadeiras obras de arte.

---

## 3. IDENTIDADE VISUAL
*   **Aparência:** "Dark Premium Modern". Estética sólida, profunda e tecnologicamente avançada.
*   **Paleta de Cores:** 
    *   `Rich Black (#050505)`: Profundidade e luxo.
    *   `Pure White (#FFFFFF)`: Tipografia e clareza.
    *   `Lumière Gold (#C5A059)`: Detalhes de destaque e exclusividade.
    *   `Slate Gray (#2D2D2D)`: Camadas de Glassmorphism e profundidade.
*   **Tipografia:** 
    *   *Headlines:* "Outfit" ou "Space Grotesk" (Moderno/Futurista).
    *   *Body:* "Inter" (Precisão e legibilidade).

---

## 4. ESTRUTURA DO SITE & ARQUITETURA DE INFORMAÇÃO
1.  **Landing Page (The Premiere):** Impacto visual absoluto e curadoria.
2.  **Portfolio (The Collection):** Listagem inteligente com visual de galeria de arte.
3.  **Property Detail (The Masterpiece):** Foco sensorial e dados técnicos avançados.
4.  **AI Finder (The Visionary):** Interface de conversação natural para descoberta de imóveis.
5.  **Owner Console:** Dashboard minimalista para acompanhamento de valorização.

---

## 5. EXPERIÊNCIA DE SCROLL (The Narrative Flow)
O scroll não é apenas rolagem; é uma revelação progressiva.
*   **Sessão 1 para Sessão 2:** Transição de opacidade e zoom-out do vídeo Hero para o grid de destaques.
*   **Smooth Scroll:** Implementação de GSAP ScrollSmoother para sensação de peso e elegância.
*   **Parallax 3D:** Elementos de interface (UI) flutuam sutilmente sobre imagens de fundo.
*   **Progress Indicators:** Linhas minimalistas que acompanham o progresso da leitura.

---

## 6. LAYOUT DETALHADO (Desktop & Mobile)

### 6.1 Landing Page (Hero Section)
*   **Visual:** Vídeo cinematográfico 4K em fullscreen (input_file_0.mp4).
*   **Overlay:** Glassmorphism sutil na navbar.
*   **Headline:** "Onde o Luxo encontra o Futuro."
*   **CTA:** "Inicie sua jornada" com efeito de hover magnético.

### 6.2 Página de Listagem (The Collection)
*   **Grid:** Bento Box Layout. Cards de tamanhos variados para criar ritmo visual.
*   **Hover:** Ao passar o mouse, o card se expande levemente e um preview em vídeo (60fps) inicia automaticamente.
*   **Filtros:** "Filtros Invisíveis" - Uma IA que processa buscas semânticas (ex: "Casa com luz natural e vista para o mar em bairro silencioso").

### 6.3 Página Individual (The Masterpiece)
*   **Hero:** Imagem 360º ou vídeo de drone imersivo.
*   **Dados:** Infográficos dinâmicos mostrando o Score de Valorização local.
*   **IA Assistente:** Botão flutuante para perguntar detalhes específicos sobre o condomínio ou região.

---

## 7. INTELIGÊNCIA ARTIFICIAL (Vanguarda Tecnológica)
*   **Lumière AI Finder:** Interface estilo "Prompt-to-Property". O usuário descreve seu estilo de vida e a IA encontra a melhor correspondência.
*   **Score de Compatibilidade:** Algoritmo que analisa o perfil do usuário (através de cliques e interesses) e dá um percentual de "Match" com cada imóvel.
*   **Predição de Valorização:** Backend alimentado por IA (Supabase + Gemini/OpenAI) que analisa tendências de mercado e sugere o ROI futuro.

---

## 8. DESIGN SYSTEM & COMPONENTES
*   **Bordas:** `Rounded-2xl` (suavidade tecnológica).
*   **Sombras:** `Soft Glow` em vez de sombras pesadas e escuras.
*   **Glassmorphism:** `Background-blur` de 15px com borda branca de 0.5px e opacidade de 5%.
*   **Inputs:** Minimalistas, apenas uma linha que se transforma em um gradiente ao focar.

---

## 9. MOTION DESIGN & ANIMAÇÕES
*   **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (Curva de aceleração estilo Apple).
*   **Transitions:** Fade-in-up suave para cada nova seção.
*   **Microinterações:** Botões que reagem magneticamente ao cursor.
*   **Loading States:** Skeleton screens que brilham suavemente antes do conteúdo carregar.

---

## 10. STACK TECNOLÓGICA (Pronta para Supabase)
*   **Framework:** React 19 + Vite (Alta performance e HMR ativo).
*   **Styling:** Tailwind CSS 4.0.
*   **Database & Auth:** Supabase (PostgreSQL para dados complexos, Auth para leads).
*   **Animations:** Framer Motion (Interações de UI) + GSAP (Scroll sequence).
*   **AI Engine:** OpenAI / Gemini SDK.
*   **Routing:** React Router v7.

---

## 11. ESTRATÉGIA DE CONVERSÃO & LEADS
*   **Low-Friction Forms:** Captura de e-mail integrada na experiência da IA Finder.
*   **Private Tours:** Agendamento via calendário minimalista sincronizado em tempo real.
*   **Personalization:** O site lembra o nome do cliente e apresenta as listagens "Para você" na próxima visita.

---

## 12. ESTRUTURA PARA DESENVOLVIMENTO (PRÓXIMOS PASSOS)
*   **Fase 1:** Setup do Canvas 3D e Video Hero.
*   **Fase 2:** Integração do Supabase para Mock (Listagens).
*   **Fase 3:** Implementação do GSAP Scroll Sequence.
*   **Fase 4:** Camada de IA com Gemini/OpenAI para busca semântica.
