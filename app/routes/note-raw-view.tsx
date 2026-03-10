import { and, eq } from "drizzle-orm";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import { getSession } from "../services/session.server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, params, context }: LoaderFunctionArgs) {
    const db = getDB(context.cloudflare.env);
    const slug = params.slug;

    if (!slug) {
        throw new Response("Not Found", { status: 404 });
    }

    const session = await getSession(request, context.cloudflare.env as any);
    const conditions = [eq(notes.slug, slug)];

    // Only enforce PUBLIC if not logged in
    if (!session.isLoggedIn) {
        conditions.push(eq(notes.isPublic, true));
    }

    const result = await db.select().from(notes).where(
        and(...conditions)
    ).limit(1);

    const note = result[0];

    if (!note) {
        throw new Response("Not Found", { status: 404 });
    }

    return new Response(note.content, {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
        },
    });
}
