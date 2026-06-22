import { prisma } from "@/lib/prisma";

export const userRepo = {
  findByEmail(email: string) {
    return prisma.users.findUnique({
      where: { email },
    });
  },

  findById(id: number) {
    return prisma.users.findUnique({
      where: { id },
    });
  },

  searchByUsername(query: string) {
    return prisma.users.findMany({
      where: {
        username: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 20,
    });
  },
};