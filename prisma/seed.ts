import prisma from "../src/config/prisma";

async function main() {
  await prisma.role.createMany({
    data: [
      { id: 1, name: "Admin" },
      { id: 2, name: "Staff" },
      { id: 3, name: "User" }
    ],
    skipDuplicates: true
  });

  console.log("Roles seeded successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seeding failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });