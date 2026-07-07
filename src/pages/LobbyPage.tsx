import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useTournamentStore } from '@/stores/tournamentStore';

export function LobbyPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const nickname = params.get('nickname') ?? 'Jugador';
  const navigate = useNavigate();
  const { room, connected } = useGameRoom(code, nickname);
  const queuePosition = useTournamentStore((s) => s.queuePosition);

  useEffect(() => {
    if (room && room.phase !== 'lobby') {
      navigate(`/play/${code}?nickname=${encodeURIComponent(nickname)}`, { replace: true });
    }
  }, [room, code, nickname, navigate]);

  if (queuePosition) {
    return (
      <Layout>
        <p className="text-center text-zinc-400">
          Sala llena. Cola: <span className="text-amber-400">#{queuePosition}</span>
        </p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">Lobby</h1>
        <p className="text-zinc-400">
          Sala <span className="font-mono text-amber-400">{code}</span> · {nickname}
        </p>
        <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
          {!connected || !room
            ? 'Conectando…'
            : `Esperando luchadores (${room.fighters}/${room.maxFighters}). El host inicia con 8.`}
        </p>
      </div>
    </Layout>
  );
}
