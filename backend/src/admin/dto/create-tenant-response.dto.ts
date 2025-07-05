import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantResponseDto {
  @ApiProperty({
    description: 'Created tenant information',
  })
  tenant: {
    id: string;
    name: string;
    display_name: string;
    is_active: boolean;
  };

  @ApiProperty({
    description: 'Created admin user information',
  })
  admin_user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    temporary_password: string;
  };

  @ApiProperty({
    description: 'Instructions for the new tenant',
  })
  instructions: string;
}
