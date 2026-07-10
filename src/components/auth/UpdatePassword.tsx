import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function UpdatePassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    const processarToken = async () => {
      const hash = window.location.hash;

      // Se não tem token
      if (!hash || !hash.includes('access_token=')) {
        setStatus('invalid');
        return;
      }

      // CORREÇÃO: lê tanto com ? quanto com &
      const paramsStr = hash.replace(/^#reset-password[?&]/, '');
      const params = new URLSearchParams(paramsStr);

      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token') || '';
      const type = params.get('type');

      if (!access_token || type !== 'recovery') {
        setStatus('invalid');
        return;
      }

      // Define sessão manualmente
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      setStatus(error ? 'invalid' : 'valid');
    };

    processarToken();
  }, []);

  const salvarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      alert('Senha alterada com sucesso!');
      window.location.hash = 'signin';
      window.location.reload();
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return <div className="min-h-screen bg-black flex items-center justify-center text-white">Verificando...</div>;

  if (status === 'invalid') return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-red-800 text-center">
        <h2 className="text-xl text-white font-bold mb-3">Link inválido ou já usado</h2>
        <p className="text-gray-400 mb-5">Solicite uma nova recuperação de senha.</p>
        <button onClick={() => onNavigate('forgot-password')} className="w-full bg-amber-500 py-2 rounded text-black font-medium">Solicitar novo link</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={salvarSenha} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-lg">
        <h2 className="text-2xl text-white font-bold mb-5">Definir nova senha</h2>
        <input
          type="password"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full p-3 mb-4 bg-black border border-gray-700 rounded text-white focus:border-amber-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  );
}