"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websocketService = void 0;
const socket_io_1 = require("socket.io");
class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }
    /**
     * Initialize WebSocket server
     */
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true,
            },
            pingTimeout: 60000,
            pingInterval: 25000,
        });
        this.io.on('connection', (socket) => {
            console.log(`🔌 WebSocket connected: ${socket.id}`);
            // Authenticate user
            socket.on('authenticate', (data) => {
                this.handleAuthentication(socket, data);
            });
            // Handle disconnect
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
            // Handle email read status sync
            socket.on('email:markRead', (data) => {
                this.broadcastToUser(socket, 'email:readStatusChanged', data);
            });
            // Handle email starred status sync
            socket.on('email:star', (data) => {
                this.broadcastToUser(socket, 'email:starChanged', data);
            });
            // Handle typing indicator for shared drafts
            socket.on('compose:typing', (data) => {
                this.broadcastToUser(socket, 'compose:userTyping', {
                    ...data,
                    socketId: socket.id,
                });
            });
        });
        console.log('✅ WebSocket server initialized');
        return this.io;
    }
    /**
     * Handle user authentication
     */
    handleAuthentication(socket, data) {
        const { userId } = data;
        // Join user-specific room
        socket.join(`user:${userId}`);
        // Track connected user
        const userSockets = this.connectedUsers.get(userId) || [];
        userSockets.push({
            socketId: socket.id,
            userId,
            connectedAt: new Date(),
        });
        this.connectedUsers.set(userId, userSockets);
        // Store userId on socket for later reference
        socket.userId = userId;
        console.log(`👤 User ${userId} authenticated on socket ${socket.id}`);
        // Emit connection success
        socket.emit('authenticated', { success: true });
    }
    /**
     * Handle socket disconnect
     */
    handleDisconnect(socket) {
        const userId = socket.userId;
        if (userId) {
            // Remove from tracking
            const userSockets = this.connectedUsers.get(userId) || [];
            const filtered = userSockets.filter(s => s.socketId !== socket.id);
            if (filtered.length > 0) {
                this.connectedUsers.set(userId, filtered);
            }
            else {
                this.connectedUsers.delete(userId);
            }
            socket.leave(`user:${userId}`);
        }
        console.log(`🔌 WebSocket disconnected: ${socket.id}`);
    }
    /**
     * Broadcast to same user's other devices
     */
    broadcastToUser(socket, event, data) {
        const userId = socket.userId;
        if (userId) {
            socket.to(`user:${userId}`).emit(event, data);
        }
    }
    // ==========================================
    // PUBLIC NOTIFICATION METHODS
    // ==========================================
    /**
     * Notify user of new email
     */
    notifyNewEmail(userId, email) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('email:new', {
            ...email,
            timestamp: new Date().toISOString(),
        });
        console.log(`📧 Notified user ${userId} of new email: ${email.subject}`);
    }
    /**
     * Notify user of email update
     */
    notifyEmailUpdate(userId, emailId, changes) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('email:updated', {
            emailId,
            changes,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Notify user of email deletion
     */
    notifyEmailDeleted(userId, emailId) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('email:deleted', {
            emailId,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Notify user of folder update (new count, etc)
     */
    notifyFolderUpdate(userId, folder, unreadCount) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('folder:updated', {
            folder,
            unreadCount,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Notify user of sync completion
     */
    notifySyncComplete(userId, result) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('sync:complete', {
            ...result,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Notify user of scheduled email sent
     */
    notifyScheduledEmailSent(userId, emailId, subject) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('scheduled:sent', {
            emailId,
            subject,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Notify user of snoozed email returned
     */
    notifySnoozeComplete(userId, emailId, subject) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit('snooze:complete', {
            emailId,
            subject,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Get connected users count
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    /**
     * Check if user is online
     */
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }
    /**
     * Get user's active connections count
     */
    getUserConnectionsCount(userId) {
        return this.connectedUsers.get(userId)?.length || 0;
    }
}
exports.websocketService = new WebSocketService();
