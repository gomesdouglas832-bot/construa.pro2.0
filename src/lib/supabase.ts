import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não encontradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// 📋 Tipos alinhados com exatamente a estrutura do seu banco
export type Profile = {
  id: string;
  full_name: string;
  title: string;
  bio: string;
  city: string;
  state: string;
  whatsapp: string;
  avatar_url: string | null;
  cover_url: string | null;
  specialties: string[];
  years_experience: number;
  verified: boolean;
  rating: number;
  reviews_count: number; // ✅ Adicionado para o ranking dos melhores
  is_active: boolean;
  created_at: string;
  updated_at: string;
  instagram: string | null;
};

export type PortfolioItem = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  image_url: string;
  category?: string; // ✅ Adicionado como opcional para não quebrar dados antigos
  created_at: string;
};

export type Story = {
  id: string;
  profile_id: string;
  image_url: string;
  caption: string | null; // ✅ Alterado para aceitar vazio/nulo
  status: string;
  expires_at: string;
  created_at: string;
  // ✅ Adicionado para trazer os dados do perfil junto na consulta
  profiles?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    rating: number;
  };
};

// ✅ NOVO: Tipo para controlar quais stories cada usuário já viu
export type StoryView = {
  id: string;
  story_id: string;
  viewer_id: string;
  viewed_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type ProfileView = {
  id: string;
  profile_id: string;
  viewer_source: string;
  created_at: string;
};

export type WhatsappClick = {
  id: string;
  profile_id: string;
  origin: string;
  created_at: string;
};

export type Plan = {
  id: string;
  name: string;
  price: number;
  features: {
    max_projects: number;
    stories: boolean;
  };
};

// ✅ Adicionei também o tipo para Avaliações, que usamos na página do perfil
export type Rating = {
  id: number;
  profile_id: string;
  reviewer_name: string;
  reviewer_phone: string;
  stars: number;
  comment: string;
  created_at: string;
};