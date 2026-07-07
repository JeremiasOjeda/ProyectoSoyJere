import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function JoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code') ?? '');
  const [nickname, setNickname] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const room = code.trim().toUpperCase();
    const name = nickname.trim();
    if (!room || !name) return;
    navigate(`/lobby/${room}?nickname=${encodeURIComponent(name)}`);
  };

  return (
    <Layout>
      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">Unirse al torneo</h1>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">Código de sala</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3"
            placeholder="ABC123"
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-400">Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3"
            placeholder="Tu nombre"
            maxLength={16}
          />
        </label>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-amber-500 py-4 font-semibold text-zinc-950"
        >
          Entrar
        </button>
      </form>
    </Layout>
  );
}
