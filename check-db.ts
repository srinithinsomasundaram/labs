import * as dotenv from 'dotenv';
dotenv.config();

async function checkDb() {
    console.log("Checking database connectivity...");
    try {
        // Dynamic import to ensure process.env is populated
        const { supabaseAdmin } = await import('./lib/supabase');

        const { data, error } = await supabaseAdmin.from('audits').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Database error audits:", error);
        } else {
            console.log("Successfully connected to 'audits' table. Count:", data);
        }

        const { data: userData, error: userError } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
        if (userError) {
            console.error("Users table error:", userError);
        } else {
            console.log("Successfully connected to 'users' table. Count:", userData);
        }
    } catch (e) {
        console.error("Unexpected error:", e);
    }
}

checkDb();
