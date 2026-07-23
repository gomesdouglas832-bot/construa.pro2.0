import { useEffect, useState, useMemo } from 'react';
import {
  Eye, MessageCircle, Image as ImageIcon, Clock, TrendingUp, ArrowUpRight, ArrowRight, ShieldCheck, AlertCircle, Star, MapPin, Briefcase,
} from 'lucide-react';
import { supabase, type Profile, type PortfolioItem, type Story, type ProfileView, type WhatsappClick } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { formatNumber, formatRelative, cn } from '../lib/utils';

type Props = { onNavigate: (path: string) => void };

export function DashboardPage({ onNavigate }: Props) {
  const { user, profile } = useAuth();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [clicks, setClicks] = useState<WhatsappClick[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [v, c, p, s] = await Promise.all([
        supabase.from('profile_views').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('whatsapp_clicks').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('portfolio_items').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
        supabase.from('stories').select('*').eq('profile_id', user.id).order('created_at', { ascending: false }),
      ]);
      setViews((v.data as ProfileView[]) || []);
      setClicks((c.data as WhatsappClick[]) || []);
      setPortfolio((p.data as PortfolioItem[]) || []);
      setStories((s.data as Story[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const stats = useMemo(() => {
    const now = new Date();
    const dayMs = 86400000;
    const views7 = views.filter((v) => now.getTime() - new Date(v.created_at).getTime() < 7 * dayMs).length;
    const views30 = views.filter((v) => now.getTime() - new Date(v.created_at).getTime() < 30 * dayMs).length;
    const clicks7 = clicks.filter((c) => now.getTime() - new Date(c.created_at).getTime() < 7 * dayMs).length;
    const clicks30 = clicks.filter((c) => now.getTime() - new Date(c.created_at).getTime() < 30 * dayMs).length;
    const conversion = views30 > 0 ? (clicks30 / views30) * 100 : 0;
    return { views7, views30, clicks7, clicks30, totalViews: views.length, totalClicks: clicks.length, conversion };
  }, [views, clicks]);

  // Build last-7-days chart data
  const chartData = useMemo(() => {
    const days: { label: string; views: number; clicks: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - i);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      const dayViews = views.filter((v) => {
        const t = new Date(v.created_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length;
      const dayClicks = clicks.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= day.getTime() && t < next.getTime();
      }).length;
      days.push({
        label: day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
        views: dayViews,
        clicks: dayClicks,
      });
    }
    return days;
  }, [views, clicks]);

  const maxBar = Math.max(...chartData.map((d) => Math.max(d.views, d.clicks)), 1);

  if (loading) {
    return (
      <DashboardLayout active="dashboard" onNavigate={onNavigate}>
        <div className="flex justify-center py-20"><Spinner size={36} /></div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout active="dashboard" onNavigate={onNavigate}>
        <EmptyState
          icon={<AlertCircle size={28} />}
          title="Perfil não encontrado"
          description="Não foi possível carregar seu perfil. Tente sair e entrar novamente."
          action={<Button onClick={() => onNavigate('/signin')}>Ir para login</Button>}
        />
      </DashboardLayout>
    );
  }

  const completion = profileCompletion(profile, portfolio.length, stories.length);

  return (
    <DashboardLayout active="dashboard" onNavigate={onNavigate}>
      <DashboardHeader
        title={`Olá, ${profile.full_name.split(' ')[0]}!`}
        description="Veja como sua vitrine está performando."
        action={
          <Button variant="secondary" icon={<ArrowRight size={15} />} onClick={() => onNavigate(`/p/${profile.id}`)}>
            Ver vitrine pública
          </Button>
        }
      />
      {/* 📌 AQUI VOCÊ COLOCA O AVISO LOGO ABAIXO DE STORIES */}
  <div className="px-3 py-2 mt-4 border-t border-ink-800">
    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
      <AlertCircle size={16} />
      <span>Acesso gratuito — use todas as funcionalidades por tempo determinado</span>
    </div>
  </div>


      {/* Profile completion banner */}
      {completion < 100 && (
        <div className="card-surface p-5 mb-6 border-amber-400/30">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm font-semibold text-white">Seu perfil está {completion}% completo</p>
                <Button size="sm" onClick={() => onNavigate('/dashboard/profile')}>Completar agora</Button>
              </div>
              <div className="mt-3 h-2 rounded-full bg-ink-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-2">Perfis completos recebem até 3x mais contatos.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Eye size={18} />}
          label="Visitas (7 dias)"
          value={stats.views7}
          sub={`${stats.views30} no mês`}
          accent
        />
        <StatCard
          icon={<MessageCircle size={18} />}
          label="Cliques WhatsApp (7 dias)"
          value={stats.clicks7}
          sub={`${stats.clicks30} no mês`}
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Conversão"
          value={`${stats.conversion.toFixed(0)}%`}
          sub="cliques / visitas"
        />
        <StatCard
          icon={<ImageIcon size={18} />}
          label="Projetos no portfólio"
          value={portfolio.length}
          sub={`${stories.length} stories`}
        />
      </div>

      {/* Chart */}
      <div className="card-surface p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Atividade dos últimos 7 dias</h2>
            <p className="text-xs text-muted mt-1">Visitas e cliques no WhatsApp por dia</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Visitas</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> Cliques</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-44">
          {chartData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex items-end justify-center gap-1 h-32">
                <div
                  className="w-1/2 max-w-[18px] bg-amber-400/80 rounded-t-md hover:bg-amber-400 transition-all relative group"
                  style={{ height: `${(d.views / maxBar) * 100}%`, minHeight: d.views > 0 ? '4px' : '0' }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {d.views}
                  </span>
                </div>
                <div
                  className="w-1/2 max-w-[18px] bg-emerald-400/80 rounded-t-md hover:bg-emerald-400 transition-all relative group"
                  style={{ height: `${(d.clicks / maxBar) * 100}%`, minHeight: d.clicks > 0 ? '4px' : '0' }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    {d.clicks}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-muted uppercase tracking-wider">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* 📌 AQUI VOCÊ COLOCA O AVISO LOGO ABAIXO DE STORIES */}
  <div className="px-3 py-2 mt-4 border-t border-ink-800">
    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
      <AlertCircle size={16} />
      <span>Acesso gratuito — use todas as funcionalidades por tempo determinado</span>
    </div>
  </div>


      <div className="grid lg:grid-cols-3 gap-4">
        {/* Profile summary */}
        <div className="card-surface p-5">
          <h3 className="text-sm font-bold text-white mb-4">Resumo do perfil</h3>
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" ring={profile.verified} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-white truncate">{profile.full_name}</p>
                {profile.verified && <ShieldCheck size={14} className="text-amber-400" />}
              </div>
              <p className="text-xs text-muted-light truncate">{profile.title || 'Sem título definido'}</p>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <Row icon={<Star size={13} />} label="Avaliação" value={`${Number(profile.rating).toFixed(1)} ★`} />
            <Row icon={<MapPin size={13} />} label="Cidade" value={profile.city || '—'} />
            <Row icon={<Briefcase size={13} />} label="Experiência" value={`${profile.years_experience} anos`} />
            <Row icon={<ImageIcon size={13} />} label="Especialidades" value={`${profile.specialties.length}`} />
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => onNavigate('/dashboard/profile')}>
            Editar perfil
          </Button>
        </div>

        {/* Recent activity */}
        <div className="card-surface p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-white mb-4">Atividade recente</h3>
          {views.length === 0 && clicks.length === 0 ? (
            <div className="py-8 text-center">
              <Eye size={28} className="text-muted mx-auto mb-2" />
              <p className="text-sm text-muted">Sem atividade ainda. Compartilhe sua vitrine para começar!</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar">
              {[...views].slice(0, 8).map((v) => (
                <div key={v.id} className="flex items-center gap-3 py-2 border-b border-ink-800 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                    <Eye size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white">Nova visita ao perfil</p>
                    <p className="text-[10px] text-muted">{formatRelative(v.created_at)} atrás · {v.viewer_source}</p>
                  </div>
                </div>
              ))}
              {[...clicks].slice(0, 4).map((c) => (
                <div key={c.id} className="flex items-center gap-3 py-2 border-b border-ink-800 last:border-0">
                  <div className="h-8 w-8 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400">
                    <MessageCircle size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-white">Clique no WhatsApp</p>
                    <p className="text-[10px] text-muted">{formatRelative(c.created_at)} atrás · {c.origin}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3 mt-6">
        <QuickAction
          icon={<ImageIcon size={18} />}
          title="Adicionar projeto"
          desc="Mostre seu trabalho no portfólio"
          onClick={() => onNavigate('/dashboard/portfolio')}
        />
        <QuickAction
          icon={<Clock size={18} />}
          title="Publicar story"
          desc="Humanize seu dia a dia"
          onClick={() => onNavigate('/dashboard/stories')}
        />
        <QuickAction
          icon={<ArrowUpRight size={18} />}
          title="Ver vitrine pública"
          desc="Como o cliente te vê"
          onClick={() => onNavigate(`/p/${profile.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}

function StatCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: number | string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn('card-surface p-4', accent && 'border-amber-400/30')}>
      <div className="flex items-center justify-between mb-3">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', accent ? 'bg-amber-400/10 border border-amber-400/30 text-amber-400' : 'bg-ink-800 border border-ink-700 text-muted-light')}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
      <p className="text-[11px] text-muted uppercase tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted"><span className="text-amber-400">{icon}</span> {label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function QuickAction({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card-surface p-4 text-left hover:border-amber-400/40 group">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-ink-800 border border-ink-700 flex items-center justify-center text-amber-400 group-hover:bg-amber-400 group-hover:text-ink-950 group-hover:border-amber-400 transition-all">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function profileCompletion(p: Profile, portfolioCount: number, storiesCount: number): number {
  let score = 0;
  const checks = [
    !!p.full_name, !!p.title, !!p.bio, !!p.city, !!p.whatsapp, !!p.avatar_url, !!p.cover_url,
    p.specialties.length > 0, p.years_experience > 0, portfolioCount >= 3, storiesCount >= 1,
  ];
  checks.forEach((c) => c && (score += 1));
  return Math.round((score / checks.length) * 100);
}
