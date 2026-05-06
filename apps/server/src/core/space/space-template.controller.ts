import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { SpaceTemplateService } from './services/space-template.service';
import {
  CreateSpaceTemplateDto,
  DeleteSpaceTemplateDto,
} from './dto/space-template.dto';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from '../casl/interfaces/space-ability.type';

@UseGuards(JwtAuthGuard)
@Controller('space-templates')
export class SpaceTemplateController {
  constructor(
    private readonly spaceTemplateService: SpaceTemplateService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('/')
  async listTemplates(@AuthWorkspace() workspace: Workspace) {
    return this.spaceTemplateService.listTemplates(workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('create')
  async createTemplate(
    @Body() dto: CreateSpaceTemplateDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const ability = await this.spaceAbility.createForUser(user, dto.spaceId);
    if (ability.cannot(SpaceCaslAction.Read, SpaceCaslSubject.Page)) {
      throw new ForbiddenException();
    }

    return this.spaceTemplateService.createFromSpace(
      dto.name,
      dto.description ?? '',
      dto.icon ?? '📄',
      dto.spaceId,
      user.id,
      workspace.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Post('delete')
  async deleteTemplate(
    @Body() dto: DeleteSpaceTemplateDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    await this.spaceTemplateService.deleteTemplate(
      dto.templateId,
      user.id,
      workspace.id,
    );
  }
}
