import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../types/index.js';

export function authorizeRole(allowedRoles: Array<AuthUser['role']>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication session required.',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient organization privileges for this operation.',
        },
      });
      return;
    }

    next();
  };
}
