'use client';
import { useParams } from 'next/navigation';
import MaintenanceJobDetailClient from '@/components/maintenance/MaintenanceJobDetailClient';

export default function MaintenanceJobDetailPage() {
  const { uuid } = useParams();
  return <MaintenanceJobDetailClient uuid={uuid} />;
}
