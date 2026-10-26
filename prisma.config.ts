import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl =
  process.env.NODE_ENV === "production"
    ? (process.env.DIRECT_URL ?? process.env.DATABASE_URL)
    : process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl,
  },
});
