
import * as dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from './lib/supabase';

async function checkAuthUser() {
    const email = 'srinithin002@gmail.com';
    console.log(`Checking Auth status for: ${email}`);

    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.log('User not found in Supabase Auth');
        return;
    }

    console.log('User Found in Auth:');
    console.log('- ID:', user.id);
    console.log('- Email Confirmed:', !!user.email_confirmed_at);
    console.log('- Providers:', user.app_metadata?.providers);
    console.log('- Last Sign In:', user.last_sign_in_at);
    console.log('- User Metadata:', user.user_metadata);
}

checkAuthUser().catch(console.error);
