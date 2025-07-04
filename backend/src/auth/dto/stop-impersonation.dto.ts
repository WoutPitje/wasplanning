import { ApiProperty } from '@nestjs/swagger';

export class StopImpersonationDto {
  @ApiProperty({
    description: 'DTO for stopping user impersonation',
    example: 'No request body required',
  })
  // No properties needed
}