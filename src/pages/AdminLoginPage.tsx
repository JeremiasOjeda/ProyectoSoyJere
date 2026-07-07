import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export function AdminLoginPage() {
  return (
    <Layout>
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold">Crear sala</h1>
        <p className="text-zinc-400">Login de admin — etapa siguiente.</p>
        <Link to="/" className="text-amber-400 underline">
          Volver
        </Link>
      </div>
    </Layout>
  );
}
