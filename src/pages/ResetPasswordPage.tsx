import { useState } from 'react';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // O Supabase já terá processado o token automaticamente
    const { error } = await supabase.auth.updateUser({ password });
    
    if (error) {
      alert(error.message);
    } else {
      alert('Senha atualizada com sucesso!');
      onNavigate('signin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleUpdate} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800">
        <h2 className="text-2xl text-white font-bold mb-6">Definir nova senha</h2>
        <input 
          type="password" 
          placeholder="Nova senha" 
          className="w-full p-3 mb-4 bg-black text-white border border-gray-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button disabled={loading} className="w-full bg-amber-500 text-black font-bold py-3 rounded">
          {loading ? 'Atualizando...' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}