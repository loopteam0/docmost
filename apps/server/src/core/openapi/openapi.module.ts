import { Module } from '@nestjs/common';
import { OpenApiController } from './openapi.controller';
import { OpenApiProxyService } from './services/openapi-proxy.service';

@Module({
  controllers: [OpenApiController],
  providers: [OpenApiProxyService],
})
export class OpenApiModule {}
