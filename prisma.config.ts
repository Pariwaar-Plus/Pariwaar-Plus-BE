import "dotenv/config";
import { defineConfig } from "prisma/config";


export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    url: (process.env.NODE_ENV === 'production') ? process.env["DIRECT_URL"] : process.env["DATABASE_URL"],
  },
});
