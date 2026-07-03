import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import {
  AI_CHAT_THROTTLER,
  AUTH_THROTTLER,
} from '../../integrations/throttle/throttler-names';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../common/decorators/auth-user.decorator';
import { User } from '@docmost/db/types/entity.types';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { PageAccessService } from '../page/page-access/page-access.service';
import { OpenApiProxyService } from './services/openapi-proxy.service';
import { OpenApiFetchDto } from './dto/openapi-fetch.dto';

@SkipThrottle({ [AUTH_THROTTLER]: true, [AI_CHAT_THROTTLER]: true })
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Controller('openapi')
export class OpenApiController {
  constructor(
    private readonly openApiProxyService: OpenApiProxyService,
    private readonly pageRepo: PageRepo,
    private readonly pageAccessService: PageAccessService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post('fetch-spec')
  async fetchSpec(@Body() dto: OpenApiFetchDto, @AuthUser() user: User) {
    const page = await this.pageRepo.findById(dto.pageId);
    if (!page) {
      throw new NotFoundException('Page not found');
    }

    await this.pageAccessService.validateCanView(page, user);

    return this.openApiProxyService.fetchSpec(dto.url);
  }
}
