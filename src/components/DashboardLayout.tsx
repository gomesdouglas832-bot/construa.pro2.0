import { type ReactNode, useState } from 'react';
import {
  LayoutDashboard, User, Image as ImageIcon, Clock, LogOut, ExternalLink, HardHat, Menu, X, Sparkles,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { cn } from '../lib/utils';

type Props = {
  active: 'dashboard' | 'profile' | 'portfolio' | 'stories';
  onNavigate: (path: string) => void;
  children: ReactNode;
};

const NAV = [
  { key: 'dashboard', label: 'Visão geral', icon: LayoutDashboard, path: '/dashboard' },
  { key: 'profile', label: 'Meu perfil', icon: User, path: '/dashboard/profile' },
  { key: 'portfolio', label: 'Portfólio', icon: ImageIcon, path: '/dashboard/portfolio' },
  { key: 'stories', label: 'Stories', icon: Clock, path: '/dashboard/stories' },
] as const;

export function DashboardLayout({ active, onNavigate, children }: Props) {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleSignOut() {
    signOut().then(() => onNavigate('/'));
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5 px-2 py-1 group shrink-0">
        <div className="h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center text-ink-950 group-hover:shadow-amber-glow-sm transition-all">
          <HardHat size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-base font-extrabold text-white tracking-tight">
            CONSTRUA.<span className="text-amber-400">PRO</span>
          </span>
          <span className="text-[10px] text-muted uppercase tracking-widest">Painel</span>
        </div>
      </button>

      <nav className="mt-8 flex-1 space-y-1">
        {NAV.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.path); setMobileOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                  : 'text-muted-light hover:text-white hover:bg-ink-800 border border-transparent',
              )}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-3">
        {profile && (
          <button
            onClick={() => onNavigate(`/p/${profile.id}`)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-xs text-muted-light hover:text-amber-400 hover:bg-ink-800 transition-all border border-ink-700"
          >
            <ExternalLink size={14} />
            Ver vitrine pública
          </button>
        )}
        <div className="flex items-center gap-3 p-3 rounded-[10px] bg-ink-900 border border-ink-700">
          <Avatar name={profile?.full_name || user?.email || 'U'} src={profile?.avatar_url} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile?.full_name || 'Sem nome'}</p>
            <p className="text-[10px] text-muted truncate">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="text-muted hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-ink-800" title="Sair">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-950">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 glass-strong border-r border-ink-700 p-5 flex-col">
        {sidebar}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 glass-strong border-b border-ink-700 px-4 h-14 flex items-center justify-between">
        <button onClick={() => onNavigate('/')} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center text-ink-950">
            <HardHat size={18} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-extrabold text-white">CONSTRUA.<span className="text-amber-400">PRO</span></span>
        </button>
        <button onClick={() => setMobileOpen(true)} className="text-white p-2">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 glass-strong border-r border-ink-700 p-5 animate-slide-in-right">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-muted hover:text-white">
              <X size={20} />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function DashboardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <Badge variant="amber" className="mb-2"><Sparkles size={11} /> Painel do profissional</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{title}</h1>
        {description && <p className="text-sm text-muted mt-1.5">{description}</p>}
      </div>
      {action}
    </div>
  );
}
