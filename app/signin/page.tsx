import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DevSignIn } from '@/components/DevSignIn';
import Link from 'next/link';

export default function SignInPage() {
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--color-surface-0)] px-4 py-12 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-brand-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative">
        <Link
          href="/"
          className="block text-3xl font-bold text-[#f5f1ec] text-center mb-10 hover:text-brand-400 transition-colors"
        >
          CaterCare
        </Link>
        <Card variant="elevated" className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-[#f5f1ec]/60 mt-1.5">
              Sign in to order, cook, or drive.
            </p>
          </div>
          <form
            action={async () => {
              'use server';
              await signIn('google');
            }}
          >
            <Button type="submit" size="lg" className="w-full">
              Continue with Google
            </Button>
          </form>

          {isDev && <DevSignIn />}
        </Card>
        <p className="text-xs text-[#f5f1ec]/40 text-center mt-6">
          By signing in you agree to our terms. We&apos;ll never sell your info.
        </p>
      </div>
    </main>
  );
}
