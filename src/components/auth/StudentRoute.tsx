import { useAppStore } from '@/store/app-store';
import { Redirect } from 'expo-router';
import { PropsWithChildren } from 'react';

export function StudentRoute({ children }: PropsWithChildren) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentStudent = useAppStore((state) => state.currentStudent);

  if (!hasHydrated) return null;
  if (!currentStudent) return <Redirect href="/student/login" />;
  return <>{children}</>;
}
