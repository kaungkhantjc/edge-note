import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useState, useEffect } from "react";
import { Form, redirect, useNavigation, Link } from "react-router";
import type { Route } from "./+types/note-edit";
import { requireAuth } from "../services/session.server";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { useResolvedTheme } from "../hooks/useResolvedTheme";

export function meta({ data }: Route.MetaArgs) {
    if (!data || !data.note) {
        return [{ title: "Note Not Found - Edge Note" }];
    }
    return [
        { title: `Editing: ${data.note.title} - Edge Note` },
        { name: "description", content: `Editing note: ${data.note.title}` },
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
        return { error: "Invalid ID" };
    }

    const formData = await request.formData();

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const content = formData.get("content") as string;

    if (!title || !content) {
        return { error: "Title and content are required" };
    }

    const db = getDB(context.cloudflare.env);

    await db.update(notes)
        .set({
            title,
            slug: slug || null,
            content,
            updatedAt: new Date()
        })
        .where(eq(notes.id, noteId));

    return redirect(`/${noteId}`);
}

export default function EditNote({ loaderData }: Route.ComponentProps) {
    const { note } = loaderData;
    const [content, setContent] = useState(note.content);
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";
    const [isPreviewEnabled, setIsPreviewEnabled] = useState(true);
    const resolvedTheme = useResolvedTheme();

    useEffect(() => {
        const checkMobile = () => {
            // If width is less than 768px (md breakpoint), disable preview
            setIsPreviewEnabled(window.innerWidth >= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 py-3.5 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to={`/${note.id}`} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Edit Note</h1>
                        <span className="text-gray-400 dark:text-gray-500 text-sm hidden sm:inline">#{note.id}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        to={`/${note.id}`}
                        className="hidden md:inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30"
                    >
                        Cancel
                    </Link>
                    <button
                        form="edit-note-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-neutral-50 hover:text-neutral-700 hover:border-neutral-200 focus:outline-none dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-neutral-900/20 dark:hover:text-neutral-400 dark:hover:border-neutral-900/30 disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <Form method="post" id="edit-note-form" className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                defaultValue={note.title}
                                placeholder="Note Title"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-shadow"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug (Optional)</label>
                            <input
                                type="text"
                                name="slug"
                                id="slug"
                                defaultValue={note.slug || ""}
                                placeholder="custom-slug"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-125 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800">
                        <input type="hidden" name="content" value={content} />
                        <MdEditor
                            key={`editor-${resolvedTheme}-${isPreviewEnabled}`}
                            value={content}
                            onChange={setContent}
                            theme={resolvedTheme}
                            language="en-US"
                            className="h-full"
                            preview={isPreviewEnabled}
                            noPrettier={false}
                            noUploadImg={true}
                            inputBoxWidth="60%"
                            toolbars={[
                                'bold',
                                'underline',
                                'italic',
                                '-',
                                'strikeThrough',
                                'sub',
                                'sup',
                                'quote',
                                'unorderedList',
                                'orderedList',
                                'task',
                                '-',
                                'codeRow',
                                'code',
                                'link',
                                'image',
                                'table',
                                'mermaid',
                                'katex',
                                '-',
                                'revoke',
                                'next',
                                'save',
                                '=',
                                'pageFullscreen',
                                'fullscreen',
                                'preview',
                                'previewOnly',
                                'htmlPreview',
                                'catalog'
                            ]}
                        />
                    </div>
                </Form>
            </main>
        </div>
    );
}
