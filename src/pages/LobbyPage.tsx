import { useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function LobbyPage() {
  const { code } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const nickname = params.get('nickname') ?? 'Jugador';

  return (
    <Layout>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <p className="text-zinc-400">
          Sala <span className="font-mono text-amber-400">{code}</span> · {nickname}
        </p>
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          Esperando luchadores (0/8). El torneo arranca cuando el host inicie con 8 jugadores.
        </p>
      </div>
    </Layout>
  );
}
