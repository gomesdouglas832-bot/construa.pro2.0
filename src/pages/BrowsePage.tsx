import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, MapPin, Star, ShieldCheck, SlidersHorizontal, X, Building2, HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, Trophy, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, type Profile, type Category, type Story } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';

const ICONS: Record<string, typeof HardHat> = {
  BrickWall: HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, HardHat,
};

type UserStories = {
  profile: Profile;
  stories: Story[];
  hasUnseen: boolean;
};

type Props = {
  onNavigate: (path: string) => void;
  initialCategory?: string;
  initialQuery?: string;
};

type Sort = 'rating' | 'recent' | 'experience';

export function BrowsePage({ onNavigate, initialCategory, initialQuery }: Props) {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [topProfessionals, setTopProfessionals] = useState<Profile[]>([]);
  const [allStories, setAllStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQuery || '');
  const [activeCat, setActiveCat] = useState<string | undefined>(initialCategory);
  const [sort, setSort] = useState<Sort>('rating');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const itemsPerPage = 6;
  const [currentPage, setCurrentPage] = useState(1);

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeUserIndex, setActiveUserIndex] = useState(0);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const timerRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const agora = new Date().toISOString();

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true);

    if (activeCat) {
      const cat = categories.find((c) => c.slug === activeCat);
      if (cat) query = query.contains('specialties', [cat.name]);
    }

    if (q.trim()) {
      const termo = q.trim();
      query = query.or(`full_name.ilike.%${termo}%,title.ilike.%${termo}%,bio.ilike.%${termo}%`);
    }

    if (city.trim()) {
      query = query.ilike('city', `%${city.trim()}%`);
    }

    if (sort === 'rating') query = query.order('rating', { ascending: false });
    if (sort === 'recent') query = query.order('created_at', { ascending: false });
    if (sort === 'experience') query = query.order('years_experience', { ascending: false });

    const { data: profs } = await query;

    const { data: top3 } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_active', true)
      .gt('rating', 0)
      .order('rating', { ascending: false })
      .order('reviews_count', { ascending: false })
      .limit(3);

    const { data: storiesRaw } = await supabase
      .from('stories')
      .select(`*, profiles:profile_id (*)`)
      .eq('status', 'active')
      .gt('expires_at', agora)
      .order('created_at', { ascending: true });

    const { data: visualizacoes } = user
      ? await supabase.from('story_views').select('story_id').eq('viewer_id', user.id)
      : { data: [] };

    const idsVistos = new Set(visualizacoes?.map(v => v.story_id) || []);

    const groupedStories: UserStories[] = [];
    if (storiesRaw) {
      storiesRaw.forEach((story: any) => {
        const profile = story.profiles;
        if (!profile) return;
        const existente = groupedStories.find(u => u.profile.id === profile.id);
        if (existente) {
          existente.stories.push(story);
        } else {
          groupedStories.push({
            profile,
            stories: [story],
            hasUnseen: !idsVistos.has(story.id)
          });
        }
      });
    }

    setProfiles(profs || []);
    setTopProfessionals(top3 || []);
    setAllStories(groupedStories);
    setCurrentPage(1);
    setLoading(false);
  }, [activeCat, q, city, sort, categories, user]);

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => {
      setCategories(data || []);
    });
  }, []);

  useEffect(() => {
    setQ(initialQuery || '');
    setActiveCat(initialCategory);
  }, [initialQuery, initialCategory]);

  useEffect(() => {
    if (categories.length === 0) return;
    load();
  }, [load, categories.length]);

  const marcarComoVisto = async (storyId: string) => {
    if (!user) return;
    try {
      await supabase.from('story_views').upsert(
        { story_id: storyId, viewer_id: user.id },
        { onConflict: 'story_id,viewer_id' }
      );
    } catch (err) {
      console.log('Já registrado ou erro:', err);
    }
  };

  const abrirStories = async (userIndex: number) => {
    setActiveUserIndex(userIndex);
    setActiveStoryIndex(0);
    setStoryViewerOpen(true);
    iniciarTimer();
    await marcarComoVisto(allStories[userIndex].stories[0].id);
  };

  const fecharStories = () => {
    setStoryViewerOpen(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const proximoStory = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const atual = allStories[activeUserIndex];
    if (activeStoryIndex < atual.stories.length - 1) {
      const novo = activeStoryIndex + 1;
      setActiveStoryIndex(novo);
      await marcarComoVisto(atual.stories[novo].id);
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

  const storyAnterior = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(i => i - 1);
    } else if (activeUserIndex > 0) {
      const antigo = activeUserIndex - 1;
      setActiveUserIndex(antigo);
      setActiveStoryIndex(allStories[antigo].stories.length - 1);
    }
    iniciarTimer();
  };

  const iniciarTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(proximoStory, 5000);
  };

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    load();
  }

  function clearFilters() {
    setQ('');
    setCity('');
    setActiveCat(undefined);
    onNavigate('/explore');
  }

  const hasFilters = q || city || activeCat;
  const totalPages = Math.ceil(profiles.length / itemsPerPage);
  const paginatedProfiles = profiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold text-white">Explorar profissionais</h1>
          <p className="text-sm text-muted mt-1.5">Encontre o especialista certo para a sua obra.</p>
        </div>

        {/* 🥇 Melhores Avaliados - TEXTO CENTRALIZADO */}
        {!loading && topProfessionals.length > 0 && (
          <div className="mb-5">
            <h3 className="text-xs text-muted mb-3 text-center">Melhores Avaliados</h3>
            <div className="flex justify-center gap-6 flex-wrap">
              {topProfessionals.map((pro, idx) => (
                <button
                  key={pro.id}
                  onClick={() => onNavigate(`/p/${pro.id}`)}
                  className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
                  style={{ width: '70px' }}
                >
                  <div className="relative">
                    <div className={cn(
                      'w-14 h-14 rounded-full p-1',
                      idx === 0 ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 animate-pulse' :
                      idx === 1 ? 'bg-gradient-to-tr from-gray-300 via-gray-200 to-gray-400' :
                      'bg-gradient-to-tr from-amber-700 via-amber-600 to-amber-800'
                    )}>
                      <Avatar 
                        src={pro.avatar_url} 
                        name={pro.full_name} 
                        size="sm" 
                        className="w-full h-full border border-ink-900" 
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-ink-900 flex items-center justify-center">
                      {idx === 0 ? <Trophy size={10} className="text-amber-400" /> :
                       idx === 1 ? <Flame size={10} className="text-gray-200" /> :
                       <Flame size={10} className="text-amber-700" />}
                    </div>
                  </div>
                  <span className="text-xs text-white truncate w-full text-center">{pro.full_name.split(' ')[0]}</span>
                  <span className="text-xs text-amber-400 flex items-center justify-center gap-0.5 w-full">
                    <Star size={9} fill="currentColor" /> {Number(pro.rating || 0).toFixed(1)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 📱 Histórias */}
        {!loading && allStories.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs text-muted mb-3 text-center">Histórias</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 justify-center sm:justify-start">
              {allStories.map((userStory, idx) => (
                <button
                  key={userStory.profile.id}
                  onClick={() => abrirStories(idx)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                  style={{ width: '60px' }}
                >
                  <div className={cn(
                    'w-12 h-12 rounded-full p-1',
                    userStory.hasUnseen ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300' : 'bg-gray-600/60'
                  )}>
                    <Avatar 
                      src={userStory.profile.avatar_url} 
                      name={userStory.profile.full_name} 
                      size="sm" 
                      className="w-full h-full border border-ink-900" 
                    />
                  </div>
                  <span className="text-xs text-white truncate w-full text-center">{userStory.profile.full_name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Barra de busca e filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nome, serviço ou especialidade..."
              className="w-full bg-ink-900 border border-ink-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="rating">Melhor avaliados</option>
              <option value="recent">Mais recentes</option>
              <option value="experience">Mais experiência</option>
            </select>
            <Button
              variant="secondary"
              icon={<SlidersHorizontal size={14} />}
              onClick={() => setShowFilters((v) => !v)}
              className={cn(showFilters && 'border-amber-400/50 text-amber-400')}
            >
              Filtros
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="card-surface p-4 mb-5 rounded-lg animate-slide-up">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label-tag mb-1.5 block text-xs">Cidade</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: Sorriso"
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>
              <div className="flex items-end">
                {hasFilters ? (
                  <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : (
                  <p className="text-xs text-muted">Ajuste os filtros e a lista atualiza automaticamente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Categorias */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
          <button
            onClick={() => { setActiveCat(undefined); onNavigate('/explore'); }}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              !activeCat
                ? 'bg-amber-400 text-ink-950 border-amber-400'
                : 'bg-ink-900 text-muted-light border-ink-700 hover:border-ink-500',
            )}
          >
            Todas
          </button>
          {categories.map((c) => {
            const Icon = ICONS[c.icon || ''] || HardHat;
            const active = activeCat === c.slug;
            return (
              <button
                key={c.id}
                onClick={() => { setActiveCat(c.slug); onNavigate(`/explore?cat=${c.slug}`); }}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  active
                    ? 'bg-amber-400 text-ink-950 border-amber-400'
                    : 'bg-ink-900 text-muted-light border-ink-700 hover:border-ink-500',
                )}
              >
                <Icon size={12} /> {c.name}
              </button>
            );
          })}
        </div>

        {/* Lista de profissionais com paginação */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={<Building2 size={26} />}
            title="Nenhum profissional encontrado"
            description={hasFilters ? 'Tente ajustar ou limpar os filtros.' : 'Cadastre os primeiros profissionais no banco de dados!'}
            action={
              hasFilters ? (
                <Button variant="primary" onClick={clearFilters}>Limpar filtros</Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted mb-3 text-center">{profiles.length} profissional(is) encontrados • Página {currentPage} de {totalPages}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedProfiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate(`/p/${p.id}`)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="card-surface p-4 text-left hover:border-amber-400/40 hover:shadow-card group animate-slide-up rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={p.full_name} src={p.avatar_url} size="md" ring={p.verified} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                          {p.full_name}
                        </h3>
                        {p.verified && <ShieldCheck size={13} className="text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-light truncate">{p.title || 'Profissional da construção'}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                        {p.city && <span className="flex items-center gap-1"><MapPin size={10} /> {p.city}</span>}
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star size={10} fill="currentColor" /> {Number(p.rating || 0).toFixed(1)}
                        </span>
                        {p.years_experience > 0 && <span>{p.years_experience} anos exp.</span>}
                      </div>
                    </div>
                  </div>
                  {p.bio && (
                    <p className="text-xs text-muted mt-2 line-clamp-2 leading-relaxed">{p.bio}</p>
                  )}
                  {p.specialties && p.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="muted">{p.specialties.slice(0, 3).join(', ')}</Badge>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 📌 Paginação CORRIGIDA */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="text-white"
                >
                  Anterior
                </Button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <Button
  key={idx}
  onClick={() => setCurrentPage(idx + 1)}
  className={cn(
    "min-w-[36px] h-9 flex items-center justify-center border-none transition-colors",
    currentPage === idx + 1 
      ? "bg-amber-400 text-ink-950 font-medium" 
      : "bg-transparent text-white hover:bg-ink-800"
  )}
>
  {idx + 1}
</Button>
                ))}
                <Button
                  variant="secondary"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="text-white"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Visualizador de histórias */}
      {storyViewerOpen && allStories[activeUserIndex] && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" 
          onClick={(e) => e.target === e.currentTarget && fecharStories()}
        >
          <div className="relative w-full max-w-sm h-[80vh] bg-ink-900 rounded-lg overflow-hidden">
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

            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar 
                  src={allStories[activeUserIndex].profile.avatar_url} 
                  name={allStories[activeUserIndex].profile.full_name} 
                  size="sm" 
                />
                <span className="text-white text-xs font-medium">{allStories[activeUserIndex].profile.full_name}</span>
              </div>
              <button onClick={fecharStories} className="text-white hover:text-amber-400 transition-colors">
                <X size={18} />
              </button>
            </div>

            <img 
              src={allStories[activeUserIndex].stories[activeStoryIndex].image_url} 
              alt="História" 
              className="w-full h-full object-contain bg-black" 
            />

            {allStories[activeUserIndex].stories[activeStoryIndex].caption && (
              <div className="absolute bottom-8 left-0 right-0 px-3 py-2 bg-black/50 text-white text-xs text-center">
                {allStories[activeUserIndex].stories[activeStoryIndex].caption}
              </div>
            )}

            <button 
              onClick={storyAnterior} 
              className="absolute left-1 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={proximoStory} 
              className="absolute right-1 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}