export type AccountSession = {
  sessionId: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
  revoked: boolean;
  userAgent?: string;
};
