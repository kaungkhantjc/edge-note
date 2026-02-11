import { count, desc, like, or, sql } from "drizzle-orm";
import { LogOut, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useSearchParams, useSubmit } from "react-router";
import { NoteList } from "../components/NoteList";
import { ThemeToggle } from "../components/theme-toggle";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { SearchBar } from "../components/ui/Input";
import { useUI } from "../components/ui/UIProvider";
import { notes } from "../drizzle/schema";
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
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = 24;

  let query = db.select({
    id: notes.id,
    title: notes.title,
    createdAt: notes.createdAt,
    slug: notes.slug,
    excerpt: sql<string>`SUBSTR(${notes.content}, 1, 200)`
  }).from(notes).$dynamic();

  let countQuery = db.select({ value: count() }).from(notes).$dynamic();

  if (q) {
    const filters = or(
      like(notes.title, `%${q}%`),
      like(notes.content, `%${q}%`)
    );
    query = query.where(filters);
    countQuery = countQuery.where(filters);
  }

  const [resultNotes, totalCountResult] = await Promise.all([
    query
      .orderBy(desc(notes.createdAt))
      .limit(limit)
      .offset(offset),
    countQuery
  ]);

  const totalNotes = totalCountResult[0]?.value || 0;
  const hasMore = offset + resultNotes.length < totalNotes;

  return {
    notes: resultNotes.map(n => ({
      id: n.id,
      title: n.title || "Untitled",
      excerpt: n.excerpt?.replace(/[#*`]/g, '') || "",
      date: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      slug: n.slug
    })),
    totalNotes,
    q: q || "",
    hasMore,
    nextOffset: offset + resultNotes.length
  };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAuth(request, context.cloudflare.env);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const db = getDB(context.cloudflare.env);

  if (intent === "delete_batch") {
    const ids = formData.getAll("id");
    const numberIds = ids.map(id => parseInt(id as string, 10)).filter(id => !isNaN(id));

    if (numberIds.length > 0) {
      // Use raw SQL to bypass D1 parameter limits (max 100)
      // Safe since we've parsed all IDs to numbers
      const idsQuery = numberIds.join(",");
      await db.run(sql.raw(`DELETE FROM notes WHERE id IN (${idsQuery})`));
    }
    return { success: true, deletedCount: numberIds.length };
  }

  return { error: "Invalid intent" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const containerRef = useRef<HTMLDivElement>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Search handler state and debounce
  const [q, setQ] = useState(loaderData.q || "");

  useEffect(() => {
    // Skip initial sync
    if (q === loaderData.q) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("index");
      submit(params, { replace: true });
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
    if (searchParams.has("deleted") || searchParams.has("index")) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (next.has("deleted")) {
          showSnackbar("Note deleted successfully");
          next.delete("deleted");
        }
        next.delete("index");
        return next;
      }, { replace: true });
    }
  }, [searchParams, showSnackbar, setSearchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQ(e.target.value);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-on-background">
      {/* App Bar / Toolbar - Hidden in Selection Mode */}
      {!isSelectionMode && (
        <AppBar
          className="bg-surface-container/50 backdrop-blur-xl border-b-0 shadow-sm"
          title={
            <div className="flex gap-3 items-center">
              <img src="/favicon.svg" alt="Edge Note" className="h-10 w-10" />
              <div className="flex flex-col">
                <span className="font-bold text-xl leading-tight tracking-tight text-primary">Edge Note</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-xs font-medium text-on-surface-variant/70 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-primary/40" />
                    {loaderData.totalNotes > 0
                      ? `${loaderData.totalNotes} notes`
                      : "0 notes"}
                  </span>
                </div>
              </div>
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
        <NoteList
          notes={loaderData.notes}
          hasMore={loaderData.hasMore}
          nextOffset={loaderData.nextOffset}
          containerRef={containerRef}
          onSelectionModeChange={setIsSelectionMode}
        >
          {/* Mobile Search - Scrollable with notes */}
          <div className="md:hidden p-4 bg-background border-b border-outline-variant/10">
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
        </NoteList>
      </div>

      {/* FAB */}
      {!isSelectionMode && (
        <Link to="/new" className="fixed bottom-7 right-7 z-40">
          <Button
            variant="filled"
            className="h-16 w-16 rounded-2xl bg-primary-container text-on-primary-container shadow-md hover:shadow-3 flex items-center justify-center p-0"
            icon={<Plus className="w-8 h-8" />}
          />
        </Link>
      )}
    </div>
  );
}
