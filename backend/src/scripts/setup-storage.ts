import * as Minio from 'minio';
import { config } from 'dotenv';

// Load environment variables
config();

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

async function setupStorage() {
  try {
    console.log('Setting up MinIO storage...');

    // Create main bucket if it doesn't exist
    const mainBucket = process.env.MINIO_BUCKET_NAME || 'wasplanning';
    const bucketExists = await minioClient.bucketExists(mainBucket);
    
    if (!bucketExists) {
      await minioClient.makeBucket(mainBucket, process.env.MINIO_REGION || 'us-east-1');
      console.log(`Created bucket: ${mainBucket}`);
    } else {
      console.log(`Bucket already exists: ${mainBucket}`);
    }

    // Set bucket policy to allow read access for public files (optional)
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${mainBucket}/public/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(mainBucket, JSON.stringify(policy));
    console.log('Bucket policy set for public access to /public/* files');

    // Create test bucket for testing environment
    if (process.env.NODE_ENV !== 'production') {
      const testBucket = `${mainBucket}-test`;
      const testBucketExists = await minioClient.bucketExists(testBucket);
      
      if (!testBucketExists) {
        await minioClient.makeBucket(testBucket, process.env.MINIO_REGION || 'us-east-1');
        console.log(`Created test bucket: ${testBucket}`);
      }
    }

    console.log('Storage setup completed successfully!');
    console.log(`MinIO Console: http://${process.env.MINIO_ENDPOINT}:${parseInt(process.env.MINIO_PORT || '9000') + 1}`);
  } catch (error) {
    console.error('Error setting up storage:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupStorage()
    .then(() => {
      console.log('MinIO storage setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup storage:', error);
      process.exit(1);
    });
}