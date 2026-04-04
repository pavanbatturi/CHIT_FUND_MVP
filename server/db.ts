import * as fs from "fs";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";

const usePglite = process.env.USE_PGLITE === "true";

const pgliteDataDir = process.env.PGLITE_DATA_DIR ?? ".data/pglite";
if (usePglite) {
  fs.mkdirSync(pgliteDataDir, { recursive: true });
}

const pglite = usePglite ? new PGlite(pgliteDataDir) : null;

/** Resolve before handling HTTP traffic when using PGlite (WASM init). */
export const dbReady = pglite ? pglite.waitReady : Promise.resolve();

export const db = usePglite
  ? drizzlePglite(pglite!)
  : (() => {
      const url = process.env.DATABASE_URL;
      if (!url) {
        throw new Error(
          "Set DATABASE_URL for PostgreSQL, or USE_PGLITE=true for local embedded DB (no Docker).",
        );
      }
      return drizzleNodePg(url);
    })();
