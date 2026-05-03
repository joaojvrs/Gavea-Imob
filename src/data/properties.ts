export interface Property {
  id: string;
  type: string; // e.g., 'Cobertura', 'Apartamento'
  title: string;
  location: string;
  neighborhood: string;
  city: string;
  state: string;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  suites: number;
  price?: string; // Not provided in text, but good to have
  description: string;
  features: string[];
  infrastructure: string[];
  lazer: string[];
  matchScore: number;
  image: string;
  gallery?: string[];
  tour360?: string[];
}

export const PROPERTIES: Property[] = [
  {
    id: "ponta-da-praia-cobertura",
    type: "Cobertura",
    title: "Cobertura Duplex Frente Mar",
    location: "Ponta da Praia - Santos/SP",
    neighborhood: "Ponta da Praia",
    city: "Santos",
    state: "SP",
    area: 302,
    bedrooms: 4,
    bathrooms: 5,
    parking: 4,
    suites: 4,
    description: "Cobertura duplex frente mar no bairro Ponta da Praia, uma das regiões mais desejadas de Santos. Vista frontal para o mar e canal do porto.",
    features: [
      "Vista frontal para o mar",
      "Persianas de enrolar automatizadas",
      "Varanda com ponto de TV e churrasqueira a gás",
      "Entradas social e de serviço independentes",
      "Infraestrutura para ar-condicionado",
      "Varanda técnica"
    ],
    infrastructure: [
      "Empreendimento Ilhas Resort | Torre Bali",
      "Portaria e segurança 24h",
      "Acesso eletrônico",
      "Sistema de monitoramento",
      "Espaço delivery",
      "Carregamento para carro elétrico"
    ],
    lazer: [
      "Piscina de areia",
      "Piscinas adulto e infantil",
      "Espaços de convivência equipados",
      "Áreas comuns sofisticadas"
    ],
    matchScore: 98.2,
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=2000"
  },
  {
    id: "gonzaga-apartamento",
    type: "Apartamento",
    title: "Apartamento Sofisticado no Gonzaga",
    location: "Gonzaga - Santos/SP",
    neighborhood: "Gonzaga",
    city: "Santos",
    state: "SP",
    area: 169,
    bedrooms: 3,
    bathrooms: 5,
    parking: 3,
    suites: 3,
    description: "Localizado no coração do Gonzaga, este apartamento oferece uma planta funcional e sofisticada com sol nascente e excelente iluminação natural.",
    features: [
      "Sala para três ambientes",
      "Home office integrado",
      "Cozinha moderna com ilha",
      "Dependência de serviço convertida em despensa",
      "Duas entradas (social e serviço)",
      "Opção porteira fechada"
    ],
    infrastructure: [
      "Portaria 24 horas",
      "Gás canalizado",
      "Área de serviço independente"
    ],
    lazer: [
      "Academia equipada",
      "Salão de festas",
      "Sauna seca e molhada"
    ],
    matchScore: 95.7,
    image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&q=80&w=2000"
  },
  {
    id: "boqueirao-apartamento",
    type: "Apartamento",
    title: "Exclusividade no Boqueirão",
    location: "Boqueirão - Santos/SP",
    neighborhood: "Boqueirão",
    city: "Santos",
    state: "SP",
    area: 270,
    bedrooms: 3,
    bathrooms: 4,
    parking: 2,
    suites: 3,
    description: "Apartamento de altíssimo padrão com vista deslumbrante para o mar. Privacidade absoluta com 1 unidade por andar.",
    features: [
      "1 unidade por andar",
      "Suíte master com walk-in closet",
      "Living imponente para 3 ambientes",
      "Sala de TV privativa",
      "Home office reservado",
      "Cozinha gourmet",
      "Automação inteligente com keypads",
      "Marcenaria premium"
    ],
    infrastructure: [
      "Andar alto",
      "Vista Mar definitiva",
      "Vagas demarcadas livres"
    ],
    lazer: [
      "Lounge privativo",
      "Espaço gourmet"
    ],
    matchScore: 99.1,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=2000"
  },
  {
    id: "tour-360-premium",
    type: "Experiência 360",
    title: "Tour 360 Premium - Residência Imersiva",
    location: "Estúdio Imersivo - Santos/SP",
    neighborhood: "Tour 360",
    city: "Santos",
    state: "SP",
    area: 340,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    suites: 3,
    price: "R$ 14.500.000",
    description: "Uma residência concebida para visitas remotas premium com tour 360 completo de alta resolução. Ideal para apresentações digitais de alto padrão e imersões virtuais.",
    features: [
      "Tour 360 integrado com imagens de altíssima qualidade",
      "Sala de cinema e lounge tecnológico",
      "Cozinha gourmet com ilha central",
      "Suíte master com closet e hidromassagem",
      "Home office com infraestrutura AV premium",
      "Automação residencial e iluminação cênica"
    ],
    infrastructure: [
      "Portaria 24 horas",
      "Wi-Fi fibra óptica em toda a casa",
      "Sala técnica para equipamentos audiovisuais",
      "Garagem com 3 vagas dedicadas",
      "Gerador de energia de reserva"
    ],
    lazer: [
      "Cinema privado",
      "Espaço fitness",
      "Deck gourmet com churrasqueira",
      "Terraço panorâmico com vista privilegiada"
    ],
    matchScore: 99.5,
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=2000&q=90",
    gallery: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=90",
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1600&q=90",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1600&q=90"
    ],
    tour360: [
      "/property-tour/360/DSCN0009.JPG",
      "/property-tour/360/DSCN0010.JPG",
      "/property-tour/360/DSCN0011.JPG",
      "/property-tour/360/DSCN0012.JPG",
      "/property-tour/360/DSCN0013.JPG"
    ]
  }
];
