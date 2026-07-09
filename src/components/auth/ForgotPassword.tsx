import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function ForgotPassword({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // O redirectTo deve ser a URL base + o hash da rota de reset
    // O Supabase vai anexar os parâmetros de token automaticamente após o #
    const redirectTo = `${window.location.origin}/#reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo,
    });

    if (error) {
      alert(`Erro: ${error.message}`);
    } else {
      alert('Enviamos um e-mail com as instruções para redefinir sua senha.');
      onNavigate('signin');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <form onSubmit={handleReset} className="w-full max-w-md bg-gray-900 p-8 rounded-xl border border-gray-800 shadow-xl">
        <h2 className="text-2xl text-white font-bold mb-2">Recuperar senha</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Digite seu e-mail abaixo e enviaremos um link para redefinição.
        </p>
        
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
          className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded transition-all duration-200"
        >
          {loading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
        
        <button 
          type="button" 
          onClick={() => onNavigate('signin')} 
          className="w-full mt-4 text-gray-500 hover:text-white transition-colors text-sm"
        >
          Voltar ao login
        </button>
      </form>
    </div>
  );
}