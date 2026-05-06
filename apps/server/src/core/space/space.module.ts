import { Module } from '@nestjs/common';
import { SpaceService } from './services/space.service';
import { SpaceController } from './space.controller';
import { SpaceMemberService } from './services/space-member.service';
import { SpaceTemplateService } from './services/space-template.service';
import { SpaceTemplateController } from './space-template.controller';

@Module({
  controllers: [SpaceController, SpaceTemplateController],
  providers: [SpaceService, SpaceMemberService, SpaceTemplateService],
  exports: [SpaceService, SpaceMemberService, SpaceTemplateService],
})
export class SpaceModule {}
