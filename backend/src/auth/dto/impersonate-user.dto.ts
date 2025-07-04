import { ApiProperty } from '@nestjs/swagger';

export class ImpersonateUserDto {
  @ApiProperty({
    description: 'DTO for user impersonation request',
    example: 'No request body required - userId is provided in the route parameter',
  })
  // No properties needed - userId comes from route param
}