import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ForgotPassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Formato compatível com rotas em hash
    const redirectTo = 'https://construa-pro2-0.vercel.app/#reset-password';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      alert('Link enviado! Abra no navegador, não use a prévia do e-mail.');
      onNavigate('signin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleReset} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl text-white font-bold mb-2">Recuperar senha</h2>
        <p className="text-gray-400 mb-6 text-sm">Digite seu e-mail cadastrado.</p>
        
        <input 
          type="email" 
          placeholder="seuemail@exemplo.com" 
          className="w-full p-3 mb-4 bg-black text-white border border-gray-700 rounded focus:border-amber-500 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <button 
          disabled={loading} 
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded"
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
        
        <button 
          type="button" 
          onClick={() => onNavigate('signin')} 
          className="w-full mt-4 text-gray-500 hover:text-white text-sm"
        >
          Voltar ao login
        </button>
      </form>
    </div>
  );
}