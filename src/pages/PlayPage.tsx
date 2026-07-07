import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { PlayerList } from '@/components/lobby/PlayerList';
import { LoadoutWizard, UpgradePicker } from '@/components/loadout/LoadoutWizard';
import { ArenaBanner, NarrationFeed } from '@/components/narration/NarrationFeed';
import {
  BracketView,
  ChampionScreen,
} from '@/components/tournament/BracketView';
import { FightAnimation, PredictionPoll } from '@/components/tournament/PredictionPoll';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useTournamentStore } from '@/stores/tournamentStore';

export function PlayPage() {
  const { code = '' } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  const nickname = params.get('nickname') ?? 'Jugador';
  const { room, connected, submitLoadout, submitUpgrade, submitPrediction } = useGameRoom(
    code,
    nickname,
  );
  const { bracket, narration, predictionResults, queuePosition, error, me } = useTournamentStore();
  const player = me();

  const currentFight = useMemo(() => {
    if (!room?.currentFightId || !bracket.length) return null;
    return bracket.find((m) => m.id === room.currentFightId) ?? null;
  }, [room, bracket]);

  const fighterA = room?.players.find((p) => p.id === currentFight?.fighterA);
  const fighterB = room?.players.find((p) => p.id === currentFight?.fighterB);

  if (queuePosition) {
    return (
      <Layout>
        <p className="text-center text-zinc-400">
          Sala llena. Posición en cola: <span className="text-amber-400">{queuePosition}</span>
        </p>
      </Layout>
    );
  }

  if (!connected || !room) {
    return (
      <Layout>
        <p className="text-zinc-400">Conectando a la sala {code}…</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <header>
          <h1 className="text-xl font-bold">
            {room.phase === 'lobby' && 'Lobby'}
            {room.phase === 'loadout' && 'Equipamiento'}
            {room.phase === 'pre_fight' && 'Predicciones'}
            {room.phase === 'fighting' && (room.roundLabel ?? 'Pelea')}
            {room.phase === 'upgrade' && 'Mejora'}
            {room.phase === 'champion' && 'Campeón'}
          </h1>
          <p className="text-sm text-zinc-500">
            {code} · {nickname}
            {player?.role === 'fighter' && !player.eliminated && (
              <span className="ml-2 text-amber-400">Luchador</span>
            )}
            {(player?.role === 'spectator' || player?.eliminated) && (
              <span className="ml-2 text-zinc-400">Espectador</span>
            )}
          </p>
        </header>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {room.phase === 'lobby' && (
          <>
            <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              {room.fighters}/{room.maxFighters} luchadores · {room.spectators} espectadores
              {room.queueSize > 0 && ` · ${room.queueSize} en cola`}
            </p>
            <PlayerList players={room.players} />
          </>
        )}

        {room.phase === 'loadout' && player?.role === 'fighter' && !player.eliminated && (
          <LoadoutWizard
            initial={player.build}
            deadline={room.loadoutDeadline}
            onSubmit={submitLoadout}
          />
        )}

        {room.phase === 'loadout' && (player?.role === 'spectator' || player?.eliminated) && (
          <p className="text-zinc-400">Los luchadores arman su build…</p>
        )}

        {room.phase === 'pre_fight' && (
          <PredictionPoll
            fighterA={fighterA}
            fighterB={fighterB}
            onVote={submitPrediction}
            results={predictionResults}
          />
        )}

        {(room.phase === 'fighting' || room.phase === 'pre_fight') && bracket.length > 0 && (
          <BracketView bracket={bracket} players={room.players} />
        )}

        {room.phase === 'fighting' && (
          <>
            <ArenaBanner arena={room.arena} />
            <FightAnimation fighterA={fighterA} fighterB={fighterB} />
            <NarrationFeed lines={narration} />
          </>
        )}

        {room.phase === 'upgrade' && player && !player.eliminated && player.build && (
          <UpgradePicker build={player.build} onUpgrade={submitUpgrade} />
        )}

        {room.phase === 'champion' && (
          <ChampionScreen championId={room.championId} players={room.players} />
        )}
      </div>
    </Layout>
  );
}
