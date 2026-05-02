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
  }
];
