import "dotenv/config";
import * as fs from "fs";
import { defineConfig } from "drizzle-kit";

const usePglite = process.env.USE_PGLITE === "true";

if (usePglite) {
  fs.mkdirSync(process.env.PGLITE_DATA_DIR || ".data/pglite", {
    recursive: true,
  });
}

if (!usePglite && !process.env.DATABASE_URL) {
  throw new Error(
    "Set DATABASE_URL for PostgreSQL, or USE_PGLITE=true for local embedded DB.",
  );
}

export default defineConfig(
  usePglite
    ? {
        out: "./migrations",
        schema: "./shared/schema.ts",
        dialect: "postgresql",
        driver: "pglite",
        dbCredentials: {
          url: process.env.PGLITE_DATA_DIR || ".data/pglite",
        },
      }
    : {
        out: "./migrations",
        schema: "./shared/schema.ts",
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.DATABASE_URL!,
        },
      },
);
