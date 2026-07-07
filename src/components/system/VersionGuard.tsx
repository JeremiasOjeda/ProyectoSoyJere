import { useEffect, useState } from 'react';
import { APP_VERSION, PROTOCOL_VERSION } from '@/lib/version';
import type { VersionInfo } from '@/types/protocol';
import { purgeLegacyKeys } from '@/lib/storage';

export function VersionGuard({ children }: { children: React.ReactNode }) {
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    purgeLegacyKeys();

    const check = async () => {
      try {
        const res = await fetch('/api/version', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as VersionInfo;
        if (data.protocolVersion > PROTOCOL_VERSION) {
          setOutdated(true);
        } else if (data.appVersion !== APP_VERSION) {
          setOutdated(true);
        }
      } catch {
        // servidor no disponible en dev parcial
      }
    };

    void check();
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (outdated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Hay una actualización</h1>
        <p className="text-zinc-400">Recargá la página para usar la última versión.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-950"
        >
          Actualizar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
