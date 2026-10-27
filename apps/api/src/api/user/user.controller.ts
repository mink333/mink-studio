// src/api/user/user.controller.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../../shared/types/auth.type.js';
import { getCurrentUserProfile } from './user.service.js';

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await getCurrentUserProfile(userId);

    if (!user) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ message: '내 정보 조회 중 오류가 발생했습니다.' });
  }
};