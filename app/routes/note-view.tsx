import { eq } from "drizzle-orm";
import { ArrowLeft, Globe, Lock, MoreVertical, Pen, Trash2 } from "lucide-react";
import { data, Link, redirect, useSubmit } from "react-router";
import { NotePublicViewer } from "../components/NotePublicViewer";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { DropdownItem, DropdownMenu } from "../components/ui/DropdownMenu";
import { notes } from "../drizzle/schema";
import { useResolvedTheme } from "../hooks/useResolvedTheme";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/note-view";
import { ThemeToggle } from "../components/theme-toggle";
import { useUI } from "../components/ui/UIProvider";

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

    return redirect("/?deleted=1");
}

export default function NoteView({ loaderData }: Route.ComponentProps) {
    const { note } = loaderData;
    const scrollElement = typeof document !== 'undefined' ? document.documentElement : 'html';
    const resolvedTheme = useResolvedTheme();

    // For manual form submission
    const submit = useSubmit();
    const { showModal } = useUI();

    const handleDelete = () => {
        showModal({
            title: "Delete note?",
            description: "Are you sure you want to delete this note? This action cannot be undone.",
            confirmText: "Delete",
            isDestructive: true,
            icon: <Trash2 className="w-6 h-6" />,
            onConfirm: () => {
                const formData = new FormData();
                submit(formData, { method: "post" });
            }
        });
    }

    const formatDate = (date: Date | string | number | null) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(',', '');
    };

    return (
        <div className="min-h-screen flex flex-col">
            <AppBar
                className="bg-background/80 backdrop-blur-md px-4"
                title={
                    <span className="font-semibold text-lg">{note.title || "Untitled"}</span>
                }
                startAction={
                    <Link to="/">
                        <Button variant="icon" icon={<ArrowLeft className="w-6 h-6" />} />
                    </Link>
                }
                endAction={
                    <div className="flex items-center gap-2">
                        {/* Desktop Actions */}
                        <div className="hidden md:flex gap-2">
                            <Link to={`/${note.id}/edit`}>
                                <Button variant="filled" icon={<Pen className="w-4 h-4" />}>Edit</Button>
                            </Link>
                            <Button variant="tonal" size="md" onClick={handleDelete}>Delete</Button>
                        </div>

                        <ThemeToggle />

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

            {/* Metadata Bar */}
            <div className="w-full max-w-5xl mx-auto px-6 md:px-8 pt-6 flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-medium animate-in fade-in slide-in-from-top-2 duration-500">
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span className="text-on-surface-variant/70 uppercase tracking-wider font-bold">Created:</span>
                    <span className="text-on-surface">{formatDate(note.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span className="text-on-surface-variant/70 uppercase tracking-wider font-bold">Updated:</span>
                    <span className="text-on-surface">{formatDate(note.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/50 border border-outline-variant/30 text-on-surface">
                    {note.isPublic ? (
                        <>
                            <Globe className="w-3.5 h-3.5 text-primary" />
                            <span>Public</span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-3.5 h-3.5 text-secondary" />
                            <span>Private</span>
                        </>
                    )}
                </div>
            </div>

            <NotePublicViewer title={note.title || "Untitled"} content={note.content} />
        </div>
    );
}
