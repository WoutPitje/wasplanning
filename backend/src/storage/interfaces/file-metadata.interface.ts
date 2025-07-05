import { FileCategory } from '../entities/file.entity';

export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  bucketName: string;
  objectKey: string;
  url?: string;
  tenantId: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}