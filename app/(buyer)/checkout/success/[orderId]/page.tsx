import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Card className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Order placed!</h1>
        <p className="text-slate-600">
          Your cook will accept or decline shortly. You&apos;ll get email updates as
          your order progresses.
        </p>
        <p className="text-xs text-slate-500">Order ID: {orderId}</p>
        <Link href={`/orders/${orderId}`}>
          <Button className="w-full">Track this order</Button>
        </Link>
      </Card>
    </main>
  );
}
