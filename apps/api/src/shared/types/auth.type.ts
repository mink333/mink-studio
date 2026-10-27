import type { Request } from "express";
import { JWTPayload } from "jose"

export interface UserTokenPayload extends JWTPayload {
  userId: string;
  role: string;
}

export type AnonymousUser = {
  userId: null;
};

export type AuthenticatedUser = {
  userId: string;
  role: string;
};

export type RequestUser = AnonymousUser | AuthenticatedUser;

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
