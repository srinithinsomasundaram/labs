import { io } from 'socket.io-client';

const socket = io(process.env.SOCKET_INTERNAL_URL || 'http://localhost:3001');

export const emitAuditProgress = (userId: string, auditId: string, step: string, message: string) => {
    console.log(`[SOCKET-EMIT] User: ${userId}, Audit: ${auditId}, Step: ${step}, Msg: ${message}`);
    socket.emit('audit-progress', {
        userId,
        auditId,
        step,
        message,
        timestamp: new Date().toISOString()
    });
};

export const emitToUser = (userId: string, event: string, data: any) => {
    socket.emit('user-event', { userId, event, data });
};
