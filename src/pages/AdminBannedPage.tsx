import { useEffect, useState } from 'react';
import { ShieldOff, Plus, Trash2, X } from 'lucide-react';
import { supabase, type BannedUser } from '../lib/supabase';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

type Props = { onNavigate: (path: string) => void };

export function AdminBannedPage({ onNavigate }: Props) {
  const { toast } = useToast();
  const [banned, setBanned] = useState<BannedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('banned_users')
      .select('*')
      .order('banned_at', { ascending: false });

    if (error) {
      toast('Erro ao carregar lista de banidos: ' + error.message, 'error');
    } else {
      setBanned((data as BannedUser[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function closeModal() {
    setModalOpen(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setReason('');
  }

  async function handleBan(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim() && !email.trim() && !phone.trim()) {
      toast('Preencha ao menos nome, e-mail ou telefone.', 'error');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('banned_users').insert({
      full_name: fullName.trim() || null,
      email: email.trim() || null,
      phone: phone.replace(/\D/g, '') || null,
      reason: reason.trim(),
    });
    setSaving(false);

    if (error) {
      toast('Erro ao banir: ' + error.message, 'error');
      return;
    }

    toast('Profissional banido com sucesso.', 'success');
    closeModal();
    load();
  }

  async function handleUnban(id: string) {
    if (!confirm('Remover este banimento? A pessoa poderá se cadastrar novamente.')) return;

    const { error } = await supabase.from('banned_users').delete().eq('id', id);
    if (error) {
      toast('Erro ao remover banimento: ' + error.message, 'error');
      return;
    }
    toast('Banimento removido.', 'success');
    load();
  }

  return (
    <DashboardLayout active="admin-banned" onNavigate={onNavigate}>
      <DashboardHeader
        title="Profissionais banidos"
        description="Nome, e-mail ou telefone banido não conseguem criar uma nova conta."
        action={
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Banir profissional
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : banned.length === 0 ? (
        <div className="card-surface p-10">
          <EmptyState
            icon={<ShieldOff size={26} />}
            title="Nenhum banimento registrado"
            description="Quando alguém for banido, aparece aqui."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {banned.map((b) => (
            <div key={b.id} className="card-surface p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{b.full_name || '(nome não informado)'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                  {b.email && <span>{b.email}</span>}
                  {b.phone && <span>{b.phone}</span>}
                  <span>Banido em {new Date(b.banned_at).toLocaleDateString('pt-BR')}</span>
                </div>
                {b.reason && (
                  <p className="text-xs text-muted-lighter mt-2 leading-relaxed">{b.reason}</p>
                )}
              </div>
              <button
                onClick={() => handleUnban(b.id)}
                className="shrink-0 text-muted hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-ink-800"
                title="Remover banimento"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="card-surface w-full max-w-md p-6 animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted hover:text-white"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">Banir profissional</h2>
            <p className="text-xs text-muted mb-5">
              Preencha ao menos um dos três campos (nome, e-mail ou telefone). Quem tentar se
              cadastrar com qualquer um desses dados será bloqueado.
            </p>

            <form onSubmit={handleBan} className="space-y-4">
              <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Opcional" />
              <Input label="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Opcional" />
              <Input label="Telefone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Opcional" />
              <Textarea label="Motivo (interno, não é exibido publicamente)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Ex: golpe relatado por cliente, não cumpriu o combinado..." />

              <Button type="submit" loading={saving} className="w-full">
                Confirmar banimento
              </Button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}