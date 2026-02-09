import type { Route } from "./+types/new";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { useState, useEffect } from "react";
import { Form, redirect, useNavigation, Link } from "react-router";
import { requireAuth } from "../services/session.server";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { useResolvedTheme } from "../hooks/useResolvedTheme";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ArrowLeft, Save } from "lucide-react";

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
                title="New Note"
                startAction={
                    <Link to="/">
                        <Button variant="icon" icon={<ArrowLeft className="w-6 h-6" />} />
                    </Link>
                }
                endAction={
                    <div className="flex items-center gap-2">
                        <Link to="/" className="hidden md:block">
                            <Button variant="text">Cancel</Button>
                        </Link>
                        <Button
                            form="new-note-form"
                            type="submit"
                            disabled={isSubmitting}
                            variant="filled"
                            icon={<Save className="w-4 h-4" />}
                        >
                            {isSubmitting ? "Saving..." : "Save Note"}
                        </Button>
                    </div>
                }
            />

            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-hidden flex flex-col">
                <Form method="post" id="new-note-form" className="flex flex-col gap-6 h-full">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                        <div className="md:col-span-2">
                            <Input
                                name="title"
                                label="Title"
                                required
                                placeholder="Note Title"
                            />
                        </div>
                        <div>
                            <Input
                                name="slug"
                                label="Slug"
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
