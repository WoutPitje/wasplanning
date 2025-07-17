import { ApiProperty } from '@nestjs/swagger';

export class InvoiceDto {
  @ApiProperty({
    description: 'Invoice ID',
    example: 'in_1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Invoice number',
    example: 'INV-2024-001',
    required: false,
  })
  number?: string;

  @ApiProperty({
    description: 'Invoice date',
    example: '2024-01-01T00:00:00.000Z',
  })
  date: Date;

  @ApiProperty({
    description: 'Invoice amount in cents',
    example: 10000,
  })
  amount: number;

  @ApiProperty({
    description: 'Invoice status',
    example: 'paid',
    enum: ['draft', 'open', 'paid', 'uncollectible', 'void'],
  })
  status: string;

  @ApiProperty({
    description: 'PDF download URL',
    example: 'https://pay.stripe.com/invoice/...',
    required: false,
  })
  pdf_url?: string;
}

export class InvoicesResponseDto {
  @ApiProperty({
    description: 'List of invoices',
    type: [InvoiceDto],
  })
  invoices: InvoiceDto[];

  @ApiProperty({
    description: 'Whether there are more invoices',
    example: true,
  })
  has_more: boolean;

  @ApiProperty({
    description: 'Total number of invoices',
    example: 25,
    required: false,
  })
  total_count?: number;
}
