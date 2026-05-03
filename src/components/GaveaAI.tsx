import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Send, MessageSquare, Info, MapPin, Building } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
}

const PRESET_QUESTIONS = [
  { id: '1', text: "Como é o estilo de vida neste bairro?", icon: MapPin },
  { id: '2', text: "Busque residências com arquitetura minimalista.", icon: Sparkles },
  { id: '3', text: "Quais imóveis possuem as melhores vistas?", icon: Building },
  { id: '4', text: "Me fale sobre as opções de lazer premium.", icon: Info },
];

const WEBHOOK_URL = "https://webhook.saveautomatik.shop/webhook/gavea";

export default function GaveaAI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      text: text.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text.trim(),
          timestamp: new Date().toISOString(),
          context: "gavea_ai_chat"
        }),
      });

      if (!response.ok) throw new Error('Falha na comunicação');

      // Since we don't know the exact response format of the user's webhook, 
      // we'll simulate a generic acknowledgment if it returns 200 but no body,
      // or handle JSON if present.
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      const aiResponseText = data?.reply || data?.message || "Obrigado por sua pergunta! Nossa curadoria inteligente está processando seu pedido e entrará em contato em breve com os detalhes mais exclusivos.";

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: aiResponseText
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Erro no webhook:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        text: "Desculpe, tive um pequeno problema técnico. Por favor, tente novamente em alguns instantes."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="visionary" className="py-24 px-6 md:px-12 relative overflow-hidden bg-brand-bg scroll-mt-20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/10 blur-[160px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent/10 text-brand-accent text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Especialista Digital em Curadoria
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.3, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.12 }}
            className="text-4xl md:text-6xl font-display font-bold tracking-tighter mb-6 leading-tight text-brand-blue"
          >
            Inteligência ao seu serviço. <br />
            <span className="text-brand-accent italic font-light">Seu novo lar, descoberto.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.26 }}
            className="text-brand-blue/50 text-xl font-light max-w-2xl mx-auto italic leading-relaxed"
          >
            Nossa inteligência entende as nuances do seu estilo de vida para sugerir propriedades que realmente importam.
          </motion.p>
        </div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.38 }}
          className="bg-white/80 backdrop-blur-xl border border-brand-blue/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-brand-blue/10 flex flex-col min-h-[400px] md:min-h-[500px] max-h-[600px] md:max-h-[700px]"
        >
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-5 md:p-10 space-y-4 md:space-y-6 no-scrollbar">
            <AnimatePresence initial={false}>
              {messages.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-4 px-4"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-slate rounded-full flex items-center justify-center text-brand-accent">
                    <MessageSquare size={24} className="md:w-8 md:h-8" />
                  </div>
                  <p className="text-brand-blue/40 font-light text-sm md:text-base">
                    Como posso ajudar você a encontrar o seu próximo endereço icônico? <br className="hidden md:block" /> Escolha uma sugestão ou escreva abaixo.
                  </p>
                </motion.div>
              )}
              
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex w-full mb-4",
                    m.type === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] px-4 py-3 md:px-6 md:py-4 rounded-[1.2rem] md:rounded-[1.5rem]",
                    m.type === 'user' 
                      ? "bg-brand-blue text-white rounded-tr-none" 
                      : "bg-brand-slate text-brand-blue rounded-tl-none shadow-sm"
                  )}>
                    <p className="text-xs md:text-base font-light leading-relaxed">
                      {m.text}
                    </p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start mb-4"
                >
                  <div className="bg-brand-slate px-6 py-4 rounded-[1.5rem] rounded-tl-none">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-brand-accent rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Questions Bar */}
          {messages.length === 0 && (
            <div className="px-6 pb-6 mt-auto">
              <div className="flex flex-wrap gap-2 justify-center">
                {PRESET_QUESTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => handleSend(q.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-brand-blue/5 bg-white text-brand-blue/60 text-xs font-medium hover:border-brand-accent hover:text-brand-accent transition-all duration-300 shadow-sm"
                  >
                    <q.icon size={14} />
                    {q.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 md:p-6 bg-brand-slate/30 border-t border-brand-blue/5">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
                placeholder="Descreva seu estilo de vida..."
                className="w-full bg-white border border-brand-blue/10 rounded-full py-3.5 md:py-4 pl-6 md:pl-8 pr-14 md:pr-16 text-xs md:text-sm font-light focus:outline-none focus:ring-2 focus:ring-brand-accent/20 transition-all placeholder:text-brand-blue/30 shadow-inner"
              />
              <button 
                onClick={() => handleSend(input)}
                disabled={!input.trim() || isLoading}
                className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 bg-brand-blue text-white p-2.5 md:p-3 rounded-full hover:bg-brand-accent transition-all duration-300 disabled:opacity-50 disabled:hover:bg-brand-blue"
              >
                <Send size={16} className="md:w-[18px] md:h-[18px]" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
