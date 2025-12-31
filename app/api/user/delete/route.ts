import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/permissions';
import { deleteUser } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
    try {
        // Require authentication
        const session = await requireAuth();
        const userId = session.user.id;

        console.log(`API: Deleting user account for ${userId}`);

        // Perform deletion
        await deleteUser(userId);

        return NextResponse.json({
            success: true,
            message: 'Account deleted successfully',
        });
    } catch (error: any) {
        console.error('Delete account error:', error);

        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete account. Please try again or contact support.' },
            { status: 500 }
        );
    }
}
