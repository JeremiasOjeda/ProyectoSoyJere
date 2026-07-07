import type { Player, PredictionResults } from '@/types/protocol';

export function PredictionPoll({
  fighterA,
  fighterB,
  onVote,
  results,
}: {
  fighterA?: Player;
  fighterB?: Player;
  onVote: (id: string) => void;
  results?: PredictionResults | null;
}) {
  if (!fighterA || !fighterB) return null;

  if (results) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm">
        <p className="mb-2 text-zinc-400">Resultados de predicciones</p>
        <p>
          {results.percentages[fighterA.id] ?? 0}% → {fighterA.nickname}
        </p>
        <p>
          {results.percentages[fighterB.id] ?? 0}% → {fighterB.nickname}
        </p>
        <p className="mt-2 text-amber-400">
          {results.correctVotes} de {results.totalVotes} acertaron
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center text-sm text-zinc-400">¿Quién gana?</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onVote(fighterA.id)}
          className="rounded-xl border border-zinc-700 bg-zinc-900 py-4 font-semibold hover:border-amber-500"
        >
          {fighterA.nickname}
        </button>
        <button
          type="button"
          onClick={() => onVote(fighterB.id)}
          className="rounded-xl border border-zinc-700 bg-zinc-900 py-4 font-semibold hover:border-amber-500"
        >
          {fighterB.nickname}
        </button>
      </div>
    </div>
  );
}

export function FightAnimation({
  fighterA,
  fighterB,
}: {
  fighterA?: Player;
  fighterB?: Player;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex-1 text-center">
        <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-red-900/50" />
        <p className="font-semibold">{fighterA?.nickname ?? '—'}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-3/4 bg-red-500 transition-all" />
        </div>
      </div>
      <span className="text-2xl font-bold text-amber-500">VS</span>
      <div className="flex-1 text-center">
        <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-blue-900/50" />
        <p className="font-semibold">{fighterB?.nickname ?? '—'}</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-2/3 bg-blue-500 transition-all" />
        </div>
      </div>
    </div>
  );
}
