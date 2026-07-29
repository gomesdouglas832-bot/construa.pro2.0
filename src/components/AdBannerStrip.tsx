import { useEffect, useRef, useState } from 'react';
import { supabase, type Advertisement } from '../lib/supabase';

type Props = {
  placement: string;
  aspectClassName?: string;
};

export function AdBannerStrip({ placement, aspectClassName = 'aspect-[4/1]' }: Props) {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const agora = new Date().toISOString();

      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('placement', placement)
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${agora}`)
        .order('position', { ascending: true })
        .limit(3);

      if (!mounted) return;
      if (error) {
        console.error('Erro ao carregar anúncios:', error.message);
        setAds([]);
      } else {
        setAds((data as Advertisement[]) || []);
      }
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [placement]);

  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % ads.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [ads.length]);

  if (loading || ads.length === 0) return null;

  const adAtivo = ads[activeIndex];

  return (
    <a
      href={adAtivo.link_url || undefined}
      target={adAtivo.link_url ? '_blank' : undefined}
      rel={adAtivo.link_url ? 'noopener noreferrer' : undefined}
      className={`relative block w-full ${aspectClassName} rounded-xl overflow-hidden border border-ink-800 mb-6 group`}
    >
      <div className="absolute top-2 left-2 z-10">
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-black/50 text-white/70 backdrop-blur-sm tracking-wide">
          PUBLICIDADE
        </span>
      </div>

      {ads.map((ad, i) => (
        <img
          key={ad.id}
          src={ad.image_url}
          alt={ad.title || 'Anúncio'}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === activeIndex ? 1 : 0 }}
        />
      ))}

      {ads.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
          {ads.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === activeIndex ? '16px' : '6px',
                backgroundColor: i === activeIndex ? '#F5B800' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}
    </a>
  );
}