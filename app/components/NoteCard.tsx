import { Globe, Lock } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { formatDate } from "~/lib/date";
import { cn } from "../lib/utils";

export interface Note {
    id: string | number;
    title: string;
    excerpt: string;
    date: string;
    isPublic: boolean;
}

interface NoteCardProps {
    note: Note;
    selected: boolean;
    isSelectionMode?: boolean; // Optional if not used for styling logic explicitly
    onClick: (note: Note) => void;
    onLongPress: (note: Note) => void;
    className?: string;
}

export const NoteCard = React.memo(function NoteCard({
    note,
    selected,
    onClick,
    onLongPress,
    className,
}: NoteCardProps) {
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressing = useRef(false);
    const touchStartPos = useRef<{ x: number, y: number } | null>(null);

    // Memoize the formatted date to avoid expensive recalculation
    const formattedDate = useMemo(() => formatDate(note.date), [note.date]);

    useEffect(() => {
        return () => {
            if (longPressTimer.current) clearTimeout(longPressTimer.current);
        };
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Don't preventDefault here to allow scrolling
        isLongPressing.current = false;
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };

        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            // Provide haptic feedback if available
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(40);
            }
            onLongPress(note);
        }, 500);
    }, [note, onLongPress]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        if (isLongPressing.current) {
            // Prevent the synthesized click event if we just finished a long press
            e.preventDefault();
            e.stopPropagation();
        }
        touchStartPos.current = null;
    }, []);

    const handleTouchCancel = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        isLongPressing.current = false;
        touchStartPos.current = null;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!longPressTimer.current || !touchStartPos.current) return;

        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPos.current.x);
        const dy = Math.abs(touch.clientY - touchStartPos.current.y);

        // Increased threshold to 25px to be more forgiving for mobile thumbs
        if (dx > 25 || dy > 25) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
            touchStartPos.current = null;
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        isLongPressing.current = false;

        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            onLongPress(note);
        }, 500);
    }, [note, onLongPress]);

    const handleMouseUp = useCallback((e: React.MouseEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // If we were long pressing, we should prevent the default click
        if (isLongPressing.current) {
            // For mouse, the click event will still fire, handled by handleClick
        }
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!longPressTimer.current) return;

        // Minor movement is okay for mouse long press too, but less than touch
        // Actually for mouse, movement usually means intent to drag or something else
        // Let's keep it simple: any real move cancels
        if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleClick = useCallback((e: React.MouseEvent) => {
        if (isLongPressing.current) {
            e.preventDefault();
            e.stopPropagation();
            isLongPressing.current = false;
            return;
        }
        onClick(note);
    }, [note, onClick]);

    return (
        <button
            type="button"
            id={`note-card-${note.id}`}
            className={cn(
                "group relative flex flex-col p-5 h-56 transition-all duration-300 rounded-3xl cursor-pointer overflow-hidden touch-manipulation select-none touch-callout-none text-left",
                "note-card transition-shadow duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                selected
                    ? "bg-secondary-container text-on-secondary-container ring-2 ring-primary border-primary shadow-lg"
                    : "bg-surface-container-high hover:bg-surface-container hover:shadow-md text-on-surface border-none",
                className
            )}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onTouchCancel={handleTouchCancel}
        >
            <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className={cn("font-bold text-lg leading-snug line-clamp-2 transition-colors font-sans tracking-tight", selected ? "text-on-secondary-container" : "text-on-surface")}>
                    {note.title}
                </h3>
                {selected && (
                    <div className="bg-primary text-on-primary rounded-full p-1 shrink-0 animate-in zoom-in duration-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>

            <p className={cn("text-base leading-relaxed line-clamp-4 grow font-normal", selected ? "text-on-secondary-container/80" : "text-on-surface-variant")}>
                {note.excerpt || "No additional text"}
            </p>

            <div className="mt-auto flex items-center justify-between pt-4">
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-lg tracking-wide", selected ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant")}>
                    {formattedDate}
                </span>

                <div className={cn(
                    "flex items-center justify-center size-8 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    note.isPublic
                        ? (selected ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary")
                        : (selected ? "bg-surface-container/90 text-on-surface-variant" : "bg-background/90 text-on-surface-variant")
                )}>
                    {note.isPublic ? (
                        <>
                            <Globe className="w-3 h-3" />
                        </>
                    ) : (
                        <>
                            <Lock className="w-3 h-3" />
                        </>
                    )}
                </div>
            </div>

            {/* State Layer (Overlay on hover) */}
            {!selected && <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-[0.08] pointer-events-none transition-opacity duration-200" />}
        </button>
    );
});
