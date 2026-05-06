import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('space_templates')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col)
    .addColumn('icon', 'varchar', (col) => col)
    .addColumn('creator_id', 'uuid', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('workspace_id', 'uuid', (col) =>
      col.references('workspaces.id').onDelete('cascade').notNull(),
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable('space_template_pages')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_uuid_v7()`),
    )
    .addColumn('template_id', 'uuid', (col) =>
      col.references('space_templates.id').onDelete('cascade').notNull(),
    )
    .addColumn('title', 'varchar', (col) => col)
    .addColumn('icon', 'varchar', (col) => col)
    .addColumn('content', 'jsonb', (col) => col)
    .addColumn('parent_page_id', 'uuid', (col) =>
      col.references('space_template_pages.id').onDelete('cascade'),
    )
    .addColumn('position', 'varchar', (col) => col)
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('space_template_pages_template_id_idx')
    .on('space_template_pages')
    .column('template_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('space_template_pages').execute();
  await db.schema.dropTable('space_templates').execute();
}
