import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@admin.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.users.upsert({
    where: { email: adminEmail },
    update: {
      email_verified_at: new Date(),
    },
    create: {
      email: adminEmail,
      username: "admin",
      password_hash: passwordHash,
      role: "admin",
      email_verified_at: new Date(),
    },
  });

  console.log("Seeded admin user:", adminEmail);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
