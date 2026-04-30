import { useAppStore } from '@/store/app-store';
import { Redirect } from 'expo-router';
import { PropsWithChildren, useEffect } from 'react';

type Props = PropsWithChildren<{
  allowStudent?: boolean;
}>;

export function ProtectedRoute({ children, allowStudent = false }: Props) {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const currentStudent = useAppStore((state) => state.currentStudent);
  const ensureTeacherSession = useAppStore((state) => state.ensureTeacherSession);

  useEffect(() => {
    if (hasHydrated && !currentTeacher && !allowStudent) {
      ensureTeacherSession();
    }
  }, [allowStudent, currentTeacher, ensureTeacherSession, hasHydrated]);

  if (!hasHydrated) {
    return null;
  }

  if (allowStudent && currentStudent) {
    return <>{children}</>;
  }

  if (!currentTeacher && allowStudent) {
    return <Redirect href="/" />;
  }

  if (!currentTeacher) {
    return null;
  }

  return <>{children}</>;
}
