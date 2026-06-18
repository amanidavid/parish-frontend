'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditStaffPage() {
  const { uuid } = useParams();
  const router = useRouter();
  useEffect(() => { router.replace(`/staff/${uuid}`); }, [router, uuid]);
  return null;
}
