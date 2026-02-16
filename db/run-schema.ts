import "dotenv/config";
import { pool } from "../lib/db";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
  await pool.query(schema);
  console.log("Schema applied successfully.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
