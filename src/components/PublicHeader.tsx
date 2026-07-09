import { useEffect, useState } from 'react';
import { HardHat, Search, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

type Props = {
  onNavigate: (path: string) => void;
  onSearch?: (q: string) => void;
  searchValue?: string;
};

export function PublicHeader({ onNavigate, onSearch, searchValue }: Props) {
  const { user, profile } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [q, setQ] = useState(searchValue || '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setQ(searchValue || '');
  }, [searchValue]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    onSearch?.(q);
    setMobileOpen(false);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'glass-strong border-b border-ink-700' : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div className="h-9 w-9 rounded-xl bg-amber-400 flex items-center justify-center text-ink-950 group-hover:shadow-amber-glow-sm transition-all">
              <HardHat size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-extrabold text-white tracking-tight">
                CONSTRUA.<span className="text-amber-400">PRO</span>
              </span>
              <span className="text-[10px] text-muted uppercase tracking-widest hidden sm:block">
                Marketplace da Obra
              </span>
            </div>
          </button>

          {onSearch && (
            <form
              onSubmit={submitSearch}
              className="hidden md:flex flex-1 max-w-md relative"
            >
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar profissional, serviço ou cidade..."
                className="w-full bg-ink-900/80 border border-ink-700 rounded-[10px] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all"
              />
            </form>
          )}

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<LayoutDashboard size={15} />}
                  onClick={() => onNavigate('/dashboard')}
                >
                  Painel
                </Button>
                {profile && (
                  <button
                    onClick={() => onNavigate(`/p/${profile.id}`)}
                    className="text-xs text-muted hover:text-white transition-colors px-2"
                  >
                    Ver vitrine pública
                  </button>
                )}
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => onNavigate('/signin')}>
                  Entrar
                </Button>
                <Button size="sm" onClick={() => onNavigate('/signup')} icon={<LogIn size={15} />}>
                  Sou profissional
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden text-white p-2 -mr-2"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 flex flex-col gap-3 animate-slide-up">
            {onSearch && (
              <form onSubmit={submitSearch} className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-ink-900 border border-ink-700 rounded-[10px] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted focus:outline-none focus:border-amber-400/60"
                />
              </form>
            )}
            {user ? (
              <Button variant="secondary" size="md" onClick={() => { onNavigate('/dashboard'); setMobileOpen(false); }}>
                Ir para o Painel
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="md" className="flex-1" onClick={() => { onNavigate('/signin'); setMobileOpen(false); }}>
                  Entrar
                </Button>
                <Button size="md" className="flex-1" onClick={() => { onNavigate('/signup'); setMobileOpen(false); }}>
                  Cadastrar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
