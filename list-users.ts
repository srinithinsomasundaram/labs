
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error listing users:', error);
    } else {
        console.log('Users found:', data.length);
        data.forEach(u => console.log(`- ${u.email} (${u.id})`));
    }
}

listUsers();
