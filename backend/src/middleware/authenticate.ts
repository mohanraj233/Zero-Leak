import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthUser } from '../types/index.js';
import { env } from '../config/env.js';

declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.header('Authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      req.user = decoded;
      return next();
    } catch {
      // Invalid token
    }
  }

  // Local development default session
  req.user = {
    id: 'user-default-developer',
    email: 'developer@zeroleak.local',
    displayName: 'Workspace User',
    organizationId: 'org-default-workspace',
    role: 'developer',
  };

  next();
}
