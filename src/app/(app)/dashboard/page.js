'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import useServiceStore from '@/store/serviceStore';
import ServiceHub from '@/components/dashboard/ServiceHub';
import MyWorkspace from '@/components/dashboard/MyWorkspace';
import WelcomeModal from '@/components/dashboard/WelcomeModal';

/* Dashboard page branches based on user scope:
 * - full          → ServiceHub (all services)
 * - limited       → MyWorkspace (assigned resources only)
 */

/* --- Page --- */
export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isNewUser = useAuthStore((s) => s.isNewUser);
  const setNewUser = useAuthStore((s) => s.setNewUser);
  const services = useAuthStore((s) => s.services);
  const scope = useAuthStore((s) => s.scope);

  useEffect(() => {
    if (services?.length > 0) {
      useServiceStore.getState().setActiveService(services[0].id);
    }
  }, [services]);

  const handlePropertyCreated = (property) => {
    setNewUser(false);
    router.push(`/properties/${property.uuid}`);
  };

  const handleSkip = () => setNewUser(false);

  const isLimited = scope === 'limited';

  return (
    <div>
      <WelcomeModal open={isNewUser} userName={user?.name} onCreated={handlePropertyCreated} onSkip={handleSkip} />
      {isLimited ? <MyWorkspace /> : <ServiceHub />}
    </div>
  );
}
