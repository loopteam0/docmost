import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { TokenService } from '../auth/services/token.service';
import { User, Workspace } from '@docmost/db/types/entity.types';
import { UpsertProvisionPagesDto, ProvisionPageItemDto } from './dto/upsert-provision-pages.dto';
import { SpaceRepo } from '@docmost/db/repos/space/space.repo';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { ImportService } from '../../integrations/import/services/import.service';
import { jsonToText } from '../../collaboration/collaboration.util';
import { generateSlugId } from '../../common/helpers';
import SpaceAbilityFactory from '../casl/abilities/space-ability.factory';
import { SpaceCaslAction, SpaceCaslSubject } from '../casl/interfaces/space-ability.type';

export interface UpsertedPageInfo {
  pageId: string;
  slugId: string;
  title: string;
  parentPageId: string | null;
  created: boolean;
}

export interface UpsertPagesResult {
  created: number;
  updated: number;
  pages: UpsertedPageInfo[];
}

@Injectable()
export class ProvisionService {
  private readonly logger = new Logger(ProvisionService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly spaceRepo: SpaceRepo,
    private readonly pageRepo: PageRepo,
    private readonly importService: ImportService,
    private readonly spaceAbility: SpaceAbilityFactory,
  ) {}

  async generateToken(
    user: User,
    workspace: Workspace,
    expiresIn?: string,
  ): Promise<string> {
    return this.tokenService.generateProvisionToken(
      user,
      workspace.id,
      expiresIn || '1y',
    );
  }

  async upsertPages(
    user: User,
    workspace: Workspace,
    dto: UpsertProvisionPagesDto,
  ): Promise<UpsertPagesResult> {
    const space = await this.spaceRepo.findBySlug(dto.spaceSlug, workspace.id);
    if (!space) {
      throw new NotFoundException(
        `Space with slug "${dto.spaceSlug}" not found`,
      );
    }

    const ability = await this.spaceAbility.createForUser(user, space.id);
    if (
      ability.cannot(SpaceCaslAction.Create, SpaceCaslSubject.Page) ||
      ability.cannot(SpaceCaslAction.Edit, SpaceCaslSubject.Page)
    ) {
      throw new ForbiddenException();
    }

    const result: UpsertPagesResult = {
      created: 0,
      updated: 0,
      pages: [],
    };

    for (const pageItem of dto.pages) {
      const upsertedPages = await this.processPageTree(
        pageItem,
        space.id,
        workspace.id,
        user.id,
        null,
      );

      for (const page of upsertedPages) {
        result.pages.push(page);
        if (page.created) {
          result.created++;
        } else {
          result.updated++;
        }
      }
    }

    return result;
  }

  private async processPageTree(
    pageItem: ProvisionPageItemDto,
    spaceId: string,
    workspaceId: string,
    userId: string,
    parentPageId: string | null,
  ): Promise<UpsertedPageInfo[]> {
    const pages: UpsertedPageInfo[] = [];

    let prosemirrorJson;
    let ydoc;

    try {
      prosemirrorJson = await this.importService.processMarkdown(
        pageItem.content,
      );
      ydoc = await this.importService.createYdoc(prosemirrorJson);
    } catch (err) {
      this.logger.error(
        `Failed to process markdown for page "${pageItem.title}"`,
        err,
      );
      throw new BadRequestException(
        `Failed to process content for page "${pageItem.title}"`,
      );
    }

    const textContent = jsonToText(prosemirrorJson);

    let pageId: string;
    let slugId: string;
    let created = false;

    if (pageItem.slugId) {
      const existingPage = await this.pageRepo.findById(pageItem.slugId);
      if (!existingPage || existingPage.spaceId !== spaceId) {
        throw new NotFoundException(
          `Page with slug ID "${pageItem.slugId}" not found in this space`,
        );
      }

      await this.pageRepo.updatePage(
        {
          title: pageItem.title,
          icon: pageItem.icon,
          content: prosemirrorJson,
          ydoc,
          textContent,
          lastUpdatedById: userId,
          workspaceId,
        },
        existingPage.id,
      );

      pageId = existingPage.id;
      slugId = existingPage.slugId;
    } else {
      const existingPage = await this.pageRepo.findByTitleAndSpace(
        pageItem.title,
        spaceId,
        parentPageId,
      );

      if (existingPage) {
        await this.pageRepo.updatePage(
          {
            title: pageItem.title,
            icon: pageItem.icon,
            content: prosemirrorJson,
            ydoc,
            textContent,
            lastUpdatedById: userId,
            workspaceId,
          },
          existingPage.id,
        );

        pageId = existingPage.id;
        slugId = existingPage.slugId;
      } else {
        const position = await this.importService.getNewPagePosition(
          spaceId,
          parentPageId,
        );

        const newPage = await this.pageRepo.insertPage({
          slugId: generateSlugId(),
          title: pageItem.title,
          icon: pageItem.icon,
          content: prosemirrorJson,
          ydoc,
          textContent,
          position,
          spaceId,
          workspaceId,
          creatorId: userId,
          lastUpdatedById: userId,
        });

        pageId = newPage.id;
        slugId = newPage.slugId;
        created = true;
      }
    }

    pages.push({
      pageId,
      slugId,
      title: pageItem.title,
      parentPageId,
      created,
    });

    if (pageItem.children && pageItem.children.length > 0) {
      for (const childItem of pageItem.children) {
        const childPages = await this.processPageTree(
          childItem,
          spaceId,
          workspaceId,
          userId,
          pageId,
        );
        pages.push(...childPages);
      }
    }

    return pages;
  }
}
