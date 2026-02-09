import type { Route } from "./+types/home";
import { requireAuth } from "../services/session.server";
import { NoteList } from "../components/NoteList";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { desc, inArray, like } from "drizzle-orm";
import { ThemeToggle } from "../components/theme-toggle";
import { data, Form, useSubmit } from "react-router";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Edge Note" },
    { name: "description", content: "A secure, edge-based note taking app." },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAuth(request, context.cloudflare.env);
  const db = getDB(context.cloudflare.env);
  const url = new URL(request.url);
  const q = url.searchParams.get("q");

  let query = db.select().from(notes).orderBy(desc(notes.createdAt));

  if (q) {
    // @ts-ignore
    query = db.select().from(notes).where(like(notes.title, `%${q}%`)).orderBy(desc(notes.createdAt));
  }

  const allNotes = await query;

  return {
    notes: allNotes.map(n => ({
      id: n.id,
      title: n.title,
      excerpt: n.content.slice(0, 100) + (n.content.length > 100 ? "..." : ""),
      date: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      slug: n.slug
    })),
    q: q || ""
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

import { useRef } from 'react';
import { useSelectionMode } from '../hooks/useSelection';

export default function Home({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const containerRef = useRef<HTMLDivElement>(null);

  const selection = useSelectionMode({
    items: loaderData.notes,
    containerRef,
    getItemId: (note) => note.id.toString(),
  });

  const { isSelectionMode } = selection;

  return (
    <>
      {/* Hide Search Toolbar when in Selection Mode */}
      {!isSelectionMode && (
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3.5 shadow-sm flex items-center justify-between">
          <Form method="get" action="/" className="flex-1 max-w-lg relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              name="q"
              defaultValue={loaderData.q}
              placeholder="Search notes..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              onChange={(e) => {
                const isFirstSearch = loaderData.q === null;
                submit(e.currentTarget.form, {
                  replace: !isFirstSearch,
                });
              }}
            />
          </Form>

          {/* Desktop Toolbar Button */}
          <div className="hidden md:block ml-4">
            <a href="/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Create Note
            </a>
          </div>

          {/* Theme Toggle */}
          <div className="hidden md:block ml-4 relative z-50">
            <ThemeToggle />
          </div>
        </div>
      )}

      <NoteList
        notes={loaderData.notes}
        selection={selection}
        containerRef={containerRef}
      />

      {/* Mobile Floating Action Button - Hide in selection mode too? User didn't specify, but usually yes. Assuming hide to avoid clutter. */}
      {!isSelectionMode && (
        <a href="/new" className="md:hidden fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 z-50 transition-transform hover:scale-105 active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </a>
      )}
    </>
  );
}
