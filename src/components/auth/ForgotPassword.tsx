import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ForgotPassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#reset-password`,
    });
    if (error) alert(error.message);
    else alert('Verifique seu e-mail para o link de recuperação!');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleReset} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800">
        <h2 className="text-2xl text-white font-bold mb-6">Recuperar senha</h2>
        <input 
          type="email" 
          placeholder="Seu e-mail" 
          className="w-full p-3 mb-4 bg-black text-white border border-gray-700 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button disabled={loading} className="w-full bg-amber-500 text-black font-bold py-3 rounded">
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
        <button type="button" onClick={() => onNavigate('signin')} className="w-full mt-4 text-gray-400">Voltar ao login</button>
      </form>
    </div>
  );
}