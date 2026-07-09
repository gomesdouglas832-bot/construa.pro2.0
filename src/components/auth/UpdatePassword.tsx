import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function UpdatePassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Atualiza a senha no banco de dados do Supabase
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        throw error;
      }

      // 2. Segurança máxima: Desloga a sessão aberta pelo reset
      await supabase.auth.signOut();
      
      // 3. Aguarda um breve momento para garantir que o Supabase sincronize o estado deslogado
      await new Promise(resolve => setTimeout(resolve, 500));

      alert('Senha alterada com sucesso! Você será redirecionado para a tela de login.');
      
      // 4. Limpa a navegação e força o recarregamento total da aplicação.
      // Isso impede que o estado "logado" persista na memória do React.
      window.location.hash = 'signin';
      window.location.reload(); 
      
    } catch (error: any) {
      alert(`Erro ao atualizar senha: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form 
        onSubmit={handleUpdate} 
        className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-xl"
      >
        <h2 className="text-2xl text-white font-bold mb-6">Definir nova senha</h2>
        
        <input 
          type="password" 
          placeholder="Digite sua nova senha" 
          className="w-full p-3 mb-4 bg-black text-white border border-gray-700 rounded focus:border-amber-500 outline-none transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        
        <button 
          disabled={loading} 
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Atualizar e sair'}
        </button>
        
        <p className="text-gray-500 text-xs mt-4 text-center">
          Após atualizar, você precisará fazer login com sua nova senha.
        </p>
      </form>
    </div>
  );
}