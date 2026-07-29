type Props = {
  onNavigate: (path: string) => void;
};

export function PrivacyPolicyPage({ onNavigate }: Props) {
  return (
    <div className="min-h-screen bg-ink-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <button
          onClick={() => onNavigate('/')}
          className="text-sm text-amber-400 hover:text-amber-300 mb-8 inline-block"
        >
          ← Voltar ao início
        </button>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted mb-10">
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-sm sm:text-base text-muted-lighter leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Quem somos</h2>
            <p>
              A CONSTRUA.PRO é um marketplace que conecta profissionais da construção
              civil (pedreiros, engenheiros, arquitetos, eletricistas e demais
              especialistas) a clientes que precisam desses serviços. Esta política
              explica como coletamos, usamos e protegemos os dados pessoais de quem
              usa a plataforma, em conformidade com a Lei Geral de Proteção de Dados
              (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. Quais dados coletamos</h2>
            <p className="mb-3">
              <strong className="text-white">De profissionais cadastrados:</strong> nome
              completo, e-mail, senha (armazenada de forma criptografada, nunca em
              texto simples), número de WhatsApp, Instagram, cidade e estado, foto de
              perfil e de capa, biografia, especialidades, anos de experiência e fotos
              de portfólio.
            </p>
            <p className="mb-3">
              <strong className="text-white">De clientes que avaliam um profissional:</strong>{' '}
              nome e telefone, usados exclusivamente para identificar a avaliação e
              impedir avaliações falsas ou duplicadas (sistema antifraude). O telefone
              não é exibido publicamente em nenhuma tela.
            </p>
            <p>
              <strong className="text-white">Dados de uso da plataforma:</strong>{' '}
              registramos visualizações de perfil e cliques no botão "Falar no
              WhatsApp", de forma agregada, para que o profissional entenda o
              desempenho da própria vitrine.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Para que usamos esses dados</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Exibir a vitrine pública do profissional para potenciais clientes;</li>
              <li>Permitir contato direto via WhatsApp entre cliente e profissional;</li>
              <li>Calcular e exibir a nota média e o número de avaliações de cada profissional;</li>
              <li>Prevenir fraudes, avaliações falsas e uso indevido da plataforma;</li>
              <li>Enviar comunicações essenciais, como confirmação de cadastro e recuperação de senha;</li>
              <li>Gerar estatísticas de uso para o próprio profissional acompanhar seu desempenho.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Com quem compartilhamos</h2>
            <p>
              Não vendemos nem alugamos dados pessoais a terceiros. Os dados ficam
              armazenados em nossa infraestrutura de banco de dados (Supabase) e nosso
              provedor de imagens (Cloudinary), ambos com práticas de segurança
              adequadas. O nome, foto, cidade, especialidades e avaliações do
              profissional são públicos por natureza do serviço (é uma vitrine
              pública); o e-mail, senha e telefone de quem avalia nunca são exibidos
              publicamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Seus direitos</h2>
            <p className="mb-3">Como titular dos dados, você pode, a qualquer momento:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Solicitar a confirmação de quais dados seus temos armazenados;</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados diretamente no seu painel de profissional;</li>
              <li>Solicitar a exclusão da sua conta e dos dados pessoais associados a ela;</li>
              <li>Solicitar a portabilidade dos seus dados para outro serviço;</li>
              <li>Revogar o consentimento dado, a qualquer momento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Segurança</h2>
            <p>
              Utilizamos autenticação segura (Supabase Auth), senhas sempre
              criptografadas e regras de acesso que garantem que cada profissional só
              consiga editar os próprios dados. Avaliações não podem ser alteradas ou
              apagadas por terceiros depois de publicadas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Contato</h2>
            <p>
              Para exercer qualquer um dos direitos acima ou tirar dúvidas sobre esta
              política, entre em contato conosco pelo e-mail{' '}
              <span className="text-amber-400">[contato@construapro.com.br]</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}