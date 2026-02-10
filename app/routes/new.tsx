import { eq } from "drizzle-orm";
import { useActionData, useNavigation } from "react-router";
import { NoteEditorLayout } from "../components/NoteEditorLayout";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/new";
import { redirect } from "react-router";

export async function loader({ request, context }: Route.LoaderArgs) {
    await requireAuth(request, context.cloudflare.env);
    return {};
}

export async function action({ request, context }: Route.ActionArgs) {
    await requireAuth(request, context.cloudflare.env);
    const formData = await request.formData();

    const title = formData.get("title") as string;
    const slug = (formData.get("slug") as string | null)?.trim() || "";
    const content = formData.get("content") as string;

    if (!content) {
        return { errors: { content: "Content is required" } };
    }

    const db = getDB(context.cloudflare.env);

    if (slug) {
        const existingNote = await db.select().from(notes).where(eq(notes.slug, slug)).limit(1);
        if (existingNote.length > 0) {
            return { errors: { slug: "Slug already exists" } };
        }
    }

    try {
        const result = await db.insert(notes).values({
            title,
            slug: slug || null,
            content,
            isPublic: false
        }).returning({ id: notes.id });

        const newNote = result[0];

        return redirect(`/${newNote.id}`);
    } catch (error: any) {
        if (error.message.includes("UNIQUE constraint failed: notes.slug")) {
            return { errors: { slug: "Slug already exists" } };
        }
        return { errors: { global: "Failed to create note" } };
    }
}

export default function NewNote() {
    const navigation = useNavigation();
    const actionData = useActionData<typeof action>();
    const isSubmitting = navigation.state === "submitting";

    return (
        <NoteEditorLayout
            title="New Note"
            backLink="/"
            formId="new-note-form"
            isSubmitting={isSubmitting}
            errors={actionData?.errors}
        />
    );
}
