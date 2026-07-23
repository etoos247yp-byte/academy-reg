import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { ssl: "require", connect_timeout: 10, max: 1 });
  try {
    const r = await sql`SELECT 1 as connected`;
    console.log("CONNECTED:", r);
  } catch (e: any) {
    console.log("ERR:", String(e));
  }
  await sql.end();
}

main();
