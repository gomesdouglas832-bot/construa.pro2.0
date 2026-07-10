import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function UpdatePassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');

  useEffect(() => {
    const carregarToken = async () => {
      // Pega os parâmetros diretamente da parte do hash
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token') || params.get('token');
      const refreshToken = params.get('refresh_token') || '';
      const tipo = params.get('type');

      if (!accessToken || tipo !== 'recovery') {
        setStatus('invalid');
        return;
      }

      // Cria a sessão
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      setStatus(error ? 'invalid' : 'valid');
    };

    carregarToken();
  }, []);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      alert('Senha alterada com sucesso!');
      onNavigate('/signin');
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
        <h2 className="text-white text-xl font-bold mb-3">Link inválido ou expirado</h2>
        <p className="text-gray-400 mb-5">Solicite uma nova recuperação.</p>
        <button onClick={() => onNavigate('/forgot-password')} className="w-full bg-amber-500 py-2 rounded text-black font-medium">Solicitar novo</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={salvar} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-lg">
        <h2 className="text-2xl text-white font-bold mb-5">Nova senha</h2>
        <input
          type="password"
          placeholder="Digite sua nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className="w-full p-3 mb-4 bg-black border border-gray-700 rounded text-white"
        />
        <button disabled={loading} className="w-full bg-amber-500 text-black py-3 rounded font-bold">
          {loading ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </div>
  );
}