
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('Applying status column migration...');

    const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_string: "ALTER TABLE audits ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' CHECK (status IN ('analyzing', 'completed', 'failed'));"
    });

    if (alterError) {
        console.error('Migration failed (RPC exec_sql probably not enabled):', alterError);
        console.log('Attempting via direct query if possible...');
        // Supabase JS doesn't support raw SQL easily unless RPC is enabled.
        // Let's try to just insert a record with the new column - if it works, the column exists.
    } else {
        console.log('Migration successful!');
    }
}

applyMigration();
