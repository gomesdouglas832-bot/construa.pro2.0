import { useEffect, useState, useRef } from 'react';
import {
  Search, MapPin, ShieldCheck, Star, ArrowRight, Sparkles, TrendingUp, Users, HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, Building2, ChevronLeft, ChevronRight, X, Trophy, Flame
} from 'lucide-react';
import { supabase, type Profile, type Category, type Story, type StoryView } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { cn } from '../lib/utils';

const ICONS: Record<string, typeof HardHat> = {
  BrickWall: HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, HardHat,
};

// Tipo auxiliar para agrupar stories por usuário
type UserStories = {
  profile: Profile;
  stories: Story[];
  hasUnseen: boolean;
};

type Props = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: Props) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Profile[]>([]);
  const [topProfessionals, setTopProfessionals] = useState<Profile[]>([]);
  const [allStories, setAllStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  // Estados para o visualizador de stories
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true);
      const agora = new Date().toISOString();

      const [
        { data: cats },
        { data: profs },
        { data: top3 },
        { data: storiesRaw },
        visualizacoesResult
      ] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(6),
        supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .order('reviews_count', { ascending: false })
          .limit(3),
        supabase
          .from('stories')
          .select(`
            *,
            profiles:profile_id (
              id, full_name, avatar_url, rating, title, bio, city, state, whatsapp, verified, specialties, years_experience, is_active, created_at, updated_at
            )
          `)
          .eq('status', 'active')
          .gt('expires_at', agora)
          .order('created_at', { ascending: true }),
        user 
          ? supabase.from('story_views').select('story_id').eq('viewer_id', user.id)
          : Promise.resolve({ data: [] })
      ]);

      const visualizacoes = visualizacoesResult?.data || [];
      const idsVistos = new Set(visualizacoes.map(v => v.story_id));

      // Agrupa stories por usuário
      const groupedStories: UserStories[] = [];
      if (storiesRaw) {
        storiesRaw.forEach((story: any) => {
          const profile = story.profiles;
          if (!profile) return;

          const existente = groupedStories.find(u => u.profile.id === profile.id);
          if (existente) {
            existente.stories.push(story);
          } else {
            const temNaoVisto = !idsVistos.has(story.id);
            groupedStories.push({
              profile,
              stories: [story],
              hasUnseen: temNaoVisto
            });
          }
        });
      }

      setCategories(cats || []);
      setFeatured((profs as Profile[]) || []);
      setTopProfessionals((top3 as Profile[]) || []);
      setAllStories(groupedStories);
      setLoading(false);
    };

    carregarDados();
  }, [user]);

  function search(e: React.FormEvent) {
    e.preventDefault();
    onNavigate(`/explore?q=${encodeURIComponent(q)}`);
  }

  // Marca story como visto
  const marcarComoVisto = async (storyId: string) => {
    if (!user) return;
    try {
      await supabase
        .from('story_views')
        .upsert(
          { story_id: storyId, viewer_id: user.id },
          { onConflict: 'story_id, viewer_id' }
        );
    } catch (err) {
      console.log('Visualização já registrada:', err);
    }
  };

  // Controles do visualizador
  const abrirStories = async (userIndex: number) => {
    setActiveUserIndex(userIndex);
    setActiveStoryIndex(0);
    setStoryViewerOpen(true);
    iniciarTimer();

    const primeiroStory = allStories[userIndex].stories[0];
    await marcarComoVisto(primeiroStory.id);
  };

  const fecharStories = () => {
    setStoryViewerOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const proximoStory = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const usuarioAtual = allStories[activeUserIndex];

    if (activeStoryIndex < usuarioAtual.stories.length - 1) {
      const novoIndice = activeStoryIndex + 1;
      setActiveStoryIndex(novoIndice);
      await marcarComoVisto(usuarioAtual.stories[novoIndice].id);
    } else {
      if (activeUserIndex < allStories.length - 1) {
        const novoUsuario = activeUserIndex + 1;
        setActiveUserIndex(novoUsuario);
        setActiveStoryIndex(0);
        await marcarComoVisto(allStories[novoUsuario].stories[0].id);
      } else {
        fecharStories();
        return;
      }
    }
    iniciarTimer();
  };

  const storyAnterior = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(i => i - 1);
    } else {
      if (activeUserIndex > 0) {
        const usuarioAnterior = activeUserIndex - 1;
        setActiveUserIndex(usuarioAnterior);
        setActiveStoryIndex(allStories[usuarioAnterior].stories.length - 1);
      }
    }
    iniciarTimer();
  };

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(proximoStory, 5000);
  };

  return (
    <div className="min-h-screen bg-ink-950 noise-bg">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-400/5 blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12 lg:pt-16 lg:pb-16">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="amber" className="mb-4 animate-fade-in">
              <Sparkles size={12} /> Plataforma oficial
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight text-balance animate-slide-up">
              Onde a obra encontra o{' '}
              <span className="text-gradient-amber">profissional certo</span>.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-lighter leading-relaxed max-w-2xl mx-auto animate-slide-up">
              Conecte-se com pedreiros, engenheiros, arquitetos e especialistas da construção civil.
              Veja portfólios reais, confie em quem tem autoridade, e feche no WhatsApp.
            </p>

            {/* 🥇 SEÇÃO TOP 3 PROFISSIONAIS */}
            {!loading && topProfessionals.length > 0 && (
              <div className="mt-6 mb-6 animate-slide-up">
                <h3 className="text-sm text-muted mb-3">Melhores Avaliados</h3>
                <div className="flex justify-center gap-6">
                  {topProfessionals.map((pro, idx) => (
                    <button
                      key={pro.id}
                      onClick={() => onNavigate(`/p/${pro.id}`)}
                      className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                    >
                      <div className="relative">
                        <div className={cn(
                          'w-20 h-20 rounded-full p-1.5',
                          idx === 0 ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 animate-pulse' :
                          idx === 1 ? 'bg-gradient-to-tr from-gray-300 via-gray-200 to-gray-400' :
                          'bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800'
                        )}>
                          <Avatar 
                            src={pro.avatar_url} 
                            name={pro.full_name} 
                            size="lg" 
                            className="w-full h-full border-2 border-ink-900" 
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-ink-900 flex items-center justify-center">
                          {idx === 0 ? <Trophy size={14} className="text-amber-400" /> :
                           idx === 1 ? <Flame size={14} className="text-gray-200" /> :
                           <Flame size={14} className="text-amber-700" />}
                        </div>
                      </div>
                      <span className="text-xs text-white font-medium max-w-[80px] truncate text-center">{pro.full_name}</span>
                      <span className="text-xs text-amber-400 flex items-center gap-0.5">
                        <Star size={10} fill="currentColor" /> {Number(pro.rating || 0).toFixed(1)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BARRA DE PESQUISA */}
            <form onSubmit={search} className="max-w-xl mx-auto relative animate-slide-up">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="O que você precisa? Ex: pedreiro em São Paulo"
                className="w-full bg-ink-900/90 border border-ink-700 rounded-2xl pl-12 pr-32 py-4 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-2 focus:ring-amber-400/20 transition-all shadow-card"
              />
              <Button type="submit" size="md" className="absolute right-2 top-1/2 -translate-y-1/2" icon={<ArrowRight size={16} />}>
                Buscar
              </Button>
            </form>

            {/* 📱 SEÇÃO DE STORIES */}
            {!loading && allStories.length > 0 && (
              <div className="mt-6 mb-4 animate-slide-up">
                <h3 className="text-sm text-muted mb-3 text-left">Histórias</h3>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-ink-700 scrollbar-track-transparent">
                  {allStories.map((userStory, idx) => (
                    <button
                      key={userStory.profile.id}
                      onClick={() => abrirStories(idx)}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div className={cn(
                        'w-16 h-16 rounded-full p-1.5',
                        userStory.hasUnseen 
                          ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300' 
                          : 'bg-gray-600/60'
                      )}>
                        <Avatar 
                          src={userStory.profile.avatar_url} 
                          name={userStory.profile.full_name} 
                          size="md" 
                          className="w-full h-full border-2 border-ink-900" 
                        />
                      </div>
                      <span className="text-xs text-white max-w-[64px] truncate text-center">
                        {userStory.profile.full_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-400" /> Profissionais verificados</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> Avaliações reais</span>
              <span className="flex items-center gap-1.5"><Users size={14} className="text-amber-400" /> +1.200 profissionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Categorias</h2>
            <p className="text-sm text-muted mt-1.5">Encontre o especialista certo para cada etapa da obra.</p>
          </div>
          <button onClick={() => onNavigate('/explore')} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {categories.map((cat, i) => {
              const Icon = ICONS[cat.icon || ''] || HardHat;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(`/explore?cat=${cat.slug}`)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="card-surface p-5 text-left hover:border-amber-400/40 hover:bg-ink-850 group animate-slide-up"
                >
                  <div className="h-11 w-11 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-400 group-hover:text-ink-950 group-hover:border-amber-400 transition-all">
                    <Icon size={20} />
                  </div>
                  <p className="text-sm font-semibold text-white leading-tight">{cat.name}</p>
                  <p className="text-[11px] text-muted mt-1 flex items-center gap-1">
                    Ver profissionais <ArrowRight size={11} />
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* DESTAQUES */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="amber" className="mb-3"><TrendingUp size={12} /> Em destaque</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Profissionais com maior avaliação</h2>
            <p className="text-sm text-muted mt-1.5">Aqueles que entregam o que prometem.</p>
          </div>
          <button onClick={() => onNavigate('/explore')} className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : featured.length === 0 ? (
          <div className="card-surface p-10 text-center">
            <Building2 size={36} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">Ainda não há profissionais cadastrados. Seja o primeiro!</p>
            <Button className="mt-4" onClick={() => onNavigate('/signup')} icon={<HardHat size={15} />}>
              Cadastrar como profissional
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onNavigate(`/p/${p.id}`)}
                style={{ animationDelay: `${i * 50}ms` }}
                className="card-surface p-5 text-left hover:border-amber-400/40 hover:shadow-card group animate-slide-up"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={p.full_name} src={p.avatar_url} size="lg" ring />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                        {p.full_name}
                      </h3>
                      {p.verified && <ShieldCheck size={15} className="text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-light truncate">{p.title || 'Profissional da construção'}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                      {p.city && (
                        <span className="flex items-center gap-1"><MapPin size={11} /> {p.city}</span>
                      )}
                      <span className="flex items-center gap-1 text-amber-400">
                        <Star size={11} fill="currentColor" /> {Number(p.rating || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
                {p.specialties && p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {p.specialties.slice(0, 3).map((s) => (
                      <Badge key={s} variant="muted">{s}</Badge>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* CHAMADA PARA AÇÃO */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 p-8 sm:p-12">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-[100px]" />
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <Badge variant="amber" className="mb-4"><HardHat size={12} /> Para profissionais</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Sua vitrine trabalhando <span className="text-gradient-amber">24h por dia</span>.
              </h2>
              <p className="mt-4 text-muted-lighter leading-relaxed">
                Mostre seu portfólio, publique stories do dia a dia da obra e receba clientes
                qualificados direto no seu WhatsApp. Sem burocracia, sem intermediário.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => onNavigate('/signup')} icon={<ArrowRight size={16} />}>
                  Criar minha vitrine grátis
                </Button>
                <Button variant="outline" size="lg" onClick={() => onNavigate('/explore')}>
                  Ver exemplos
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Vitrine', value: '24h', icon: HardHat },
                { label: 'Cliques WA', value: '+1.2k', icon: Zap },
                { label: 'Avaliação', value: '4.9', icon: Star },
              ].map((s) => (
                <div key={s.label} className="card-surface p-4 text-center">
                  <s.icon size={18} className="text-amber-400 mx-auto mb-2" />
                  <p className="text-xl font-extrabold text-white">{s.value}</p>
                  <p className="text-[10px] text-muted uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 🖼️ VISUALIZADOR DE STORIES */}
      {storyViewerOpen && allStories[activeUserIndex] && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && fecharStories()}
        >
          <div className="relative w-full max-w-md h-[85vh] bg-ink-900 rounded-xl overflow-hidden">
            
            {/* Barras de progresso */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
              {allStories[activeUserIndex].stories.map((_, idx) => (
                <div key={idx} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                  <div 
                    className={cn(
                      'h-full bg-white transition-all',
                      idx === activeStoryIndex ? 'animate-[progress_5s_linear_forwards]' : idx < activeStoryIndex ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Cabeçalho */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar 
                  src={allStories[activeUserIndex].profile.avatar_url} 
                  name={allStories[activeUserIndex].profile.full_name} 
                  size="sm" 
                />
                <span className="text-white font-medium text-sm">
                  {allStories[activeUserIndex].profile.full_name}
                </span>
              </div>
              <button onClick={fecharStories} className="text-white hover:text-amber-400">
                <X size={20} />
              </button>
            </div>

            {/* Imagem do Story */}
            <img
              src={allStories[activeUserIndex].stories[activeStoryIndex].image_url}
              alt="Story"
              className="w-full h-full object-contain bg-black"
            />

            {/* Legenda */}
            {allStories[activeUserIndex].stories[activeStoryIndex].caption && (
              <div className="absolute bottom-10 left-0 right-0 px-4 py-3 bg-black/50 text-white text-sm text-center">
                {allStories[activeUserIndex].stories[activeStoryIndex].caption}
              </div>
            )}

            {/* Botões de navegação */}
            <button 
              onClick={storyAnterior}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              onClick={proximoStory}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2"
            >
              <ChevronRight size={32} />
            </button>

          </div>
        </div>
      )}

      {/* Animação da barra de progresso */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}