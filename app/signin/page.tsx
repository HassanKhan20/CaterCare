import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-sm w-full space-y-4">
        <h1 className="text-2xl font-bold">Sign in to CaterCare</h1>
        <p className="text-sm text-slate-600">
          Discover authentic local home-cooks in your neighborhood.
        </p>
        <form
          action={async () => {
            'use server';
            await signIn('google');
          }}
        >
          <Button type="submit" className="w-full">
            Continue with Google
          </Button>
        </form>
      </Card>
    </main>
  );
}
