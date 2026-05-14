import { DocUploadPage } from '@/components/cook/DocUploadPage';

export default function CookIdUploadPage() {
  return (
    <DocUploadPage
      title="ID verification"
      description="Upload a clear photo of your government-issued ID."
      purpose="cook-id"
      apiPath="/api/cook/id-doc"
      fileFieldName="idDocUrl"
      nextPath="/cook/profile/cert"
    />
  );
}
