import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DevSignIn } from '@/components/DevSignIn';
import Link from 'next/link';

export default function SignInPage() {
  const isDev = process.env.NODE_ENV === 'development';
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-brand-100 px-4 py-12">
      <div className="max-w-md w-full">
        <Link
          href="/"
          className="block text-2xl font-bold text-brand-700 text-center mb-8"
        >
          CaterCare
        </Link>
        <Card className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-600 mt-1">
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
        <p className="text-xs text-slate-500 text-center mt-6">
          By signing in you agree to our terms. We&apos;ll never sell your info.
        </p>
      </div>
    </main>
  );
}
