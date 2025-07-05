export interface StorageConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region?: string;
  defaultBucket?: string;
}

export interface BucketConfig {
  name: string;
  policy?: 'public' | 'private';
  prefix?: string;
}

export interface UploadOptions {
  bucketName?: string;
  objectKey?: string;
  metadata?: Record<string, any>;
  contentType?: string;
}

export interface DownloadOptions {
  bucketName: string;
  objectKey: string;
}

export interface DeleteOptions {
  bucketName: string;
  objectKey: string;
}
