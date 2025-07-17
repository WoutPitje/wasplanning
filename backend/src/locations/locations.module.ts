import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location } from './entities/location.entity';
import { UserLocation } from './entities/user-location.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location, UserLocation]),
    SubscriptionsModule, // For checking subscription limits
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
