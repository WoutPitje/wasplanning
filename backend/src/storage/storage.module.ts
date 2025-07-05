import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { StorageService } from './storage.service';
import { File } from './entities/file.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([File]),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}