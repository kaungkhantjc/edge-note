import { MdPreview, MdCatalog } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import type { Route } from "./+types/note-view";
import { requireAuth } from "../services/session.server";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { data, redirect, Link, Form } from "react-router";

export async function loader({ request, params, context }: Route.LoaderArgs) {
    await requireAuth(request, context.cloudflare.env);
    const db = getDB(context.cloudflare.env);
    const noteId = parseInt(params.id, 10);

    if (isNaN(noteId)) {
        throw new Response("Not Found", { status: 404 });
    }

    const result = await db.select().from(notes).where(eq(notes.id, noteId));
    const note = result[0];

    if (!note) {
        throw new Response("Not Found", { status: 404 });
    }

    return { note };
}

export async function action({ request, params, context }: Route.ActionArgs) {
    await requireAuth(request, context.cloudflare.env);
    const noteId = parseInt(params.id, 10);

    if (isNaN(noteId)) {
        return data({ error: "Invalid ID" }, { status: 400 });
    }

    const db = getDB(context.cloudflare.env);
    await db.delete(notes).where(eq(notes.id, noteId));

    return redirect("/");
}

export default function NoteView({ loaderData }: Route.ComponentProps) {
    const { note } = loaderData;
    const scrollElement = typeof document !== 'undefined' ? document.documentElement : 'html';

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 py-4 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 line-clamp-1">{note.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        to={`/${note.id}/edit`}
                        className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200"
                    >
                        Edit
                    </Link>
                    <Form method="post" onSubmit={(e) => {
                        if (!confirm("Are you sure you want to delete this note?")) {
                            e.preventDefault();
                        }
                    }}>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors"
                        >
                            Delete
                        </button>
                    </Form>
                </div>
            </header>

            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-8">
                <article className="flex-1 min-w-0 prose prose-slate md:prose-lg max-w-none">
                    <MdPreview editorId="preview-only" modelValue={note.content} />
                </article>

                <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                    <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Table of Contents</div>
                    <MdCatalog editorId="preview-only" scrollElement={scrollElement} />
                </aside>
            </div>
        </div>
    );
}
