import { eq, ne, and } from "drizzle-orm";
import { redirect, useActionData, useNavigation } from "react-router";
import { NoteEditorLayout } from "../components/NoteEditorLayout";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/note-edit";
import { APP_CONFIG } from "~/config";

export function meta({ data }: Route.MetaArgs) {
    if (!data || !data.note) {
        return [{ title: `Note Not Found - ${APP_CONFIG.name}` }];
    }
    return [
        { title: `Editing: ${data.note.title} - ${APP_CONFIG.name}` },
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
    const slug = (formData.get("slug") as string | null)?.trim() || "";
    const content = formData.get("content") as string;
    const isPublic = formData.get("isPublic") === "true";

    if (!content) {
        return { errors: { content: "Content is required" } };
    }

    if (isPublic && !slug) {
        return { errors: { slug: "Slug is required for public notes" } };
    }

    const db = getDB(context.cloudflare.env);

    if (slug) {
        const existing = await db.select().from(notes)
            .where(and(eq(notes.slug, slug), ne(notes.id, noteId)))
            .limit(1);

        if (existing.length > 0) {
            return { errors: { slug: "Slug already exists" } };
        }
    }

    try {
        await db.update(notes)
            .set({
                title,
                slug: slug || null,
                content,
                isPublic,
                updatedAt: new Date()
            })
            .where(eq(notes.id, noteId));
    } catch (error: any) {
        if (error.message.includes("UNIQUE constraint failed: notes.slug")) {
            return { errors: { slug: "Slug already exists" } };
        }
        return { errors: { global: "Failed to update note" } };
    }

    return redirect(`/${noteId}`);
}

export default function EditNote({ loaderData }: Route.ComponentProps) {
    const { note } = loaderData;
    const navigation = useNavigation();
    const actionData = useActionData<typeof action>();
    const isSubmitting = navigation.state === "submitting";

    return (
        <NoteEditorLayout
            key={note.id}
            title="Edit Note"
            backLink={`/${note.id}`}
            formId="edit-note-form"
            isSubmitting={isSubmitting}
            initialTitle={note.title ?? undefined}
            initialSlug={note.slug || ""}
            initialContent={note.content}
            initialIsPublic={!!note.isPublic}
            errors={actionData?.errors}
        />
    );
}
