
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
    console.log('Testing manual insert...');

    // First find a user
    const { data: user } = await supabase.from('users').select('id').limit(1).single();
    if (!user) {
        console.error('No users found to test with');
        return;
    }

    console.log('Using user ID:', user.id);

    const record = {
        user_id: user.id,
        website_url: 'https://test-example.com',
        conversion_score: 8.5,
        preview_issues: { test: true },
        full_report: { test: true, detailed: "yes" },
        is_paid: false
    };

    const { data, error } = await supabase.from('audits').insert(record).select().single();

    if (error) {
        console.error('Insert Error:', error);
    } else {
        console.log('Insert Success! New ID:', data.id);

        // Clean up
        await supabase.from('audits').delete().eq('id', data.id);
        console.log('Cleaned up test record.');
    }
}

testInsert();
