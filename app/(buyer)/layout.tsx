import { BuyerNavBar } from '@/components/BuyerNavBar';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BuyerNavBar />
      {children}
    </>
  );
}
