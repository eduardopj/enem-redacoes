// Augment Express Request with custom fields set by our middleware
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      teacherId: string;
      teacherEmail: string;
    }
  }
}

export {};
