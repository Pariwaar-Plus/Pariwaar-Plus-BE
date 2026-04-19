import prisma from "../src/config/prisma";
import bcrypt from "bcrypt";

async function main() {
  const adminEmail = "admin@system.com";

  // 1. Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 3. Create admin user
  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin created successfully:", admin.email);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });