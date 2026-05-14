import { DocUploadPage } from '@/components/cook/DocUploadPage';

export default function CookDshsUploadPage() {
  return (
    <DocUploadPage
      title="DSHS registration (TCS dishes)"
      description="Required by TX SB 541 to sell refrigerated or prepared meals. Upload your registration certificate from the Texas Department of State Health Services."
      purpose="cook-dshs"
      apiPath="/api/cook/dshs"
      fileFieldName="dshsRegistrationUrl"
      nextPath="/cook"
    />
  );
}
