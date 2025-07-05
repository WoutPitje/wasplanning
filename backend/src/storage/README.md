# Storage Module

This module provides file storage and management capabilities using MinIO (S3-compatible object storage) with multi-tenant isolation.

## Overview

The storage module handles all file operations including upload, download, deletion, and URL generation. It implements per-tenant bucket isolation to ensure complete data separation between different garage tenants.

## Architecture

### Multi-Tenant Storage Strategy
- **Per-Tenant Buckets**: Each tenant gets isolated MinIO bucket (`{prefix}-{tenant-id}`)
- **Automatic Provisioning**: Buckets created automatically on first file upload
- **Secure Isolation**: Complete file isolation between tenants at bucket level
- **Simplified Paths**: Files stored as `{category}/{year}/{month}/{uuid}-{filename}`

## Structure

```
storage/
├── README.md                    # This documentation
├── USAGE.md                    # Usage examples and API guide
├── storage.module.ts           # NestJS module definition
├── storage.service.ts          # Main storage service
├── storage.service.spec.ts     # Service tests
├── index.ts                    # Module exports
├── dto/                        # Data Transfer Objects
│   ├── download-url-response.dto.ts
│   ├── file-query.dto.ts
│   ├── file-response.dto.ts
│   ├── file-upload.dto.ts
│   ├── storage-stats-response.dto.ts
│   ├── upload-file.dto.ts
│   └── index.ts
├── entities/
│   └── file.entity.ts          # File metadata entity
├── enums/
│   └── file-category.enum.ts   # File categorization
├── interfaces/
│   ├── file-metadata.interface.ts
│   ├── storage-config.interface.ts
│   └── index.ts
└── utils/
    ├── file-naming.util.ts     # File naming utilities
    ├── file-naming.util.spec.ts
    ├── file-validation.util.ts # File validation utilities
    ├── file-validation.util.spec.ts
    └── index.ts
```

## Key Features

### File Management
- **Upload**: Multi-format file upload with validation
- **Download**: Secure presigned URL generation
- **Deletion**: Safe file deletion with metadata cleanup
- **Metadata**: Complete file metadata tracking in database

### Security
- **Tenant Isolation**: Bucket-level separation between tenants
- **Presigned URLs**: Temporary, secure access to files
- **Validation**: File type, size, and security validation
- **Access Control**: Tenant-aware access restrictions

### File Categories
```typescript
enum FileCategory {
  TENANT_LOGO = 'tenant_logo',
  USER_AVATAR = 'user_avatar',
  VEHICLE_IMAGE = 'vehicle_image',
  WASH_BEFORE = 'wash_before',
  WASH_AFTER = 'wash_after',
  DOCUMENT = 'document',
  OTHER = 'other'
}
```

## Core Components

### StorageService
Main service providing:
- `uploadFile()` - Upload files with automatic bucket creation
- `generatePresignedUrl()` - Generate secure download URLs
- `deleteFile()` - Delete files and cleanup metadata
- `getFileMetadata()` - Retrieve file information
- `getStorageStats()` - Get tenant storage statistics

### File Entity
Tracks file metadata:
- Unique file ID and original filename
- File size, MIME type, and category
- Upload timestamp and tenant association
- Storage path and bucket information

### DTOs and Validation
- **Upload validation**: File type, size, and format checking
- **Query parameters**: Filtering and pagination for file lists
- **Response formatting**: Consistent API response structures

## Configuration

### Environment Variables
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=wasplanning
MINIO_SECRET_KEY=wasplanning123
MINIO_USE_SSL=false
MINIO_BUCKET_PREFIX=wasplanning
```

### File Limits
- **Max file size**: 10MB (configurable)
- **Allowed types**: Images, documents, archives
- **Naming**: UUID-based to prevent conflicts

## Usage

### Basic Upload
```typescript
const result = await this.storageService.uploadFile(
  file,
  FileCategory.TENANT_LOGO,
  tenantId
);
```

### Generate Download URL
```typescript
const url = await this.storageService.generatePresignedUrl(
  fileId,
  tenantId
);
```

### Delete File
```typescript
await this.storageService.deleteFile(fileId, tenantId);
```

For detailed usage examples, see [USAGE.md](./USAGE.md).

## Testing

The module includes comprehensive tests:
- Unit tests for all service methods
- File validation utility tests
- File naming utility tests
- Mock implementations for testing

```bash
npm run test storage
```

## Best Practices

1. **Tenant Context**: Always provide tenant ID for operations
2. **File Validation**: Use built-in validation utilities
3. **Error Handling**: Handle MinIO connection and permission errors
4. **Cleanup**: Delete files when related entities are removed
5. **Monitoring**: Track storage usage per tenant

## Dependencies

- **MinIO**: S3-compatible object storage
- **TypeORM**: File metadata persistence
- **NestJS**: Framework integration
- **uuid**: Unique file identification
- **mime-types**: File type detection

## Performance Considerations

- **Presigned URLs**: Reduce server load for file downloads
- **Bucket Isolation**: Enables per-tenant performance optimization
- **Metadata Caching**: File metadata stored in database for quick access
- **Connection Pooling**: Efficient MinIO connection management

## Security Considerations

- **Bucket Policies**: Restrict access to tenant-specific buckets
- **Presigned URL Expiry**: Temporary access with configurable expiration
- **File Validation**: Prevent malicious file uploads
- **Access Logging**: Track file access for security auditing