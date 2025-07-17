import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignUsersDto {
  @ApiProperty({
    description: 'Array of user IDs to assign to this location',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  user_ids: string[];
}
