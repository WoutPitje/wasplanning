import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

/**
 * Generates a storage path for files within tenant buckets
 * @param tenantId - The tenant ID (used for bucket selection, not path)
 * @param category - File category (e.g., 'documents', 'images', 'receipts')
 * @param filename - Original filename
 * @returns Storage path like {category}/{year}/{month}/{uuid}-{filename}
 */
export function generateStoragePath(
  tenantId: string,
  category: string,
  filename: string,
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uniqueFilename = generateUniqueFilename(filename);

  // Since we use per-tenant buckets, no need for tenant prefix in path
  return `${category}/${year}/${month}/${uniqueFilename}`;
}

/**
 * Sanitizes a filename by removing special characters while preserving the extension
 * @param filename - The original filename
 * @returns Sanitized filename
 */
export function sanitizeFilename(filename: string): string {
  // Extract the extension
  const ext = path.extname(filename);
  const nameWithoutExt = path.basename(filename, ext);

  // Remove special characters, keep only alphanumeric, hyphens, and underscores
  const sanitizedName = nameWithoutExt
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .toLowerCase();

  // Ensure the filename is not empty after sanitization
  const finalName = sanitizedName || 'file';

  return `${finalName}${ext}`;
}

/**
 * Generates a unique filename by adding a UUID prefix
 * @param originalFilename - The original filename
 * @returns Unique filename with UUID prefix
 */
export function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const uuid = uuidv4();
  return `${uuid}-${sanitized}`;
}
