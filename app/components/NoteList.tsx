import { Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import { useSelectionMode } from '../hooks/useSelection';
import { NoteCard, type Note } from './NoteCard';
import { Button } from './ui/Button';
import { useUI } from './ui/UIProvider';

type SelectionResult = ReturnType<typeof useSelectionMode>;

interface NoteListProps {
    notes: Note[];
    hasMore: boolean;
    nextOffset: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    selection: SelectionResult;
    onDelete?: () => void;
    children?: React.ReactNode;
}

const SkeletonCard = () => (
    <div className="h-56 rounded-3xl bg-surface-container-high animate-pulse border border-transparent shadow-sm" />
);

export function NoteList({
    notes: initialNotes,
    hasMore: initialHasMore,
    nextOffset: initialOffset,
    containerRef,
    selection,
    onDelete,
    children
}: NoteListProps) {
    const fetcher = useFetcher<any>();
    const navigate = useNavigate();
    const { showSnackbar } = useUI();

    // State for local accumulation of notes
    const [notes, setNotes] = useState<Note[]>(initialNotes);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [offset, setOffset] = useState(initialOffset);
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const {
        isSelectionMode,
        selectedIds,
        selectionBox,
        handleMouseDown,
        toggleSelection,
        startSelectionMode,
        clearSelection,
    } = selection;

    // Reset list when initial notes change (e.g. on search)
    useEffect(() => {
        setNotes(initialNotes);
        setHasMore(initialHasMore);
        setOffset(initialOffset);
        setIsError(false);
    }, [initialNotes, initialHasMore, initialOffset]);

    // Handle fetcher data (for deletion action)
    useEffect(() => {
        if (!fetcher.data) return;

        // handle explicit successful deletion action
        if (fetcher.data.success && fetcher.formData?.get("intent") === "delete_batch") {
            const deletedCount = fetcher.data.deletedCount || fetcher.formData.getAll("id").length;
            const deletedIds = new Set(fetcher.formData.getAll("id").map(String));
            setNotes(prev => prev.filter(n => !deletedIds.has(String(n.id))));
            showSnackbar(`${deletedCount} notes deleted successfully`);
        }
    }, [fetcher.data, fetcher.formData, showSnackbar]);

    const fetchMore = useCallback(async () => {
        if (isLoading || !hasMore) return;

        setIsLoading(true);
        setIsError(false);

        try {
            const params = new URLSearchParams();
            const currentQ = new URLSearchParams(window.location.search).get("q");
            const currentPrivacy = new URLSearchParams(window.location.search).get("privacy");
            if (currentQ) params.set("q", currentQ);
            if (currentPrivacy) params.set("privacy", currentPrivacy);
            params.set("offset", offset.toString());

            const res = await fetch(`/api-notes?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch");

            // Correctly typecast
            const data = await res.json() as {
                notes: Note[];
                hasMore: boolean;
                nextOffset: number;
            };

            if (data.notes) {
                const nextBatch = data.notes;
                const serverHasMore = data.hasMore;
                const serverNextOffset = data.nextOffset;

                setNotes((prev) => {
                    const existingIds = new Set(prev.map(n => n.id.toString()));
                    const uniqueNewNotes = nextBatch.filter((n: Note) => !existingIds.has(n.id.toString()));
                    return [...prev, ...uniqueNewNotes];
                });

                setHasMore(serverHasMore);
                setOffset(serverNextOffset);
            }
        } catch (err) {
            console.error("Infinite scroll error:", err);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, hasMore, offset]);

    // Intersection Observer for Infinite Scroll
    useEffect(() => {
        if (!hasMore || isLoading || isError) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    fetchMore();
                }
            },
            { threshold: 0.1, root: null }
        );

        const currentSentinel = sentinelRef.current;
        if (currentSentinel) observer.observe(currentSentinel);

        return () => {
            if (currentSentinel) observer.unobserve(currentSentinel);
        };
    }, [hasMore, isLoading, isError, fetchMore]);

    const handleNoteClick = useCallback((note: Note) => {
        if (isSelectionMode) {
            toggleSelection(note.id.toString());
        } else {
            navigate(`/${note.id}`, { viewTransition: true });
        }
    }, [isSelectionMode, toggleSelection]);

    const handleNoteLongPress = useCallback((note: Note) => {
        if (!isSelectionMode) {
            startSelectionMode(note.id.toString());
        } else {
            toggleSelection(note.id.toString());
        }
    }, [isSelectionMode, startSelectionMode, toggleSelection]);

    return (
        <div className="flex flex-col h-full w-full bg-background text-on-background relative">

            <div
                className="flex-1 overflow-y-auto select-none relative scroll-smooth"
                ref={containerRef}
                onMouseDown={handleMouseDown}
            >
                {children}

                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6 pb-24">
                    {notes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onClick={handleNoteClick}
                            onLongPress={handleNoteLongPress}
                            selected={selectedIds.has(note.id.toString())}
                        />
                    ))}

                    {notes.length === 0 && !isLoading && !isError && (
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

                    {/* Sentinel / Footer Area */}
                    {(hasMore || isError) && (
                        <div ref={sentinelRef} className="col-span-full pb-8 pt-0 flex flex-col items-center justify-center min-h-25">
                            {isLoading && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-4 w-full">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <SkeletonCard key={i} />
                                    ))}
                                </div>
                            )}

                            {isError && !isLoading && (
                                <div className="mt-2 w-full flex flex-col items-center gap-3 p-8 bg-surface-container rounded-3xl border border-outline-variant/20 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                    <div className="text-error mb-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    </div>
                                    <p className="text-on-surface font-semibold">Connection failed</p>
                                    <p className="text-sm text-on-surface-variant max-w-50 text-center">Couldn't load more notes. Please check your network.</p>
                                    <Button
                                        variant="tonal"
                                        onClick={() => fetchMore()}
                                        className="mt-2 min-w-30"
                                    >
                                        Retry
                                    </Button>
                                </div>
                            )}
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
