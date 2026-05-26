import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { env } from '../config/env';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${env.azure.tenantId}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err ?? new Error('No signing key found'));
    callback(null, key.getPublicKey());
  });
}

export interface AuthenticatedRequest<P = Record<string, string>> extends Request<P> {
  user?: {
    oid: string;   // Azure AD object ID — stable unique user identifier
    email: string;
    name: string;
    roles?: string[];
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized', message: 'Missing bearer token', statusCode: 401 });
    return;
  }

  const token = authHeader.slice(7);

  // In dev with no Azure config, allow a mock token for local testing
  if (env.isDev && !env.azure.tenantId) {
    try {
      const decoded = jwt.decode(token) as Record<string, unknown>;
      req.user = {
        oid: decoded?.sub as string ?? 'dev-user',
        email: decoded?.email as string ?? 'dev@localhost',
        name: decoded?.name as string ?? 'Dev User',
      };
      return next();
    } catch {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid token', statusCode: 401 });
      return;
    }
  }

  jwt.verify(
    token,
    getKey,
    {
      audience: env.azure.clientId,
      issuer: `https://login.microsoftonline.com/${env.azure.tenantId}/v2.0`,
    },
    (err, decoded) => {
      if (err || !decoded || typeof decoded === 'string') {
        res.status(401).json({ error: 'Unauthorized', message: 'Invalid token', statusCode: 401 });
        return;
      }
      const claims = decoded as Record<string, unknown>;
      req.user = {
        oid: claims.oid as string,
        email: (claims.preferred_username ?? claims.email) as string,
        name: claims.name as string,
        roles: claims.roles as string[] | undefined,
      };
      next();
    }
  );
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles ?? [];
    if (roles.some(r => userRoles.includes(r))) return next();
    res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions', statusCode: 403 });
  };
}
