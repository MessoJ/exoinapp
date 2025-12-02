import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import * as Minio from 'minio';
import { AssetType } from '@prisma/client';

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
  } catch (error) {
    console.error('MinIO bucket error:', error);
  }
}

ensureBucket();

export default async function assetsRoutes(fastify: FastifyInstance) {
  
  // Get all assets
  fastify.get('/', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { type } = request.query as any;
    
    const where: any = { companyId };
    if (type) where.type = type;
    
    const assets = await prisma.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    
    return assets;
  });

  // Upload asset (simplified - accepts base64 data)
  fastify.post('/upload', { 
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { companyId } = (request as any).user;
    const { filename, mimetype, data, type, name, description } = request.body as any;
    
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
    let assetType: AssetType = type || AssetType.OTHER;
    if (!type && mimetype) {
      if (mimetype.startsWith('image/')) {
        assetType = filename.toLowerCase().includes('logo') ? AssetType.LOGO : AssetType.IMAGE;
      } else if (mimetype === 'application/pdf') {
        assetType = AssetType.DOCUMENT;
      }
    }
    
    // Create asset record
    const asset = await prisma.asset.create({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const asset = await prisma.asset.findFirst({
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
    preHandler: [(fastify as any).authenticate] 
  }, async (request, reply) => {
    const { id } = request.params as any;
    const { companyId } = (request as any).user;
    
    const asset = await prisma.asset.findFirst({
      where: { id, companyId }
    });
    
    if (!asset) {
      return reply.status(404).send({ error: 'Asset not found' });
    }
    
    // Delete from MinIO
    const objectName = asset.url.replace(`/${BUCKET_NAME}/`, '');
    await minioClient.removeObject(BUCKET_NAME, objectName);
    
    // Delete from DB
    await prisma.asset.delete({ where: { id } });
    
    return { success: true };
  });
}
