import { useParams } from 'react-router-dom';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useTournamentStore } from '@/stores/tournamentStore';
import { BracketView } from '@/components/tournament/BracketView';
import { NarrationFeed } from '@/components/narration/NarrationFeed';
import { FightAnimation } from '@/components/tournament/PredictionPoll';

export function OverlayPage() {
  const { code = '' } = useParams<{ code: string }>();
  useGameRoom(code, 'Overlay');
  const { room, bracket, narration } = useTournamentStore();

  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-500">
        Conectando overlay…
      </div>
    );
  }

  const fight = bracket.find((m) => m.id === room.currentFightId);
  const fighterA = room.players.find((p) => p.id === fight?.fighterA);
  const fighterB = room.players.find((p) => p.id === fight?.fighterB);

  return (
    <div className="min-h-screen bg-black/90 p-6 font-sans text-white">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-amber-400">{code}</span>
        <span className="text-sm text-zinc-400">{room.roundLabel ?? room.phase}</span>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <BracketView bracket={bracket} players={room.players} />
        <div className="flex flex-col gap-4">
          <FightAnimation fighterA={fighterA} fighterB={fighterB} />
          <NarrationFeed lines={narration} />
        </div>
      </div>
    </div>
  );
}
