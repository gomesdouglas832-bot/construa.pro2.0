import { useState } from 'react';
import { HardHat, Mail, Lock, User, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

type Props = {
  mode: 'signin' | 'signup';
  onNavigate: (path: string) => void;
};

export function AuthPage({ mode, onNavigate }: Props) {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === 'signup';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isSignup && fullName.trim().length < 2) {
      setError('Digite seu nome completo.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const res = isSignup
      ? await signUp(email.trim(), password, fullName.trim())
      : await signIn(email.trim(), password);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    toast(isSignup ? 'Conta criada com sucesso!' : 'Bem-vindo de volta!', 'success');
    onNavigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-ink-950 flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-ink-700">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-ink-950 group-hover:shadow-amber-glow-sm transition-all">
              <HardHat size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold text-white">
              CONSTRUA.<span className="text-amber-400">PRO</span>
            </span>
          </button>

          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              Sua vitrine <br />
              <span className="text-gradient-amber">trabalhando 24h</span> <br />
              por você.
            </h2>
            <p className="mt-5 text-muted-lighter leading-relaxed max-w-md">
              Junte-se a milhares de profissionais que já transformaram seu portfólio em contratos fechados.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { icon: ShieldCheck, text: 'Perfil verificado e profissional' },
                { icon: TrendingUp, text: 'Métricas de visitas e cliques no WhatsApp' },
                { icon: Sparkles, text: 'Stories para humanizar sua marca' },
              ].map((f) => (
                <div key={f.text} className="flex items-center gap-3 text-sm text-muted-light">
                  <div className="h-8 w-8 rounded-lg bg-ink-850 border border-ink-700 flex items-center justify-center text-amber-400">
                    <f.icon size={15} />
                  </div>
                  {f.text}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">© 2026 CONSTRUA.PRO Construído para quem constrói.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <button
            onClick={() => onNavigate('/')}
            className="text-muted hover:text-white text-sm flex items-center gap-1.5 mb-8 transition-colors"
          >
            <ArrowLeft size={14} /> Voltar ao início
          </button>

          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-ink-950">
              <HardHat size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-extrabold text-white">CONSTRUA.<span className="text-amber-400">PRO</span></span>
          </div>

          <h1 className="text-3xl font-extrabold text-white">
            {isSignup ? 'Criar sua vitrine' : 'Entrar no painel'}
          </h1>
          <p className="text-sm text-muted mt-2">
            {isSignup
              ? 'Comece a receber clientes qualificados hoje mesmo.'
              : 'Acesse e gerencie sua presença digital.'}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            {isSignup && (
              <Input
                label="Nome completo"
                name="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Marcos Silva"
                icon={<User size={15} />}
                required
              />
            )}
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              icon={<Mail size={15} />}
              required
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock size={15} />}
              required
            />

            {error && (
              <div className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-3.5 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
             
             

            <Button type="submit" size="lg" loading={loading} className="w-full" icon={!loading ? <ArrowRight size={16} /> : undefined}>
              {isSignup ? 'Criar conta grátis' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-4 text-center">
  <button 
    onClick={(e) => {
      e.preventDefault();
      onNavigate('forgot-password');
    }} 
    className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
  >
    Esqueceu sua senha?
  </button>
</div>

          <p className="text-sm text-muted text-center mt-6">
            {isSignup ? 'Já tem conta?' : 'Ainda não é cadastrado?'}{' '}
            <button
              onClick={() => onNavigate(isSignup ? '/signin' : '/signup')}
              className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
            >
              {isSignup ? 'Entrar' : 'Criar vitrine grátis'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
