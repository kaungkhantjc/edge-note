import { and, count, desc, eq, like, or, sql } from "drizzle-orm";
import { Globe, LayoutGrid, Lock, LogOut, Pen, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Form, Link, useActionData, useFetcher, useSearchParams, useSubmit } from "react-router";
import { NoteList } from "../components/NoteList";
import { ThemeToggle } from "../components/theme-toggle";
import { AppBar } from "../components/ui/AppBar";
import { Button } from "../components/ui/Button";
import { SearchBar } from "../components/ui/Input";
import { SegmentedButton } from "../components/ui/SegmentedButton";
import { useUI } from "../components/ui/UIProvider";
import { notes } from "../drizzle/schema";
import { cn } from "../lib/utils";
import { NoteCard, type Note } from "../components/NoteCard";
import { useSelectionMode } from "../hooks/useSelection";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/home";
import { Trash2, X } from "lucide-react";

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
  const privacy = url.searchParams.get("privacy") || "all";
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const limit = 24;

  let query = db.select({
    id: notes.id,
    title: notes.title,
    createdAt: notes.createdAt,
    slug: notes.slug,
    isPublic: notes.isPublic,
    excerpt: sql<string>`SUBSTR(${notes.content}, 1, 200)`
  }).from(notes).$dynamic();

  let countQuery = db.select({ value: count() }).from(notes).$dynamic();

  const conditions = [];

  if (q) {
    conditions.push(or(
      like(notes.title, `%${q}%`),
      like(notes.content, `%${q}%`)
    ));
  }

  if (privacy === "public") {
    conditions.push(eq(notes.isPublic, true));
  } else if (privacy === "private") {
    conditions.push(eq(notes.isPublic, false));
  }

  if (conditions.length > 0) {
    const combined = conditions.length > 1 ? and(...conditions) : conditions[0];
    query = query.where(combined!);
    countQuery = countQuery.where(combined!);
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
      slug: n.slug,
      isPublic: !!n.isPublic
    })),
    totalNotes,
    q: q || "",
    privacy,
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
  const fetcher = useFetcher<any>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Lifted state: Notes accumulation for infinite scroll
  const [notesList, setNotesList] = useState<Note[]>(loaderData.notes);

  // Sync notes when search/loader changes
  useEffect(() => {
    setNotesList(loaderData.notes);
  }, [loaderData.notes]);

  // Lifted state: Selection
  const selection = useSelectionMode({
    items: notesList,
    containerRef,
    getItemId: (note) => note.id.toString(),
  });

  const {
    isSelectionMode,
    selectedIds,
    clearSelection,
    selectAll,
  } = selection;

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

  const { showSnackbar, showModal } = useUI();
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

  const [privacy, setPrivacy] = useState(loaderData.privacy);

  useEffect(() => {
    if (privacy === loaderData.privacy) return;

    const params = new URLSearchParams(window.location.search);
    if (privacy && privacy !== "all") params.set("privacy", privacy);
    else params.delete("privacy");
    params.delete("offset");
    submit(params, { replace: true });
  }, [privacy, submit, loaderData.privacy]);

  const handleDelete = () => {
    showModal({
      title: `Delete ${selectedIds.size} notes?`,
      description: `Are you sure you want to delete these ${selectedIds.size} notes? This action cannot be undone.`,
      confirmText: "Delete",
      isDestructive: true,
      icon: <Trash2 className="w-6 h-6" />,
      onConfirm: () => {
        const formData = new FormData();
        formData.append("intent", "delete_batch");
        selectedIds.forEach(id => formData.append("id", id));
        fetcher.submit(formData, { method: "post", action: "/?index" });
        clearSelection();
      }
    });
  };

  // Handle successful deletion from fetcher
  useEffect(() => {
    if (fetcher.data?.success && fetcher.formData?.get("intent") === "delete_batch") {
      const deletedIds = new Set(fetcher.formData.getAll("id").map(String));
      setNotesList(prev => prev.filter(n => !deletedIds.has(String(n.id))));
      // Re-trigger selection count update if needed (handled by selectedIds dependency)
    }
  }, [fetcher.data, fetcher.formData]);

  return (
    <div className="flex flex-col h-screen bg-background text-on-background overflow-hidden">
      {/* Unified Header Container to avoid layout 'glitch' */}
      <div className="relative h-18 md:h-16 shrink-0 z-50">
        {/* Default App Bar */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out",
          isSelectionMode ? "opacity-0 pointer-events-none -translate-y-2" : "opacity-100 translate-y-0"
        )}>
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
                <div className="hidden md:flex items-center gap-3 mr-2">
                  <Link to="/new">
                    <Button
                      variant="tonal"
                      className="rounded-xl h-11 px-4 flex items-center gap-2 font-medium"
                      icon={<Pen className="w-5 h-5" />}
                    >
                      New
                    </Button>
                  </Link>
                  <div className="w-64 lg:w-80">
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
                </div>
                <ThemeToggle />
                <Form action="/logout" method="post">
                  <Button variant="icon" icon={<LogOut className="w-5 h-5" />} title="Logout" />
                </Form>
              </div>
            }
          />
        </div>

        {/* Selection mode toolbar */}
        <div className={cn(
          "absolute inset-0 transition-all duration-300 ease-in-out",
          !isSelectionMode ? "opacity-0 pointer-events-none translate-y-2" : "opacity-100 translate-y-0"
        )}>
          <div className="h-18 md:h-16 bg-surface-container/90 backdrop-blur-md px-4 border-b border-outline-variant/20 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="icon"
                onClick={clearSelection}
                aria-label="Cancel selection"
                icon={<X className="w-6 h-6" />}
              />

              <div className="flex flex-col">
                <span className="text-lg font-medium text-on-surface">
                  {selectedIds.size} selected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="text"
                onClick={selectAll}
                className="bg-transparent"
              >
                Select All
              </Button>
              <Button
                variant="icon"
                onClick={handleDelete}
                disabled={selectedIds.size === 0}
                title="Delete selected"
                className="text-error hover:bg-error/10"
                icon={<Trash2 className="w-6 h-6" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full overflow-hidden flex flex-col relative">
        <NoteList
          notes={notesList}
          hasMore={loaderData.hasMore}
          nextOffset={loaderData.nextOffset}
          containerRef={containerRef}
          selection={selection}
          onDelete={handleDelete}
        >
          {/* Header area for search/filters */}
          <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-4 md:pt-6 flex flex-col md:flex-row md:items-center md:justify-end gap-4">
            {/* Mobile Search */}
            <div className="md:hidden w-full">
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


            <SegmentedButton
              value={privacy}
              onChange={setPrivacy}
              className="w-full md:w-auto"
              options={[
                { label: "All", value: "all", icon: <LayoutGrid className="w-4 h-4" /> },
                { label: "Private", value: "private", icon: <Lock className="w-4 h-4" /> },
                { label: "Public", value: "public", icon: <Globe className="w-4 h-4" /> },
              ]}
            />
          </div>
        </NoteList>
      </div>

      {/* FAB - Mobile Only */}
      {!isSelectionMode && (
        <Link to="/new" className="fixed bottom-7 right-7 z-40 md:hidden">
          <Button
            variant="filled"
            className="h-16 w-16 rounded-2xl bg-primary-container hover:bg-primary-container/80 text-on-primary-container shadow-md hover:shadow-3 flex items-center justify-center p-0"
            icon={<Plus className="w-8 h-8" />}
          />
        </Link>
      )}
    </div>
  );
}
