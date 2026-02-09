import { eq } from "drizzle-orm";
import { MdCatalog, MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import { Pen, Trash2, EllipsisVertical } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { data, Form, Link, redirect } from "react-router";
import { notes } from "../drizzle/schema";
import { useResolvedTheme } from "../hooks/useResolvedTheme";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/note-view";

export function meta({ data }: Route.MetaArgs) {
    if (!data || !data.note) {
        return [{ title: "Note Not Found - Edge Note" }];
    }
    return [
        { title: `${data.note.title} - Edge Note` },
        { name: "description", content: `Viewing note: ${data.note.title}` },
    ];
}

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
    const resolvedTheme = useResolvedTheme();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 py-3.5 shadow-sm">
                <div className="flex items-center gap-4">
                    {/* Back button */}
                    <Link to="/" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{note.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Desktop Edit Button */}
                    <Link
                        to={`/${note.id}/edit`}
                        className="hidden md:inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30"
                    >
                        Edit
                    </Link>

                    {/* Mobile Edit Icon Button */}
                    <Link
                        to={`/${note.id}/edit`}
                        className="md:hidden inline-flex justify-center rounded-md border border-gray-300 shadow-sm p-2 bg-white text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30"
                        title="Edit"
                    >
                        <Pen className="h-5 w-5" />
                    </Link>

                    {/* Desktop Delete Button */}
                    <Form method="post" className="hidden md:block" onSubmit={(e) => {
                        if (!confirm("Are you sure you want to delete this note?")) {
                            e.preventDefault();
                        }
                    }}>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30"
                        >
                            Delete
                        </button>
                    </Form>

                    {/* Mobile Menu Dropdown */}
                    <div className="md:hidden relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm p-2 bg-white text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30"
                            aria-label="More options"
                        >
                            <EllipsisVertical className="h-5 w-5" />
                        </button>

                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in duration-100 origin-top-right">
                                <Form method="post" onSubmit={(e) => {
                                    if (!confirm("Are you sure you want to delete this note?")) {
                                        e.preventDefault();
                                    }
                                }}>
                                    <button
                                        type="submit"
                                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4 mr-3" /> Delete Note
                                    </button>
                                </Form>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-8">
                <article className="flex-1 min-w-0 prose prose-slate dark:prose-invert md:prose-lg max-w-none">
                    <MdPreview
                        key={resolvedTheme}
                        editorId="preview-only"
                        modelValue={note.content}
                        theme={resolvedTheme}
                    />
                </article>

                <aside className="hidden lg:block w-64 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                    <div className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Table of Contents</div>
                    <MdCatalog editorId="preview-only" scrollElement={scrollElement} theme={resolvedTheme} />
                </aside>
            </div>
        </div>
    );
}
