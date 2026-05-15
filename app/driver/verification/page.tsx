'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

type UploadPurpose =
  | 'driver-license'
  | 'driver-insurance'
  | 'driver-id'
  | 'driver-car'
  | 'driver-thermal-bag';

async function uploadFile(file: File, purpose: UploadPurpose): Promise<string> {
  const presignRes = await fetch('/api/uploads/presign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ purpose, contentType: file.type }),
  });
  const { uploadUrl, publicUrl } = await presignRes.json();
  await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'content-type': file.type } });
  return publicUrl;
}

export default function DriverVerificationPage() {
  const router = useRouter();
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [idFile, setIdFile] = useState<File | null>(null);
  const [carFile, setCarFile] = useState<File | null>(null);
  const [thermalBagFile, setThermalBagFile] = useState<File | null>(null);
  const [dob, setDob] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!licenseFile || !insuranceFile || !idFile || !carFile || !dob || !licenseExpiry || !insuranceExpiry) {
      setError('All required fields must be filled.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const [licenseDocUrl, insuranceDocUrl, idDocUrl, carPhotoUrl] = await Promise.all([
        uploadFile(licenseFile, 'driver-license'),
        uploadFile(insuranceFile, 'driver-insurance'),
        uploadFile(idFile, 'driver-id'),
        uploadFile(carFile, 'driver-car'),
      ]);

      const res = await fetch('/api/driver/docs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          licenseDocUrl,
          licenseExpiresAt: new Date(licenseExpiry).toISOString(),
          insuranceDocUrl,
          insuranceExpiresAt: new Date(insuranceExpiry).toISOString(),
          idDocUrl,
          carPhotoUrl,
          dateOfBirth: new Date(dob).toISOString(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Submission failed.');
        return;
      }

      // Optional: upload thermal bag photo
      if (thermalBagFile) {
        const url = await uploadFile(thermalBagFile, 'driver-thermal-bag');
        await fetch('/api/driver/thermal-bag', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ thermalBagPhotoUrl: url }),
        });
      }

      router.push('/driver/payouts');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--color-surface-0)]">
      <header className="border-b bg-[var(--color-surface-1)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/driver" className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            ← Dashboard
          </Link>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-3xl font-bold">Verification</h1>

        <FileField
          label="Driver's license"
          file={licenseFile}
          onChange={setLicenseFile}
          extra={
            <Input
              type="date"
              value={licenseExpiry}
              onChange={(e) => setLicenseExpiry(e.target.value)}
              placeholder="Expiry date"
            />
          }
        />
        <FileField
          label="Auto insurance card"
          file={insuranceFile}
          onChange={setInsuranceFile}
          extra={
            <Input
              type="date"
              value={insuranceExpiry}
              onChange={(e) => setInsuranceExpiry(e.target.value)}
              placeholder="Expiry date"
            />
          }
        />
        <FileField label="Government ID" file={idFile} onChange={setIdFile} />
        <FileField label="Photo of your car" file={carFile} onChange={setCarFile} />

        <Card>
          <h3 className="font-semibold mb-2">Date of birth</h3>
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">Must be 18+</p>
        </Card>

        <FileField
          label="Thermal bag photo (optional — earns Verified Bag badge)"
          file={thermalBagFile}
          onChange={setThermalBagFile}
        />

        {error && <p className="text-sm text-red-300">{error}</p>}

        <Button className="w-full" onClick={submit} disabled={submitting}>
          {submitting ? 'Uploading…' : 'Submit for review'}
        </Button>
      </div>
    </main>
  );
}

function FileField({
  label,
  file,
  onChange,
  extra,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  extra?: React.ReactNode;
}) {
  return (
    <Card>
      <h3 className="font-semibold mb-2">{label}</h3>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="text-sm"
      />
      {file && <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{file.name}</p>}
      {extra && <div className="mt-2">{extra}</div>}
    </Card>
  );
}
