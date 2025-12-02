"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = companyRoutes;
const index_1 = require("../index");
const argon2 = __importStar(require("argon2"));
async function companyRoutes(fastify) {
    // Get company details
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const company = await index_1.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            return reply.status(404).send({ error: 'Company not found' });
        }
        return company;
    });
    // Update company
    fastify.put('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId, role } = request.user;
        // Only admins can update company
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Forbidden' });
        }
        const data = request.body;
        const company = await index_1.prisma.company.update({
            where: { id: companyId },
            data,
        });
        return company;
    });
    // Get company users
    fastify.get('/users', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const users = await index_1.prisma.user.findMany({
            where: { companyId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                jobTitle: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return users;
    });
    // Create new user
    fastify.post('/users', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId, role } = request.user;
        // Only admins can create users
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Forbidden' });
        }
        const { email, firstName, lastName, password, role: userRole, jobTitle, phone } = request.body;
        // Check if email already exists
        const existingUser = await index_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return reply.status(400).send({ error: 'Email already exists' });
        }
        const hashedPassword = await argon2.hash(password);
        const user = await index_1.prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                passwordHash: hashedPassword,
                role: userRole || 'STAFF',
                jobTitle,
                phone,
                companyId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                jobTitle: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
        });
        return user;
    });
    // Update user
    fastify.put('/users/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId, role } = request.user;
        const { id } = request.params;
        // Only admins can update users
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Forbidden' });
        }
        const { email, firstName, lastName, role: userRole, jobTitle, phone, isActive, password } = request.body;
        // Verify user belongs to company
        const existingUser = await index_1.prisma.user.findFirst({
            where: { id, companyId },
        });
        if (!existingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }
        const updateData = {};
        if (email)
            updateData.email = email;
        if (firstName)
            updateData.firstName = firstName;
        if (lastName)
            updateData.lastName = lastName;
        if (userRole)
            updateData.role = userRole;
        if (jobTitle !== undefined)
            updateData.jobTitle = jobTitle;
        if (phone !== undefined)
            updateData.phone = phone;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (password) {
            updateData.passwordHash = await argon2.hash(password);
        }
        const user = await index_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                jobTitle: true,
                phone: true,
                isActive: true,
                createdAt: true,
            },
        });
        return user;
    });
    // Delete user
    fastify.delete('/users/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId, role, userId } = request.user;
        const { id } = request.params;
        // Only admins can delete users
        if (role !== 'ADMIN') {
            return reply.status(403).send({ error: 'Forbidden' });
        }
        // Can't delete yourself
        if (id === userId) {
            return reply.status(400).send({ error: 'Cannot delete yourself' });
        }
        // Verify user belongs to company
        const existingUser = await index_1.prisma.user.findFirst({
            where: { id, companyId },
        });
        if (!existingUser) {
            return reply.status(404).send({ error: 'User not found' });
        }
        await index_1.prisma.user.delete({
            where: { id },
        });
        return { success: true };
    });
    // Get templates
    fastify.get('/templates', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { type } = request.query;
        const where = { companyId };
        if (type)
            where.type = type;
        const templates = await index_1.prisma.template.findMany({
            where,
            orderBy: { name: 'asc' },
        });
        return templates;
    });
}
