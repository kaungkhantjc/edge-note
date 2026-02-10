import { desc, inArray, like, or, sql } from "drizzle-orm";
import { LogOut, Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { data, Form, Link, useSubmit, useFetcher } from "react-router";
import { NoteList } from "../components/NoteList";
import { useTheme } from "../components/theme-provider";
import { ThemeToggle } from "../components/theme-toggle";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { SearchBar } from "../components/ui/Input";
import { useActionData, useSearchParams } from "react-router";
import { useUI } from "../components/ui/UIProvider";
import { notes } from "../drizzle/schema";
import { useSelectionMode } from '../hooks/useSelection';
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/home";

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
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  let query = db.select({
    id: notes.id,
    title: notes.title,
    createdAt: notes.createdAt,
    slug: notes.slug,
    excerpt: sql<string>`SUBSTR(${notes.content}, 1, 200)`
  }).from(notes).$dynamic();

  if (q) {
    query = query.where(or(
      like(notes.title, `%${q}%`),
      like(notes.content, `%${q}%`)
    ));
  }

  const resultNotes = await query
    .orderBy(desc(notes.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    notes: resultNotes.map(n => ({
      id: n.id,
      title: n.title || "Untitled",
      excerpt: n.excerpt?.replace(/[#*`]/g, '') || "",
      date: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      slug: n.slug
    })),
    q: q || "",
    page
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

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  // Search handler state and debounce
  const [q, setQ] = useState(loaderData.q || "");

  useEffect(() => {
    // Skip the first render if q matches loaderData.q
    if (q === loaderData.q) return;

    const timer = setTimeout(() => {
      submit(
        { q },
        { replace: loaderData.q !== "" }
      );
    }, 300);

    return () => clearTimeout(timer);
  }, [q, submit, loaderData.q]);

  const { showSnackbar } = useUI();
  const actionData = useActionData<{ success?: boolean }>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (actionData?.success) {
      showSnackbar("Notes deleted successfully");
    }
  }, [actionData, showSnackbar]);

  useEffect(() => {
    if (searchParams.get("deleted") === "1") {
      showSnackbar("Note deleted successfully");
      // Remove the param without affecting history much
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("deleted");
        return next;
      }, { replace: true });
    }
  }, [searchParams, showSnackbar, setSearchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
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
                    value={q}
                    placeholder="Search your notes"
                    onChange={handleSearch}
                    onClear={() => setQ("")}
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
                className="h-14"
                name="q"
                value={q}
                placeholder="Search notes"
                onChange={handleSearch}
                onClear={() => setQ("")}
              />
            </Form>
          </div>
        )}

        <NoteList
          notes={loaderData.notes}
          containerRef={containerRef}
          onSelectionModeChange={setIsSelectionMode}
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
