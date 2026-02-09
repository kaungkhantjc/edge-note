import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useState } from "react";
import { Form, redirect, useNavigation } from "react-router";
import type { Route } from "./+types/note-edit";
import { requireAuth } from "../services/session.server";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-800">Edit Note</h1>
                    <span className="text-gray-400 text-sm">#{note.id}</span>
                </div>

                <div className="flex items-center gap-3">
                    <a href={`/${note.id}`} className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                        Cancel
                    </a>
                    <button
                        form="edit-note-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shadow-sm transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <Form method="post" id="edit-note-form" className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                defaultValue={note.title}
                                placeholder="Note Title"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (Optional)</label>
                            <input
                                type="text"
                                name="slug"
                                id="slug"
                                defaultValue={note.slug || ""}
                                placeholder="custom-slug"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-[500px] border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
                        <input type="hidden" name="content" value={content} />
                        <MdEditor
                            modelValue={content}
                            onChange={setContent}
                            language="en-US"
                            className="h-full"
                            toolbars={[
                                'bold', 'underline', 'italic', '-', 'title', 'strikeThrough', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList', 'task', '-', 'codeRow', 'code', 'link', 'image', 'table', 'mermaid', 'katex', '-', 'revoke', 'next', 'save', '=', 'pageFullscreen', 'fullscreen', 'preview', 'htmlPreview', 'catalog', 'github'
                            ]}
                        />
                    </div>
                </Form>
            </main>
        </div>
    );
}
