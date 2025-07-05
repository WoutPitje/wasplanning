import { ApiProperty } from '@nestjs/swagger';

export class StorageStatsResponseDto {
  @ApiProperty({
    description: 'Total number of files',
    example: 150,
  })
  totalFiles: number;

  @ApiProperty({
    description: 'Total storage used in bytes',
    example: 157286400,
  })
  totalSizeBytes: number;

  @ApiProperty({
    description: 'Total storage used in MB',
    example: 150.25,
  })
  totalSizeMB: number;

  @ApiProperty({
    description: 'Number of files by category',
    example: {
      vehicle_photo: 45,
      damage_report: 30,
      invoice: 25,
      document: 20,
      other: 30,
    },
  })
  filesByCategory: Record<string, number>;

  @ApiProperty({
    description: 'Number of files by type',
    example: {
      image: 75,
      document: 50,
      video: 10,
      other: 15,
    },
  })
  filesByType: Record<string, number>;
}
