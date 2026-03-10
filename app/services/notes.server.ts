import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { notes } from "../drizzle/schema";

export async function getNotesList(
  db: any,
  {
    q,
    privacy,
    offset = 0,
    limit = 24,
  }: {
    q?: string | null;
    privacy?: string | null;
    offset?: number;
    limit?: number;
  }
) {
  let query = db
    .select({
      id: notes.id,
      title: notes.title,
      createdAt: notes.createdAt,
      slug: notes.slug,
      isPublic: notes.isPublic,
      excerpt: sql<string>`SUBSTR(${notes.content}, 1, 200)`,
    })
    .from(notes)
    .$dynamic();

  let countQuery = db.select({ value: count() }).from(notes).$dynamic();

  const conditions = [];

  if (q) {
    conditions.push(
      or(
        like(notes.title, `%${q}%`),
        like(notes.content, `%${q}%`),
        like(notes.slug, `%${q}%`)
      )
    );
  }

  if (privacy === "public") {
    conditions.push(eq(notes.isPublic, true));
  } else if (privacy === "private") {
    conditions.push(eq(notes.isPublic, false));
  }

  if (conditions.length > 0) {
    const combined =
      conditions.length > 1 ? and(...conditions) : conditions[0];
    query = query.where(combined!);
    countQuery = countQuery.where(combined!);
  }

  const [resultNotes, totalCountResult] = await Promise.all([
    query.orderBy(desc(notes.createdAt)).limit(limit).offset(offset),
    countQuery,
  ]);

  const totalNotes = totalCountResult[0]?.value || 0;
  const hasMore = offset + resultNotes.length < totalNotes;

  const formattedNotes = resultNotes.map((n: any) => ({
    id: n.id,
    title: n.title || "Untitled",
    excerpt: n.excerpt?.replace(/[#*`]/g, "") || "",
    date: n.createdAt
      ? new Date(n.createdAt).toISOString()
      : new Date().toISOString(),
    slug: n.slug,
    isPublic: !!n.isPublic,
  }));

  return {
    notes: formattedNotes,
    totalNotes,
    hasMore,
    nextOffset: offset + resultNotes.length,
  };
}
