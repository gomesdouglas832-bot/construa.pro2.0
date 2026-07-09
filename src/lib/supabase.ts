import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

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
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PortfolioItem = {
  id: string;
  profile_id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  created_at: string;
};

export type Story = {
  id: string;
  profile_id: string;
  image_url: string;
  caption: string;
  status: string;
  expires_at: string;
  created_at: string;
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