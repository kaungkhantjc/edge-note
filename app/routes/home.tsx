import type { Route } from "./+types/home";
import { requireAuth } from "../services/session.server";
import { NoteList } from "../components/NoteList";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { desc, inArray, eq } from "drizzle-orm";
import { data, redirect } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Edge Note" },
    { name: "description", content: "A secure, edge-based note taking app." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAuth(request, context.cloudflare.env);
  const db = getDB(context.cloudflare.env);

  const allNotes = await db.select().from(notes).orderBy(desc(notes.createdAt));

  return {
    notes: allNotes.map(n => ({
      id: n.id,
      title: n.title,
      excerpt: n.content.slice(0, 100) + (n.content.length > 100 ? "..." : ""),
      date: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      slug: n.slug
    }))
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = getDB(context.cloudflare.env);

  if (intent === "delete_batch") {
    const idsString = formData.get("ids");
    if (typeof idsString === "string") {
      try {
        const ids = JSON.parse(idsString) as string[];
        // Note IDs are integers in DB, but selectedIds are strings
        const numberIds = ids.map(id => parseInt(id, 10)).filter(id => !isNaN(id));

        if (numberIds.length > 0) {
          await db.delete(notes).where(inArray(notes.id, numberIds));
        }
      } catch (e) {
        console.error("Failed to parse IDs for batch delete", e);
      }
    }
    return data({ success: true });
  }

  return data({ error: "Invalid intent" }, { status: 400 });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <NoteList notes={loaderData.notes} />;
}
