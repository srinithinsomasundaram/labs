import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { supabaseAdmin } from '@/lib/supabase';
import { createAuditRequestSchema } from '@/lib/validation';
import { scrapePage } from '@/lib/scraper';
import { analyzePage } from '@/lib/ai';
import { emitAuditProgress } from '@/lib/socket-server-client';

// Force rebuild to pick up lib/ai.ts changes
export async function POST(request: NextRequest) {
    let auditId: string | undefined; // Move outside the try block
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;
        const isPro = session.user.plan === 'pro';

        // ENSURE USER EXISTS (Step 3: Fix API logic)
        console.log(`[AUDIT] Ensuring user exists for: ${session.user.email}`);
        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert(
                { id: userId, email: session.user.email },
                { onConflict: 'email', ignoreDuplicates: true }
            );

        if (upsertError) {
            console.error("[AUDIT] USER UPSERT FAILED", upsertError);
            throw upsertError;
        }

        // Fetch the actual ID from the DB (crucial if conflict happened and we kept old ID)
        const { data: userData, error: fetchError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (fetchError || !userData) {
            console.error("[AUDIT] USER FETCH FAILED", fetchError);
            throw new Error("User sync failed: could not retrieve user record");
        }

        const targetUserId = userData.id;
        console.log(`[AUDIT] User verified/onboarded with ID: ${targetUserId}`);

        // Parse and validate request body
        console.log('--- AUDIT CREATE START ---');
        let body;
        try {
            body = await request.json();
        } catch (e) {
            throw new Error('Invalid JSON body');
        }

        const { url } = createAuditRequestSchema.parse(body);
        console.log(`[AUDIT] Starting for user: ${targetUserId} (${url})`);

        // 1. CREATE INITIAL RECORD (Immediate persistence)
        console.log('[AUDIT] Step 1: Creating initial record...');
        const { data: audit, error: createError } = await supabaseAdmin
            .from('audits')
            .insert({
                user_id: targetUserId,
                website_url: url,
                is_paid: isPro,
                status: 'analyzing', // Set initial status to analyzing (supported by DB constraint)
                conversion_score: null,
                preview_issues: null,
                full_report: null
            })
            .select()
            .single();

        if (createError) {
            console.error('[AUDIT] Initial Save Error:', createError);
            return NextResponse.json(
                {
                    error: 'Database save failed',
                    details: createError.message,
                    hint: createError.hint,
                    code: createError.code
                },
                { status: 500 }
            );
        }

        auditId = audit.id; // Assign value
        console.log('[AUDIT] Initial record created:', auditId);
        emitAuditProgress(targetUserId, auditId!, 'scrapping', 'Starting website analysis...');

        // 2. SCRAPE
        console.log('[AUDIT] Step 2: Scraping page...');
        let scrapedData;
        try {
            scrapedData = await scrapePage(url);
            console.log('[AUDIT] Scrape successful. Title length:', scrapedData.title.length);
            emitAuditProgress(targetUserId, auditId!, 'analyzing', 'Extracting content and trust signals...');
        } catch (e: any) {
            console.error('[AUDIT] Scraping failed:', e.message);
            // Optional: Update record to mark as failed
            throw new Error(`Scraping failed: ${e.message}`);
        }

        // 3. ANALYZE
        console.log('[AUDIT] Step 3: Performing AI analysis...');
        let auditResult;
        try {
            auditResult = await analyzePage(scrapedData);
            console.log('[AUDIT] AI Analysis successful. Score:', auditResult.score);
            emitAuditProgress(targetUserId, auditId!, 'completed', 'Finalizing conversion report...');
        } catch (e: any) {
            console.error('[AUDIT] AI Analysis failed:', e.message);
            throw new Error(`AI Analysis failed: ${e.message}`);
        }

        // 4. UPDATE RECORD WITH RESULTS
        console.log('[AUDIT] Step 4: Updating record with results...');
        const { data: updatedAudit, error: updateError } = await supabaseAdmin
            .from('audits')
            .update({
                conversion_score: auditResult.score,
                preview_issues: auditResult.audit_items.slice(0, 3),
                full_report: auditResult,
                status: 'completed' // Set status to completed
            })
            .eq('id', auditId)
            .select()
            .single();

        if (updateError) {
            console.error('[AUDIT] Final Update Error:', updateError);
            return NextResponse.json(
                {
                    error: 'Database update failed',
                    details: updateError.message,
                    hint: updateError.hint,
                    code: updateError.code
                },
                { status: 500 }
            );
        }

        console.log('[AUDIT] SUCCESS:', auditId);
        console.log('--- AUDIT CREATE SUCCESS ---');

        return NextResponse.json({
            success: true,
            audit: {
                id: updatedAudit.id,
                url: updatedAudit.website_url,
                isPaid: updatedAudit.is_paid,
                score: updatedAudit.conversion_score,
                result: updatedAudit.full_report,
                createdAt: updatedAudit.created_at,
            },
        });
    } catch (error: any) {
        console.error('[AUDIT] CRITICAL FAILURE:', error.message);

        // Return more descriptive error for debugging
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error('Detailed Error:', {
            message: errorMessage,
            stack: errorStack,
            error: error
        });

        // Update record to mark as failed if we have an auditId
        if (typeof auditId !== 'undefined') {
            await supabaseAdmin
                .from('audits')
                .update({ status: 'failed' })
                .eq('id', auditId);
        }

        // --- DEBUG LOGGING START ---
        const fs = require('fs');
        const logPath = require('path').join(process.cwd(), 'debug_error.log');
        const timestamp = new Date().toISOString();
        const logMessage = `\n[${timestamp}] ERROR in /api/audit/create:\nMessage: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error)}\n-----------------------------------\n`;
        try {
            fs.appendFileSync(logPath, logMessage);
        } catch (fsError) {
            console.error('Failed to write to debug log:', fsError);
        }
        // --- DEBUG LOGGING END ---



        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                error: errorMessage || 'Failed to create audit',
                details: error.details || error.hint || error.message || 'No additional details'
            },
            { status: 500 }
        );
    }
}
