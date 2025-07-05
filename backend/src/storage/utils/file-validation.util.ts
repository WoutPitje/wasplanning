/**
 * File validation utilities for storage operations
 */

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates file type against allowed MIME types
 * @param mimetype - The MIME type of the file
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFileType(
  mimetype: string,
  allowedTypes: string[],
): FileValidationResult {
  const isValid = allowedTypes.includes(mimetype);

  if (!isValid) {
    return {
      isValid: false,
      error: `File type ${mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates file size against maximum allowed size
 * @param size - File size in bytes
 * @param maxSize - Maximum allowed size in bytes
 * @returns Validation result
 */
export function validateFileSize(
  size: number,
  maxSize: number,
): FileValidationResult {
  const isValid = size <= maxSize;

  if (!isValid) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Determines file category based on MIME type
 * @param mimetype - The MIME type of the file
 * @returns File category
 */
export function getFileCategory(mimetype: string): string {
  // Image types
  if (mimetype.startsWith('image/')) {
    return 'images';
  }

  // Document types
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];
  if (documentTypes.includes(mimetype)) {
    return 'documents';
  }

  // Video types
  if (mimetype.startsWith('video/')) {
    return 'videos';
  }

  // Audio types
  if (mimetype.startsWith('audio/')) {
    return 'audio';
  }

  // Archive types
  const archiveTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',
  ];
  if (archiveTypes.includes(mimetype)) {
    return 'archives';
  }

  // Default category for other types
  return 'other';
}
