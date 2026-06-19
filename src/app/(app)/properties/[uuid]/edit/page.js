'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditPropertyPage() {
  const { uuid } = useParams();
  const router = useRouter();
  useEffect(() => { router.replace(`/properties/${uuid}`); }, [router, uuid]);
  return null;
}
