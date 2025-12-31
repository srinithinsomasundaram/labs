
import * as dotenv from 'dotenv';
dotenv.config();

import { scrapePage } from './lib/scraper';
import { analyzePage } from './lib/ai';
import { supabaseAdmin } from './lib/supabase';

async function test() {
    const url = "https://thamly.in";
    console.log('--- TEST AUDIT START ---');

    // Get a user
    const { data: user } = await supabaseAdmin.from('users').select('id').limit(1).single();
    if (!user) throw new Error("No user found");
    const userId = user.id;
    console.log('Using User:', userId);

    console.log('1. Scraping...');
    const scraped = await scrapePage(url);
    console.log('Scraped Title:', scraped.title);

    console.log('2. Analyzing...');
    const result = await analyzePage(scraped);
    console.log('Analyze Score:', result.score);

    console.log('3. Saving...');
    const record = {
        user_id: userId,
        website_url: url,
        conversion_score: result.score,
        preview_issues: result.audit_items.slice(0, 3),
        full_report: result,
        is_paid: false
    };

    const { data, error } = await supabaseAdmin.from('audits').insert(record).select().single();
    if (error) {
        console.error('Save failed:', error);
    } else {
        console.log('Save success! ID:', data.id);

        // Don't delete it this time, let's see it in the DB
        console.log('Check DB now for ID:', data.id);
    }
}

test().catch(console.error);
