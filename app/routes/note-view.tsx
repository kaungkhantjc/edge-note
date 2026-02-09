import { eq } from "drizzle-orm";
import { ArrowLeft, MoreVertical, Pen, Trash2 } from "lucide-react";
import { MdCatalog, MdPreview } from "md-editor-rt";
import "md-editor-rt/lib/preview.css";
import { data, Link, redirect, useSubmit } from "react-router";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { DropdownItem, DropdownMenu } from "../components/ui/DropdownMenu";
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

    // For manual form submission
    const submit = useSubmit();

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this note?")) {
            const formData = new FormData();
            submit(formData, { method: "post" });
        }
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black flex flex-col">
            <AppBar
                className="bg-background/80 backdrop-blur-md"
                title={
                    <span className="font-semibold text-lg">{note.title}</span>
                }
                startAction={
                    <Link to="/">
                        <Button variant="icon" icon={<ArrowLeft className="w-6 h-6" />} />
                    </Link>
                }
                endAction={
                    <div className="flex items-center gap-1">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-2">
                            <Link to={`/${note.id}/edit`}>
                                <Button variant="filled" icon={<Pen className="w-4 h-4" />}>Edit</Button>
                            </Link>
                            <Button variant="tonal" size="md" onClick={handleDelete}>Delete</Button>
                        </div>

                        {/* Mobile Actions */}
                        <div className="md:hidden">
                            <Link to={`/${note.id}/edit`}>
                                <Button variant="icon" icon={<Pen className="w-5 h-5" />} />
                            </Link>
                            <DropdownMenu trigger={<Button variant="icon" icon={<MoreVertical className="w-5 h-5" />} />}>
                                <DropdownItem onClick={handleDelete}>
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownItem>
                            </DropdownMenu>
                        </div>
                    </div>
                }
            />

            <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 p-6 md:p-8 animate-in fade-in duration-500 delay-100">
                <article className="flex-1 min-w-0 prose prose-lg dark:prose-invert max-w-none prose-headings:font-sans prose-p:text-on-surface-variant prose-headings:text-on-surface">
                    <MdPreview
                        key={resolvedTheme}
                        editorId="preview-only"
                        modelValue={note.content}
                        theme={resolvedTheme}
                        // We might want to customize the CSS of MdPreview to match M3, but general prose is usually fine.
                        className="bg-transparent"
                    />
                </article>

                <aside className="hidden lg:block w-72 shrink-0 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4 px-2">Table of Contents</div>
                    <div className="bg-surface-container-low rounded-2xl p-4">
                        <MdCatalog editorId="preview-only" scrollElement={scrollElement} theme={resolvedTheme} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
