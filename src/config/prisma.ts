// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../generated/prisma/client";

// const connectionString = `${process.env.DATABASE_URL}`;
// const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

// export default prisma ;

import dotenv from "dotenv";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from "@prisma/client";

dotenv.config();
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

export default prisma ;

// import { PrismaClient } from '@prisma/client';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { Pool } from 'pg';
// import dotenv from "dotenv";

// // 1. Load the variables IMMEDIATELY
// dotenv.config();

// const connectionString = process.env.DATABASE_URL;

// // 2. Add a check to catch the error early with a better message
// if (!connectionString) {
//   throw new Error("DATABASE_URL is not defined in the environment variables.");
// }

// const pool = new Pool({ connectionString });
// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// export default prisma;


