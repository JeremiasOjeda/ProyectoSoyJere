import type { Player } from '@/types/protocol';

export function PlayerList({ players }: { players: Player[] }) {
  const fighters = players.filter((p) => p.role === 'fighter' && !p.eliminated);
  const spectators = players.filter((p) => p.role === 'spectator' || p.eliminated);

  return (
    <div className="flex flex-col gap-3">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-amber-400">
          Luchadores ({fighters.length}/8)
        </h2>
        <ul className="space-y-1">
          {fighters.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
            >
              <span>{p.nickname}</span>
              <span className={p.connected ? 'text-green-400' : 'text-zinc-500'}>
                {p.connected ? '●' : '○'}
              </span>
            </li>
          ))}
        </ul>
      </section>
      {spectators.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-zinc-400">
            Espectadores ({spectators.length})
          </h2>
          <ul className="flex flex-wrap gap-2">
            {spectators.map((p) => (
              <li key={p.id} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                {p.nickname}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
