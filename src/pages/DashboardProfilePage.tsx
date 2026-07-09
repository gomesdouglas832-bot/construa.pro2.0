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

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
      setTitle(profile.title);
      setBio(profile.bio);
      setCity(profile.city);
      setState(profile.state);
      setWhatsapp(profile.whatsapp);
      setAvatarUrl(profile.avatar_url || '');
      setCoverUrl(profile.cover_url || '');
      setYearsExp(profile.years_experience);
      setSpecialties(profile.specialties);
      setLoading(false);
    }
  }, [profile]);

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

  async function save() {
    if (!user) return;
    if (!fullName.trim()) {
      toast('Digite seu nome completo.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
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
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
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
        {/* Preview card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card-surface overflow-hidden">
            <div className="h-28 bg-ink-800 relative">
              {coverUrl ? (
                <img src={coverUrl} alt="" className="h-full w-full object-cover opacity-70" />
              ) : (
                <div className="absolute inset-0 grid-bg opacity-40" />
              )}
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
                  {specialties.slice(0, 4).map((s) => (
                    <Badge key={s} variant="muted">{s}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card-surface p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-xs text-muted leading-relaxed">
                Dica: use uma foto de perfil nítida e um banner que mostre seu trabalho. Perfis com foto recebem 4x mais visitas.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <UserIcon size={16} className="text-amber-400" /> Identidade
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nome completo" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ex: Marcos Silva" />
              <Input label="Título profissional" name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Pedreiro especializado em acabamento" />
            </div>
            <div className="mt-4">
              <Textarea label="Biografia" name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Conte sua história, experiência e diferenciais. O cliente compra confiança." />
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MapPin size={16} className="text-amber-400" /> Localização e contato
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Cidade" name="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" icon={<MapPin size={15} />} />
              <Input label="Estado" name="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} />
              <Input label="WhatsApp" name="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" icon={<Phone size={15} />} hint="Apenas números, com DDD" />
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-amber-400" /> Experiência
            </h3>
            <Input
              label="Anos de experiência"
              name="years"
              type="number"
              min={0}
              max={60}
              value={yearsExp}
              onChange={(e) => setYearsExp(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-400" /> Especialidades
            </h3>
            <p className="text-xs text-muted mb-3">Selecione categorias ou adicione as suas próprias.</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((c) => {
                const active = specialties.includes(c.name);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => (active ? removeSpecialty(c.name) : addSpecialty(c.name))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                      active
                        ? 'bg-amber-400 text-ink-950 border-amber-400'
                        : 'bg-ink-900 text-muted-light border-ink-700 hover:border-ink-500',
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Input
                name="newSpecialty"
                value={newSpecialty}
                onChange={(e) => setNewSpecialty(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty(newSpecialty))}
                placeholder="Adicionar especialidade personalizada"
              />
              <Button type="button" variant="secondary" icon={<Plus size={15} />} onClick={() => addSpecialty(newSpecialty)}>
                Adicionar
              </Button>
            </div>
            {specialties.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {specialties.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/30">
                    {s}
                    <button onClick={() => removeSpecialty(s)} className="hover:text-white">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="card-surface p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-amber-400" /> Imagens
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="URL da foto de perfil" name="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." hint="Use um link direto para a imagem" />
              <Input label="URL do banner de capa" name="coverUrl" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://..." />
            </div>
            {(avatarUrl || coverUrl) && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {avatarUrl && (
                  <div className="aspect-square rounded-xl overflow-hidden border border-ink-700">
                    <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  </div>
                )}
                {coverUrl && (
                  <div className="aspect-video rounded-xl overflow-hidden border border-ink-700">
                    <img src={coverUrl} alt="cover" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button size="lg" icon={<Save size={16} />} loading={saving} onClick={save}>
              Salvar alterações
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
