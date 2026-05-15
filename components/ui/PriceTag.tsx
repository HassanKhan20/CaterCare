type Props = {
  cents: number;
  large?: boolean;
};

export function PriceTag({ cents, large }: Props) {
  const dollars = (cents / 100).toFixed(2);
  return (
    <span className={large ? 'cc-price cc-price-lg' : 'cc-price'}>
      <span className="cc-price-sym">$</span>
      {dollars}
    </span>
  );
}
