import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// Omit sensitive fields that shouldn't be updated directly
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email', 'password', 'tenant_id'] as const),
) {}
