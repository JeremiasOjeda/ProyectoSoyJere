import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { PlayerList } from '@/components/lobby/PlayerList';
import { BracketView } from '@/components/tournament/BracketView';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useTournamentStore } from '@/stores/tournamentStore';

export function HostPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const token = params.get('token');
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { room, hostStart, hostNext, hostKick, hostRecover } = useGameRoom(code, 'Host');
  const bracket = useTournamentStore((s) => s.bracket);

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

  if (!authorized || !token) {
    return (
      <Layout>
        <p className="text-red-400">Token de host inválido.</p>
      </Layout>
    );
  }

  const canStart = room?.phase === 'lobby' && room.fighters === 8;
  const joinUrl = `${window.location.origin}/join?code=${code}`;
  const overlayUrl = `${window.location.origin}/overlay/${code}`;

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Panel host</h1>
        <p className="text-zinc-400">
          Sala <span className="font-mono text-amber-400">{code}</span>
        </p>

        {room && (
          <p className="text-sm text-zinc-500">
            {room.fighters}/8 luchadores · {room.spectators} espectadores · {room.queueSize} en cola
            · Fase: {room.phase}
          </p>
        )}

        <div className="flex flex-col gap-2 text-sm">
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(joinUrl)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-left hover:bg-zinc-900"
          >
            Copiar link de unión
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(overlayUrl)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-left hover:bg-zinc-900"
          >
            Copiar link overlay OBS
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!canStart}
            onClick={() => hostStart(token)}
            className="rounded-xl bg-amber-500 px-4 py-3 font-semibold text-zinc-950 disabled:opacity-40"
          >
            Iniciar torneo
          </button>
          <button
            type="button"
            onClick={() => hostNext(token)}
            className="rounded-xl border border-zinc-600 px-4 py-3 font-semibold"
          >
            Siguiente fase / pelea
          </button>
          <button
            type="button"
            onClick={() => hostRecover(token)}
            className="rounded-xl border border-zinc-600 px-4 py-3 text-sm"
          >
            Recuperar snapshot
          </button>
        </div>

        {room && <PlayerList players={room.players} />}
        {bracket.length > 0 && room && (
          <BracketView bracket={bracket} players={room.players} />
        )}

        {room && (
          <ul className="text-xs text-zinc-500">
            {room.players.map((p) => (
              <li key={p.id} className="flex justify-between py-1">
                <span>{p.nickname}</span>
                <button
                  type="button"
                  className="text-red-400"
                  onClick={() => hostKick(token, p.id)}
                >
                  Expulsar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
