import { searchUsers } from "@/services/user.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const users = await searchUsers(q);

  return Response.json(users);
}