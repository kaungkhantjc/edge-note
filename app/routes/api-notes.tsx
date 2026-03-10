import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import { getNotesList } from "../services/notes.server";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ request, context }: LoaderFunctionArgs) {
    await requireAuth(request, context.cloudflare.env);
    const db = getDB(context.cloudflare.env);
    const url = new URL(request.url);

    const q = url.searchParams.get("q");
    const privacy = url.searchParams.get("privacy");
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    const limit = 24;

    const notesResult = await getNotesList(db, { q, privacy, offset, limit });

    return {
        notes: notesResult.notes,
        hasMore: notesResult.hasMore,
        nextOffset: notesResult.nextOffset
    };
}
