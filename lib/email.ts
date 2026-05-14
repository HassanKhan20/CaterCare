import { Resend } from 'resend';

let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  _resend = new Resend(process.env.RESEND_API_KEY ?? '');
  return _resend;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (process.env.NODE_ENV === 'test') return { id: 'test' };
  const from = process.env.RESEND_FROM ?? 'CaterCare <hello@example.com>';
  return getResend().emails.send({ from, ...args });
}

const appUrl = () => process.env.APP_URL ?? 'http://localhost:3000';

export const templates = {
  cookApproved: (name: string) => ({
    subject: "You're approved on CaterCare!",
    html: `<p>Hi ${name}, your cook account is live. List your first dish at ${appUrl()}/cook/dishes.</p>`,
  }),
  cookRejected: (name: string, reason: string) => ({
    subject: 'CaterCare application update',
    html: `<p>Hi ${name}, unfortunately we couldn't approve your application: ${reason}.</p>`,
  }),
  certExpiringSoon: (name: string, daysLeft: number) => ({
    subject: `Your food handler cert expires in ${daysLeft} days`,
    html: `<p>Hi ${name}, your TX food handler certification expires in ${daysLeft} days. Renew at ${appUrl()}/cook/profile to keep listings active.</p>`,
  }),
  orderPlaced: (cookName: string, orderId: string) => ({
    subject: 'New order received',
    html: `<p>You have a new order. Accept or decline in your inbox: ${appUrl()}/cook/orders/${orderId}</p>`,
  }),
  orderAccepted: (orderId: string) => ({
    subject: 'Your order was accepted',
    html: `<p>Your CaterCare order is being prepared. Track: ${appUrl()}/orders/${orderId}</p>`,
  }),
  orderDelivered: (orderId: string) => ({
    subject: 'Order delivered',
    html: `<p>Your order has been delivered. View receipt: ${appUrl()}/orders/${orderId}</p>`,
  }),
  driverAssigned: (orderId: string) => ({
    subject: 'New delivery job',
    html: `<p>You claimed a delivery. Details: ${appUrl()}/driver/jobs/${orderId}</p>`,
  }),
  cottageCapSoftWarning: (name: string, gmvDollars: number) => ({
    subject: "Heads up: you're approaching the TX cottage food earnings cap",
    html: `<p>Hi ${name}, your CaterCare earnings this year have reached $${gmvDollars.toLocaleString()}. Texas law caps cottage food sales at $150,000/year. At $145,000 your listings will be paused until you obtain a commercial permit. <a href="${appUrl()}/cook/compliance">Learn more</a>.</p>`,
  }),
  cottageCapHardWarning: (name: string, gmvDollars: number) => ({
    subject: 'Action required: TX cottage food cap approaching ($145K threshold)',
    html: `<p>Hi ${name}, your earnings are at $${gmvDollars.toLocaleString()}. You must obtain a Dallas Retail Food Establishment Permit before reaching $150,000 or your listings will be auto-paused. <a href="${appUrl()}/cook/compliance">Upload your permit</a>.</p>`,
  }),
  dshsRegistrationRequired: (name: string) => ({
    subject: 'DSHS registration required for your TCS dish',
    html: `<p>Hi ${name}, one of your dishes is classified as TCS (refrigerated/prepared meal). Texas requires DSHS registration to sell these. <a href="${appUrl()}/cook/compliance">Upload registration</a> to activate the dish.</p>`,
  }),
  insuranceExpiringSoon: (name: string, daysLeft: number) => ({
    subject: `Your auto insurance expires in ${daysLeft} days`,
    html: `<p>Hi ${name}, your auto insurance on file expires in ${daysLeft} days. Update it at ${appUrl()}/driver/profile to stay active on CaterCare.</p>`,
  }),
};
