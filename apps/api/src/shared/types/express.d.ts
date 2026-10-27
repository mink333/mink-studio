import 'express';
import { RequestUser } from './auth.type.ts';

declare global {
  namespace Express {
    interface Request {
      user: RequestUser;
    }
  }
}
