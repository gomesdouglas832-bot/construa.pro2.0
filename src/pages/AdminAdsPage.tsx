import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Megaphone, Plus, X, Trash2, RefreshCcw, ImageUp, Pause, Play, DollarSign,
} from 'lucide-react';
import { supabase, type Advertisement } from '../lib/supabase';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Textarea } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

type Props = { onNavigate: (path: string) => void };

const PLACEMENTS = [
  { value: 'explore_page_1', label: 'Explorar — Página 1' },
  { value: 'explore_page_2', label: 'Explorar — Página 2' },
  { value: 'explore_page_3', label: 'Explorar — Página 3' },
  { value: 'dashboard', label: 'Painel do profissional' },
] as const;

type Duration = 'indeterminate' | '1d' | '7d' | '30d';

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: 'indeterminate', label: 'Tempo indeterminado' },
  { value: '1d', label: '1 dia' },
  { value: '7d', label: '7 dias' },
  { value: '30d', label: '30 dias' },
];

function calcExpiresAt(duration: Duration): string | null {
  if (duration === 'indeterminate') return null;
  const dias = duration === '1d' ? 1 : duration === '7d' ? 7 : 30;
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return data.toISOString();
}

function statusDoAnuncio(ad: Advertisement): { label: string; variant: 'green' | 'muted' | 'amber' } {
  if (!ad.active) return { label: 'Pausado', variant: 'muted' };
  if (ad.expires_at && new Date(ad.expires_at) <= new Date()) return { label: 'Expirado', variant: 'amber' };
  return { label: 'Ativo', variant: 'green' };
}

async function uploadImagemAnuncio(arquivo: File): Promise<{ url: string | null; erro: string | null }> {
  const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!formatosPermitidos.includes(arquivo.type)) {
    return { url: null, erro: 'Formato inválido! Use JPG, PNG ou WEBP.' };
  }
  if (arquivo.size > 5 * 1024 * 1024) {
    return { url: null, erro: 'Arquivo muito grande! Máximo 5MB.' };
  }

  const nomeArquivo = `${Date.now()}_${arquivo.name.replace(/\s+/g, '_')}`;

  const { error } = await supabase.storage
    .from('advertisements')
    .upload(nomeArquivo, arquivo, { cacheControl: '3600', upsert: true });

  if (error) {
    console.error('Erro upload anúncio:', error);
    return { url: null, erro: 'Não foi possível enviar a imagem.' };
  }

  const { data: urlPublica } = supabase.storage.from('advertisements').getPublicUrl(nomeArquivo);
  return { url: urlPublica.publicUrl, erro: null };
}

