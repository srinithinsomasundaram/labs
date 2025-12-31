import { NextResponse } from "next/server";
import { scrapePage } from "@/lib/scraper";
import { analyzePage } from "@/lib/ai";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        console.log("[GUEST-AUDIT] Processing:", url);

        // 1. Scrape
        console.log("[GUEST-AUDIT] Step 1: Scraping...");
        const scrapedData = await scrapePage(url);
        console.log("[GUEST-AUDIT] Scraped:", scrapedData.title);

        // 2. Analyze
        console.log("[GUEST-AUDIT] Step 2: Analyzing...");
        const auditResult = await analyzePage(scrapedData);
        console.log("[GUEST-AUDIT] AI Analysis successful. Score:", auditResult.score);

        // 3. Save to DB (as Guest Audit)
        console.log("[GUEST-AUDIT] Step 3: Saving to DB...");
        const { data: savedAudit, error: saveError } = await supabaseAdmin
            .from('audits')
            .insert({
                website_url: url,
                conversion_score: auditResult.score,
                preview_issues: auditResult.audit_items.slice(0, 3), // Only save preview issues initially
                full_report: auditResult,
                is_paid: false,
                user_id: null // Explicitly null for guest audits
            })
            .select('id')
            .single();

        if (saveError) {
            console.error("[GUEST-AUDIT] Database save failed:", saveError.message);
            // We'll still return the result so the UI works, but it won't be paywall-compatible
        }

        return NextResponse.json({
            scrapedData,
            auditResult,
            auditId: savedAudit?.id || null
        });
    } catch (error: any) {
        console.error("[GUEST-AUDIT] Failure:", error.message);
        return NextResponse.json(
            {
                error: error.message || "Something went wrong",
                details: error.stack
            },
            { status: 500 }
        );
    }
}
