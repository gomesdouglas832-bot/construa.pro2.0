import { useEffect, useState } from 'react';
import { Plus, Trash2, Clock, Save, AlertCircle } from 'lucide-react';
import { supabase, type Story } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatRelative, cn } from '../lib/utils';

type Props = { onNavigate: (path: string) => void };

export function DashboardStoriesPage({ onNavigate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<Story | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    setStories((data as Story[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  function openNew() {
    setImageUrl('');
    setCaption('');
    setModalOpen(true);
  }

  async function save() {
    if (!user) return;
    if (!imageUrl.trim()) {
      toast('Adicione a URL da imagem.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('stories').insert({
      profile_id: user.id,
      image_url: imageUrl.trim(),
      caption: caption.trim(),
      status: 'active',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    setSaving(false);
    if (error) {
      toast('Erro ao publicar: ' + error.message, 'error');
      return;
    }
    toast('Story publicado!', 'success');
    setModalOpen(false);
    load();
  }

  async function remove(s: Story) {
    const { error } = await supabase.from('stories').delete().eq('id', s.id);
    if (error) {
      toast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    toast('Story removido.', 'success');
    setConfirmDelete(null);
    load();
  }

  const activeCount = stories.filter((s) => s.status === 'active' && new Date(s.expires_at) > new Date()).length;
  const expiredCount = stories.length - activeCount;

  return (
    <DashboardLayout active="stories" onNavigate={onNavigate}>
      <DashboardHeader
        title="Stories"
        description="Humanize seu trabalho. Mostre o bastidor da obra e gere proximidade."
        action={<Button icon={<Plus size={15} />} onClick={openNew}>Publicar story</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={36} /></div>
      ) : stories.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            icon={<Clock size={28} />}
            title="Nenhum story publicado"
            description="Stories ficam no ar por 24h. Mostre o dia a dia da obra, ferramentas, equipe e resultados em tempo real."
            action={<Button icon={<Plus size={15} />} onClick={openNew}>Publicar primeiro story</Button>}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card-surface p-4">
              <p className="text-2xl font-extrabold text-white">{stories.length}</p>
              <p className="text-[11px] text-muted uppercase tracking-wider mt-1">Total publicados</p>
            </div>
            <div className="card-surface p-4 border-emerald-400/30">
              <p className="text-2xl font-extrabold text-emerald-400">{activeCount}</p>
              <p className="text-[11px] text-muted uppercase tracking-wider mt-1">No ar agora</p>
            </div>
            <div className="card-surface p-4">
              <p className="text-2xl font-extrabold text-muted-light">{expiredCount}</p>
              <p className="text-[11px] text-muted uppercase tracking-wider mt-1">Expirados</p>
            </div>
          </div>

          <div className="card-surface p-4 mb-4 border-amber-400/30 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-light">
              Stories expiram automaticamente em <span className="text-amber-400 font-semibold">24 horas</span>.
              Eles aparecem na sua vitrine pública e ajudam o cliente a se conectar com você.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {stories.map((s) => {
              const expired = s.status !== 'active' || new Date(s.expires_at) <= new Date();
              return (
                <div key={s.id} className="card-surface overflow-hidden group relative">
                  <div className="aspect-[9/16] relative bg-ink-800">
                    <img src={s.image_url} alt={s.caption} className={cn('h-full w-full object-cover', expired && 'opacity-40 grayscale')} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-2 left-2">
                      {expired ? (
                        <Badge variant="muted" icon={<Clock size={10} />}>Expirado</Badge>
                      ) : (
                        <Badge variant="success" icon={<span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}>No ar</Badge>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setConfirmDelete(s)}
                        className="h-7 w-7 rounded-lg bg-ink-950/80 backdrop-blur border border-ink-600 flex items-center justify-center text-white hover:text-red-400 hover:border-red-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {s.caption && (
                      <p className="absolute bottom-2 left-2 right-2 text-[10px] text-white font-medium line-clamp-2">{s.caption}</p>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-[10px] text-muted">{formatRelative(s.created_at)} atrás</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publicar story" size="md">
        <div className="space-y-4">
          <Input
            label="URL da imagem"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            hint="Formato vertical (9:16) funciona melhor"
          />
          {imageUrl && (
            <div className="flex justify-center">
              <div className="aspect-[9/16] w-40 rounded-xl overflow-hidden border border-ink-700 bg-ink-800">
                <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
              </div>
            </div>
          )}
          <Textarea
            label="Legenda (opcional)"
            name="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder="Ex: Acabamento da cozinha saindo hoje!"
          />
          <div className="flex items-center gap-2 text-xs text-muted">
            <Clock size={13} className="text-amber-400" />
            Fica no ar por 24 horas
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button icon={<Save size={15} />} loading={saving} onClick={save}>Publicar</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir story" size="sm">
        <p className="text-sm text-muted-light mb-6">Tem certeza que deseja excluir este story? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => confirmDelete && remove(confirmDelete)}>Excluir</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
