import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="max-w-2xl text-center py-24 space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900">
          Authentic home-cooked food, from neighbors who love what they make.
        </h1>
        <p className="text-lg text-slate-600">
          CaterCare connects local home cooks with hungry neighbors. Independent
          drivers deliver. Everyone gets paid fairly.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/signin">
            <Button>Browse cooks near me</Button>
          </Link>
          <Link href="/signin">
            <Button variant="secondary">Become a cook</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
