export interface PlanDetail {
  id: string;
  name: string;
  price: number | null; // null = Gratis
  popular?: boolean;
  base?: string; // "Todo lo de X, más:"
  features: readonly string[];
}

export const PLAN_DETAILS: readonly PlanDetail[] = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    features: ['50 créditos/mes', '1 usuario', 'Chat RAG', 'Análisis de calidad básico'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 59.99,
    features: [
      '400 créditos/mes', 'Hasta 3 usuarios', 'Chat RAG',
      'Análisis rápido y exhaustivo', 'Análisis de estilo', 'Mejora de documentos con IA',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149.99,
    base: 'Todo lo de Starter, más:',
    features: [
      '1.500 créditos/mes', 'Hasta 5 usuarios',
      'Google Drive y OneDrive', 'Descuento en reanálisis',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 349.99,
    popular: true,
    base: 'Todo lo de Pro, más:',
    features: [
      '4.000 créditos/mes', 'Hasta 15 usuarios',
      'Panel de analítica', 'Precio variable en análisis exhaustivo', 'Agente IA autónomo',
    ],
  },
  {
    id: 'business_plus',
    name: 'Business+',
    price: 599.99,
    base: 'Todo lo de Business, más:',
    features: ['10.000 créditos/mes', 'Usuarios ilimitados', 'Soporte prioritario'],
  },
];
