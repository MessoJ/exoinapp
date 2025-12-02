"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
require("dotenv/config");
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const client_1 = require("@prisma/client");
// Import Routes
const auth_1 = __importDefault(require("./routes/auth"));
const documents_1 = __importDefault(require("./routes/documents"));
const clients_1 = __importDefault(require("./routes/clients"));
const company_1 = __importDefault(require("./routes/company"));
const assets_1 = __importDefault(require("./routes/assets"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const pdf_1 = __importDefault(require("./routes/pdf"));
const mail_1 = __importDefault(require("./routes/mail"));
const signature_1 = __importDefault(require("./routes/signature"));
const emailHosting_1 = __importDefault(require("./routes/emailHosting"));
const users_1 = __importDefault(require("./routes/users"));
const ai_1 = __importDefault(require("./routes/ai"));
const templates_1 = __importDefault(require("./routes/templates"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const mailMerge_1 = __importDefault(require("./routes/mailMerge"));
const twoFactor_1 = __importDefault(require("./routes/twoFactor"));
const admin_1 = __importDefault(require("./routes/admin"));
// Import Services
const websocketService_1 = require("./services/websocketService");
const cacheService_1 = require("./services/cacheService");
const jobQueueService_1 = require("./services/jobQueueService");
// Initialize Prisma
exports.prisma = new client_1.PrismaClient();
// Initialize Fastify
const server = (0, fastify_1.default)({
    logger: true,
    bodyLimit: 52428800 // 50MB
});
// Register Plugins
server.register(cors_1.default, {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
    credentials: true,
});
server.register(jwt_1.default, {
    secret: process.env.JWT_SECRET || 'supersecret'
});
// Decorate request with user
server.decorate('authenticate', async function (request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.status(401).send({ error: 'Unauthorized' });
    }
});
// Health Check
server.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});
// Register Routes
server.register(auth_1.default, { prefix: '/api/auth' });
server.register(documents_1.default, { prefix: '/api/documents' });
server.register(clients_1.default, { prefix: '/api/clients' });
server.register(company_1.default, { prefix: '/api/company' });
server.register(assets_1.default, { prefix: '/api/assets' });
server.register(dashboard_1.default, { prefix: '/api/dashboard' });
server.register(pdf_1.default, { prefix: '/api/pdf' });
server.register(mail_1.default, { prefix: '/api/mail' });
server.register(signature_1.default, { prefix: '/api/signature' });
server.register(emailHosting_1.default, { prefix: '/api/email-hosting' });
server.register(users_1.default, { prefix: '/api/users' });
server.register(ai_1.default, { prefix: '/api/ai' });
server.register(templates_1.default, { prefix: '/api/mail' });
server.register(tracking_1.default, { prefix: '/api/track' });
server.register(mailMerge_1.default, { prefix: '/api/mail-merge' });
server.register(twoFactor_1.default, { prefix: '/api/auth/2fa' });
server.register(admin_1.default, { prefix: '/api/admin' });
// Start Server
const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3000', 10);
        await server.listen({ port, host: '0.0.0.0' });
        console.log(`🚀 Server running on http://localhost:${port}`);
        // Initialize WebSocket service with the underlying HTTP server
        if (process.env.ENABLE_WEBSOCKET === 'true') {
            websocketService_1.websocketService.initialize(server.server);
            console.log('🔌 WebSocket service initialized');
        }
        // Initialize Redis cache (optional - only if REDIS_URL is set)
        if (process.env.REDIS_URL) {
            await cacheService_1.cacheService.connect();
            console.log('📦 Redis cache connected');
        }
        // Initialize job queue (optional - only if REDIS_URL is set for BullMQ)
        if (process.env.REDIS_URL) {
            await jobQueueService_1.jobQueueService.initialize();
            console.log('⚙️ Job queue service initialized');
        }
    }
    catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};
// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        await server.close();
        await exports.prisma.$disconnect();
        if (process.env.REDIS_URL) {
            await cacheService_1.cacheService.disconnect();
            await jobQueueService_1.jobQueueService.shutdown();
        }
        console.log('✅ Server shut down successfully');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error during shutdown:', err);
        process.exit(1);
    }
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
start();
