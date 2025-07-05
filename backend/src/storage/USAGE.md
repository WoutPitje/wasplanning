# Storage Module Usage

## Overview
The storage module provides per-tenant file storage using MinIO with automatic bucket isolation.

## How it works

### Tenant Logo Example
The tenant module demonstrates how to use the storage service:

#### 1. Upload Logo
```typescript
// POST /admin/tenants/:id/logo
const uploadedFile = await this.storageService.uploadFile({
  file,                    // Express.Multer.File
  tenantId,               // UUID of tenant
  userId,                 // UUID of user uploading
  category: FileCategory.TENANT_LOGO,
  isPublic: true,         // Tenant logos are public
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxSizeBytes: 2 * 1024 * 1024, // 2MB
});

// Update tenant record
await this.tenantRepository.update(tenantId, {
  logo_url: `minio:${uploadedFile.id}`, // Store file ID for reference
});
```

#### 2. Get Logo URL
```typescript
// GET /admin/tenants/:id/logo
async getLogoUrl(tenantId: string): Promise<string | null> {
  const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
  
  if (tenant.logo_url?.startsWith('minio:')) {
    const fileId = tenant.logo_url.replace('minio:', '');
    return await this.storageService.generatePresignedUrl(fileId, tenantId);
  }
  
  return tenant.logo_url; // External URL or null
}
```

### Storage Structure
Files are organized in per-tenant buckets:

```
MinIO Buckets:
├── wasplanning-tenant1/
│   ├── tenant_logo/2024/01/uuid-logo.png
│   ├── documents/2024/01/uuid-doc.pdf
│   └── vehicle_photos/2024/01/uuid-car.jpg
├── wasplanning-tenant2/
│   ├── tenant_logo/2024/01/uuid-logo.png
│   └── invoices/2024/01/uuid-invoice.pdf
└── wasplanning-tenant3/
    └── tenant_logo/2024/01/uuid-logo.jpg
```

### Database Storage
File metadata is tracked in the `files` table:

```sql
SELECT id, tenant_id, category, original_filename, bucket_name, object_key
FROM files 
WHERE tenant_id = 'tenant-uuid' AND category = 'tenant_logo';
```

### Security Features
1. **Bucket Isolation**: Each tenant has its own MinIO bucket
2. **Service Validation**: All operations validate tenant ownership
3. **Presigned URLs**: Secure, time-limited access (7 days default)
4. **File Validation**: Type and size restrictions per upload

### Usage in Other Modules
```typescript
// Import storage service
import { StorageService } from '../storage/storage.service';

@Injectable()
export class YourService {
  constructor(private readonly storageService: StorageService) {}

  async uploadDocument(file: Express.Multer.File, tenantId: string, userId: string) {
    return await this.storageService.uploadFile({
      file,
      tenantId,
      userId,
      category: FileCategory.DOCUMENT,
      allowedMimeTypes: ['application/pdf', 'image/jpeg'],
      maxSizeBytes: 10 * 1024 * 1024, // 10MB
    });
  }
}
```

## API Endpoints

### Tenant Logo Management
- `POST /admin/tenants/:id/logo` - Upload tenant logo
- `GET /admin/tenants/:id/logo` - Get current logo URL
- `GET /admin/tenants` - List tenants (includes logo URLs)
- `GET /admin/tenants/:id` - Get tenant details (includes logo URL)

### Benefits
- ✅ **Complete tenant isolation** at storage level
- ✅ **Automatic bucket creation** on first upload
- ✅ **Secure presigned URLs** with expiration
- ✅ **File cleanup** when logos are replaced
- ✅ **Backward compatibility** with external URLs
- ✅ **Type safety** with TypeScript interfaces