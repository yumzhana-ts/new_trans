import { userRepo } from "@/repositories/user.repo";

export async function searchUsers(query: string) {
  const q = query.trim();

  if (!q) return [];

  return userRepo.searchByUsername(q);
}

export async function getUserByEmail(email: string) {
  return userRepo.findByEmail(email);
}

export async function getUserById(id: number) {
  return userRepo.findById(id);
}
