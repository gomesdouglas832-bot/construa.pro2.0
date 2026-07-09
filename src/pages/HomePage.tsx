import { useEffect, useState } from 'react';
import {
  Search, MapPin, ShieldCheck, Star, ArrowRight, Sparkles, TrendingUp, Users, HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, Building2,
} from 'lucide-react';
import { supabase, type Profile, type Category } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';

const ICONS: Record<string, typeof HardHat> = {
  BrickWall: HardHat, Compass, Ruler, Zap, Wrench, PaintRoller, Hammer, Grid3x3, Layers, HardHat,
};

type Props = {
  onNavigate: (path: string) => void;
};

export function HomePage({ onNavigate }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const [{ data: cats }, { data: profs }] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase
          .from('profiles')
          .select('*')
          .eq('is_active', true)
          .order('rating', { ascending: false })
          .limit(6),
      ]);
      setCategories(cats || []);
      setFeatured((profs as Profile[]) || []);
      setLoading(false);
    })();
  }, []);

  function search(e: React.FormEvent) {
    e.preventDefault();
    onNavigate(`/explore?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="min-h-screen bg-ink-950 noise-bg">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-400/5 blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="amber" className="mb-6 animate-fade-in">
              <Sparkles size={12} /> Plataforma oficial
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight text-balance animate-slide-up">
              Onde a obra encontra o{' '}
              <span className="text-gradient-amber">profissional certo</span>.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-lighter leading-relaxed max-w-2xl mx-auto animate-slide-up">
              Conecte-se com pedreiros, engenheiros, arquitetos e especialistas da construção civil.
              Veja portfólios reais, confie em quem tem autoridade, e feche no WhatsApp.
            </p>

            <form onSubmit={search} className="mt-10 max-w-xl mx-auto relative animate-slide-up">
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

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-muted">
              <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-400" /> Profissionais verificados</span>
              <span className="flex items-center gap-1.5"><Star size={14} className="text-amber-400" /> Avaliações reais</span>
              <span className="flex items-center gap-1.5"><Users size={14} className="text-amber-400" /> +1.200 profissionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
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

      {/* FEATURED */}
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
                        <Star size={11} fill="currentColor" /> {Number(p.rating).toFixed(1)}
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

      {/* CTA */}
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
    </div>
  );
}
