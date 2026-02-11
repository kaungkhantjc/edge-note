import { desc, like, or, sql } from "drizzle-orm";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
    await requireAuth(request, context.cloudflare.env);
    const db = getDB(context.cloudflare.env);
    const url = new URL(request.url);

    const q = url.searchParams.get("q");
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = 24;

    let query = db.select({
        id: notes.id,
        title: notes.title,
        createdAt: notes.createdAt,
        slug: notes.slug,
        excerpt: sql<string>`SUBSTR(${notes.content}, 1, 200)`
    }).from(notes).$dynamic();

    if (q) {
        const filters = or(
            like(notes.title, `%${q}%`),
            like(notes.content, `%${q}%`)
        );
        query = query.where(filters);
    }

    const resultNotes = await query
        .orderBy(desc(notes.createdAt))
        .limit(limit + 1)
        .offset(offset);

    const hasMore = resultNotes.length > limit;
    const items = hasMore ? resultNotes.slice(0, limit) : resultNotes;

    return {
        notes: items.map(n => ({
            id: n.id,
            title: n.title || "Untitled",
            excerpt: n.excerpt?.replace(/[#*`]/g, '') || "",
            date: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
            slug: n.slug
        })),
        hasMore,
        nextOffset: offset + items.length
    };
}
