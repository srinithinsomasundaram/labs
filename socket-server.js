const http = require('http');
const { Server } = require('socket.io');

const httpServer = http.createServer();

const io = new Server(httpServer, {
    cors: {
        origin: '*', // In production, limit this to your domain
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Allow clients to join rooms based on their user ID or audit ID
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle progress updates from the Next.js API
    socket.on('audit-progress', (data) => {
        const { userId, auditId, step, message } = data;
        console.log(`[PROGRESS] Audit ${auditId} for user ${userId}: ${step} - ${message}`);
        // Broadcast to user-specific room and audit-specific room
        io.to(userId).emit('audit-update', data);
        io.to(auditId).emit('audit-update', data);
    });

    // Handle generic user events
    socket.on('user-event', (data) => {
        const { userId, event, data: eventData } = data;
        io.to(userId).emit(event, eventData);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

const PORT = process.env.SOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
