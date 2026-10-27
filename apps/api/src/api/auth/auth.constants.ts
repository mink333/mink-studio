import { CookieOptions } from 'express';
import { REFRESH_TOKEN_EXPIRY_SECONDS } from "../../shared/util/jwt.util.js";

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
};
