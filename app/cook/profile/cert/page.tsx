import { DocUploadPage } from '@/components/cook/DocUploadPage';

export default function CookCertUploadPage() {
  return (
    <DocUploadPage
      title="Food handler certification"
      description="Upload your TX food handler certificate. Valid 2 years from issue date."
      purpose="cook-cert"
      apiPath="/api/cook/food-cert"
      fileFieldName="foodHandlerCertUrl"
      requireExpiry
      expiryFieldName="foodHandlerCertExpiresAt"
      nextPath="/cook/payouts"
    />
  );
}
