import Link from 'next/link';
import { Btn } from '@/components/ui/Btn';

export default async function CheckoutSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return (
    <main className="cc-page">
      <div className="cc-confirm">
        <div className="cc-confirm-mark">
          <svg viewBox="0 0 64 64" width="64" height="64">
            <circle
              cx="32"
              cy="32"
              r="29"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m20 32 8 8 16-18"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="cc-eye">Order #{orderId.slice(-8).toUpperCase()}</span>
        <h2>Your cook is preparing your food.</h2>
        <p>
          We&apos;ll let you know when a driver claims the pickup. Your home cook
          gets 88¢ of every dollar — thank you for ordering local.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href={`/orders/${orderId}`}>
            <Btn variant="primary" size="lg">
              Track this order
            </Btn>
          </Link>
          <Link href="/browse">
            <Btn variant="secondary" size="lg">
              Back to browse
            </Btn>
          </Link>
        </div>
      </div>
    </main>
  );
}
