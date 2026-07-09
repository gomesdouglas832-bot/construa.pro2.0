import { useEffect, useState } from 'react';
import { Plus, Trash2, Pencil, Image as ImageIcon, Save, AlertCircle } from 'lucide-react';
import { supabase, type PortfolioItem } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';
import { formatRelative } from '../lib/utils';

type Props = { onNavigate: (path: string) => void };

export function DashboardPortfolioPage({ onNavigate }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<PortfolioItem | null>(null);

  async function load() {
    if (!user) return;
    const { data } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    setItems((data as PortfolioItem[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  function openNew() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setCategory('');
    setModalOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditing(item);
    setTitle(item.title);
    setDescription(item.description);
    setImageUrl(item.image_url);
    setCategory(item.category);
    setModalOpen(true);
  }

  async function save() {
    if (!user) return;
    if (!imageUrl.trim()) {
      toast('Adicione a URL da imagem.', 'error');
      return;
    }
    if (!title.trim()) {
      toast('Adicione um título ao projeto.', 'error');
      return;
    }
    setSaving(true);
    const payload = {
      profile_id: user.id,
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      category: category.trim(),
    };
    let res;
    if (editing) {
      res = await supabase.from('portfolio_items').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('portfolio_items').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      toast('Erro ao salvar: ' + res.error.message, 'error');
      return;
    }
    toast(editing ? 'Projeto atualizado!' : 'Projeto adicionado!', 'success');
    setModalOpen(false);
    load();
  }

  async function remove(item: PortfolioItem) {
    const { error } = await supabase.from('portfolio_items').delete().eq('id', item.id);
    if (error) {
      toast('Erro ao excluir: ' + error.message, 'error');
      return;
    }
    toast('Projeto removido.', 'success');
    setConfirmDelete(null);
    load();
  }

  return (
    <DashboardLayout active="portfolio" onNavigate={onNavigate}>
      <DashboardHeader
        title="Portfólio"
        description="A prova social que converte visita em cliente. O cliente compra pelo olho."
        action={<Button icon={<Plus size={15} />} onClick={openNew}>Adicionar projeto</Button>}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={36} /></div>
      ) : items.length === 0 ? (
        <div className="card-surface">
          <EmptyState
            icon={<ImageIcon size={28} />}
            title="Seu portfólio está vazio"
            description="Adicione fotos dos seus melhores trabalhos. Quanto mais projetos, mais confiança você transmite."
            action={<Button icon={<Plus size={15} />} onClick={openNew}>Adicionar primeiro projeto</Button>}
          />
        </div>
      ) : (
        <>
          <div className="card-surface p-4 mb-4 border-amber-400/30 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-light">
              Você tem <span className="text-amber-400 font-semibold">{items.length}</span> projeto(s) no portfólio.
              Recomendamos pelo menos 3 para maximizar conversão.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div key={item.id} className="card-surface overflow-hidden group">
                <div className="aspect-video relative overflow-hidden bg-ink-800">
                  <img src={item.image_url} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(item)}
                      className="h-8 w-8 rounded-lg bg-ink-950/80 backdrop-blur border border-ink-600 flex items-center justify-center text-white hover:text-amber-400 hover:border-amber-400 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      className="h-8 w-8 rounded-lg bg-ink-950/80 backdrop-blur border border-ink-600 flex items-center justify-center text-white hover:text-red-400 hover:border-red-400 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {item.category && (
                    <span className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-ink-950/80 backdrop-blur text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                      {item.category}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  {item.description && (
                    <p className="text-xs text-muted mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-[10px] text-muted mt-2">{formatRelative(item.created_at)} atrás</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar projeto' : 'Novo projeto'} size="md">
        <div className="space-y-4">
          <Input
            label="URL da imagem"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            hint="Cole o link direto da foto do seu trabalho"
          />
          {imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden border border-ink-700 bg-ink-800">
              <img src={imageUrl} alt="preview" className="h-full w-full object-cover" />
            </div>
          )}
          <Input
            label="Título"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Reforma de cozinha em São Paulo"
          />
          <Input
            label="Categoria (opcional)"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Acabamento, Hidráulica, Estrutura"
          />
          <Textarea
            label="Descrição (opcional)"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Conte o que foi feito, materiais usados, prazo..."
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button icon={<Save size={15} />} loading={saving} onClick={save}>
              {editing ? 'Salvar' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir projeto" size="sm">
        <p className="text-sm text-muted-light mb-6">
          Tem certeza que deseja excluir <span className="text-white font-semibold">"{confirmDelete?.title}"</span>?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => confirmDelete && remove(confirmDelete)}>
            Excluir
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
