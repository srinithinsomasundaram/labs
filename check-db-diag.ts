
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('Checking database...');

    // Check users
    const { data: users, error: userError } = await supabase.from('users').select('id, email, plan').limit(5);
    console.log('Recent Users:', users || userError);

    // Check audits
    const { data: audits, error: auditError } = await supabase
        .from('audits')
        .select('id, user_id, website_url, created_at, is_paid')
        .order('created_at', { ascending: false })
        .limit(10);

    console.log('Recent Audits:', audits || auditError);

    if (audits && audits.length > 0) {
        console.log('Latest audit details:', JSON.stringify(audits[0], null, 2));
    } else {
        console.log('No audits found in the database.');
    }
}

check();