export function AdminAdsPage({ onNavigate }: Props) {
  const { toast } = useToast();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlacement, setFilterPlacement] = useState<string>('all');

  // Modal de criação
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [placement, setPlacement] = useState<string>(PLACEMENTS[0].value);
  const [clientName, setClientName] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [duration, setDuration] = useState<Duration>('30d');

  // Modal de renovação
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewDuration, setRenewDuration] = useState<Duration>('30d');

  // Input escondido para trocar só a arte de um anúncio já existente
  const editArtInputRef = useRef<HTMLInputElement | null>(null);
  const [editingArtId, setEditingArtId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('placement', { ascending: true })
      .order('position', { ascending: true });

    if (error) {
      toast('Erro ao carregar anúncios: ' + error.message, 'error');
    } else {
      setAds((data as Advertisement[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const totalFaturado = useMemo(
    () => ads.reduce((soma, ad) => soma + Number(ad.amount_paid || 0), 0),
    [ads],
  );

  const adsFiltrados = useMemo(
    () => (filterPlacement === 'all' ? ads : ads.filter((a) => a.placement === filterPlacement)),
    [ads, filterPlacement],
  );

  function closeModal() {
    setModalOpen(false);
    setNewImageFile(null);
    setNewImagePreview(null);
    setTitle('');
    setLinkUrl('');
    setPlacement(PLACEMENTS[0].value);
    setClientName('');
    setAmountPaid('0');
    setPaymentNotes('');
    setDuration('30d');
  }

  function handlePickNewImage(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;
    setNewImageFile(arquivo);
    setNewImagePreview(URL.createObjectURL(arquivo));
  }

  async function handleCreateAd(e: React.FormEvent) {
    e.preventDefault();
    if (!newImageFile) {
      toast('Escolha uma imagem para o anúncio.', 'error');
      return;
    }

    setSaving(true);
    setUploading(true);
    const { url, erro } = await uploadImagemAnuncio(newImageFile);
    setUploading(false);

    if (erro || !url) {
      toast(erro || 'Erro ao enviar imagem.', 'error');
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('advertisements').insert({
      title: title.trim(),
      image_url: url,
      link_url: linkUrl.trim(),
      placement,
      client_name: clientName.trim(),
      amount_paid: Number(amountPaid) || 0,
      payment_notes: paymentNotes.trim(),
      active: true,
      expires_at: calcExpiresAt(duration),
    });

    setSaving(false);

    if (error) {
      toast('Erro ao criar anúncio: ' + error.message, 'error');
      return;
    }

    toast('Anúncio criado com sucesso!', 'success');
    closeModal();
    load();
  }

  async function toggleActive(ad: Advertisement) {
    const { error } = await supabase
      .from('advertisements')
      .update({ active: !ad.active, updated_at: new Date().toISOString() })
      .eq('id', ad.id);

    if (error) {
      toast('Erro ao atualizar: ' + error.message, 'error');
      return;
    }
    toast(ad.active ? 'Anúncio pausado.' : 'Anúncio ativado.', 'success');
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este anúncio permanentemente? Essa ação não pode ser desfeita.')) return;
    const { error } = await supabase.from('advertisements').delete().eq('id', id);
    if (error) {
      toast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    toast('Anúncio excluído.', 'success');
    load();
  }

  async function confirmRenew() {
    if (!renewingId) return;
    const { error } = await supabase
      .from('advertisements')
      .update({
        expires_at: calcExpiresAt(renewDuration),
        active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', renewingId);

    if (error) {
      toast('Erro ao renovar: ' + error.message, 'error');
      return;
    }
    toast('Anúncio renovado com sucesso!', 'success');
    setRenewingId(null);
    load();
  }

  function startEditArt(id: string) {
    setEditingArtId(id);
    editArtInputRef.current?.click();
  }

  async function handleEditArtFile(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ''; // permite escolher o mesmo arquivo de novo depois
    if (!arquivo || !editingArtId) return;

    const { url, erro } = await uploadImagemAnuncio(arquivo);
    if (erro || !url) {
      toast(erro || 'Erro ao enviar imagem.', 'error');
      return;
    }

    const { error } = await supabase
      .from('advertisements')
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq('id', editingArtId);

    if (error) {
      toast('Erro ao trocar arte: ' + error.message, 'error');
      return;
    }

    toast('Arte atualizada!', 'success');
    setEditingArtId(null);
    load();
  }

  return (
    <DashboardLayout active="admin-ads" onNavigate={onNavigate}>
      <DashboardHeader
        title="Anúncios"
        description="Gerencie as publicidades exibidas no site."
        action={
          <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
            Novo anúncio
          </Button>
        }
      />

      {/* Totalizador */}
      <div className="card-surface p-5 mb-6 flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
          <DollarSign size={20} />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">Total faturado com anúncios</p>
          <p className="text-2xl font-extrabold text-white">
            {totalFaturado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      {/* Filtro por posição */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
        <button
          onClick={() => setFilterPlacement('all')}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
            filterPlacement === 'all'
              ? 'bg-amber-400 text-ink-950 border-amber-400'
              : 'bg-ink-900 text-muted-light border-ink-700',
          )}
        >
          Todas as posições
        </button>
        {PLACEMENTS.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilterPlacement(p.value)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
              filterPlacement === p.value
                ? 'bg-amber-400 text-ink-950 border-amber-400'
                : 'bg-ink-900 text-muted-light border-ink-700',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input escondido usado para trocar a arte de um anúncio existente */}
      <input
        type="file"
        accept="image/*"
        ref={editArtInputRef}
        onChange={handleEditArtFile}
        className="hidden"
      />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : adsFiltrados.length === 0 ? (
        <div className="card-surface p-10">
          <EmptyState
            icon={<Megaphone size={26} />}
            title="Nenhum anúncio cadastrado"
            description="Clique em 'Novo anúncio' para criar o primeiro."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adsFiltrados.map((ad) => {
            const status = statusDoAnuncio(ad);
            return (
              <div key={ad.id} className="card-surface overflow-hidden flex flex-col">
                <div className="relative aspect-[4/1] bg-ink-800">
                  <img src={ad.image_url} alt={ad.title} className="h-full w-full object-cover" />
                  <div className="absolute top-2 left-2">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <p className="text-sm font-bold text-white truncate">{ad.title || '(sem título)'}</p>
                  <p className="text-xs text-muted">
                    {PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}
                  </p>
                  <div className="text-xs text-muted-lighter space-y-0.5">
                    <p>Cliente: {ad.client_name || '—'}</p>
                    <p>Valor: {Number(ad.amount_paid || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    <p>
                      Validade:{' '}
                      {ad.expires_at
                        ? new Date(ad.expires_at).toLocaleDateString('pt-BR')
                        : 'Indeterminado'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-3">
                    <button
                      onClick={() => toggleActive(ad)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-muted-light hover:text-white hover:bg-ink-800 transition-all"
                    >
                      {ad.active ? <Pause size={12} /> : <Play size={12} />}
                      {ad.active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => { setRenewingId(ad.id); setRenewDuration('30d'); }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-muted-light hover:text-amber-400 hover:bg-ink-800 transition-all"
                    >
                      <RefreshCcw size={12} /> Renovar
                    </button>
                    <button
                      onClick={() => startEditArt(ad.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-muted-light hover:text-amber-400 hover:bg-ink-800 transition-all"
                    >
                      <ImageUp size={12} /> Trocar arte
                    </button>
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-ink-700 text-muted-light hover:text-red-400 hover:bg-ink-800 transition-all ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: novo anúncio */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={closeModal}
        >
          <div
            className="card-surface w-full max-w-lg p-6 my-8 animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeModal} className="absolute top-4 right-4 text-muted hover:text-white">
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-white mb-5">Novo anúncio</h2>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="text-xs uppercase text-gray-400 tracking-wider mb-2 block">
                  Arte do anúncio (recomendado 1200x300px, formato faixa)
                </label>
                <input type="file" id="input-ad-image" accept="image/*" onChange={handlePickNewImage} className="hidden" />
                <label
                  htmlFor="input-ad-image"
                  className="relative block h-24 w-full max-w-[320px] cursor-pointer rounded-lg border border-ink-700 bg-ink-800 overflow-hidden hover:border-amber-400 transition-all"
                >
                  {newImagePreview ? (
                    <img src={newImagePreview} alt="Prévia" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted text-xs text-center px-2">
                      Clique para escolher a imagem
                    </div>
                  )}
                </label>
              </div>

              <Input label="Título (interno, opcional)" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Loja de Materiais X - Julho" />
              <Input label="Link de destino" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />

              <div>
                <label className="text-xs uppercase text-gray-400 tracking-wider mb-2 block">Onde aparece</label>
                <select
                  value={placement}
                  onChange={(e) => setPlacement(e.target.value)}
                  className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60"
                >
                  {PLACEMENTS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs uppercase text-gray-400 tracking-wider mb-2 block">Duração</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as Duration)}
                  className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Nome do cliente/anunciante" value={clientName} onChange={(e) => setClientName(e.target.value)} />
                <Input label="Valor pago (R$)" type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>

              <Textarea label="Observações de pagamento (opcional)" value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} placeholder="Ex: pago via Pix em 05/07" />

              <Button type="submit" loading={saving} className="w-full">
                {uploading ? 'Enviando imagem...' : 'Criar anúncio'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: renovar */}
      {renewingId && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setRenewingId(null)}
        >
          <div
            className="card-surface w-full max-w-sm p-6 animate-slide-up relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setRenewingId(null)} className="absolute top-4 right-4 text-muted hover:text-white">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">Renovar anúncio</h2>
            <label className="text-xs uppercase text-gray-400 tracking-wider mb-2 block">Nova duração</label>
            <select
              value={renewDuration}
              onChange={(e) => setRenewDuration(e.target.value as Duration)}
              className="w-full bg-ink-900 border border-ink-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400/60 mb-5"
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <Button onClick={confirmRenew} className="w-full">Confirmar renovação</Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}