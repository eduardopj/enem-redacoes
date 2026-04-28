import { useAppStore } from '@/store/app-store';
import { Redirect } from 'expo-router';
import { PropsWithChildren } from 'react';

type Props = PropsWithChildren<{
  allowStudent?: boolean;
}>;

export function ProtectedRoute({ children, allowStudent = false }: Props) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const currentStudent = useAppStore((state) => state.currentStudent);

  if (!hasHydrated) {
    return null;
  }

  const isAuthorized = currentTeacher != null || (allowStudent && currentStudent != null);

  if (!isAuthorized) {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
}