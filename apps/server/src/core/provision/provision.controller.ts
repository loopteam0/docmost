import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ProvisionService } from './provision.service';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../common/decorators/auth-workspace.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { CreateProvisionTokenDto } from './dto/create-provision-token.dto';
import { UpsertProvisionPagesDto } from './dto/upsert-provision-pages.dto';
import {
  WorkspaceCaslSubject,
  WorkspaceCaslAction,
} from '../casl/interfaces/workspace-ability.type';
import {
  SpaceCaslSubject,
  SpaceCaslAction,
} from '../casl/interfaces/space-ability.type';
import WorkspaceAbilityFactory from '../casl/abilities/workspace-ability.factory';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';

@UseGuards(JwtAuthGuard)
@Controller('provision')
export class ProvisionController {
  constructor(
    private readonly provisionService: ProvisionService,
    private readonly workspaceAbility: WorkspaceAbilityFactory,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('token')
  async generateToken(
    @Body() dto: CreateProvisionTokenDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    const ability = await this.workspaceAbility.createForUser(user, workspace);
    if (ability.cannot(WorkspaceCaslAction.Manage, WorkspaceCaslSubject.Settings)) {
      throw new ForbiddenException(
        'Only workspace admins can generate provision tokens',
      );
    }

    const token = await this.provisionService.generateToken(
      user,
      workspace,
      dto.expiresIn,
    );

    return { token };
  }

  @HttpCode(HttpStatus.OK)
  @Post('pages')
  async upsertPages(
    @Body() dto: UpsertProvisionPagesDto,
    @AuthUser() user: User,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.provisionService.upsertPages(user, workspace, dto);
  }
}
