import { useEffect, useState } from 'react';
import { Save, Plus, X, MapPin, Phone, Briefcase, Star, ShieldCheck, User as UserIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase, type Category } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { DashboardLayout, DashboardHeader } from '../components/DashboardLayout';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import { cn } from '../lib/utils';

type Props = { onNavigate: (path: string) => void };

export function DashboardProfilePage({ onNavigate }: Props) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [yearsExp, setYearsExp] = useState(0);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Carrega categorias
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // ✅ CORREÇÃO: Carrega perfil com tratamento completo
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Se já tem perfil no contexto, usa ele
      if (profile) {
        fillForm(profile);
        setLoading(false);
        return;
      }

      // Se não tem, busca diretamente + atualiza o contexto
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('Perfil não encontrado no banco, vamos criar vazio:', error.message);
          // Não interrompe, vai permitir preencher e salvar
        }

        if (data) {
          fillForm(data);
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, profile]);

  // Função auxiliar para preencher os campos
  const fillForm = (p: any) => {
    setFullName(p.full_name || '');
    setTitle(p.title || '');
    setBio(p.bio || '');
    setCity(p.city || '');
    setState(p.state || '');
    setWhatsapp(p.whatsapp || '');
    setAvatarUrl(p.avatar_url || '');
    setCoverUrl(p.cover_url || '');
    setYearsExp(p.years_experience || 0);
    setSpecialties(p.specialties || []);
  };

  function addSpecialty(s: string) {
    const v = s.trim();
    if (!v) return;
    if (specialties.includes(v)) return;
    setSpecialties((prev) => [...prev, v]);
    setNewSpecialty('');
  }

  function removeSpecialty(s: string) {
    setSpecialties((prev) => prev.filter((x) => x !== s));
  }

  // ✅ CORREÇÃO: Função de salvar ajustada para funcionar com RLS
  async function save() {
    if (!user) return;
    if (!fullName.trim()) {
      toast('Digite seu nome completo.', 'error');
      return;
    }
    setSaving(true);
    
    const dados = {
      id: user.id,
      full_name: fullName.trim(),
      title: title.trim(),
      bio: bio.trim(),
      city: city.trim(),
      state: state.trim(),
      whatsapp: whatsapp.replace(/\D/g, ''),
      avatar_url: avatarUrl.trim() || null,
      cover_url: coverUrl.trim() || null,
      years_experience: yearsExp,
      specialties,
      updated_at: new Date().toISOString(),
    };

    // Usamos upsert com confirmação de linha
    const { error } = await supabase
      .from('profiles')
      .upsert(dados, { onConflict: 'id' });

    setSaving(false);
    if (error) {
      console.error('Erro ao salvar perfil:', error);
      toast('Erro ao salvar: ' + error.message, 'error');
      return;
    }

    await refreshProfile();
    toast('Perfil atualizado com sucesso!', 'success');
  }

  if (loading) {
    return (
      <DashboardLayout active="profile" onNavigate={onNavigate}>
        <div className="flex justify-center py-20"><Spinner size={36} /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout active="profile" onNavigate={onNavigate}>
      <DashboardHeader
        title="Meu perfil"
        description="Este é o seu currículo vivo. Mantenha-o sempre atualizado."
        action={<Button icon={<Save size={15} />} loading={saving} onClick={save}>Salvar alterações</Button>}
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div className="card-surface overflow-hidden">
            <div className="h-28 bg-ink-800 relative">
              {coverUrl ? <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-70" /> : <div className="absolute inset-0 grid-bg opacity-40" />}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink-900" />
            </div>
            <div className="px-5 pb-5 -mt-12">
              <Avatar name={fullName} src={avatarUrl} size="xl" ring className="mb-3" />
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-white truncate">{fullName || 'Sem nome'}</p>
                {profile?.verified && <ShieldCheck size={14} className="text-amber-400" />}
              </div>
              <p className="text-xs text-muted-light">{title || 'Profissional da construção'}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-muted">
                {city && <span className="flex items-center gap-1"><MapPin size={11} /> {city}</span>}
                <span className="flex items-center gap-1 text-amber-400"><Star size={11} fill="currentColor" /> {Number(profile?.rating ?? 5).toFixed(1)}</span>
              </div>
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {specialties.slice(0, 4).map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
                </div>
              )}
            </div>
          </div>
          <div className="card-surface p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">Dica: use uma foto de perfil nítida e um banner que mostre seu trabalho.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><UserIcon size={16} /> Identidade</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Título profissional" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Textarea label="Biografia" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><MapPin size={16} /> Localização e contato</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
              <Input label="Estado" value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
              <Input label="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Briefcase size={16} /> Experiência</h3>
            <Input label="Anos de experiência" type="number" value={yearsExp} onChange={(e) => setYearsExp(Math.max(0, Number(e.target.value)))} />
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Especialidades</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((c) => {
                const active = specialties.includes(c.name);
                return (
                  <button key={c.id} type="button" onClick={() => (active ? removeSpecialty(c.name) : addSpecialty(c.name))} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-all', active ? 'bg-amber-400 text-ink-950 border-amber-400' : 'bg-ink-900 text-muted-light border-ink-700')}>{c.name}</button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input value={newSpecialty} onChange={(e) => setNewSpecialty(e.target.value)} placeholder="Adicionar personalizada" />
              <Button type="button" variant="secondary" onClick={() => addSpecialty(newSpecialty)}>Adicionar</Button>
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><ImageIcon size={16} /> Imagens</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="URL foto perfil" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              <Input label="URL banner capa" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="lg" icon={<Save size={16} />} loading={saving} onClick={save}>Salvar alterações</Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}