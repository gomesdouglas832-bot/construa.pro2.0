import { supabase } from './supabase';

/**
 * Combina classes CSS condicionalmente
 */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formata números para exibição (ex: 1500 → 1.5k)
 */
export function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k';
  return String(n);
}

/**
 * Formata data para tempo relativo (ex: 2h, 3d)
 */
export function formatRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/**
 * Versão simplificada de tempo decorrido
 */
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

/**
 * Formata número de telefone
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Cria link do WhatsApp com mensagem personalizada
 */
export function buildWhatsappUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

/**
 * Gera iniciais do nome
 */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

// ✅ NOVA FUNÇÃO: Upload de imagem para o Supabase
/**
 * Faz upload de imagem para o armazenamento
 * @param arquivo Arquivo selecionado pelo usuário
 * @param pasta Nome da pasta: 'profiles' | 'portfolio' | 'stories'
 * @returns Objeto com URL pública ou mensagem de erro
 */
export async function uploadImagem(arquivo: File, pasta: 'profiles' | 'portfolio' | 'stories') {
  // Validação de formato permitido
  const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!formatosPermitidos.includes(arquivo.type)) {
    return { url: null, erro: 'Formato inválido! Use arquivos JPG, PNG ou WEBP.' };
  }

  // Validação de tamanho máximo
  const tamanhoMaxMB = pasta === 'portfolio' ? 10 : 5; // 10MB para portfólio, 5MB para os outros
  if (arquivo.size > tamanhoMaxMB * 1024 * 1024) {
    return { url: null, erro: `Arquivo muito grande! Tamanho máximo: ${tamanhoMaxMB}MB.` };
  }

  // Cria nome único para não sobrescrever arquivos
  const nomeArquivo = `${Date.now()}_${arquivo.name.replace(/\s+/g, '_')}`;

  // Envia para o armazenamento
  const { data, error } = await supabase.storage
    .from(pasta)
    .upload(nomeArquivo, arquivo, {
      cacheControl: '3600',
      upsert: true
    });

  if (error) {
    console.error('Erro no upload:', error);
    return { url: null, erro: 'Não foi possível enviar a imagem. Tente novamente.' };
  }

  // Pega a URL pública da imagem
  const { data: urlPublica } = supabase.storage
    .from(pasta)
    .getPublicUrl(nomeArquivo);

  return { url: urlPublica.publicUrl, erro: null };
}