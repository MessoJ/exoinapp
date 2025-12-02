import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

interface UserSocket {
  socketId: string;
  userId: string;
  connectedAt: Date;
}

class WebSocketService {
  private io: Server | null = null;
  private connectedUsers: Map<string, UserSocket[]> = new Map();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.io.on('connection', (socket: Socket) => {
      console.log(`🔌 WebSocket connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', (data: { userId: string; token: string }) => {
        this.handleAuthentication(socket, data);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle email read status sync
      socket.on('email:markRead', (data: { emailId: string; isRead: boolean }) => {
        this.broadcastToUser(socket, 'email:readStatusChanged', data);
      });

      // Handle email starred status sync
      socket.on('email:star', (data: { emailId: string; isStarred: boolean }) => {
        this.broadcastToUser(socket, 'email:starChanged', data);
      });

      // Handle typing indicator for shared drafts
      socket.on('compose:typing', (data: { draftId: string; isTyping: boolean }) => {
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
  private handleAuthentication(socket: Socket, data: { userId: string; token: string }) {
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
    (socket as any).userId = userId;

    console.log(`👤 User ${userId} authenticated on socket ${socket.id}`);
    
    // Emit connection success
    socket.emit('authenticated', { success: true });
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket) {
    const userId = (socket as any).userId;
    
    if (userId) {
      // Remove from tracking
      const userSockets = this.connectedUsers.get(userId) || [];
      const filtered = userSockets.filter(s => s.socketId !== socket.id);
      
      if (filtered.length > 0) {
        this.connectedUsers.set(userId, filtered);
      } else {
        this.connectedUsers.delete(userId);
      }

      socket.leave(`user:${userId}`);
    }

    console.log(`🔌 WebSocket disconnected: ${socket.id}`);
  }

  /**
   * Broadcast to same user's other devices
   */
  private broadcastToUser(socket: Socket, event: string, data: any) {
    const userId = (socket as any).userId;
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
  notifyNewEmail(userId: string, email: {
    id: string;
    subject: string;
    fromAddress: string;
    fromName?: string;
    snippet?: string;
    folder: string;
  }) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('email:new', {
      ...email,
      timestamp: new Date().toISOString(),
    });

    console.log(`📧 Notified user ${userId} of new email: ${email.subject}`);
  }

  /**
   * Notify user of email update
   */
  notifyEmailUpdate(userId: string, emailId: string, changes: Record<string, any>) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('email:updated', {
      emailId,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user of email deletion
   */
  notifyEmailDeleted(userId: string, emailId: string) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('email:deleted', {
      emailId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user of folder update (new count, etc)
   */
  notifyFolderUpdate(userId: string, folder: string, unreadCount: number) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('folder:updated', {
      folder,
      unreadCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user of sync completion
   */
  notifySyncComplete(userId: string, result: {
    newEmails: number;
    folder: string;
    success: boolean;
  }) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('sync:complete', {
      ...result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user of scheduled email sent
   */
  notifyScheduledEmailSent(userId: string, emailId: string, subject: string) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('scheduled:sent', {
      emailId,
      subject,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify user of snoozed email returned
   */
  notifySnoozeComplete(userId: string, emailId: string, subject: string) {
    if (!this.io) return;
    
    this.io.to(`user:${userId}`).emit('snooze:complete', {
      emailId,
      subject,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get user's active connections count
   */
  getUserConnectionsCount(userId: string): number {
    return this.connectedUsers.get(userId)?.length || 0;
  }
}

export const websocketService = new WebSocketService();
