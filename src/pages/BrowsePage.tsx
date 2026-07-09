import { useEffect, useState, useCallback } from 'react';
import { Search, MapPin, Star, ShieldCheck, SlidersHorizontal, X, Building2, HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers } from 'lucide-react';
import { supabase, type Profile, type Category } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/utils';

const ICONS: Record<string, typeof HardHat> = {
  BrickWall: HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, HardHat,
};

type Props = {
  onNavigate: (path: string) => void;
  initialCategory?: string;
  initialQuery?: string;
};

type Sort = 'rating' | 'recent' | 'experience';

export function BrowsePage({ onNavigate, initialCategory, initialQuery }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQuery || '');
  const [activeCat, setActiveCat] = useState<string | undefined>(initialCategory);
  const [sort, setSort] = useState<Sort>('rating');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').eq('is_active', true);
    if (activeCat) {
      const cat = categories.find((c) => c.slug === activeCat);
      if (cat) query = query.contains('specialties', [cat.name]);
    }
    if (q.trim()) {
      query = query.or(`full_name.ilike.%${q.trim()}%,title.ilike.%${q.trim()}%,bio.ilike.%${q.trim()}%`);
    }
    if (city.trim()) {
      query = query.ilike('city', `%${city.trim()}%`);
    }
    if (sort === 'rating') query = query.order('rating', { ascending: false });
    if (sort === 'recent') query = query.order('created_at', { ascending: false });
    if (sort === 'experience') query = query.order('years_experience', { ascending: false });
    const { data } = await query.limit(60);
    setProfiles((data as Profile[]) || []);
    setLoading(false);
  }, [activeCat, q, city, sort, categories]);

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

  return (
    <div className="min-h-screen bg-ink-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white">Explorar profissionais</h1>
          <p className="text-sm text-muted mt-1.5">Encontre o especialista certo para a sua obra.</p>
        </div>

        {/* Search + filter toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={submitSearch} className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nome, serviço ou especialidade..."
              className="w-full bg-ink-900 border border-ink-700 rounded-[10px] pl-10 pr-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
            />
          </form>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="bg-ink-900 border border-ink-700 rounded-[10px] px-3 py-3 text-sm text-white focus:outline-none focus:border-amber-400/60"
            >
              <option value="rating">Melhor avaliados</option>
              <option value="recent">Mais recentes</option>
              <option value="experience">Mais experiência</option>
            </select>
            <Button
              variant="secondary"
              icon={<SlidersHorizontal size={15} />}
              onClick={() => setShowFilters((v) => !v)}
              className={cn(showFilters && 'border-amber-400/50 text-amber-400')}
            >
              Filtros
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="card-surface p-5 mb-6 animate-slide-up">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label-tag mb-2 block">Cidade</label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-ink-900 border border-ink-700 rounded-[10px] pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60"
                  />
                </div>
              </div>
              <div className="flex items-end">
                {hasFilters ? (
                  <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
                    Limpar filtros
                  </Button>
                ) : (
                  <p className="text-xs text-muted">Ajuste os filtros e a lista atualiza automaticamente.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          <button
            onClick={() => { setActiveCat(undefined); onNavigate('/explore'); }}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all',
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
                  'shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all',
                  active
                    ? 'bg-amber-400 text-ink-950 border-amber-400'
                    : 'bg-ink-900 text-muted-light border-ink-700 hover:border-ink-500',
                )}
              >
                <Icon size={13} /> {c.name}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={36} /></div>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={<Building2 size={28} />}
            title="Nenhum profissional encontrado"
            description={hasFilters ? 'Tente ajustar ou limpar os filtros.' : 'Seja o primeiro a se cadastrar!'}
            action={
              hasFilters ? (
                <Button onClick={clearFilters}>Limpar filtros</Button>
              ) : (
                <Button onClick={() => onNavigate('/signup')}>Cadastrar como profissional</Button>
              )
            }
          />
        ) : (
          <>
            <p className="text-xs text-muted mb-4">{profiles.length} profissional(is) encontrados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate(`/p/${p.id}`)}
                  style={{ animationDelay: `${i * 30}ms` }}
                  className="card-surface p-5 text-left hover:border-amber-400/40 hover:shadow-card group animate-slide-up"
                >
                  <div className="flex items-start gap-4">
                    <Avatar name={p.full_name} src={p.avatar_url} size="lg" ring={p.verified} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {p.full_name}
                        </h3>
                        {p.verified && <ShieldCheck size={14} className="text-amber-400 shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-light truncate">{p.title || 'Profissional da construção'}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                        {p.city && <span className="flex items-center gap-1"><MapPin size={11} /> {p.city}</span>}
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star size={11} fill="currentColor" /> {Number(p.rating).toFixed(1)}
                        </span>
                        {p.years_experience > 0 && <span>{p.years_experience} anos exp.</span>}
                      </div>
                    </div>
                  </div>
                  {p.bio && (
                    <p className="text-xs text-muted mt-4 line-clamp-2 leading-relaxed">{p.bio}</p>
                  )}
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
          </>
        )}
      </div>
    </div>
  );
}
