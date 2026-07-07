import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';

interface CreateRoomResponse {
  code: string;
  hostToken: string;
  joinUrl: string;
  hostUrl: string;
  overlayUrl: string;
  error?: string;
}

export function CreateRoomPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<CreateRoomResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/rooms', {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as CreateRoomResponse;
      if (!res.ok) {
        if (res.status === 401) {
          navigate('/admin/login');
          return;
        }
        setError(data.error ?? 'No se pudo crear la sala');
        return;
      }
      setResult(data);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  return (
    <Layout>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">Nueva sala</h1>
        {!result ? (
          <>
            <p className="text-zinc-400">Generá un código para que tus amigos se unan.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="button"
              onClick={create}
              disabled={loading}
              className="rounded-xl bg-amber-500 py-4 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {loading ? 'Creando…' : 'Crear sala'}
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p>
              Código: <span className="font-mono text-2xl text-amber-400">{result.code}</span>
            </p>
            <button
              type="button"
              onClick={() => copy(result.joinUrl)}
              className="rounded-lg border border-zinc-700 py-3 text-sm"
            >
              Copiar link para unirse
            </button>
            <button
              type="button"
              onClick={() => copy(result.hostUrl)}
              className="rounded-lg border border-zinc-700 py-3 text-sm"
            >
              Copiar link del panel host
            </button>
            <Link
              to={`/host/${result.code}?token=${result.hostToken}`}
              className="rounded-lg bg-zinc-800 py-3 text-center text-sm"
            >
              Ir al panel host
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}
