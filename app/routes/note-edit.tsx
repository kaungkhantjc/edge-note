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
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ArrowLeft, Save } from "lucide-react";

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
            setIsPreviewEnabled(window.innerWidth >= 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="flex flex-col h-screen bg-background">
            <AppBar
                className="bg-background/80 backdrop-blur-md"
                title="Edit Note"
                startAction={
                    <Link to={`/${note.id}`}>
                        <Button variant="icon" icon={<ArrowLeft className="w-6 h-6" />} />
                    </Link>
                }
                endAction={
                    <div className="flex items-center gap-2">
                        <Link to={`/${note.id}`} className="hidden md:block">
                            <Button variant="text">Cancel</Button>
                        </Link>
                        <Button
                            form="edit-note-form"
                            type="submit"
                            disabled={isSubmitting}
                            variant="filled"
                            icon={<Save className="w-4 h-4" />}
                        >
                            {isSubmitting ? "Saving..." : "Save"}
                        </Button>
                    </div>
                }
            />

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
                <Form method="post" id="edit-note-form" className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="md:col-span-2">
                            <Input
                                name="title"
                                label="Title"
                                required
                                defaultValue={note.title}
                                placeholder="Note Title"
                            />
                        </div>
                        <div>
                            <Input
                                name="slug"
                                label="Slug"
                                defaultValue={note.slug || ""}
                                placeholder="custom-slug"
                            />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm bg-surface">
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
                            toolbarsExclude={['github']}
                        />
                    </div>
                </Form>
            </main>
        </div>
    );
}
