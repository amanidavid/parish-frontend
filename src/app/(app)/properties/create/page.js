'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePropertyPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/properties'); }, [router]);
  return null;
}
