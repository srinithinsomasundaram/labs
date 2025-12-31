
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
    const email = 'srinithin+test@example.com';
    console.log(`Checking for user with email: ${email}`);

    const { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (user) {
        console.log('User already exists:', user.id);
        return;
    }

    console.log('Creating test user...');
    const { data, error } = await supabase.from('users').insert({
        email,
        name: 'Test User',
        plan: 'free'
    }).select().single();

    if (error) {
        console.error('Error creating user:', error);
    } else {
        console.log('User created successfully:', data.id);
    }
}

createTestUser();
