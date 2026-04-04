import { useAppStore } from '@/store/app-store';
import { Redirect } from 'expo-router';
import { PropsWithChildren } from 'react';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentTeacher = useAppStore((state) => state.currentTeacher);

  if (!hasHydrated) {
    return null;
  }

  if (!currentTeacher) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}