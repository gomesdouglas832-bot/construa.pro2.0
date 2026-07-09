import { HardHat } from 'lucide-react';

export function PublicFooter({ onNavigate }: { onNavigate: (p: string) => void }) {
  return (
    <footer className="border-t border-ink-700 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-8 w-8 rounded-lg bg-amber-400 flex items-center justify-center text-ink-950">
                <HardHat size={18} strokeWidth={2.5} />
              </div>
              <span className="text-base font-extrabold text-white">
                CONSTRUA.<span className="text-amber-400">PRO</span>
              </span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              A vitrine digital dos profissionais da construção civil. Encontre, avalie e contrate.
            </p>
          </div>
          <div>
            <h4 className="label-tag mb-3">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('/explore')} className="text-muted hover:text-amber-400 transition-colors">Explorar</button></li>
              <li><button onClick={() => onNavigate('/signup')} className="text-muted hover:text-amber-400 transition-colors">Sou profissional</button></li>
              <li><button onClick={() => onNavigate('/signin')} className="text-muted hover:text-amber-400 transition-colors">Entrar</button></li>
            </ul>
          </div>
          <div>
            <h4 className="label-tag mb-3">Categorias</h4>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => onNavigate('/explore?cat=pedreiro')} className="text-muted hover:text-amber-400 transition-colors">Pedreiros</button></li>
              <li><button onClick={() => onNavigate('/explore?cat=engenheiro-civil')} className="text-muted hover:text-amber-400 transition-colors">Engenheiros</button></li>
              <li><button onClick={() => onNavigate('/explore?cat=arquiteto')} className="text-muted hover:text-amber-400 transition-colors">Arquitetos</button></li>
            </ul>
          </div>
          <div>
            <h4 className="label-tag mb-3">Contato</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>contato@construapro.com.br</li>
              <li>Brasil</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted">© 2026 CONSTRUA.PRO. Construído para quem constrói.</p>
          <p className="text-xs text-muted">Feito pra voce !</p>
        </div>
      </div>
    </footer>
  );
}
