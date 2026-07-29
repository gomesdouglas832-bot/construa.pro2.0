import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const CONSENT_KEY = 'construapro_privacy_consent';
// Se um dia voce atualizar a Politica de Privacidade de forma relevante,
// so subir esse numero (ex: 'v2') que o modal volta a aparecer pra todo
// mundo de novo, mesmo quem ja tinha aceitado a versao anterior.
const CONSENT_VERSION = 'v1';

type ConsentRecord = {
  version: string;
  acceptedAt: string;
};

function jaAceitou(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as ConsentRecord;
    return data.version === CONSENT_VERSION;
  } catch {
    return false;
  }
}

function registrarConsentimento() {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
}

type Props = {
  onNavigate: (path: string) => void;
};

export function PrivacyConsentModal({ onNavigate }: Props) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!jaAceitou()) {
      setVisible(true);
    }
  }, []);

  function aceitar() {
    if (!checked) return;
    registrarConsentimento();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card-surface w-full max-w-md p-6 sm:p-8 animate-slide-up">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck size={22} className="text-amber-400 shrink-0" />
          <h2 className="text-lg font-bold text-white">Antes de continuar</h2>
        </div>

        <p className="text-sm text-muted-lighter leading-relaxed mb-4">
          A CONSTRUA.PRO é uma vitrine que conecta profissionais e clientes — o
          acordo do serviço é sempre direto entre vocês. Usamos seus dados (como
          nome, telefone e localização) apenas para viabilizar essa conexão,
          seguindo a Lei Geral de Proteção de Dados (LGPD). Você pode ler os
          detalhes na nossa{' '}
          <button
            type="button"
            onClick={() => onNavigate('/privacidade')}
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
          >
            Política de Privacidade
          </button>{' '}
          e nos{' '}
          <button
            type="button"
            onClick={() => onNavigate('/termos')}
            className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
          >
            Termos de Uso
          </button>
          .
        </p>

        <label className="flex items-start gap-2.5 mb-5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-ink-600 bg-ink-900 text-amber-400 focus:ring-amber-400/40 focus:ring-offset-0 shrink-0"
          />
          <span className="text-sm text-muted-lighter">
            Li e concordo com a Política de Privacidade e os Termos de Uso.
          </span>
        </label>

        <button
          type="button"
          onClick={aceitar}
          disabled={!checked}
          className="w-full py-3 rounded-xl font-semibold text-sm bg-amber-400 text-ink-950 hover:bg-amber-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-400"
        >
          Concordo e quero continuar
        </button>
      </div>
    </div>
  );
}