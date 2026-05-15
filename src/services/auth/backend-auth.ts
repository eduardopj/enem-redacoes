import { ApiError, apiRequest } from '@/services/api';

export async function registerWithBackend(
  teacherId: string,
  teacherEmail: string,
  teacherName: string,
  clientPasswordHash?: string,
): Promise<string | null> {
  try {
    const data = await apiRequest<{ token: string }>('/v1/auth/register', {
      method: 'POST',
      body: { teacherId, teacherEmail, teacherName, passwordHash: clientPasswordHash },
    });
    return data?.token ?? null;
  } catch {
    return null; // Backend offline — local app still works
  }
}

/**
 * Authenticates against the backend.
 * Returns the session data on success, 'wrong_credentials' on 401, null on network error.
 */
export async function loginWithBackend(
  teacherEmail: string,
  clientPasswordHash: string,
): Promise<{ token: string; teacherId: string } | 'wrong_credentials' | null> {
  try {
    const data = await apiRequest<{ token: string; teacherId: string }>('/v1/auth/login', {
      method: 'POST',
      body: { email: teacherEmail, passwordHash: clientPasswordHash },
    });
    return data ?? null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return 'wrong_credentials';
    return null; // Network/server error — offline fallback handled by caller
  }
}

export async function logoutFromBackend(token: string): Promise<void> {
  try {
    await apiRequest('/v1/auth/logout', { method: 'POST', token });
  } catch {
    // Best-effort — token will expire on its own
  }
}

export async function deleteBackendAccount(token: string): Promise<void> {
  await apiRequest('/v1/auth/account', { method: 'DELETE', token });
}

export async function forgotPasswordRequest(email: string): Promise<void> {
  await apiRequest('/v1/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

export async function resetPasswordRequest(
  email: string,
  code: string,
  newPasswordHash: string,
): Promise<void> {
  await apiRequest('/v1/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPasswordHash },
  });
}
