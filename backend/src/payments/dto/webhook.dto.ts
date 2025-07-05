import { IsString, IsNotEmpty, IsObject, IsDateString } from 'class-validator';

export class WebhookDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  data: any;

  @IsDateString()
  createdAt: string;
}