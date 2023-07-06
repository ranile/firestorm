/*
When enabling realtime, the tables in `realtime` schema aren't created instantly.
This script polls repeatedly until the tables are created, then exits.
This allows playwright tests to run knowing the tables are created and it can proceed normally.
*/
import postgres from 'postgres';

// supabase CLI database url
const DATABASE_URL = 'postgresql://postgres:postgres@localhost:54322/postgres';

const sql = postgres(DATABASE_URL);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let i = 0; i < 100; i++) {
    try {
        await sql`select *
              from realtime.subscription;`;
        break;
    } catch (e) {
        if (e.message.includes('relation "realtime.subscription" does not exist')) {
            console.log(e.message);
        }
    }
    await sleep(1000);
}

await sql.end();
