import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function LandingPage() {
  return (
    <Layout>
      <div className="flex flex-1 flex-col justify-center gap-8">
        <div>
          <h1 className="text-3xl font-bold">Torneo de combates</h1>
          <p className="mt-2 text-zinc-400">
            8 luchadores, builds personalizados y narración automática.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            to="/join"
            className="rounded-xl bg-amber-500 py-4 text-center font-semibold text-zinc-950"
          >
            Unirse con código
          </Link>
          <Link
            to="/admin/login"
            className="rounded-xl border border-zinc-700 py-4 text-center font-semibold"
          >
            Crear sala
          </Link>
        </div>
      </div>
    </Layout>
  );
}
