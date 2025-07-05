import {
  generateStoragePath,
  sanitizeFilename,
  generateUniqueFilename,
} from './file-naming.util';
import { v4 as uuidv4 } from 'uuid';

// Mock uuid to have predictable tests
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('File Naming Utilities', () => {
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);
    // Mock date to have predictable tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateStoragePath', () => {
    it('should generate correct storage path with all parameters (tenant isolation at bucket level)', () => {
      const result = generateStoragePath(
        'tenant-123',
        'documents',
        'report.pdf',
      );
      expect(result).toBe(
        'documents/2024/03/123e4567-e89b-12d3-a456-426614174000-report.pdf',
      );
    });

    it('should handle different categories', () => {
      const result = generateStoragePath('tenant-456', 'images', 'photo.jpg');
      expect(result).toBe(
        'images/2024/03/123e4567-e89b-12d3-a456-426614174000-photo.jpg',
      );
    });

    it('should handle filenames with special characters', () => {
      const result = generateStoragePath(
        'tenant-789',
        'receipts',
        'receipt #123 (copy).pdf',
      );
      expect(result).toBe(
        'receipts/2024/03/123e4567-e89b-12d3-a456-426614174000-receipt-123-copy.pdf',
      );
    });

    it('should pad single-digit months with zero', () => {
      jest.setSystemTime(new Date('2024-01-05T10:00:00.000Z'));
      const result = generateStoragePath('tenant-001', 'documents', 'file.txt');
      expect(result).toBe(
        'documents/2024/01/123e4567-e89b-12d3-a456-426614174000-file.txt',
      );
    });

    it('should handle December correctly', () => {
      jest.setSystemTime(new Date('2024-12-25T10:00:00.000Z'));
      const result = generateStoragePath('tenant-002', 'images', 'holiday.png');
      expect(result).toBe(
        'images/2024/12/123e4567-e89b-12d3-a456-426614174000-holiday.png',
      );
    });

    it('should handle empty tenant ID (tenant isolation at bucket level)', () => {
      const result = generateStoragePath('', 'documents', 'file.pdf');
      expect(result).toBe(
        'documents/2024/03/123e4567-e89b-12d3-a456-426614174000-file.pdf',
      );
    });

    it('should handle empty category', () => {
      const result = generateStoragePath('tenant-123', '', 'file.pdf');
      expect(result).toBe(
        '/2024/03/123e4567-e89b-12d3-a456-426614174000-file.pdf',
      );
    });
  });

  describe('sanitizeFilename', () => {
    it('should keep alphanumeric characters, hyphens, and underscores', () => {
      expect(sanitizeFilename('valid-file_name123.pdf')).toBe(
        'valid-file_name123.pdf',
      );
    });

    it('should replace special characters with hyphens', () => {
      expect(sanitizeFilename('file@#$%name.txt')).toBe('file-name.txt');
    });

    it('should replace multiple consecutive hyphens with single hyphen', () => {
      expect(sanitizeFilename('file!!!name.doc')).toBe('file-name.doc');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(sanitizeFilename('---file-name---.jpg')).toBe('file-name.jpg');
    });

    it('should convert to lowercase', () => {
      expect(sanitizeFilename('MyFile.PDF')).toBe('myfile.PDF');
    });

    it('should preserve file extension', () => {
      expect(sanitizeFilename('document.docx')).toBe('document.docx');
    });

    it('should handle files without extension', () => {
      expect(sanitizeFilename('README')).toBe('readme');
    });

    it('should handle multiple dots in filename', () => {
      expect(sanitizeFilename('my.file.name.txt')).toBe('my-file-name.txt');
    });

    it('should use "file" as default name when sanitization results in empty string', () => {
      expect(sanitizeFilename('@@@.pdf')).toBe('file.pdf');
    });

    it('should handle empty filename', () => {
      expect(sanitizeFilename('')).toBe('file');
    });

    it('should handle filename with only extension', () => {
      expect(sanitizeFilename('.gitignore')).toBe('gitignore');
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFilename(longName);
      expect(result).toBe('a'.repeat(300) + '.txt');
    });

    it('should handle unicode characters', () => {
      expect(sanitizeFilename('café-münchen-文件.pdf')).toBe('caf-m-nchen.pdf');
    });

    it('should handle spaces', () => {
      expect(sanitizeFilename('my file name.doc')).toBe('my-file-name.doc');
    });

    it('should handle parentheses and brackets', () => {
      expect(sanitizeFilename('file[1](copy).txt')).toBe('file-1-copy.txt');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should prepend UUID to sanitized filename', () => {
      const result = generateUniqueFilename('document.pdf');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000-document.pdf');
      expect(uuidv4).toHaveBeenCalledTimes(1);
    });

    it('should sanitize filename before adding UUID', () => {
      const result = generateUniqueFilename('My Document #1.pdf');
      expect(result).toBe(
        '123e4567-e89b-12d3-a456-426614174000-my-document-1.pdf',
      );
    });

    it('should handle filenames that become empty after sanitization', () => {
      const result = generateUniqueFilename('@@@.txt');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000-file.txt');
    });

    it('should generate different UUIDs for each call', () => {
      (uuidv4 as jest.Mock)
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const result1 = generateUniqueFilename('file.pdf');
      const result2 = generateUniqueFilename('file.pdf');

      expect(result1).toBe('uuid-1-file.pdf');
      expect(result2).toBe('uuid-2-file.pdf');
    });

    it('should handle empty filename', () => {
      const result = generateUniqueFilename('');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000-file');
    });

    it('should preserve file extension case', () => {
      const result = generateUniqueFilename('Document.PDF');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000-document.PDF');
    });
  });

  describe('Integration tests', () => {
    it('should work correctly when functions are used together (tenant isolation at bucket level)', () => {
      const tenantId = 'tenant-abc';
      const category = 'uploads';
      const originalFilename = 'Invoice #2024-001 (final).PDF';

      const storagePath = generateStoragePath(
        tenantId,
        category,
        originalFilename,
      );

      expect(storagePath).toBe(
        'uploads/2024/03/123e4567-e89b-12d3-a456-426614174000-invoice-2024-001-final.PDF',
      );
      // Tenant isolation is now handled at bucket level, not path level
      expect(storagePath).not.toContain(tenantId);
      expect(storagePath).toContain(category);
      expect(storagePath).toContain('2024/03');
      expect(storagePath).toContain(mockUuid);
    });
  });
});
