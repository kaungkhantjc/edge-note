import type { Route } from "./+types/home";
import { requireAuth } from "../services/session.server";
import { NoteList } from "../components/NoteList";
import { getDB } from "../services/db.server";
import { notes } from "../drizzle/schema";
import { desc, inArray, like } from "drizzle-orm";
import { ThemeToggle } from "../components/theme-toggle";
import { data, Form, useSubmit, Link } from "react-router";
import { LogOut, Plus, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "../components/theme-provider";
import { useSelectionMode } from '../hooks/useSelection';
import { Button } from "../components/ui/Button";
import { SearchBar } from "../components/ui/Input";
import { AppBar } from "../components/ui/AppBar";

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
      content: n.content, // Needed for simple usage if any
      excerpt: n.content.replace(/[#*`]/g, '').slice(0, 150) + (n.content.length > 150 ? "..." : ""),
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
  const submit = useSubmit();
  const containerRef = useRef<HTMLDivElement>(null);

  const selection = useSelectionMode({
    items: loaderData.notes,
    containerRef,
    getItemId: (note) => note.id.toString(),
  });

  const { isSelectionMode } = selection;
  const { setTheme, theme } = useTheme(); // You might want to update ThemeToggle to use Button too, or just leave it.

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isFirstSearch = loaderData.q === null;
    submit(e.currentTarget.form, {
      replace: !isFirstSearch,
    });
  };

  const clearSearch = () => {
    // Create a form, or just submit empty q
    // Because useSubmit usually works with a form element, we can't easily submit without one unless we construct FormData.
    // But we are inside a Form! We can just set input value to "" and submit.
    // Best way: URL param change.
    window.location.search = "";
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* App Bar / Toolbar - Hidden in Selection Mode */}
      {!isSelectionMode && (
        <AppBar
          className="bg-surface-container/50 backdrop-blur-xl border-b-0 shadow-sm"
          title={
            <div className="flex gap-2 items-center">
              <img src="/favicon.svg" alt="Edge Note" className="h-8 w-8" />
              <span className="font-bold text-2xl tracking-tight text-primary">Edge Note</span>
            </div>
          }
          startAction={null}
          endAction={
            <div className="flex items-center gap-2">
              <div className="w-full max-w-md hidden md:block mr-2">
                <Form method="get" action="/">
                  <SearchBar
                    name="q"
                    defaultValue={loaderData.q}
                    placeholder="Search your notes"
                    onChange={handleSearch}
                    onClear={() => window.location.href = "/"}
                  />
                </Form>
              </div>
              <ThemeToggle />
              <Form action="/logout" method="post">
                <Button variant="icon" icon={<LogOut className="w-5 h-5" />} title="Logout" />
              </Form>
            </div>
          }
        />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full overflow-hidden flex flex-col relative">
        {/* Mobile Search - Visible under AppBar on mobile */}
        {!isSelectionMode && (
          <div className="md:hidden p-4 bg-background sticky top-0 z-20">
            <Form method="get" action="/">
              <SearchBar
                name="q"
                defaultValue={loaderData.q}
                placeholder="Search notes"
                onChange={handleSearch}
              />
            </Form>
          </div>
        )}

        <NoteList
          notes={loaderData.notes}
          selection={selection}
          containerRef={containerRef}
        />
      </div>

      {/* FAB */}
      {!isSelectionMode && (
        <Link to="/new" className="fixed bottom-7 right-7 z-40">
          <button className="h-16 w-16 rounded-2xl bg-primary-container text-on-primary-container shadow-md hover:shadow-3 transition-all duration-300 flex items-center justify-center group active:scale-95">
            <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </Link>
      )}
    </div>
  );
}
