import { eq } from "drizzle-orm";
import { redirect, useNavigation } from "react-router";
import { NoteEditorLayout } from "../components/NoteEditorLayout";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/note-edit";

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
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    return (
        <NoteEditorLayout
            key={note.id}
            title="Edit Note"
            backLink={`/${note.id}`}
            formId="edit-note-form"
            isSubmitting={isSubmitting}
            initialTitle={note.title}
            initialSlug={note.slug || ""}
            initialContent={note.content}
        />
    );
}
