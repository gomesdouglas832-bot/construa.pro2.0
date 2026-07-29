type Props = {
  onNavigate: (path: string) => void;
};

export function TermsOfServicePage({ onNavigate }: Props) {
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
          Termos de Uso e Responsabilidade
        </h1>
        <p className="text-sm text-muted mb-10">
          Última atualização: {new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <div className="space-y-8 text-sm sm:text-base text-muted-lighter leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. O que é a CONSTRUA.PRO</h2>
            <p>
              A CONSTRUA.PRO é uma plataforma de vitrine e conexão entre profissionais
              da construção civil (pedreiros, engenheiros, arquitetos, eletricistas e
              demais especialistas) e clientes que procuram esses serviços. A
              plataforma funciona como um marketplace: nós exibimos perfis, portfólios
              e avaliações, e viabilizamos o contato direto via WhatsApp entre as
              partes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. A CONSTRUA.PRO não é parte no serviço contratado</h2>
            <p>
              A negociação, execução, qualidade, prazo, valores e qualquer acordo
              sobre o serviço prestado são de responsabilidade exclusiva do
              profissional e do cliente envolvidos. A CONSTRUA.PRO <strong className="text-white">não
              contrata, não fiscaliza, não intermedia pagamentos e não garante</strong> a
              execução, qualidade ou resultado de nenhum serviço anunciado na
              plataforma. Qualquer contrato, verbal ou escrito, é firmado
              diretamente entre profissional e cliente, fora da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Responsabilidades do profissional cadastrado</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Fornecer informações verdadeiras no cadastro (nome, experiência, especialidades, contato);</li>
              <li>Utilizar fotos de portfólio de trabalhos reais e próprios;</li>
              <li>Cumprir com o que for acordado diretamente com o cliente;</li>
              <li>Não utilizar a plataforma para golpes, cobranças indevidas ou publicidade enganosa.</li>
            </ul>
            <p className="mt-3">
              O descumprimento destes termos pode resultar em <strong className="text-white">banimento
              permanente</strong> da plataforma, sem aviso prévio, mediante análise de
              denúncias recebidas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Responsabilidades do cliente/avaliador</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Fazer avaliações verdadeiras, baseadas em experiência real com o profissional avaliado;</li>
              <li>Não publicar avaliações falsas, ofensivas ou com intuito de prejudicar injustamente um profissional;</li>
              <li>Fornecer nome e telefone verdadeiros ao avaliar (usados apenas para controle antifraude interno, nunca exibidos publicamente).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Denúncias e banimento</h2>
            <p>
              Caso um cliente relate golpe, descumprimento de acordo ou má conduta de
              um profissional, a CONSTRUA.PRO pode, a seu critério, suspender ou
              banir permanentemente o profissional da plataforma. O banimento pode
              considerar nome, e-mail e telefone cadastrados, impedindo novo cadastro
              com os mesmos dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">6. Limitação de responsabilidade</h2>
            <p>
              Na máxima extensão permitida pela lei, a CONSTRUA.PRO não se
              responsabiliza por danos diretos ou indiretos decorrentes de negócios
              firmados entre profissionais e clientes através da plataforma,
              incluindo prejuízos financeiros, materiais, atrasos ou má execução de
              serviços.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">7. Alterações destes termos</h2>
            <p>
              Estes termos podem ser atualizados periodicamente. Alterações
              relevantes serão comunicadas através de um novo aceite obrigatório na
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">8. Contato</h2>
            <p>
              Dúvidas sobre estes termos ou denúncias sobre profissionais podem ser
              enviadas para{' '}
              <span className="text-amber-400">[contato@construapro.com.br]</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}