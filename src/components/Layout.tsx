import { Link } from 'react-router-dom';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-6">
      <header className="mb-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-amber-400">
          ProyectoSoyJere
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
