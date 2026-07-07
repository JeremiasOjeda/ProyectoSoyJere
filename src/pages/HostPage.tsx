import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';

export function HostPage() {
  const { code } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (!code || !token) {
      setAuthorized(false);
      return;
    }
    fetch(`/api/auth/rooms/${code}/host-check?token=${encodeURIComponent(token)}`)
      .then((r) => setAuthorized(r.ok))
      .catch(() => setAuthorized(false));
  }, [code, token]);

  if (authorized === null) {
    return (
      <Layout>
        <p className="text-zinc-400">Verificando acceso…</p>
      </Layout>
    );
  }

  if (!authorized) {
    return (
      <Layout>
        <p className="text-red-400">Token de host inválido.</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Panel host</h1>
        <p className="text-zinc-400">
          Sala <span className="font-mono text-amber-400">{code}</span>
        </p>
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          Controles del torneo — próxima etapa.
        </p>
      </div>
    </Layout>
  );
}
