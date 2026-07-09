import { useEffect, useState } from 'react';
import {
  MapPin, Star, ShieldCheck, MessageCircle, Briefcase, ArrowLeft, Share2, Image as ImageIcon, Clock,
} from 'lucide-react';
import { supabase, type Profile, type PortfolioItem, type Story } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { buildWhatsappUrl, formatRelative, cn } from '../lib/utils';

type Props = {
  id: string;
  onNavigate: (path: string) => void;
};

export function ProfessionalPage({ id, onNavigate }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeStory, setActiveStory] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null);

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

      const [p, s] = await Promise.all([
        supabase.from('portfolio_items').select('*').eq('profile_id', id).order('created_at', { ascending: false }),
        supabase
          .from('stories')
          .select('*')
          .eq('profile_id', id)
          .eq('status', 'active')
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(8),
      ]);
      setPortfolio((p.data as PortfolioItem[]) || []);
      setStories((s.data as Story[]) || []);
      setLoading(false);

      // fire-and-forget analytics
      supabase.from('profile_views').insert({ profile_id: id, viewer_source: 'marketplace' }).then();
    })();
  }, [id]);

  function trackWhatsapp() {
    supabase.from('whatsapp_clicks').insert({ profile_id: id, origin: 'profile' }).then();
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
      <div className="relative h-48 sm:h-64 overflow-hidden bg-ink-900">
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
            }}
          >
            Compartilhar
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile header */}
        <div className="relative -mt-20 sm:-mt-24 mb-8">
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
                <p className="text-base text-muted-lighter mt-1">{profile.title || 'Profissional da construção civil'}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted flex-wrap">
                  {profile.city && (
                    <span className="flex items-center gap-1.5"><MapPin size={14} className="text-amber-400" /> {profile.city}{profile.state ? `, ${profile.state}` : ''}</span>
                  )}
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <Star size={14} fill="currentColor" /> {Number(profile.rating).toFixed(1)}
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
                {profile.whatsapp && (
                  <p className="text-[11px] text-muted text-center sm:text-right">
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
                  <img src={s.image_url} alt={s.caption} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-2 left-2 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  {s.caption && (
                    <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-medium line-clamp-2">{s.caption}</p>
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

        {/* Final CTA */}
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

      {/* Story viewer */}
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

      {/* Portfolio lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage.image_url} alt={selectedImage.title} className="w-full max-h-[75vh] object-contain rounded-2xl" />
            <div className="mt-4 text-center">
              {selectedImage.title && <p className="text-base font-bold text-white">{selectedImage.title}</p>}
              {selectedImage.category && <p className="text-xs text-amber-400 mt-1">{selectedImage.category}</p>}
              {selectedImage.description && <p className="text-sm text-muted mt-2 max-w-lg mx-auto">{selectedImage.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
