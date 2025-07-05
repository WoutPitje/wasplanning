import {
  validateFileType,
  validateFileSize,
  getFileCategory,
  FileValidationResult,
} from './file-validation.util';

describe('File Validation Utilities', () => {
  describe('validateFileType', () => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    it('should return valid for allowed MIME type', () => {
      const result = validateFileType('image/jpeg', allowedTypes);
      expect(result).toEqual({ isValid: true });
    });

    it('should return valid for all allowed types', () => {
      allowedTypes.forEach((type) => {
        const result = validateFileType(type, allowedTypes);
        expect(result).toEqual({ isValid: true });
      });
    });

    it('should return invalid for disallowed MIME type', () => {
      const result = validateFileType('text/plain', allowedTypes);
      expect(result).toEqual({
        isValid: false,
        error:
          'File type text/plain is not allowed. Allowed types: image/jpeg, image/png, application/pdf',
      });
    });

    it('should handle empty allowed types array', () => {
      const result = validateFileType('image/jpeg', []);
      expect(result).toEqual({
        isValid: false,
        error: 'File type image/jpeg is not allowed. Allowed types: ',
      });
    });

    it('should handle case-sensitive MIME types', () => {
      const result = validateFileType('IMAGE/JPEG', allowedTypes);
      expect(result).toEqual({
        isValid: false,
        error:
          'File type IMAGE/JPEG is not allowed. Allowed types: image/jpeg, image/png, application/pdf',
      });
    });

    it('should handle empty MIME type', () => {
      const result = validateFileType('', allowedTypes);
      expect(result).toEqual({
        isValid: false,
        error:
          'File type  is not allowed. Allowed types: image/jpeg, image/png, application/pdf',
      });
    });

    it('should handle single allowed type', () => {
      const result = validateFileType('application/pdf', ['application/pdf']);
      expect(result).toEqual({ isValid: true });
    });

    it('should handle similar but not exact MIME types', () => {
      const result = validateFileType('image/jpg', ['image/jpeg']);
      expect(result).toEqual({
        isValid: false,
        error: 'File type image/jpg is not allowed. Allowed types: image/jpeg',
      });
    });
  });

  describe('validateFileSize', () => {
    const MB = 1024 * 1024;

    it('should return valid for file size within limit', () => {
      const result = validateFileSize(5 * MB, 10 * MB);
      expect(result).toEqual({ isValid: true });
    });

    it('should return valid for file size equal to limit', () => {
      const result = validateFileSize(10 * MB, 10 * MB);
      expect(result).toEqual({ isValid: true });
    });

    it('should return invalid for file size exceeding limit', () => {
      const result = validateFileSize(15 * MB, 10 * MB);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 15.00MB exceeds maximum allowed size of 10.00MB',
      });
    });

    it('should handle zero file size', () => {
      const result = validateFileSize(0, 10 * MB);
      expect(result).toEqual({ isValid: true });
    });

    it('should handle zero max size', () => {
      const result = validateFileSize(1, 0);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 0.00MB exceeds maximum allowed size of 0.00MB',
      });
    });

    it('should handle very small file sizes', () => {
      const result = validateFileSize(100, 1 * MB);
      expect(result).toEqual({ isValid: true });
    });

    it('should format file sizes with two decimal places', () => {
      const result = validateFileSize(5.5 * MB, 5 * MB);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 5.50MB exceeds maximum allowed size of 5.00MB',
      });
    });

    it('should handle fractional MB values correctly', () => {
      const result = validateFileSize(1.234567 * MB, 1 * MB);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 1.23MB exceeds maximum allowed size of 1.00MB',
      });
    });

    it('should handle very large file sizes', () => {
      const result = validateFileSize(1000 * MB, 500 * MB);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 1000.00MB exceeds maximum allowed size of 500.00MB',
      });
    });

    it('should handle negative file sizes', () => {
      const result = validateFileSize(-1 * MB, 10 * MB);
      expect(result).toEqual({ isValid: true });
    });

    it('should handle negative max size', () => {
      const result = validateFileSize(1 * MB, -10 * MB);
      expect(result).toEqual({
        isValid: false,
        error: 'File size 1.00MB exceeds maximum allowed size of -10.00MB',
      });
    });
  });

  describe('getFileCategory', () => {
    describe('Image types', () => {
      it('should categorize image MIME types as images', () => {
        const imageTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/svg+xml',
        ];
        imageTypes.forEach((type) => {
          expect(getFileCategory(type)).toBe('images');
        });
      });

      it('should handle image subtypes', () => {
        expect(getFileCategory('image/x-icon')).toBe('images');
        expect(getFileCategory('image/bmp')).toBe('images');
      });
    });

    describe('Document types', () => {
      it('should categorize PDF as documents', () => {
        expect(getFileCategory('application/pdf')).toBe('documents');
      });

      it('should categorize Microsoft Word documents', () => {
        expect(getFileCategory('application/msword')).toBe('documents');
        expect(
          getFileCategory(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ),
        ).toBe('documents');
      });

      it('should categorize Microsoft Excel documents', () => {
        expect(getFileCategory('application/vnd.ms-excel')).toBe('documents');
        expect(
          getFileCategory(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ),
        ).toBe('documents');
      });

      it('should categorize text files as documents', () => {
        expect(getFileCategory('text/plain')).toBe('documents');
        expect(getFileCategory('text/csv')).toBe('documents');
      });
    });

    describe('Video types', () => {
      it('should categorize video MIME types as videos', () => {
        const videoTypes = [
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
        ];
        videoTypes.forEach((type) => {
          expect(getFileCategory(type)).toBe('videos');
        });
      });
    });

    describe('Audio types', () => {
      it('should categorize audio MIME types as audio', () => {
        const audioTypes = [
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'audio/mp3',
          'audio/webm',
        ];
        audioTypes.forEach((type) => {
          expect(getFileCategory(type)).toBe('audio');
        });
      });
    });

    describe('Archive types', () => {
      it('should categorize archive MIME types as archives', () => {
        const archiveTypes = [
          'application/zip',
          'application/x-zip-compressed',
          'application/x-rar-compressed',
          'application/x-7z-compressed',
          'application/x-tar',
          'application/gzip',
        ];
        archiveTypes.forEach((type) => {
          expect(getFileCategory(type)).toBe('archives');
        });
      });
    });

    describe('Other types', () => {
      it('should categorize unknown MIME types as other', () => {
        expect(getFileCategory('application/octet-stream')).toBe('other');
        expect(getFileCategory('application/json')).toBe('other');
        expect(getFileCategory('application/xml')).toBe('other');
      });

      it('should handle empty MIME type', () => {
        expect(getFileCategory('')).toBe('other');
      });

      it('should handle invalid MIME type formats', () => {
        expect(getFileCategory('not-a-mime-type')).toBe('other');
        expect(getFileCategory('image')).toBe('other');
        expect(getFileCategory('/jpeg')).toBe('other');
      });

      it('should handle case sensitivity', () => {
        expect(getFileCategory('IMAGE/JPEG')).toBe('other');
        expect(getFileCategory('Application/PDF')).toBe('other');
      });

      it('should not categorize similar but different types', () => {
        expect(getFileCategory('text/html')).toBe('other');
        expect(getFileCategory('application/javascript')).toBe('other');
        expect(getFileCategory('image-jpeg')).toBe('other');
      });
    });

    describe('Edge cases', () => {
      it('should handle whitespace in MIME types', () => {
        expect(getFileCategory(' image/jpeg')).toBe('other');
        expect(getFileCategory('image/jpeg ')).toBe('images'); // trailing space is ignored by startsWith
        expect(getFileCategory(' image/jpeg ')).toBe('other');
      });

      it('should handle null or undefined gracefully', () => {
        // TypeScript would normally prevent this, but testing defensive programming
        // The actual implementation will throw, so we test that behavior
        expect(() => getFileCategory(null as any)).toThrow();
        expect(() => getFileCategory(undefined as any)).toThrow();
      });

      it('should handle very long MIME types', () => {
        const longMimeType = 'application/' + 'x'.repeat(1000);
        expect(getFileCategory(longMimeType)).toBe('other');
      });
    });
  });

  describe('FileValidationResult interface', () => {
    it('should have correct structure for valid result', () => {
      const validResult: FileValidationResult = {
        isValid: true,
      };
      expect(validResult.isValid).toBe(true);
      expect(validResult.error).toBeUndefined();
    });

    it('should have correct structure for invalid result', () => {
      const invalidResult: FileValidationResult = {
        isValid: false,
        error: 'Some error message',
      };
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toBe('Some error message');
    });
  });
});
