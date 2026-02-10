import { Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher, useSubmit } from 'react-router';
import { NoteCard, type Note } from './NoteCard';
import { Button } from './ui/Button';
import { useUI } from './ui/UIProvider';
import { useSelectionMode } from '../hooks/useSelection';

interface NoteListProps {
    notes: Note[];
    containerRef: React.RefObject<HTMLDivElement | null>;
    onSelectionModeChange?: (isSelectionMode: boolean) => void;
}

const SkeletonCard = () => (
    <div className="h-56 rounded-3xl bg-surface-container-high animate-pulse border border-transparent shadow-sm" />
);

export function NoteList({ notes: initialNotes, containerRef, onSelectionModeChange }: NoteListProps) {
    const submit = useSubmit();
    const fetcher = useFetcher<any>();
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialNotes.length === 24);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const selection = useSelectionMode({
        items: notes,
        containerRef,
        getItemId: (note) => note.id.toString(),
    });

    const {
        isSelectionMode,
        selectedIds,
        selectionBox,
        handleMouseDown,
        toggleSelection,
        startSelectionMode,
        clearSelection,
        selectAll,
    } = selection;

    // Sync initial notes from loader (e.g. on search)
    useEffect(() => {
        setNotes(initialNotes);
        setPage(1);
        setHasMore(initialNotes.length === 24);
    }, [initialNotes]);

    // Handle fetcher data for additional pages
    useEffect(() => {
        if (fetcher.data && fetcher.data.notes) {
            const nextNotes = fetcher.data.notes as Note[];
            if (nextNotes.length > 0) {
                setNotes((prev) => {
                    const existingIds = new Set(prev.map(n => n.id.toString()));
                    const uniqueNewNotes = nextNotes.filter((n: Note) => !existingIds.has(n.id.toString()));
                    return [...prev, ...uniqueNewNotes];
                });
                setHasMore(nextNotes.length === 24);
            } else {
                setHasMore(false);
            }
        }
    }, [fetcher.data]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (!hasMore || fetcher.state !== "idle") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    const nextPage = page + 1;
                    const searchParams = new URLSearchParams(window.location.search);
                    searchParams.set("page", nextPage.toString());
                    searchParams.set("index", ""); // ensure it hits the index route
                    fetcher.load(`/?${searchParams.toString()}`);
                    setPage(nextPage);
                }
            },
            { threshold: 0.1, root: null } // root null means viewport
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) {
            observer.observe(currentSentinel);
        }

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
        };
    }, [hasMore, fetcher, page]);

    // URL Synchronization (Task 4)
    useEffect(() => {
        const url = new URL(window.location.href);
        const currentPageParam = parseInt(url.searchParams.get("page") || "1", 10);

        if (page !== currentPageParam) {
            if (page > 1) {
                url.searchParams.set("page", page.toString());
            } else {
                url.searchParams.delete("page");
            }
            window.history.replaceState(null, "", url.pathname + url.search);
        }
    }, [page]);

    // Notify parent of selection mode change
    useEffect(() => {
        onSelectionModeChange?.(isSelectionMode);
    }, [isSelectionMode, onSelectionModeChange]);

    const handleNoteClick = useCallback((note: Note) => {
        if (isSelectionMode) {
            toggleSelection(note.id.toString());
        } else {
            window.location.href = `/${note.id}`;
        }
    }, [isSelectionMode, toggleSelection]);

    const handleNoteLongPress = useCallback((note: Note) => {
        if (!isSelectionMode) {
            startSelectionMode(note.id.toString());
        } else {
            toggleSelection(note.id.toString());
        }
    }, [isSelectionMode, startSelectionMode, toggleSelection]);

    const { showModal } = useUI();
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
                formData.append("ids", JSON.stringify(Array.from(selectedIds)));
                submit(formData, { method: "post" });
                clearSelection();
            }
        });
    };

    return (
        <div className="flex flex-col h-full w-full bg-background text-on-background relative">

            {/* Selection Toolbar */}
            {isSelectionMode && (
                <div className="sticky top-0 z-50 h-18 md:h-16 bg-surface-container/90 backdrop-blur-md px-4 border-b border-outline-variant/20 shadow-sm flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
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
            )}

            {/* Note Grid */}
            <div
                className="flex-1 overflow-y-auto p-4 md:p-6 select-none relative scroll-smooth"
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            isSelectionMode={isSelectionMode}
                            onClick={() => handleNoteClick(note)}
                            onLongPress={() => handleNoteLongPress(note)}
                            selected={selectedIds.has(note.id.toString())}
                        />
                    ))}

                    {notes.length === 0 && fetcher.state === "idle" && (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 text-on-surface-variant/50">
                            <div className="w-24 h-24 rounded-full bg-surface-container-high mb-4 flex items-center justify-center">
                                <span className="text-4xl">
                                    <img src="/favicon.svg" alt="Logo" className="w-12 h-12" />
                                </span>
                            </div>
                            <p className="text-lg">No notes found.</p>
                            <p className="text-sm">Create one to get started!</p>
                        </div>
                    )}

                    {/* Sentinel and Loading Skeletons */}
                    {hasMore && (
                        <div ref={sentinelRef} className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mt-4">
                            {fetcher.state === "loading" && Array.from({ length: 12 }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Selection Box */}
                {selectionBox && (
                    <div
                        className="absolute bg-primary/20 border border-primary/50 pointer-events-none z-40 transition-none rounded-sm"
                        style={{
                            left: selectionBox.x,
                            top: selectionBox.y,
                            width: selectionBox.width,
                            height: selectionBox.height,
                        }}
                    />
                )}
            </div>
        </div>
    );
}

