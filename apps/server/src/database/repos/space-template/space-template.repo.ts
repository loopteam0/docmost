import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB, KyselyTransaction } from '../../types/kysely.types';
import { dbOrTx } from '../../utils';
import {
  InsertableSpaceTemplate,
  InsertableSpaceTemplatePage,
  SpaceTemplate,
  SpaceTemplatePage,
} from '@docmost/db/types/entity.types';

@Injectable()
export class SpaceTemplateRepo {
  constructor(@InjectKysely() private readonly db: KyselyDB) {}

  async insertTemplate(
    data: InsertableSpaceTemplate,
    trx?: KyselyTransaction,
  ): Promise<SpaceTemplate> {
    return dbOrTx(this.db, trx)
      .insertInto('spaceTemplates')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async insertTemplatePage(
    data: InsertableSpaceTemplatePage,
    trx?: KyselyTransaction,
  ): Promise<SpaceTemplatePage> {
    return dbOrTx(this.db, trx)
      .insertInto('spaceTemplatePages')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async findTemplateById(
    templateId: string,
    workspaceId: string,
  ): Promise<SpaceTemplate | undefined> {
    return this.db
      .selectFrom('spaceTemplates')
      .selectAll()
      .where('id', '=', templateId)
      .where('workspaceId', '=', workspaceId)
      .executeTakeFirst();
  }

  async findTemplatesByWorkspace(
    workspaceId: string,
  ): Promise<SpaceTemplate[]> {
    return this.db
      .selectFrom('spaceTemplates')
      .selectAll()
      .where('workspaceId', '=', workspaceId)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async findPagesByTemplateId(
    templateId: string,
  ): Promise<SpaceTemplatePage[]> {
    return this.db
      .selectFrom('spaceTemplatePages')
      .selectAll()
      .where('templateId', '=', templateId)
      .orderBy('position', (ob) => ob.collate('C').asc())
      .execute();
  }

  async deleteTemplate(templateId: string, workspaceId: string): Promise<void> {
    await this.db
      .deleteFrom('spaceTemplates')
      .where('id', '=', templateId)
      .where('workspaceId', '=', workspaceId)
      .execute();
  }
}
