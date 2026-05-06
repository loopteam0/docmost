import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PageRepo } from '@docmost/db/repos/page/page.repo';
import { SpaceTemplateRepo } from '@docmost/db/repos/space-template/space-template.repo';
import { generateSlugId } from '../../../common/helpers';
import { createYdocFromJson } from '../../../common/helpers/prosemirror/utils';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import {
  SPACE_TEMPLATE_MAP,
  SPACE_TEMPLATES,
  SpaceTemplate as StaticSpaceTemplate,
  TemplatePage,
} from '../templates/index';
import { KyselyDB, KyselyTransaction } from '@docmost/db/types/kysely.types';
import { InjectKysely } from 'nestjs-kysely';
import { executeTx } from '@docmost/db/utils';
import { SpaceTemplate } from '@docmost/db/types/entity.types';

export interface ITemplateListItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  isSystem: boolean;
  creatorId?: string;
  pages?: string[];
}

@Injectable()
export class SpaceTemplateService {
  private readonly logger = new Logger(SpaceTemplateService.name);

  constructor(
    private readonly pageRepo: PageRepo,
    private readonly spaceTemplateRepo: SpaceTemplateRepo,
    @InjectKysely() private readonly db: KyselyDB,
  ) {}

  // ─── list ─────────────────────────────────────────────────────────────────

