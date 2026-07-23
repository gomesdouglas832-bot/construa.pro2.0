import { useEffect, useState } from 'react';
import {
  MapPin, Star, ShieldCheck, MessageCircle, Briefcase, ArrowLeft, Share2, Image as ImageIcon, Clock, Send, AlertCircle,
} from 'lucide-react';
import { supabase, type Profile, type PortfolioItem, type Story } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { buildWhatsappUrl, formatRelative, cn } from '../lib/utils';
import { Input, Textarea } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast'; // ✅ Importação correta do seu componente


type Props = {
  id: string;
  onNavigate: (path: string) => void;
};

type Rating = {
  id: number;
  reviewer_name: string;
  reviewer_phone: string;
  stars: number;
  comment: string;
  created_at: string;
};

export function ProfessionalPage({ id, onNavigate }: Props) {
  const { toast } = useToast(); // ✅ Agora usa o toast do seu sistema
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);

  const [reviewerName, setReviewerName] = useState('');
  const [reviewerPhone, setReviewerPhone] = useState('');
  const [selectedStars, setSelectedStars] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(data as Profile);

      const [p, s, r] = await Promise.all([
        supabase.from('portfolio_items').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
        supabase
          .from('stories')
          .select('*')
          .eq('profile_id', id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(8),
        supabase.from('ratings').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
      ]);

      setPortfolio((p.data as PortfolioItem[]) || []);
      setStories((s.data as Story[]) || []);
      setRatings((r.data as Rating[]) || []);

      const savedPhone = localStorage.getItem(`voted_${id}`);
      if (savedPhone) setHasVoted(true);

      setLoading(false);

      supabase.from('profile_views').insert({ profile_id: id, viewer_source: 'marketplace' }).then();
    })();
  }, [id]);

  function trackWhatsapp() {
    supabase.from('whatsapp_clicks').insert({ profile_id: id, origin: 'profile' }).then();
  }

  async function handleSubmitRating(e: React.FormEvent) {
    e.preventDefault();
    const phoneClean = reviewerPhone.replace(/\D/g, '');

    if (!reviewerName.trim()) return toast('Digite seu nome completo', 'error');
    if (phoneClean.length < 10) return toast('Digite um telefone válido', 'error');
    if (selectedStars < 1 || selectedStars > 5) return toast('Escolha uma nota de 1 a 5', 'error');

    setSubmitting(true);

    const { error } = await supabase.from('ratings').insert({
      profile_id: id,
      reviewer_name: reviewerName.trim(),
      reviewer_phone: phoneClean,
      stars: selectedStars,
      comment: comment.trim(),
    });

    setSubmitting(false);

    if (error) {
  if (error.code === '23505') {
    // Usamos "info" ou "success" no lugar de "warning"
    toast('Você já enviou uma avaliação para este profissional!', 'info');
    setHasVoted(true);
  } else {
    toast('Erro ao enviar avaliação: ' + error.message, 'error');
  }
  return;
}

    toast('Avaliação enviada com sucesso! ✅', 'success');
    localStorage.setItem(`voted_${id}`, phoneClean);
    setHasVoted(true);

    const { data: newRatings } = await supabase.from('ratings').select('*').eq('profile_id', id).order('created_at', { ascending: false });
    setRatings(newRatings || []);

    const { data: updatedProfile } = await supabase.from('profiles').select('rating').eq('id', id).single();
    if (updatedProfile) setProfile(prev => prev ? { ...prev, rating: updatedProfile.rating } : null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <Spinner size={36} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center px-4">
        <EmptyState
          icon={<ImageIcon size={28} />}
          title="Profissional não encontrado"
          description="A vitrine que você procura não existe ou foi removida."
          action={<Button onClick={() => onNavigate('/explore')} icon={<ArrowLeft size={15} />}>Voltar à exploração</Button>}
        />
      </div>
    );
  }

  const waUrl = buildWhatsappUrl(
    profile.whatsapp || '',
    `Olá ${profile.full_name}! Encontrei seu perfil no ObraLink e gostaria de um orçamento.`,
  );

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Cover */}
      {/* ALTERADO: altura aumentada (h-48/h-64 -> h-56/h-80) para a capa aparecer mais */}
      <div className="relative h-56 sm:h-80 overflow-hidden bg-ink-900">
        {profile.cover_url ? (
          <img src={profile.cover_url} alt="" className="h-full w-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 grid-bg opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink-950/40 to-ink-950" />
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />} onClick={() => onNavigate('/explore')}>
            Voltar
          </Button>
        </div>
        <div className="absolute top-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            icon={<Share2 size={14} />}
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              toast('Link copiado!', 'success');
            }}
          >
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        {/* ALTERADO: margem negativa reduzida (-mt-20/-mt-24 -> -mt-10/-mt-12) para o bloco sobrepor menos a capa */}
        <div className="relative -mt-10 sm:-mt-12 mb-8">
          <div className="card-surface p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar
                name={profile.full_name}
                src={profile.avatar_url}
                size="xl"
                ring={profile.verified}
                className="shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{profile.full_name}</h1>
  {profile.verified && (
    <Badge variant="amber" icon={<ShieldCheck size={12} />}>Verificado</Badge>
  )}
