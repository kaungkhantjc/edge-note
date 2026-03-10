import { sql } from "drizzle-orm";
import { Plus, Trash2 } from "lucide-react";
import { getNotesList } from "../services/notes.server";
import { useCallback, useEffect, useRef, useState } from "react";
import { useActionData, useFetcher, useSearchParams, useSubmit } from "react-router";
import { HomeHeader } from "../components/HomeHeader";
import { NoteList } from "../components/NoteList";
import { SelectionToolbar } from "../components/SelectionToolbar";
import { useUI } from "../components/ui/UIProvider";
import { notes } from "../drizzle/schema";
import { useSelectionMode } from "../hooks/useSelection";
import { getDB } from "../services/db.server";
import { requireAuth } from "../services/session.server";
import type { Route } from "./+types/home";
import type { Note } from "../components/NoteCard";
import { Link } from "react-router";
import { Button } from "../components/ui/Button";
import { APP_CONFIG } from "~/config";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: APP_CONFIG.name },
    { name: "description", content: APP_CONFIG.description },
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

  const notesResult = await getNotesList(db, { q, privacy, offset, limit });

  return {
    notes: notesResult.notes,
    totalNotes: notesResult.totalNotes,
    q: q || "",
    privacy,
    hasMore: notesResult.hasMore,
    nextOffset: notesResult.nextOffset
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
      await db.delete(notes).where(
        sql`id IN (SELECT value FROM json_each(${JSON.stringify(numberIds)}))`
      );
    }
    return { success: true, deletedCount: numberIds.length };
  }

  return { error: "Invalid intent" };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const submit = useSubmit();
  const fetcher = useFetcher<any>();
  const containerRef = useRef<HTMLDivElement>(null);

  const [notesList, setNotesList] = useState<Note[]>(loaderData.notes);
  const [hasMore, setHasMore] = useState(loaderData.hasMore);
  const [nextOffset, setNextOffset] = useState(loaderData.nextOffset);

  useEffect(() => {
    setNotesList(loaderData.notes);
    setHasMore(loaderData.hasMore);
    setNextOffset(loaderData.nextOffset);
  }, [loaderData.notes, loaderData.hasMore, loaderData.nextOffset]);

  const handleLoadMore = useCallback((newBatch: Note[], serverHasMore: boolean, serverNextOffset: number) => {
    setNotesList((prev) => {
      const existingIds = new Set(prev.map(n => n.id.toString()));
      const uniqueNewNotes = newBatch.filter((n: Note) => !existingIds.has(n.id.toString()));
      return [...prev, ...uniqueNewNotes];
    });
    setHasMore(serverHasMore);
    setNextOffset(serverNextOffset);
  }, []);

  const selection = useSelectionMode({
    items: notesList,
    containerRef,
    getItemId: (note) => note.id.toString(),
  });

  const { isSelectionMode, selectedIds, clearSelection, selectAll } = selection;

  const [q, setQ] = useState(loaderData.q || "");
  const [privacy, setPrivacy] = useState(loaderData.privacy);

  useEffect(() => {
    if (q === loaderData.q) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (q) params.set("q", q);
      else params.delete("q");
      params.delete("offset");
      submit(params, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [q, submit, loaderData.q]);

  useEffect(() => {
    if (privacy === loaderData.privacy) return;
    const params = new URLSearchParams(window.location.search);
    if (privacy && privacy !== "all") params.set("privacy", privacy);
    else params.delete("privacy");
    params.delete("offset");
    submit(params, { replace: true });
  }, [privacy, submit, loaderData.privacy]);

  const { showSnackbar, showModal } = useUI();
  const actionData = useActionData<{ success?: boolean }>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (actionData?.success) {
      showSnackbar("Notes deleted successfully");
    }
  }, [actionData, showSnackbar]);

  useEffect(() => {
    if (searchParams.has("deleted")) {
      showSnackbar("Note deleted successfully");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("deleted");
        return next;
      }, { replace: true });
    }
  }, [searchParams, showSnackbar, setSearchParams]);

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
        fetcher.submit(formData, { method: "post" });
        clearSelection();
      }
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background text-on-background overflow-hidden" style={{ viewTransitionName: 'home-page' }}>
      <div className="relative h-18 md:h-16 shrink-0 z-50">
        <HomeHeader
          isVisible={!isSelectionMode}
          totalNotes={loaderData.totalNotes}
          q={q}
          onSearchChange={(e) => setQ(e.target.value)}
          onSearchClear={() => setQ("")}
        />

        <SelectionToolbar
          isVisible={isSelectionMode}
          selectedCount={selectedIds.size}
          onClear={clearSelection}
          onSelectAll={selectAll}
          onDelete={handleDelete}
        />
      </div>

      <div className="flex-1 w-full overflow-hidden flex flex-col relative">
        <NoteList
          notes={notesList}
          hasMore={hasMore}
          nextOffset={nextOffset}
          containerRef={containerRef}
          selection={selection}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
        >
          <HomeHeader.Filters
            q={q}
            onSearchChange={(e) => setQ(e.target.value)}
            onSearchClear={() => setQ("")}
            privacy={privacy}
            onPrivacyChange={setPrivacy}
          />
        </NoteList>
      </div>

      {!isSelectionMode && (
        <Link to="/new" className="fixed bottom-7 right-7 z-40 md:hidden">
          <Button variant="filled" className="h-16 w-16 rounded-2xl bg-primary-container text-on-primary-container shadow-md flex items-center justify-center p-0" icon={<Plus className="w-8 h-8" />} />
        </Link>
      )}
    </div>
  );
}
