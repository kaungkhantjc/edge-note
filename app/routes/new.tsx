import type { Route } from "./+types/new";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useState, useEffect } from "react";
import { Form, redirect, useNavigation } from "react-router";
import { requireAuth } from "../services/session.server";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { useResolvedTheme } from "../hooks/useResolvedTheme";

export async function loader({ request, context }: Route.LoaderArgs) {
    await requireAuth(request, context.cloudflare.env);
    return {};
}

export async function action({ request, context }: Route.ActionArgs) {
    await requireAuth(request, context.cloudflare.env);
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const content = formData.get("content") as string;

    if (!title || !content) {
        return { error: "Title and content are required" };
    }

    const db = getDB(context.cloudflare.env);

    const result = await db.insert(notes).values({
        title,
        slug: slug || null,
        content,
        isPublic: false
    }).returning({ id: notes.id });

    const newNote = result[0];

    return redirect(`/${newNote.id}`);
}

export default function NewNote() {
    const [content, setContent] = useState("");
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
            <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3.5 flex items-center justify-between sticky top-0 z-50">
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">New Note</h1>
                <div className="flex items-center gap-3">
                    <a href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        Cancel
                    </a>
                    <button
                        form="new-note-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Note"}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <Form method="post" id="new-note-form" className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
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

