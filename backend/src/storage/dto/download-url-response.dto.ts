import { ApiProperty } from '@nestjs/swagger';

export class DownloadUrlResponseDto {
  @ApiProperty({
    description: 'Presigned URL for file download',
    example: 'https://minio.example.com/bucket/file.pdf?signature=...',
  })
  url: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 604800,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Original filename',
    example: 'document.pdf',
  })
  filename: string;

  @ApiProperty({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1048576,
  })
  size_bytes: number;
}
