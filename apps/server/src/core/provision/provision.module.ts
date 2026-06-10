import { Module } from '@nestjs/common';
import { ProvisionController } from './provision.controller';
import { ProvisionService } from './provision.service';
import { AuthModule } from '../auth/auth.module';
import { CaslModule } from '../casl/casl.module';
import { DatabaseModule } from '../../database/database.module';
import { ImportModule } from '../../integrations/import/import.module';

@Module({
  imports: [AuthModule, CaslModule, DatabaseModule, ImportModule],
  controllers: [ProvisionController],
  providers: [ProvisionService],
})
export class ProvisionModule {}
