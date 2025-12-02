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
exports.default = assetsRoutes;
const index_1 = require("../index");
const Minio = __importStar(require("minio"));
const client_1 = require("@prisma/client");
// Initialize MinIO client
const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9010'),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || 'admin',
    secretKey: process.env.MINIO_SECRET_KEY || 'secureminiopass',
});
const BUCKET_NAME = 'exoin-assets';
// Ensure bucket exists
async function ensureBucket() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME);
            console.log(`Bucket ${BUCKET_NAME} created`);
        }
    }
    catch (error) {
        console.error('MinIO bucket error:', error);
    }
}
ensureBucket();
async function assetsRoutes(fastify) {
    // Get all assets
    fastify.get('/', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { type } = request.query;
        const where = { companyId };
        if (type)
            where.type = type;
        const assets = await index_1.prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return assets;
    });
    // Upload asset (simplified - accepts base64 data)
    fastify.post('/upload', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { companyId } = request.user;
        const { filename, mimetype, data, type, name, description } = request.body;
        if (!data || !filename) {
            return reply.status(400).send({ error: 'No file data provided' });
        }
        const objectName = `${companyId}/${Date.now()}-${filename}`;
        const buffer = Buffer.from(data, 'base64');
        // Upload to MinIO
        await minioClient.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
            'Content-Type': mimetype || 'application/octet-stream',
        });
        // Determine asset type
        let assetType = type || client_1.AssetType.OTHER;
        if (!type && mimetype) {
            if (mimetype.startsWith('image/')) {
                assetType = filename.toLowerCase().includes('logo') ? client_1.AssetType.LOGO : client_1.AssetType.IMAGE;
            }
            else if (mimetype === 'application/pdf') {
                assetType = client_1.AssetType.DOCUMENT;
            }
        }
        // Create asset record
        const asset = await index_1.prisma.asset.create({
            data: {
                name: name || filename,
                type: assetType,
                mimeType: mimetype || 'application/octet-stream',
                size: buffer.length,
                url: `/${BUCKET_NAME}/${objectName}`,
                companyId,
            }
        });
        return asset;
    });
    // Get signed URL for download
    fastify.get('/:id/download', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const asset = await index_1.prisma.asset.findFirst({
            where: { id, companyId }
        });
        if (!asset) {
            return reply.status(404).send({ error: 'Asset not found' });
        }
        // Generate presigned URL (valid for 1 hour)
        const objectName = asset.url.replace(`/${BUCKET_NAME}/`, '');
        const presignedUrl = await minioClient.presignedGetObject(BUCKET_NAME, objectName, 3600);
        return { url: presignedUrl };
    });
    // Delete asset
    fastify.delete('/:id', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        const { id } = request.params;
        const { companyId } = request.user;
        const asset = await index_1.prisma.asset.findFirst({
            where: { id, companyId }
        });
        if (!asset) {
            return reply.status(404).send({ error: 'Asset not found' });
        }
        // Delete from MinIO
        const objectName = asset.url.replace(`/${BUCKET_NAME}/`, '');
        await minioClient.removeObject(BUCKET_NAME, objectName);
        // Delete from DB
        await index_1.prisma.asset.delete({ where: { id } });
        return { success: true };
    });
}