  async listTemplates(workspaceId: string): Promise<ITemplateListItem[]> {
    const system: ITemplateListItem[] = SPACE_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.label,
      description: t.description,
      icon: t.icon,
      isSystem: true,
      pages: t.pages.map((p) => p.title),
    }));

    const custom = await this.spaceTemplateRepo.findTemplatesByWorkspace(
      workspaceId,
    );

    const customMapped: ITemplateListItem[] = custom.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? '',
      icon: t.icon ?? '📄',
      isSystem: false,
      creatorId: t.creatorId,
    }));

    return [...system, ...customMapped];
  }

  // ─── create from space ─────────────────────────────────────────────────────

  /**
   * Saves the top-level pages of a space as a reusable template.
   */
  async createFromSpace(
    name: string,
    description: string,
    icon: string,
    spaceId: string,
    creatorId: string,
    workspaceId: string,
  ): Promise<SpaceTemplate> {
    // Load the source space's root pages (including content)
    const sourcePages = await this.db
      .selectFrom('pages')
      .select(['id', 'title', 'icon', 'content', 'position', 'parentPageId'])
      .where('spaceId', '=', spaceId)
      .where('deletedAt', 'is', null)
      .orderBy('position', (ob) => ob.collate('C').asc())
      .execute();

    return executeTx(this.db, async (trx) => {
      const template = await this.spaceTemplateRepo.insertTemplate(
        { name, description, icon, creatorId, workspaceId },
        trx,
      );

      // Map source page id → template page id for parent relationships.
      // Insert roots first so parent IDs are always available when children are processed.
      const idMap = new Map<string, string>();
      const roots = sourcePages.filter((p) => !p.parentPageId);
      const childPages = sourcePages.filter((p) => !!p.parentPageId);

      for (const page of [...roots, ...childPages]) {
        const parentTemplatePageId = page.parentPageId
          ? (idMap.get(page.parentPageId) ?? null)
          : null;

        const templatePage =
          await this.spaceTemplateRepo.insertTemplatePage(
            {
              templateId: template.id,
              title: page.title,
              icon: page.icon,
              content: page.content as any,
              parentPageId: parentTemplatePageId,
              position: page.position,
            },
            trx,
          );

        idMap.set(page.id, templatePage.id);
      }

      return template;
    });
  }

  // ─── delete ────────────────────────────────────────────────────────────────

  async deleteTemplate(
    templateId: string,
    requesterId: string,
    workspaceId: string,
  ): Promise<void> {
    const template = await this.spaceTemplateRepo.findTemplateById(
      templateId,
      workspaceId,
    );

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    if (template.creatorId !== requesterId) {
      throw new ForbiddenException(
        'Only the creator can delete this template',
      );
    }

    await this.spaceTemplateRepo.deleteTemplate(templateId, workspaceId);
  }

  // ─── apply ─────────────────────────────────────────────────────────────────

  /**
   * Creates starter pages from the given template (system or custom) in the space.
   * Returns the slugId of the first root page so the client can navigate there.
   */
  async applyTemplate(
    spaceId: string,
    templateId: string,
    userId: string,
    workspaceId: string,
    trx?: KyselyTransaction,
  ): Promise<string | null> {
    const systemTemplate = SPACE_TEMPLATE_MAP.get(templateId);
    if (systemTemplate) {
      return this.applySystemTemplate(
        systemTemplate,
        spaceId,
        userId,
        workspaceId,
        trx,
      );
    }

    return this.applyCustomTemplate(
      templateId,
      spaceId,
      userId,
      workspaceId,
      trx,
    );
  }

  // ─── private helpers ───────────────────────────────────────────────────────

  private async applySystemTemplate(
    template: StaticSpaceTemplate,
    spaceId: string,
    userId: string,
    workspaceId: string,
    trx?: KyselyTransaction,
  ): Promise<string | null> {
    let firstSlugId: string | null = null;
    let prevRootPosition: string | null = null;

    for (const page of template.pages) {
      const position = generateJitteredKeyBetween(prevRootPosition, null);
      prevRootPosition = position;

      const created = await this.insertPageFromTemplate(
        { title: page.title, icon: page.icon, content: page.content },
        spaceId,
        userId,
        workspaceId,
        position,
        null,
        trx,
      );

      if (!firstSlugId) firstSlugId = created.slugId;

      if (page.children?.length) {
        let prevChildPosition: string | null = null;
        for (const child of page.children) {
          const childPos = generateJitteredKeyBetween(prevChildPosition, null);
          prevChildPosition = childPos;
          await this.insertPageFromTemplate(
            { title: child.title, icon: child.icon, content: child.content },
            spaceId,
            userId,
            workspaceId,
            childPos,
            created.id,
            trx,
          );
        }
      }
    }

    return firstSlugId;
  }

  private async applyCustomTemplate(
    templateId: string,
    spaceId: string,
    userId: string,
    workspaceId: string,
    trx?: KyselyTransaction,
  ): Promise<string | null> {
    const template = await this.spaceTemplateRepo.findTemplateById(
      templateId,
      workspaceId,
    );

    if (!template) {
      this.logger.warn(
        `Template ${templateId} not found in workspace ${workspaceId}`,
      );
      return null;
    }

    const templatePages =
      await this.spaceTemplateRepo.findPagesByTemplateId(templateId);

    // Build ordered list: roots first, then children
    const roots = templatePages.filter((p) => !p.parentPageId);
    const children = templatePages.filter((p) => !!p.parentPageId);

    let firstSlugId: string | null = null;
    let prevRootPosition: string | null = null;
    const idMap = new Map<string, string>(); // templatePageId → new page id

    for (const tp of roots) {
      const position = generateJitteredKeyBetween(prevRootPosition, null);
      prevRootPosition = position;

      const created = await this.insertPageFromTemplate(
        { title: tp.title, icon: tp.icon, content: tp.content },
        spaceId,
        userId,
        workspaceId,
        position,
        null,
        trx,
      );

      if (!firstSlugId) firstSlugId = created.slugId;
      idMap.set(tp.id, created.id);
    }

    // Group children by parent template page id so each sibling group
    // gets its own sequential position counter.
    const childrenByParent = new Map<string, typeof children>();
    for (const tp of children) {
      if (!tp.parentPageId) continue; // TypeScript narrowing guard
      const group = childrenByParent.get(tp.parentPageId) ?? [];
      group.push(tp);
      childrenByParent.set(tp.parentPageId, group);
    }

    for (const [parentTplId, siblings] of childrenByParent) {
      const parentPageId = idMap.get(parentTplId) ?? null;
      if (!parentPageId) continue;

      let prevSiblingPosition: string | null = null;
      for (const tp of siblings) {
        const position = generateJitteredKeyBetween(prevSiblingPosition, null);
        prevSiblingPosition = position;

        const created = await this.insertPageFromTemplate(
          { title: tp.title, icon: tp.icon, content: tp.content },
          spaceId,
          userId,
          workspaceId,
          position,
          parentPageId,
          trx,
        );

        idMap.set(tp.id, created.id);
      }
    }

    return firstSlugId;
  }

  private async insertPageFromTemplate(
    page: { title: string; icon?: string | null; content: any },
    spaceId: string,
    userId: string,
    workspaceId: string,
    position: string,
    parentPageId: string | null,
    trx?: KyselyTransaction,
  ) {
    const slugId = generateSlugId();
    const ydoc = createYdocFromJson(page.content);

    return this.pageRepo.insertPage(
      {
        slugId,
        title: page.title,
        icon: page.icon ?? null,
        content: page.content as any,
        ydoc,
        position,
        parentPageId: parentPageId ?? null,
        spaceId,
        workspaceId,
        creatorId: userId,
        lastUpdatedById: userId,
      },
      trx,
    );
  }
}