</div>

{/* ⭐ Estrelas abaixo do nome */}
<div className="flex items-center gap-1.5 my-2">
  {Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      size={16}
      className={i < Math.round(profile.rating || 0) ? "text-amber-400 fill-amber-400" : "text-gray-600"}
    />
  ))}
  <span className="text-sm text-muted-lighter ml-2">
    {Number(profile.rating || 0).toFixed(1)} ({ratings.length} avaliações)
  </span>
</div>

<p className="text-base text-muted-lighter">{profile.title || 'Profissional da construção civil'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted flex-wrap">
                  {profile.city && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-400" /> {profile.city}{profile.state ? `, ${profile.state}` : ''}</span>
                  )}
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Star size={14} fill="currentColor" /> {Number(profile.rating).toFixed(1)} ({ratings.length} avaliações)
                  </span>
                  {profile.years_experience > 0 && (
                    <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-amber-400" /> {profile.years_experience} anos de experiência</span>
                  )}
                </div>
                {profile.specialties && profile.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {profile.specialties.map((s) => (
                      <Badge key={s} variant="muted">{s}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-full sm:w-auto flex flex-col gap-2 sm:items-end">
                {profile.whatsapp ? (
  <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={trackWhatsapp}>
    <Button size="lg" icon={<MessageCircle size={18} />} className="w-full sm:w-auto animate-pulse-glow">
      Falar no WhatsApp
    </Button>
  </a>
) : (
  <Button size="lg" disabled className="w-full sm:w-auto">Sem contato direto</Button>
)}

{/* 📸 Botão Instagram — só aparece se preenchido */}
{profile.instagram && profile.instagram.trim() !== '' && (
  <a 
    href={`https://instagram.com/${profile.instagram.replace('@', '').trim()}`} 
    target="_blank" 
    rel="noopener noreferrer"
    className="mt-2 block"
  >
    <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
      Ver Instagram
    </Button>
  </a>
)}

{profile.whatsapp && (
  <p className="text-[11px] text-muted text-center sm:text-right mt-2">
    Resposta direta, sem intermediário
  </p>
)}
              
              </div>
            </div>
          </div>
        </div>

        {/* Stories */}
        {stories.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-amber-400" /> Stories
              </h2>
              <span className="text-xs text-muted">Bastidores da obra</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {stories.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setActiveStory(i)}
                  className="shrink-0 w-24 h-36 rounded-2xl overflow-hidden border border-ink-700 hover:border-amber-400/50 transition-all relative group"
                >
                  <img 
  src={s.image_url} 
  alt={s.caption ?? ""} 
  className="h-full w-full object-cover group-hover:scale-105 transition-transform" 
/>
<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
<div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
{s.caption && (
  <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-medium line-clamp-2">
    {s.caption}
  </p>
)}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bio */}
        {profile.bio && (
          <section className="mb-10">
            <div className="card-surface p-6">
              <h2 className="text-lg font-bold text-white mb-3">Sobre</h2>
              <p className="text-sm text-muted-lighter leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </div>
          </section>
        )}

        {/* Portfolio */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ImageIcon size={18} className="text-amber-400" /> Portfólio
            </h2>
            <span className="text-xs text-muted">{portfolio.length} projeto(s)</span>
          </div>
          {portfolio.length === 0 ? (
            <div className="card-surface p-8">
              <EmptyState
                icon={<ImageIcon size={26} />}
                title="Ainda sem projetos publicados"
                description="Este profissional ainda não adicionou fotos ao portfólio."
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {portfolio.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedImage(item)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className={cn(
                    'group relative aspect-square rounded-2xl overflow-hidden border border-ink-700 hover:border-amber-400/50 transition-all animate-fade-in',
                    i === 0 && 'col-span-2 sm:col-span-1',
                  )}
                >
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-semibold text-white line-clamp-1">{item.title || 'Projeto'}</p>
                    {item.category && <p className="text-[10px] text-amber-400 mt-0.5">{item.category}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Avaliações */}
        <section className="mb-12">
          <div className="card-surface p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Star size={18} className="text-amber-400" /> Avaliações
            </h2>

            {!hasVoted ? (
              <form onSubmit={handleSubmitRating} className="mb-8 p-5 border border-ink-700 rounded-xl bg-ink-900/50">
                <h3 className="text-sm font-semibold text-white mb-4">Deixe sua avaliação</h3>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <Input
                    label="Seu nome completo"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    required
                  />
                  <Input
                    label="Seu telefone"
                    type="tel"
                    value={reviewerPhone}
                    onChange={(e) => setReviewerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs text-muted mb-2 block">Nota (de 1 a 5 estrelas)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSelectedStars(n)}
                        className={cn(
                          'p-1 transition-transform hover:scale-110',
                          n <= selectedStars ? 'text-amber-400' : 'text-ink-600'
                        )}
                      >
                        <Star size={22} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="Comentário (opcional)"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Conte como foi o atendimento e o serviço prestado..."
                />

                <Button
                  type="submit"
                  icon={<Send size={15} />}
                  loading={submitting}
                  className="mt-4"
                >
                  Enviar avaliação
                </Button>
              </form>
            ) : (
              <div className="flex items-center gap-2 p-3 mb-6 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                <AlertCircle size={16} className="text-amber-400" />
                <p className="text-sm text-amber-200">Você já enviou sua avaliação para este profissional. Obrigado!</p>
              </div>
            )}

            {ratings.length === 0 ? (
              <EmptyState
                icon={<Star size={24} />}
                title="Nenhuma avaliação ainda"
                description="Seja o primeiro a avaliar este profissional!"
              />
            ) : (
              <div className="space-y-5">
                {ratings.map((r) => (
                  <div key={r.id} className="border-b border-ink-800 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.reviewer_name} size="sm" />
                        <span className="text-sm font-medium text-white">{r.reviewer_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={i < r.stars ? 'text-amber-400' : 'text-ink-600'}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-muted-lighter pl-9">{r.comment}</p>
                    )}
                    <p className="text-[10px] text-muted mt-1 pl-9">{formatRelative(r.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Final */}
        {profile.whatsapp && (
          <section className="mb-16">
            <div className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-br from-ink-900 to-ink-850 p-8 text-center">
              <div className="absolute -top-20 -right-20 h-48 w-48 rounded-full bg-amber-400/10 blur-[80px]" />
              <div className="relative">
                <h3 className="text-xl font-bold text-white">Pronto para começar sua obra?</h3>
                <p className="text-sm text-muted mt-2 max-w-md mx-auto">
                  Fale diretamente com {profile.full_name.split(' ')[0]} e tire suas dúvidas sem compromisso.
                </p>
                <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={trackWhatsapp} className="inline-block mt-5">
                  <Button size="lg" icon={<MessageCircle size={18} />}>Solicitar orçamento agora</Button>
                </a>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Visualizador de Stories */}
      {activeStory !== null && stories[activeStory] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveStory(null)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-sm">Fechar</button>
          <div className="max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative rounded-2xl overflow-hidden">
              <img src={stories[activeStory].image_url} alt="" className="w-full max-h-[70vh] object-contain" />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={profile.full_name} src={profile.avatar_url} size="sm" />
                  <span className="text-sm font-semibold text-white">{profile.full_name}</span>
                  <span className="text-xs text-muted">· {formatRelative(stories[activeStory].created_at)} atrás</span>
                </div>
                {stories[activeStory].caption && (
                  <p className="text-sm text-white">{stories[activeStory].caption}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Imagens do Portfólio */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
           <div className="mt-4 text-center">
  {selectedImage.title && <p className="text-base font-bold text-white">{selectedImage.title}</p>}
  {/* Verifica se o campo existe e não está vazio antes de exibir */}
  {selectedImage.category && selectedImage.category.trim() !== '' && (
    <p className="text-xs text-amber-400 mt-1">{selectedImage.category}</p>
  )}
  {selectedImage.description && <p className="text-sm text-muted mt-2 max-w-lg mx-auto">{selectedImage.description}</p>}
</div>
          </div>
        </div>
      )}
    </div>
  );
}