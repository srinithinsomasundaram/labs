import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { rateLimitByUser } from '@/lib/rate-limit';
import { scrapePage } from '@/lib/scraper';
import { generateCopyRequestSchema } from '@/lib/validation';
import { generateCopy } from '@/lib/ai-copy';

export async function POST(request: NextRequest) {
    try {
        // Require authentication
        const { user } = await requireAuth();
        const userId = user.id;

        // Rate limit by user
        const rateLimitResult = await rateLimitByUser(userId, {
            interval: 60 * 1000, // 1 minute
            uniqueTokenPerInterval: 10, // 10 requests per minute
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
        const { url } = generateCopyRequestSchema.parse(body);

        // Scrape website
        const scrapedData = await scrapePage(url);

        // Generate AI copy suggestions
        const copyResult = await generateCopy(scrapedData);

        return NextResponse.json({
            success: true,
            copyResult,
        });
    } catch (error: any) {
        console.error('Generate copy error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        if (error.message.includes('Failed to scrape')) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: error.message || 'Failed to generate copy' },
            { status: 500 }
        );
    }
}
