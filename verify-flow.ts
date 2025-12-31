
import * as dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from './lib/supabase';
import axios from 'axios';

async function verify() {
    console.log('--- VERIFICATION START ---');

    const baseUrl = 'http://localhost:3000'; // Adjust as needed for local testing environment

    // 1. Test Guest Audit Saving
    console.log('1. Testing Guest Audit Saving...');
    try {
        const auditRes = await axios.post(`${baseUrl}/api/audit`, { url: 'https://example.com' });
        const { auditId, auditResult } = auditRes.data;

        if (!auditId) throw new Error('No auditId returned from /api/audit');
        console.log('Success: Audit saved with ID:', auditId);

        // 2. Verify in DB
        const { data: dbAudit, error: dbError } = await supabaseAdmin
            .from('audits')
            .select('*')
            .eq('id', auditId)
            .single();

        if (dbError || !dbAudit) throw new Error('Audit not found in DB');
        if (dbAudit.user_id !== null) throw new Error('Guest audit should have null user_id');
        console.log('Success: Audit verified in DB as Guest');

        // 3. Test Linking via Onboarding
        console.log('2. Testing Audit Linking via Onboarding...');
        const mockUserId = '00000000-0000-0000-0000-000000000001'; // Mock UUID
        const onboardRes = await axios.post(`${baseUrl}/api/auth/onboard`, {
            id: mockUserId,
            email: 'test@example.com',
            name: 'Test User',
            auditId: auditId
        });

        if (!onboardRes.data.success) throw new Error('Onboarding failed');
        console.log('Success: Onboarding API called');

        // 4. Verify linking in DB
        const { data: linkedAudit, error: linkError } = await supabaseAdmin
            .from('audits')
            .select('user_id')
            .eq('id', auditId)
            .single();

        if (linkError || !linkedAudit) throw new Error('Audit not found after linking');
        if (linkedAudit.user_id !== mockUserId) throw new Error('Audit NOT linked to user');
        console.log('Success: Audit verified as LINKED to user in DB');

    } catch (err: any) {
        console.error('Verification failed:', err.message);
        if (err.response) console.error('Response data:', err.response.data);
    }
}

// Note: This script requires a running server to test APIs. 
// Since I cannot guarantee a running server in this environment, I'll rely on manual verification steps in walkthrough.md 
// and logic review unless I can run it.
verify(); 
