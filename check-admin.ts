
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Testing Supabase Admin Access...');
console.log('URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);
console.log('Service Key length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

if (!supabaseServiceKey) {
    console.error('ERROR: Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function test() {
    try {
        console.log('Attempting to fetch 1 user...');
        const { data, error } = await supabaseAdmin.from('users').select('id').limit(1);

        if (error) {
            console.error('Supabase Admin Error:', error);
        } else {
            console.log('Success! Found users:', data?.length);
        }
    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
