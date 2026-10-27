// src/api/user/user.service.ts
import prisma from "../../shared/config/psql.config.js";

export const getCurrentUserProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};