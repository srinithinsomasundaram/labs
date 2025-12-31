import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { validateUrl } from '@/lib/validation';
import { scrapePage } from '@/lib/scraper';

// Lightweight preview analysis function
async function generatePreviewAnalysis(scrapedData: any) {
    // Simple preview analysis without full AI
    const issues = [];

    // Check for missing H1
    if (!scrapedData.h1 || scrapedData.h1.length === 0) {
        issues.push({
            category: 'Above-the-Fold Clarity',
            issue: 'Missing or weak H1 headline',
            impact: 'High',
        });
    }

    // Check for weak CTAs
    if (!scrapedData.ctaButtons || scrapedData.ctaButtons.length === 0) {
        issues.push({
            category: 'CTA Engineering',
            issue: 'No clear call-to-action buttons found',
            impact: 'Critical',
        });
    }

    // Check for missing meta description
    if (!scrapedData.metaDescription) {
        issues.push({
            category: 'SEO & Trust',
            issue: 'Missing meta description',
            impact: 'Medium',
        });
    }

    // Calculate basic score
    const score = Math.max(0, 100 - (issues.length * 20));

    return {
        score,
        issues: issues.slice(0, 3), // Only return top 3 issues for preview
    };
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit by IP
        const rateLimitResult = await rateLimit(request, {
            interval: 60 * 1000, // 1 minute
            uniqueTokenPerInterval: 5, // 5 requests per minute
        });

        if (!rateLimitResult.success) {
            return NextResponse.json(
                {
                    error: 'Rate limit exceeded',
                    retryAfter: rateLimitResult.reset,
                },
                { status: 429 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const { url } = body;

        // Validate URL
        const validation = validateUrl(url);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        // Scrape website
        const scrapedData = await scrapePage(url);

        // Generate preview analysis (lightweight, no full AI)
        const previewAnalysis = await generatePreviewAnalysis(scrapedData);

        return NextResponse.json({
            success: true,
            preview: {
                url,
                score: previewAnalysis.score,
                issues: previewAnalysis.issues,
                message: 'This is a preview. Purchase full report for detailed analysis.',
            },
        });
    } catch (error: any) {
        console.error('Analyze error:', error);

        if (error.message?.includes('timeout')) {
            return NextResponse.json(
                { error: 'Website took too long to respond' },
                { status: 504 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to analyze website' },
            { status: 500 }
        );
    }
}
