import React, { useRef, useCallback } from "react";
import { cn } from "../lib/utils";

export interface Note {
    id: string | number;
    title: string;
    excerpt: string;
    date: string;
}

interface NoteCardProps {
    note: Note;
    selected: boolean;
    isSelectionMode?: boolean; // Optional if not used for styling logic explicitly
    onClick: (note: Note) => void;
    onLongPress: (note: Note) => void;
    className?: string;
}

export function NoteCard({
    note,
    selected,
    onClick,
    onLongPress,
    className,
}: NoteCardProps) {
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPressing = useRef(false);

    const handleTouchStart = useCallback(() => {
        isLongPressing.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            onLongPress(note);
        }, 500);
    }, [note, onLongPress]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        if (isLongPressing.current) {
            e.preventDefault();
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        isLongPressing.current = false;
        longPressTimer.current = setTimeout(() => {
            isLongPressing.current = true;
            onLongPress(note);
        }, 500);
    }, [note, onLongPress]);

    const handleMouseUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleMouseMove = useCallback(() => {
        if (longPressTimer.current) {
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
        <div
            id={`note-card-${note.id}`}
            className={cn(
                "group relative flex flex-col p-5 h-56 transition-all duration-300 rounded-3xl cursor-pointer overflow-hidden border border-transparent touch-manipulation select-none",
                "note-card", // Added for event target identification if needed
                selected
                    ? "bg-secondary-container text-on-secondary-container ring-2 ring-primary border-primary"
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
        >
            <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className={cn("font-bold text-lg leading-snug line-clamp-2 transition-colors font-sans tracking-tight", selected ? "text-on-secondary-container" : "text-on-surface")}>
                    {note.title}
                </h3>
                {selected && (
                    <div className="bg-primary text-on-primary rounded-full p-1 shrink-0">
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
                    {new Date(note.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            </div>

            {/* State Layer (Overlay on hover) */}
            {!selected && <div className="absolute inset-0 bg-on-surface opacity-0 group-hover:opacity-[0.08] pointer-events-none transition-opacity duration-200" />}
        </div>
    );
}
