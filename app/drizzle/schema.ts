import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notes = sqliteTable("notes", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title"),
    content: text("content").notNull(),
    isPublic: integer("is_public", { mode: "boolean" }).default(false),
    slug: text("slug").unique(),
    createdAt: integer("created_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
    updatedAt: integer("updated_at", { mode: "timestamp" }).default(
        sql`(strftime('%s', 'now'))`
    ),
}, (table) => [
    index("created_at_idx").on(table.createdAt),
    index("updated_at_idx").on(table.updatedAt),
]);
