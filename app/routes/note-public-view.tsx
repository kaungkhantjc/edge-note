import { and, eq } from "drizzle-orm";
import { NotePublicViewer } from "../components/NotePublicViewer";
import { ThemeToggle } from "../components/theme-toggle";
import { AppBar } from "../components/ui/AppBar";
import { notes } from "../drizzle/schema";
import { getDB } from "../services/db.server";
import type { Route } from "./+types/note-public-view";
import { APP_CONFIG } from "~/config";

export function meta({ data }: Route.MetaArgs) {
    if (!data || !data.note) {
        return [{ title: `Note Not Found - ${APP_CONFIG.name}` }];
    }
    return [
        { title: `${data.note.title} - ${APP_CONFIG.name}` },
        { name: "description", content: `Public view of: ${data.note.title}` },
    ];
}

export async function loader({ params, context }: Route.LoaderArgs) {
    const db = getDB(context.cloudflare.env);
    const slug = params.slug;

    if (!slug) {
        throw new Response("Not Found", { status: 404 });
    }

    // Only allow viewing PUBLIC notes by slug
    const result = await db.select().from(notes).where(
        and(
            eq(notes.slug, slug),
            eq(notes.isPublic, true)
        )
    ).limit(1);

    const note = result[0];

    if (!note) {
        throw new Response("Not Found", { status: 404 });
    }

    return {
        note: {
            title: note.title,
            content: note.content
        }
    };
}

export default function NotePublicView({ loaderData }: Route.ComponentProps) {
    const { note } = loaderData;

    return (
        <div className="min-h-screen flex flex-col">
            <AppBar
                className="bg-background/80 backdrop-blur-md px-4"
                title={
                    <div className="flex gap-3 items-center">
                        <img src="/favicon.svg" alt={APP_CONFIG.name} className="h-10 w-10" />
                        <span className="font-bold text-xl leading-tight tracking-tight text-primary">{APP_CONFIG.name}</span>
                    </div>
                }
                endAction={<ThemeToggle />}
            />

            <NotePublicViewer title={note.title || "Untitled"} content={note.content} />
        </div>
    );
}
