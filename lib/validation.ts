import { z } from 'zod';

/**
 * URL validation schema
 */
export const urlSchema = z.string().min(3).refine(
    (url) => {
        try {
            // Check if it's a valid URL string first
            const formatted = url.startsWith('http') ? url : `https://${url}`;
            const parsed = new URL(formatted);
            return !!parsed.hostname;
        } catch {
            return false;
        }
    },
    { message: 'Invalid URL format' }
);

/**
 * Analyze request schema
 */
export const analyzeRequestSchema = z.object({
    url: urlSchema,
});

/**
 * Create audit request schema
 */
export const createAuditRequestSchema = z.object({
    url: urlSchema,
    previewIssues: z.any().optional(),
});

/**
 * Payment verification schema
 */
export const paymentVerificationSchema = z.object({
    razorpay_order_id: z.string(),
    razorpay_payment_id: z.string(),
    razorpay_signature: z.string(),
    audit_id: z.string().uuid().optional(),
    upgrade: z.boolean().optional(),
}).refine((data) => Boolean(data.audit_id) || Boolean(data.upgrade), {
    message: 'Either audit_id or upgrade flag must be provided',
});

/**
 * Generate copy request schema
 */
export const generateCopyRequestSchema = z.object({
    url: urlSchema,
});

/**
 * Validate and sanitize URL
 */
export function validateUrl(url: string): { valid: boolean; url?: string; error?: string } {
    try {
        const result = urlSchema.safeParse(url);
        if (!result.success) {
            return { valid: false, error: result.error.issues[0].message };
        }
        return { valid: true, url: result.data };
    } catch (error) {
        return { valid: false, error: 'Invalid URL' };
    }
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
    // Remove script tags
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove style tags
    sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // Remove inline event handlers
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');

    return sanitized;
}

/**
 * Validate email
 */
export const emailSchema = z.string().email();

/**
 * Validate UUID
 */
export const uuidSchema = z.string().uuid();
